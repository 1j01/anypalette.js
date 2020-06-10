
# Load a GIMP palette

Palette = require "../Palette"

parse_gimp_or_kde_rgb_palette = (data, format_name)->
	lines = data.split(/[\n\r]+/m)
	if lines[0] isnt format_name
		throw new Error "Not a #{format_name}"
	
	palette = new Palette()
	i = 1
	while (i += 1) < lines.length
		line = lines[i]
		
		if line[0] is "#" or line is "" then continue
		# TODO: handle non-start-of-line comments? where's the spec?
		
		m = line.match(/Name:\s*(.*)/)
		if m
			palette.name = m[1]
			continue
		m = line.match(/Columns:\s*(.*)/)
		if m
			palette.numberOfColumns = Number(m[1])
			# TODO: handle 0 as not specified? where's the spec at, yo?
			palette.geometrySpecifiedByFile = yes
			continue
		
		# TODO: replace \s with [\ \t] (spaces or tabs)
		# it can't match \n because it's already split on that, but still
		# TODO: handle line with no name but space on the end
		r_g_b_name = line.match(///
			^ # "at the beginning of the line,"
			\s* # "give or take some spaces,"
			# match 3 groups of numbers separated by spaces
			([0-9]+) # red
			\s+
			([0-9]+) # green
			\s+
			([0-9]+) # blue
			(?:
				\s+
				(.*) # optionally a name
			)?
			$ # "and that should be the end of the line"
		///)
		if not r_g_b_name
			throw new Error "Line #{i} doesn't match pattern #{r_g_b_name}" # TODO: better message?
		
		palette.add
			r: r_g_b_name[1]
			g: r_g_b_name[2]
			b: r_g_b_name[3]
			name: r_g_b_name[4]
		
	palette

module.exports = ({data})->
	parse_gimp_or_kde_rgb_palette(data, "GIMP Palette")

module.exports.parse_gimp_or_kde_rgb_palette = parse_gimp_or_kde_rgb_palette
