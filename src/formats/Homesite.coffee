# Load an Allaire Homesite / Macromedia ColdFusion palette (.hpl)

Palette = require "../Palette"

module.exports = ({fileContentString})->
	lines = fileContentString.split(/\r?\n/)
	if lines[0] isnt "Palette"
		throw new Error "Not a Homesite palette"
	if not lines[1].match /Version [34]\.0/
		throw new Error "Unsupported Homesite palette version"
	
	palette = new Palette()
	
	for line in lines
		match = line.match(/(\d+)\s+(\d+)\s+(\d+)/)
		if match
			palette.add
				red: Number(match[1]) / 255
				green: Number(match[2]) / 255
				blue: Number(match[3]) / 255
	
	palette

module.exports.write = (palette)->
	"""
	Palette
	Version 4.0
	-----------
	#{palette.map((color)-> 
		"#{Math.round(color.red * 255)} #{Math.round(color.green * 255)} #{Math.round(color.blue * 255)}"
	).join("\n")}
	"""
