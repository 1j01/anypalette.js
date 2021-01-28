
# Read a ColorSchemer palette (.cs)

jDataView = require "jdataview"
Palette = require "../Palette"

module.exports.read_colorschemer_palette = ({data, fileExt})->

	if fileExt isnt "cs"
		throw new Error("ColorSchemer loader is only enabled when file extension is '.cs' (saw '.#{fileExt}' instead)")
	
	palette = new Palette()
	littleEndian = true
	view = new jDataView(data, 0, undefined, littleEndian)
	
	view.getUint16() # probably a version number
	color_count = view.getUint16()
	for i in [0...color_count]
		view.seek(8 + i * 26)
		palette.add
			red: view.getUint8() / 255
			green: view.getUint8() / 255
			blue: view.getUint8() / 255

	palette

