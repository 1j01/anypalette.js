
# Load a ColorSchemer palette

BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

module.exports = ({data})->
	
	palette = new Palette()
	br = new BinaryReader(data)
	
	version = br.readUInt16() # or something
	length = br.readUInt16()
	i = 0
	while i < length
		br.seek(8 + i * 26)
		palette.add
			r: br.readByte()
			g: br.readByte()
			b: br.readByte()
		i += 1

	palette

