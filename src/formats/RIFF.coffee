
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
	colorCount = view.getUint16()
	
	if chunkType isnt "data"
		throw new Error "Data chunk not found (...'#{chunkType}'?)"
	
	if palVersion isnt 0x0300
		throw new Error "Unsupported PAL file format version: 0x#{palVersion.toString(16)}"
	
	# Colors
	
	palette = new Palette()
	for [0...colorCount]
		palette.add
			red: view.getUint8() / 255
			green: view.getUint8() / 255
			blue: view.getUint8() / 255
		view.getUint8() # "flags", always 0x00
	
	palette

module.exports.write = (palette)->
	chunks = []

	data_chunk_body_size =
		2 + # for the version
		2 + # for the color count
		4 * palette.length # for the colors

	document_size = # size of the "file body" or in this case the total size of the data chunk, since there are no JUNK chunks or anything
		4 + # for "data"
		4 + # for chunk size
		data_chunk_body_size

	file_size =
		4 + # for "RIFF"
		4 + # for document size
		4 + # for "PAL "
		document_size
	
	littleEndian = true
	file_view = new jDataView(file_size, 0, undefined, littleEndian)

	file_view.writeString("RIFF")
	file_view.writeUint32(document_size)
	file_view.writeString("PAL ")
	file_view.writeString("data")
	file_view.writeUint32(data_chunk_body_size)
	file_view.writeUint16(0x0300) # version number
	file_view.writeUint16(palette.length) # number of colors

	for color in palette
		file_view.writeUint8(Math.round(color.red * 255))
		file_view.writeUint8(Math.round(color.green * 255))
		file_view.writeUint8(Math.round(color.blue * 255))
		file_view.writeUint8(0) # "flags"

	file_view.buffer
