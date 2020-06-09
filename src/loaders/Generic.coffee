
# Detect CSS colors (except named colors)

Palette = require "../Palette"

module.exports = ({data})->
	
	palettes = [
		palette_xRRGGBB = new Palette()
		palette_xRGB = new Palette()
		palette_rgb = new Palette()
		palette_hsl = new Palette()
		palette_hsla = new Palette()
		palette_rgba = new Palette()
	]
	
	hex = (x)-> parseInt(x, 16)
	
	# TODO: support 0xFFF style, but deprioritize it if CSS-style colors are present
	# ...but what order of components should be assumed there? maybe just keep to CSS

	data.replace ///
		\# # hashtag # #/
		(
			[0-9A-F]{3} # three hex-digits (#A0C)
			|
			[0-9A-F]{6} # six hex-digits (#AA00CC)
			|
			[0-9A-F]{4} # with alpha, four hex-digits (#A0CF)
			|
			[0-9A-F]{8} # with alpha, eight hex-digits (#AA00CCFF)
		)
		(?![0-9A-F]) # (and no more!)
	///gim, (m, $1)->
		if $1.length > 4
			palette_xRRGGBB.add
				r: hex $1[0] + $1[1]
				g: hex $1[2] + $1[3]
				b: hex $1[4] + $1[5]
				a: if $1.length is 8 then hex $1[6] + $1[7] else 1
		else
			palette_xRGB.add
				r: hex $1[0] + $1[0]
				g: hex $1[1] + $1[1]
				b: hex $1[2] + $1[2]
				a: if $1.length is 4 then hex $1[3] + $1[3] else 1
	
	data.replace ///
		rgb\(
			\s*
			([0-9]*\.?[0-9]+) # red
			(%?)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # green
			(%?)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # blue
			(%?)
			\s*
		\)
	///gim, (_m, r_val, r_unit, g_val, g_unit, b_val, b_unit)->
		palette_rgb.add
			r: Number(r_val) * (if r_unit is "%" then 255/100 else 1)
			g: Number(g_val) * (if g_unit is "%" then 255/100 else 1)
			b: Number(b_val) * (if b_unit is "%" then 255/100 else 1)
	
	data.replace ///
		rgba?\(
			\s*
			([0-9]*\.?[0-9]+) # red
			(%?)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # green
			(%?)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # blue
			(%?)
		\s*(?:,|/)\s*
			([0-9]*\.?[0-9]+) # alpha
			(%?)
			\s*
		\)
	///gim, (_m, r_val, r_unit, g_val, g_unit, b_val, b_unit, a_val, a_unit)->
		palette_rgba.add
			r: Number(r_val) * (if r_unit is "%" then 255/100 else 1)
			g: Number(g_val) * (if g_unit is "%" then 255/100 else 1)
			b: Number(b_val) * (if b_unit is "%" then 255/100 else 1)
			a: Number(a_val) * (if a_unit is "%" then 1/100 else 1)
	
	data.replace ///
		hsl\(
			\s*
			([0-9]*\.?[0-9]+) # hue
			(deg|rad|turn|)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # saturation
			(%?)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # value
			(%?)
			\s*
		\)
	///gim, (_m, h_val, h_unit, s_val, s_unit, l_val, l_unit)->
		palette_hsl.add
			h: Number(h_val) * (if h_unit is "rad" then 180/Math.PI else if h_unit is "turn" then 360 else 1)
			s: Number(s_val) * (if s_unit is "%" then 1 else 100)
			l: Number(l_val) * (if l_unit is "%" then 1 else 100)
	
	data.replace ///
		hsla?\(
			\s*
			([0-9]*\.?[0-9]+) # hue
			(deg|rad|turn|)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # saturation
			(%?)
		\s*(?:,|\s)\s*
			([0-9]*\.?[0-9]+) # value
			(%?)
		\s*(?:,|/)\s*
			([0-9]*\.?[0-9]+) # alpha
			(%?)
			\s*
		\)
	///gim, (_m, h_val, h_unit, s_val, s_unit, l_val, l_unit, a_val, a_unit)->
		palette_hsla.add
			h: Number(h_val) * (if h_unit is "rad" then 180/Math.PI else if h_unit is "turn" then 360 else 1)
			s: Number(s_val) * (if s_unit is "%" then 1 else 100)
			l: Number(l_val) * (if l_unit is "%" then 1 else 100)
			a: Number(a_val) * (if a_unit is "%" then 1/100 else 1)
	
	most_colors = []
	for palette in palettes
		if palette.length >= most_colors.length
			most_colors = palette
	
	n = most_colors.length
	if n < 4
		throw new Error([
			"No colors found"
			"Only one color found"
			"Only a couple colors found"
			"Only a few colors found"
		][n] + " (#{n})")
	
	most_colors
