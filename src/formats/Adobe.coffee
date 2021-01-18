
jDataView = require "jdataview"
Palette = require "../Palette"

MAX_UINT16 = 2**16 - 1
MAX_UINT32 = 2**32 - 1

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

get_utf_16_string = (view, length_including_terminator)->
	binary_string = view.getString((length_including_terminator - 1) * 2, undefined, "binary")
	string = ""
	for i in [0...binary_string.length] by 2
		string += String.fromCharCode(
			# assuming big-endian (swap << 8 to i+1 for little-endian)
			binary_string.charCodeAt(i) << 8 |
			binary_string.charCodeAt(i+1)
		)
	view.getUint16() # should be 0x0000
	string

module.exports.load_adobe_color_swatch = ({data})->
	# ACO (Adobe Color Swatch)

	palette = new Palette()
	view = new jDataView(data)
	
	read_color = (aco_v2)->

		color_space = view.getUint16()
		w = view.getUint16() / MAX_UINT16
		x = view.getUint16() / MAX_UINT16
		y = view.getUint16() / MAX_UINT16
		z = view.getUint16() / MAX_UINT16
		if aco_v2
			view.getUint16() # should be 0x0000
			length_including_terminator = view.getUint16()
			name = get_utf_16_string(view, length_including_terminator)
		else
			name = undefined
	
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
	
	aco_v1_version = view.getUint16()
	number_of_colors = view.getUint16()
	
	if aco_v1_version isnt 1
		throw new Error "Not an Adobe Color Swatch file"

	header_size = 4 # ACO v1 or v2 header, same size

	aco_v2_offset = header_size + number_of_colors * (5 * 2)
	aco_v2_colors_offset = aco_v2_offset + header_size

	if view.byteLength <= aco_v2_offset
		# ACO v1 only file
		for [0...number_of_colors]
			read_color(false)
		return palette

	view.seek(aco_v2_offset)
	aco_v2_version = view.getUint16()
	aco_v2_number_of_colors = view.getUint16()
	# view.seek(aco_v2_colors_offset)

	if aco_v2_version isnt 2
		throw new Error "Not an Adobe Color Swatch file v2"
	if aco_v2_number_of_colors isnt number_of_colors
		throw new Error "Number of colors mismatch between ACO v1 and v2 sections"
	
	for [0...number_of_colors]
		read_color(true)
	
	palette

module.exports.load_adobe_swatch_exchange = ({data})->
	# ASE (Adobe Swatch Exchange)
	
	palette = new Palette()
	view = new jDataView(data)
	
	if view.getString(4) isnt "ASEF"
		throw new Error "Not an Adobe Swatch Exchange file"

	version = view.getUint32()

	# if version isnt 1 
	# 	throw new Error "Unknown Adobe Swatch Exchange format version #{version}"

	number_of_blocks = view.getUint32()

	BLOCK_TYPE_GROUP_START = 0xc001
	BLOCK_TYPE_GROUP_END = 0xc002
	BLOCK_TYPE_COLOR = 0x0001
	COLOR_SPACE_CMYK = "CMYK"
	COLOR_SPACE_RGB = "RGB "
	COLOR_SPACE_GRAYSCALE = "GRAY"
	COLOR_MODE_GLOBAL = 0
	COLOR_MODE_SPOT = 1
	COLOR_MODE_NORMAL = 2

	within_groups = []
	for [0...number_of_blocks]
		block_type = view.getUint16()
		block_length = view.getUint32()
		block_end_pos = view.tell() + block_length
		switch block_type
			when BLOCK_TYPE_GROUP_START
				name_length_including_terminator = view.getUint16()
				name = get_utf_16_string(view, name_length_including_terminator)
				within_groups.push({name})
			when BLOCK_TYPE_GROUP_END
				within_groups.pop()
			when BLOCK_TYPE_COLOR
				name_length_including_terminator = view.getUint16()
				name = get_utf_16_string(view, name_length_including_terminator)
				color_space = view.getString(4)
				switch color_space
					when COLOR_SPACE_CMYK
						palette.add
							cyan: view.getFloat32()
							magenta: view.getFloat32()
							yellow: view.getFloat32()
							key: view.getFloat32()
							name: name
					when COLOR_SPACE_RGB
						palette.add
							red: view.getFloat32()
							green: view.getFloat32()
							blue: view.getFloat32()
							name: name
					when COLOR_SPACE_GRAYSCALE
						gray = view.getFloat32()
						palette.add
							red: gray
							green: gray
							blue: gray
							name: name
				color_mode = view.getUint16()
		view.seek(block_end_pos)

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
