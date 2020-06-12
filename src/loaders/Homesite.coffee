Palette = require "../Palette"

module.exports = ({data})->
	lines = data.split(/[\n\r]+/m)
	if lines[0] isnt "Palette"
		throw new Error "Not a Homesite palette"
	if not lines[1].match /Version [34]\.0/
		throw new Error "Unsupported Homesite palette version"
	
	palette = new Palette()
	
	for line, i in lines
		if line.match /.+ .* .+/
			rgb = line.split(" ")
			palette.add
				r: rgb[0]
				g: rgb[1]
				b: rgb[2]
	
	palette
