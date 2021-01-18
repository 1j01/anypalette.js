
jDataView = require "jdataview"
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

	palette = new Palette()
	view = new jDataView(data)
	
	# aco1 header information mainly to get color count
	aco_v1_version = view.getUint16()
	number_of_colors = view.getUint16()
	
	if aco_v1_version isnt 1
		throw new Error "Not an Adobe Color Swatch file"

	skip_one_header = 4

	# skip aco1 section
	aco_v2_offset = skip_one_header + number_of_colors * (5 * 2)
	aco_v2_colors_offset = aco_v2_offset + skip_one_header

	if view.byteLength <= aco_v2_offset
		throw new Error "Not an Adobe Color Swatch file v2"

	view.seek(aco_v2_offset)
	aco_v2_version = view.getUint16()
	aco_v2_number_of_colors = view.getUint16()
	# view.seek(aco_v2_colors_offset)

	if aco_v2_version isnt 2
		throw new Error "Not an Adobe Color Swatch file v2"
	if aco_v2_number_of_colors isnt number_of_colors
		throw new Error "Number of colors mismatch between ACO v1 and v2 sections"
	
	for [0...number_of_colors]
	
		color_space = view.getUint16()
		w = view.getUint16() / MAX_UINT16
		x = view.getUint16() / MAX_UINT16
		y = view.getUint16() / MAX_UINT16
		z = view.getUint16() / MAX_UINT16
		view.getUint16() # should be 0x0000
		length_plus_1 = view.getUint16()
		name_binary_string = view.getString((length_plus_1 - 1) * 2, undefined, "binary")
		name = ""
		for i in [0...name_binary_string.length] by 2
			name += String.fromCharCode(
				name_binary_string.charCodeAt(i) << 8 |
				name_binary_string.charCodeAt(i+1)
			)
		view.getUint16() # should be 0x0000
	
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
	view = new jDataView(data)
	
	for [0...256]
		palette.add
			red: view.readByte() / 255
			green: view.readByte() / 255
			blue: view.readByte() / 255
	
	palette

load_adobe_color_book = ({data})->
	# ACB (Adobe Color Book)
	# https://magnetiq.ca/pages/acb-spec/
	
	palette = new Palette()
	view = new jDataView(data)
	
	sig = view.readString(4)
	if sig isnt "8BCB"
		throw new Error "Not an Adobe Color Book"
	
	ver = view.readInt16()
	if ver isnt 1 and ver isnt 256
		throw new Error "Unknown Adobe Color Book version: #{ver}?"
	
	book_id = view.getUint16()
	book_title = view.readUnicodeString()
	cn_prefix = view.readUnicodeString()
	cn_suffix = view.readUnicodeString()
	# console.log("BD?>")
	book_description = view.readUnicodeString().replace("^C", "©").replace("^R", "®")
	# console.log("BD.")
	
	color_count = view.getUint16()
	page_size = view.getUint16()
	page_selector_offset = view.getUint16()
	color_space = view.getUint16()
	
	for [0...color_count]
		color_name = view.readUnicodeString()
		color_code = view.readString(6)
		
		add = (o)->
			o.name = color_name
			o.code = color_code
			palette.add(o)
		
		bad = ->
			throw new Error "Color space ##{color_space} not supported."
		
		switch color_space
			when 0 # RGB
				add
					red: view.readByte() / 255
					green: view.readByte() / 255
					blue: view.readByte() / 255
			when 1 # HSB
				add
					hue: view.readByte() / 255
					saturation: view.readByte() / 255
					value: view.readByte() / 255
			when 2 # CMYK
				add
					cyan: view.readByte() / 255
					magenta: view.readByte() / 255
					yellow: view.readByte() / 255
					key: view.readByte() / 255
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
					l: view.readByte() / 255
					a: view.readByte() / 255
					b: view.readByte() / 255
			when 8 # Grayscale
				bad()
			when 10 # HKS
				bad()
	
	palette
