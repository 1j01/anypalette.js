
# Read/write Skencil palette (.spl) ("Sketch RGBPalette")
# Skencil was formerly called Sketch, but this is not related to the .sketchpalette format.

Palette = require "../Palette"

module.exports.read_skencil_palette = ({fileContentString})->
	lines = fileContentString.split(/[\n\r]+/m)
	
	if lines[0] isnt "##Sketch RGBPalette 0"
		throw new Error("Not a Skencil palette")

	palette = new Palette()
	for line, line_index in lines
		
		if line[0] is "#" or line is "" then continue
		# TODO: handle non-start-of-line comments? where's the spec?
		
		# TODO: replace \s with [\ \t] (spaces or tabs)
		# it can't match \n because it's already split on that, but still
		# TODO: handle line with no name but space on the end
		r_g_b_name = line.match(///
			^ # at the beginning of the line,
			\s* # perhaps with some leading spaces
			# match 3 groups of numbers separated by spaces
			([0-9]*\.?[0-9]+) # red
			\s+
			([0-9]*\.?[0-9]+) # green
			\s+
			([0-9]*\.?[0-9]+) # blue
			(?:
				\s+
				(.*) # optionally a name
			)?
			$ # "and that should be the end of the line"
		///)
		if not r_g_b_name
			throw new Error "Line #{line_index + 1} doesn't match pattern of red green blue name" # TODO: better message?
		
		palette.add
			red: Number(r_g_b_name[1])
			green: Number(r_g_b_name[2])
			blue: Number(r_g_b_name[3])
			name: r_g_b_name[4]
		
	palette

module.exports.write_skencil_palette = (palette)->
	"""
	##Sketch RGBPalette 0
	#{palette.map((color)-> 
		"#{color.red.toFixed(6)} #{color.green.toFixed(6)} #{color.blue.toFixed(6)} #{color.name ? color}"
	).join("\n")}
	"""
