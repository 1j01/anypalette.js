
BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

MAX_UINT16 = 2**16 - 1

AcoColorSpace = Object.freeze({
	RGB: 0
	HSB: 1
	CMYK: 2
	LAB: 7
	GRAYSCALE: 8
	WIDE_CMYK: 9

	0: "RGB"
	1: "HSB"
	2: "CMYK"
	7: "LAB"
	8: "GRAYSCALE"
	9: "WIDE_CMYK"
})

module.exports.load_adobe_color_swatch = ({data})->
	# ACO (Adobe Color Swatch)
	throw new Error "Not implemented: big endian support in BinaryReader (despite apparent support in the code it's based on)"
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	# aco1 header information mainly to get color count
	aco_v1_version = br.readUInt16()
	number_of_colors = br.readUInt16()
	
	if aco_v1_version isnt 1
		throw new Error "Not an Adobe Color Swatch file"

	skip_one_header = 4

	# skip aco1 section
	aco_v2_offset = skip_one_header + n_colors * (5 * 2)
	aco_v2_colors_offset = aco_v2_offset + skip_one_header

	br.seek(aco_v2_offset)
	aco_v2_version = br.readUInt16()
	aco_v2_number_of_colors = br.readUInt16()
	# br.seek(aco_v2_colors_offset)

	if aco_v2_version isnt 2
		throw new Error "Not an Adobe Color Swatch file v2"
	if aco_v2_number_of_colors isnt number_of_colors
		throw new Error "Number of colors mismatch between ACO v1 and v2 sections"
	
	for [0..number_of_colors]
	
		color_space = br.readUInt16()
		w = br.readUInt16() / MAX_UINT16
		x = br.readUInt16() / MAX_UINT16
		y = br.readUInt16() / MAX_UINT16
		z = br.readUInt16() / MAX_UINT16
		br.readUInt16() # should be 0x0000
		length_plus_1 = br.readUInt16()
		name = br.readUnicodeString(length_plus_1 - 1) # this may need to be made to take a length
		br.readUInt16() # should be 0x0000
	
		switch color_space
			when AcoColorSpace.RGB
				palette.add
					red: w
					green: x
					blue: y
					name: name
			when AcoColorSpace.HSB
				palette.add
					hue: w
					saturation: x
					value: y
					name: name
			when AcoColorSpace.CMYK, AcoColorSpace.WIDE_CMYK
				palette.add
					cyan: w
					magenta: x
					yellow: y
					key: z
					name: name
			when AcoColorSpace.LAB
				palette.add
					l: w
					a: x
					b: y
					name: name
			when AcoColorSpace.GRAYSCALE
				palette.add
					red: w
					green: w
					blue: w
					name: name
	
	palette

load_adobe_swatch_exchange = ({data})->
	# ASE (Adobe Swatch Exchange)
	throw new Error "Not actually implemented"
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	for [0...256]
		palette.add
			red: br.readByte() / 255
			green: br.readByte() / 255
			blue: br.readByte() / 255
	
	palette

load_adobe_color_book = ({data})->
	# ACB (Adobe Color Book)
	# https://magnetiq.ca/pages/acb-spec/
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	sig = br.readString(4)
	if sig isnt "8BCB"
		throw new Error "Not an Adobe Color Book"
	
	ver = br.readInt16()
	if ver isnt 1 and ver isnt 256
		throw new Error "Unknown Adobe Color Book version: #{ver}?"
	
	book_id = br.readUInt16()
	book_title = br.readUnicodeString()
	cn_prefix = br.readUnicodeString()
	cn_suffix = br.readUnicodeString()
	# console.log("BD?>")
	book_description = br.readUnicodeString().replace("^C", "©").replace("^R", "®")
	# console.log("BD.")
	
	color_count = br.readUInt16()
	page_size = br.readUInt16()
	page_selector_offset = br.readUInt16()
	color_space = br.readUInt16()
	
	for [0...color_count]
		color_name = br.readUnicodeString()
		color_code = br.readString(6)
		
		add = (o)->
			o.name = color_name
			o.code = color_code
			palette.add(o)
		
		bad = ->
			throw new Error "Color space ##{color_space} not supported."
		
		switch color_space
			when 0 # RGB
				add
					red: br.readByte() / 255
					green: br.readByte() / 255
					blue: br.readByte() / 255
			when 1 # HSB
				add
					hue: br.readByte() / 255
					saturation: br.readByte() / 255
					value: br.readByte() / 255
			when 2 # CMYK
				add
					cyan: br.readByte() / 255
					magenta: br.readByte() / 255
					yellow: br.readByte() / 255
					key: br.readByte() / 255
			when 3 # Pantone
				bad()
			when 4 # Focoltone
				bad()
			when 5 # Trumatch
				bad()
			when 6 # Toyo
				bad()
			when 7 # Lab (CIELAB D50)
				add
					l: br.readByte() / 255
					a: br.readByte() / 255
					b: br.readByte() / 255
			when 8 # Grayscale
				bad()
			when 10 # HKS
				bad()
	
	palette
