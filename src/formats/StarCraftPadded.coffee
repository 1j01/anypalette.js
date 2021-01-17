
# Load a StarCraft padded raw palette (.wpe)

BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

module.exports = ({data})->
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	if br.getSize() isnt 1024
		throw new Error "Wrong file size, must be #{1024} bytes long (not #{br.getSize()})"
	
	for [0...256]
		palette.add
			red: br.readByte() / 255
			green: br.readByte() / 255
			blue: br.readByte() / 255
		br.readByte() # padding
	
	palette.numberOfColumns = 16
	palette
