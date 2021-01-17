
# Load a Resource Interchange File Format Palette file (.pal)

# ported from C# code at https://worms2d.info/Palette_file

BinaryReader = require "../BinaryReader"
Palette = require "../Palette"

module.exports = ({data})->
	br = new BinaryReader(data)
	
	# RIFF header
	riff = br.readString(4) # "RIFF"
	dataSize = br.readUInt32()
	type = br.readString(4) # "PAL "
	
	if riff isnt "RIFF"
		throw new Error "RIFF header not found; not a RIFF PAL file"
	
	if type isnt "PAL "
		throw new Error """
			RIFF header says this isn't a PAL file,
			more of a sort of #{((type+"").trim())} file
		"""
	
	# Data chunk
	chunkType = br.readString(4) # "data"
	chunkSize = br.readUInt32()
	palVersion = br.readUInt16() # 0x0300
	palNumEntries = br.readUInt16()
	
	
	if chunkType isnt "data"
		throw new Error "Data chunk not found (...'#{chunkType}'?)"
	
	if palVersion isnt 0x0300
		throw new Error "Unsupported PAL file format version: 0x#{palVersion.toString(16)}"
	
	# Colors
	
	palette = new Palette()
	i = 0
	while (i += 1) < palNumEntries - 1
		palette.add
			red: br.readByte() / 255
			green: br.readByte() / 255
			blue: br.readByte() / 255
		br.readByte() # "flags", always 0x00
	
	palette
