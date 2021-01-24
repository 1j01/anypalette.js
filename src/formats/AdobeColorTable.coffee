# Load an Adobe Color Table file (.act)

###
"There is no version number written in the file.
The file is 768 or 772 bytes long and contains 256 RGB colors.
The first color in the table is index zero.
There are three bytes per color in the order red, green, blue.
If the file is 772 bytes long there are 4 additional bytes remaining.
	Two bytes for the number of colors to use.
	Two bytes for the color index with the transparency color to use."

https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577411_pgfId-1070626
###

jDataView = require "jdataview"
Palette = require "../Palette"

module.exports =
read_adobe_color_table = ({data, fileExt})->

	palette = new Palette()
	view = new jDataView(data)
	
	unless (
		view.byteLength in [768, 772] or
		fileExt is "act" # because "Fireworks can read ACT files bigger than 768 bytes"
	)
		throw new Error "file size must be 768 or 772 bytes (saw #{view.byteLength}), OR file extension must be '.act' (saw '.#{fileExt}')"
	
	for [0...256]
		palette.add
			red: view.getUint8() / 255
			green: view.getUint8() / 255
			blue: view.getUint8() / 255
	
	palette.numberOfColumns = 16 # configurable in Photoshop, but this is the default view, and for instance Visibone and the default swatches rely on this layout

	palette
