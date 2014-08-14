
load_gimp_palette = ({data})->
	lines = data.split(/[\n\r]+/m)
	if lines[0] isnt "GIMP Palette"
		throw new Error "Not a GIMP Palette"
	
	palette = new Palette()
	i = 1
	while (i += 1) < lines.length
		line = lines[i]
		
		if line.match(/^#/) or line is "" then continue
		
		m = line.match(/Name:\s*(.*)/)
		if m
			palette.name = m[1]
			continue
		m = line.match(/Columns:\s*(.*)/)
		if m
			palette.n_columns = Number(m[1])
			palette.has_dimensions = yes
			continue
		
		r_g_b_name = line.match(/^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)(?:\s+(.*))?$/)
		if not r_g_b_name
			throw new Error "Line #{i} doesn't match pattern r_g_b_name"
		
		palette.add
			r: r_g_b_name[1]
			g: r_g_b_name[2]
			b: r_g_b_name[3]
			name: r_g_b_name[4]
		
	palette
