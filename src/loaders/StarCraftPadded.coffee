
# WPE (StarCraft padded raw palette)

BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

module.exports = ({data})->
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	for i in [0...255]
		palette.add
			r: br.readByte()
			g: br.readByte()
			b: br.readByte()
			_: br.readByte() # padding
	
	palette.numberOfColumns = 16
	palette
