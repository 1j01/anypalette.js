
# Load a StarCraft raw palette (.pal)

jDataView = require "jdataview"
Palette = require "../Palette"

module.exports = ({data})->
	
	palette = new Palette()
	view = new jDataView(data)
	
	if view.byteLength isnt 768
		throw new Error "Wrong file size, must be #{768} bytes long (not #{view.byteLength})"
	
	for [0...256]
		palette.add
			red: view.getUint8() / 255
			green: view.getUint8() / 255
			blue: view.getUint8() / 255
		# no padding
	
	#? palette.numberOfColumns = 16
	palette

module.exports.write = (palette)->
	view = new jDataView(256*3)
	for i in [0...256]
		view.writeUint8(if palette[i] then Math.round(palette[i].red * 255) else 0)
		view.writeUint8(if palette[i] then Math.round(palette[i].green * 255) else 0)
		view.writeUint8(if palette[i] then Math.round(palette[i].blue * 255) else 0)
	return view.buffer
