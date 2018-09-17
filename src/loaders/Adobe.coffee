
BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

load_adobe_color_table = ({data, file_ext})->
	# ACT (Adobe Color Table)
	
	# "There is no version number written in the file.
	# The file is 768 or 772 bytes long and contains 256 RGB colors.
	# The first color in the table is index zero.
	# There are three bytes per color in the order red, green, blue.
	# If the file is 772 bytes long there are 4 additional bytes remaining.
	# 	Two bytes for the number of colors to use.
	# 	Two bytes for the color index with the transparency color to use."
	# 
	# https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577411_pgfId-1070626

	palette = new Palette()
	br = new BinaryReader(data)
	
	if br.getSize() is 768 or # "The file is exactly 76 [sic] long"
	br.getSize() is 768+2*16 or # "CS2 added 2*int16 at the end of the file"
	file_ext is "act" # "Fireworks can read ACT files bigger than 768 bytes"
		"okay"
	else
		throw new Error "Wrong file size" # TODO: more specific
	
	i = 0
	while i < 255
		palette.add
			r: br.readUInt8()
			g: br.readUInt8()
			b: br.readUInt8()
		i += 1
	
	palette

load_adobe_color_swatch = ({data})->
	# ACO (Adobe Color Swatch)
	throw new Error "Not actually implemented, despite over a hundred lines of code"
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	# aco1 header information mainly to get color count
	ver = br.readUInt16()
	n_colors = br.readUInt16()
	
	skip_one_header = 4

	# skip aco1 section
	skip_section1 = skip_one_header + n_colors * (5 * 2)
	# skip aco2 header
	to_section2 = skip_section1 + skip_one_header

	# count palette iterations
	color_count = 0

	# parse section 2 the first time to get color info and color name field length
	br.seek(to_section2)
	
	#LOOPLOOPLOOPLOOPLOOPLOOPLOOPLOOPLOOPLOOPSTART
	color_count += 1
	
	color_space = br.readUInt16()
	w = br.readUInt16()
	x = br.readUInt16()
	y = br.readUInt16()
	z = br.readUInt16()
	separator = br.readUInt16()
	lenplus1 = br.readUInt16() # let's not parse any further
	
	switch color_space
		when 0
			palette.add
				r: w / 255
				g: x / 255
				b: y / 255
				name: name
		
		when 1
			palette.add
				h: w / 182.04
				s: x / 655.35
				v: y / 655.35
				name: name
	
	# skip to the next color
	br.seek(lenplus1 * 2)
	
	###
	getColorName = (color, skip)->
		
		colorName = ""
		n = 0
		
		br.skip(skip)
			.loop((end)->
				n += 1
				if n is color.lenplus1 - 1
					end()
				
				namepart = br.readUInt16()
				
				# hex representation of this part
				hexPart = namepart.toString(16)
				# ascii representation of this part
				asciiPart = hexToAscii(hexPart)
				# console.log(asciiPart)
				colorName += asciiPart
			)
		
		colorName
	###
	
	hexToAscii = (hex)->
		ascii = ""
		i = 0
		while i < hex.length
			ascii += String.fromCharCode(
				parseInt(hex.substr(i, 2), 16)
			)
			i += 2
		
		ascii
	
	lastNamesLength = 0
	
	# iterate over our colorTable and store color names
	for i in colorTable
		
		nTotalColors += 1
		
		color = colorTable[i]
		
		# skip aco1, aco2 header, and previously iterated palette
		toNextColorName = to_section2 + ( (color.index) * 14 ) + lastNamesLength
		
		# get color name
		color.name = getColorName(color, toNextColorName)
		
		# the length of previous names in bytes
		lastNamesLength = lastNamesLength + (color.lenplus1 * 2)
		
		# calculate color values and write them to the palette
		switch color_space
			when 0
				color.r = w / 255
				color.g = x / 255
				color.b = y / 255
			
			when 1
				color.h = w / 182.04
				color.s = x / 655.35
				color.v = y / 655.35
	
	palette

load_adobe_swatch_exchange = ({data})->
	# ASE (Adobe Swatch Exchange)
	throw new Error "Not actually implemented"
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	i = 0
	while i < 255
		palette.add
			r: br.readByte()
			g: br.readByte()
			b: br.readByte()
		i += 1
	
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
	
	for i in [0..color_count]
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
					r: br.readByte()
					g: br.readByte()
					b: br.readByte()
			when 1 # HSB
				add
					h: br.readByte()
					s: br.readByte()
					b: br.readByte()
			when 2 # CMYK
				add
					c: br.readByte()
					m: br.readByte()
					y: br.readByte()
					k: br.readByte()
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
					l: br.readByte()
					a: br.readByte()
					b: br.readByte()
			when 8 # Grayscale
				bad()
			when 10 # HKS
				bad()
			
	
	palette
