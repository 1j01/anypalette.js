
load_pdn_palette = ({data})->
	
	palette = new Palette()
	
	hex = (two_hex_digits)->
		parseInt(two_hex_digits, 16)
	
	for line in data.split(/[\n\r]+/m)
		m = line.match(/^([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i)
		if m then palette.add
			a: hex m[1]
			r: hex m[2]
			g: hex m[3]
			b: hex m[4]
	
	palette
