
# Load a Resource Interchange File Format Palette file (.pal)

# ported from C# code at https://worms2d.info/Palette_file

jDataView = require "jdataview"
Palette = require "../Palette"

module.exports = ({data})->
	littleEndian = true
	view = new jDataView(data, 0, undefined, littleEndian)
	
	# RIFF header
	riff = view.getString(4) # "RIFF"
	dataSize = view.getUint32()
	type = view.getString(4) # "PAL "
	
	if riff isnt "RIFF"
		throw new Error "RIFF header not found; not a RIFF PAL file"
	
	if type isnt "PAL "
		throw new Error """
			RIFF header says this isn't a PAL file,
			more of a sort of #{((type+"").trim())} file
		"""
	
	# Data chunk
	chunkType = view.getString(4) # "data"
	chunkSize = view.getUint32()
	palVersion = view.getUint16() # 0x0300
	palNumEntries = view.getUint16()
	
	
	if chunkType isnt "data"
		throw new Error "Data chunk not found (...'#{chunkType}'?)"
	
	if palVersion isnt 0x0300
		throw new Error "Unsupported PAL file format version: 0x#{palVersion.toString(16)}"
	
	# Colors
	
	palette = new Palette()
	i = 0
	while (i += 1) < palNumEntries - 1
		palette.add
			red: view.getUint8() / 255
			green: view.getUint8() / 255
			blue: view.getUint8() / 255
		view.getUint8() # "flags", always 0x00
	
	palette
