
load_starcraft_pal = ({data})->
	# PAL (StarCraft raw palette)
	
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

load_starcraft_wpe = ({data})->
	# WPE (StarCraft padded raw palette)
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	i = 0
	while i < 255
		palette.add
			r: br.readByte()
			g: br.readByte()
			b: br.readByte()
			_: br.readByte()
		i += 1
	
	palette.n_columns = 16
	
	palette
