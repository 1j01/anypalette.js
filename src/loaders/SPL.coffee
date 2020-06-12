
# Load a Skencil palette (.spl) ("Sketch RGBPalette")
# (not related to .sketchpalette Sketch App palette format)

Palette = require "../Palette"

module.exports = ({data})->
	lines = data.split(/[\n\r]+/m)
	
	palette = new Palette()
	i = 1
	while (i += 1) < lines.length
		line = lines[i]
		
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
			throw new Error "Line #{i} doesn't match pattern #{r_g_b_name}" # TODO: better message?
		
		palette.add
			r: r_g_b_name[1] * 255
			g: r_g_b_name[2] * 255
			b: r_g_b_name[3] * 255
			name: r_g_b_name[4]
		
	palette