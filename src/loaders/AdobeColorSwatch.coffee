# Load an Adobe Color Swatch file (.aco)
# based on https://bazaar.launchpad.net/~olivier-berten/swatchbooker/trunk/view/head:/src/swatchbook/codecs/adobe_aco.py

BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

module.exports = ({data})->
	palette = new Palette()
	br = new BinaryReader(data)
	
	version = br.readUInt16()
	n_colors = br.readUInt16()
	if version == 1 and br.getSize() > 4+n_colors*10+1 # Added 1 for the Focoltone library in Photoshop 5
		br.seek(4+n_colors*10)
		version = br.readUInt16()
		n_colors = br.readUInt16()
	for i in [0..n_colors]
		# id = null
		model = br.readUInt16()
		model_names = ['RGB','HSB','CMYK','Pantone','Focoltone','Trumatch','Toyo','Lab','Gray','WideCMYK','HKS','DIC','TotalInk','MonitorRGB','Duotone','Opacity']
		if model == 2
			[C,M,Y,K] = [br.readUInt16(), br.readUInt16(), br.readUInt16(), br.readUInt16()]
			palette.add
				c: 1-C/0xFFFF*100
				m: 1-M/0xFFFF*100
				y: 1-Y/0xFFFF*100
				k: 1-K/0xFFFF*100
		else if model == 9
			[C,M,Y,K] = [br.readUInt16(), br.readUInt16(), br.readUInt16(), br.readUInt16()]
			palette.add
				c: C/10000*100
				m: M/10000*100
				y: Y/10000*100
				k: K/10000*100
		else if model == 0
			[R,G,B] = [br.readUInt16(), br.readUInt16(), br.readUInt16()]
			palette.add
				r: R/0xFFFF*255
				g: G/0xFFFF*255
				b: B/0xFFFF*255
			br.skip(2)
		else if model == 1
			[H,S,V] = [br.readUInt16(), br.readUInt16(), br.readUInt16()]
			palette.add
				h: H/0xFFFF*360
				s: S/0xFFFF*100
				v: V/0xFFFF*100
			br.skip(2)
		else if model == 7
			[L,a,b] = struct.unpack('>H 2h',file.read(6))
			palette.add
				L: L/100*100
				a: a/100*100
				b: b/100*100
			br.skip(2)
		else if model == 8
			K = br.readUInt16()
			palette.add
				r: K/10000*255
				g: K/10000*255
				b: K/10000*255
			br.skip(6)
		else
			throw new Error("unsupported color model [#{model_names[model] ? model}]\n")
			# id = file.read(7).split('\x00', 1)[0].strip()
			# br.skip(1)
		# if version == 2
		# 	length = struct.unpack('>L',file.read(4))[0]
		# 	if length > 0
		# 		id = unicode(struct.unpack(str(length*2)+'s',file.read(length*2))[0],'utf_16_be').split('\x00', 1)[0]
		# if version == 0 # Photoshop 6
		# 	length = struct.unpack('B',file.read(1))[0]
		# 	if length > 0
		# 		id = file.read(length)
		# if not id and len(item.values) > 0
		# 	id = idfromvals(item.values[item.values.keys()[0]])
		# else if not id
		# 	id = 'col'+str(i)
		# if id in swatchbook.materials
		# 	if (len(item.values) == 0 and len(swatchbook.materials[id].values) == 0) or (item.values[item.values.keys()[0]] == swatchbook.materials[id].values[swatchbook.materials[id].values.keys()[0]])
		# 		swatchbook.book.items.append(Swatch(id))
		# 		continue
		# 	else
		# 		sys.stderr.write('duplicated id: '+id+'\n')
		# 		item.info.title = id
		# 		id = id+'col'+str(i)
		# item.info.identifier = id
		# swatchbook.materials[id] = item
		# swatchbook.book.items.append(Swatch(id))

	return palette

	###
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
###
