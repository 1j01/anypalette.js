
# Read/write GIMP palette (.gpl), also used by or supported by many programs, such as Inkscape, Krita,

Palette = require "../Palette"

parse_gimp_or_kde_rgb_palette = (fileContentString, format_name)->
	lines = fileContentString.split(/\r?\n/)
	if lines[0] isnt format_name
		throw new Error "Not a #{format_name}"
	
	palette = new Palette()
	line_index = 0
	# on the first iteration, line_index = 1 because the increment happens at the start of the loop
	while (line_index += 1) < lines.length
		line = lines[line_index]
		
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
			throw new Error "Line #{line_index + 1} doesn't match pattern of red green blue name" # TODO: better message?
		
		palette.add
			red: Number(r_g_b_name[1]) / 255
			green: Number(r_g_b_name[2]) / 255
			blue: Number(r_g_b_name[3]) / 255
			name: r_g_b_name[4]
		
	palette

module.exports.read_gpl = ({fileContentString})->
	parse_gimp_or_kde_rgb_palette(fileContentString, "GIMP Palette")

write_gimp_or_kde_rgb_palette = (palette, format_name)->
	"""
	#{format_name or "GIMP Palette"}
	Name: #{palette.name or "Saved Colors"}
	Columns: #{palette.numberOfColumns or 8}
	#
	#{palette.map((color)=>
		{red, green, blue} = color
		"#{[red, green, blue].map((component)=> "#{Math.round(component * 255)}".padEnd(3, " ")).join(" ")}   #{color.name or color}"
	).join("\n")}
	"""

module.exports.write_gpl = (palette)->
	write_gimp_or_kde_rgb_palette(palette, "GIMP Palette")

module.exports.extension = "gpl"

module.exports.write_gimp_or_kde_rgb_palette = write_gimp_or_kde_rgb_palette

module.exports.parse_gimp_or_kde_rgb_palette = parse_gimp_or_kde_rgb_palette
