# Load an Allaire Homesite / Macromedia ColdFusion palette (.hpl)

Palette = require "../Palette"

module.exports = ({data})->
	lines = data.split(/[\n\r]+/m)
	if lines[0] isnt "Palette"
		throw new Error "Not a Homesite palette"
	if not lines[1].match /Version [34]\.0/
		throw new Error "Unsupported Homesite palette version"
	
	palette = new Palette()
	
	for line, i in lines
		if line.match /.+ .+ .+/
			rgb = line.split(" ")
			palette.add
				r: Number rgb[0]
				g: Number rgb[1]
				b: Number rgb[2]
	
	palette
