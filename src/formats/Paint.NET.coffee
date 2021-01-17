
# Read/write Paint.NET palette format (.txt)

Palette = require "../Palette"

module.exports = ({data})->
	
	palette = new Palette()
	
	hex = (x)-> parseInt(x, 16)
	
	for line in data.split(/[\n\r]+/m)
		m = line.match(/^([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i)
		if m then palette.add
			alpha: hex(m[1]) / 255
			red: hex(m[2]) / 255
			green: hex(m[3]) / 255
			blue: hex(m[4]) / 255
	
	palette

module.exports.write = (palette)->
	component_to_hex = (component)->
		hex = Math.round(component * 255).toString(16)
		if hex.length is 1 then "0#{hex}" else hex
	stringify_color = (color)->
		{alpha, red, green, blue} = color
		alpha ?= 1
		[alpha, red, green, blue].map(component_to_hex).join("")
	comments = """
	Paint.NET Palette File
	Lines that start with a semicolon are comments
	Colors are written as 8-digit hexadecimal numbers: aarrggbb
	For example, this would specify green: FF00FF00
	The alpha ('aa') value specifies how transparent a color is. FF is fully opaque, 00 is fully transparent.
	A palette must consist of ninety six (96) colors. If there are less than this, the remaining color
	slots will be set to white (FFFFFFFF). If there are more, then the remaining colors will be ignored.
	

	"""
	if palette.name
		comments += "Palette Name: #{palette.name}\n"
	if palette.description
		comments += "Description: #{palette.description}\n"
	comments += "Colors: #{palette.length}\n"
	if palette.numberOfColumns
		comments += "Columns: #{palette.numberOfColumns}\n"
	
	comments = "; #{comments}".replace(/\n/g, "\n; ").replace(/\s*\n/g, "\n")

	"""
	#{comments}
	#{palette.map(stringify_color).join("\n")}
	"""
