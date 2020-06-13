
BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

load_adobe_color_table = ({data, fileExt})->
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
	br.getSize() is 768+2*2 or # "CS2 added 2*int16 at the end of the file"
	fileExt is "act" # "Fireworks can read ACT files bigger than 768 bytes"
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
