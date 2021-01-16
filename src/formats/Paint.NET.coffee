
# Load a Paint.NET palette file (.txt)

Palette = require "../Palette"

module.exports = ({data})->
	
	palette = new Palette()
	
	hex = (x)-> parseInt(x, 16)
	
	for line in data.split(/[\n\r]+/m)
		m = line.match(/^([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i)
		if m then palette.add
			alpha: (hex m[1]) / 255
			r: hex m[2]
			g: hex m[3]
			b: hex m[4]
	
	palette

module.exports.write = (palette)->
	component_to_hex = (component)->
		hex = Math.round(component).toString(16)
		if hex.length is 1 then "0#{hex}" else hex
	stringify_color = (color)->
		{alpha, r, g, b} = color
		alpha ?= 1
		alpha *= 255
		[alpha, r, g, b].map(component_to_hex).join("")
	"""
	;paint.net Palette File
	;Palette Name: #{palette.name ? ""}
	;Description: #{palette.description ? ""}
	;Colors: #{palette.length}
	;Columns: #{palette.numberOfColumns ? ""}
	#{palette.map(stringify_color).join("\n")}
	"""
