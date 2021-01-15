
# Load a JASC PAL file (Paint Shop Pro palette file) (.pal)

Palette = require "../Palette"

module.exports = ({data})->
	lines = data.split(/[\n\r]+/m)
	if lines[0] isnt "JASC-PAL"
		throw new Error "Not a JASC-PAL"
	if lines[1] isnt "0100"
		throw new Error "Unknown JASC-PAL version"
	# if lines[2] isnt "256"
	# 	"that's ok"
	
	palette = new Palette()
	#n_colors = Number(lines[2])
	
	for line, i in lines
		if line isnt "" and i > 2
			rgb = line.split(" ")
			palette.add
				r: rgb[0]
				g: rgb[1]
				b: rgb[2]
	
	palette
