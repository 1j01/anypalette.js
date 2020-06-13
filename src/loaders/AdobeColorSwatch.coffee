# Load an Adobe Color Swatch file (.aco)

BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

module.exports = ({data})->
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
