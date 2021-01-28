
# Read/write JASC PAL file (Paint Shop Pro palette file) (.pal)

Palette = require "../Palette"

module.exports.read_paint_shop_pro_palette = ({fileContentString})->
	lines = fileContentString.split(/[\n\r]+/m)
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
				red: Number(rgb[0]) / 255
				green: Number(rgb[1]) / 255
				blue: Number(rgb[2]) / 255
	
	palette

module.exports.write_paint_shop_pro_palette = (palette)->
	"""
	JASC-PAL
	0100
	#{palette.length}
	#{palette.map((color)-> 
		"#{Math.round(color.red * 255)} #{Math.round(color.green * 255)} #{Math.round(color.blue * 255)}"
	).join("\n")}
	"""
