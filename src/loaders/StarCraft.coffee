
# PAL (StarCraft raw palette)

BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

module.exports = ({data})->
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	if br.getSize() isnt 768
		throw new Error "Wrong file size, must be #{768} bytes long (not #{br.getSize()})"
	
	for i in [0...255]
		palette.add
			r: br.readByte()
			g: br.readByte()
			b: br.readByte()
			#: no padding
	
	#? palette.numberOfColumns = 16
	palette
