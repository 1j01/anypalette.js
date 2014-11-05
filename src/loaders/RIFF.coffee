
# Load a Resource Interchange File Format PAL file

# ported from C# code at http://worms2d.info/Palette_file

BinaryReader = require "../BinaryReader"

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
		throw new Error "Unsupported PAL file version: 0x#{palVersion.toString(16)}"
	
	# Colors
	
	palette = new Palette()
	i = 0
	while (i += 1) < palNumEntries - 1
		
		palette.add
			r: br.readByte()
			g: br.readByte()
			b: br.readByte()
			_: br.readByte() # "flags", always 0x00
	
	palette
