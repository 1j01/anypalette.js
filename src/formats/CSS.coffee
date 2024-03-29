
# Detect CSS colors (except named colors), and write .css/.less/.scss/.sass/.styl files

css_escape = require "css.escape"
Palette = require "../Palette"

# TODO: detect names via structures like CSS variables, JSON object keys/values, comments
# TODO: use all colors regardless of format, within a detected structure, or maybe always

module.exports.read_css_colors = ({fileContentString})->
	
	n_control_characters = 0
	for char in fileContentString
		if char in [
			"\x00", "\x01", "\x02", "\x03", "\x04", "\x05", "\x06", "\x07", "\x08"
			"\x0B", "\x0C"
			"\x0E", "\x0F", "\x10", "\x11", "\x12", "\x13", "\x14", "\x15", "\x16", "\x17", "\x18", "\x19", "\x1A", "\x1B", "\x1C", "\x1D", "\x1E", "\x1F", "\x7F"
		]
			n_control_characters++
	if n_control_characters > 5
		throw new Error("looks like a binary file")

	palettes = [
		palette_hex_long = new Palette()
		palette_hex_short = new Palette()
		palette_rgb = new Palette()
		palette_hsl = new Palette()
		palette_hsla = new Palette()
		palette_rgba = new Palette()
	]
	
	hex = (x)-> parseInt(x, 16)
	
	fileContentString.replace ///
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
			palette_hex_long.add
				red: hex($1[0] + $1[1]) / 255
				green: hex($1[2] + $1[3]) / 255
				blue: hex($1[4] + $1[5]) / 255
				alpha: if $1.length is 8 then hex($1[6] + $1[7]) / 255
		else
			palette_hex_short.add
				red: hex($1[0] + $1[0]) / 255
				green: hex($1[1] + $1[1]) / 255
				blue: hex($1[2] + $1[2]) / 255
				alpha: if $1.length is 4 then hex($1[3] + $1[3]) / 255
	
	fileContentString.replace ///
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
			red: Number(r_val) / (if r_unit is "%" then 100 else 255)
			green: Number(g_val) / (if g_unit is "%" then 100 else 255)
			blue: Number(b_val) / (if b_unit is "%" then 100 else 255)
	
	fileContentString.replace ///
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
			red: Number(r_val) / (if r_unit is "%" then 100 else 255)
			green: Number(g_val) / (if g_unit is "%" then 100 else 255)
			blue: Number(b_val) / (if b_unit is "%" then 100 else 255)
			alpha: Number(a_val) / (if a_unit is "%" then 100 else 1)
	
	fileContentString.replace ///
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
			hue: Number(h_val) / (if h_unit is "rad" then 2*Math.PI else if h_unit is "turn" then 1 else 360)
			saturation: Number(s_val) / (if s_unit is "%" then 100 else 1)
			lightness: Number(l_val) / (if l_unit is "%" then 100 else 1)
	
	fileContentString.replace ///
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
			hue: Number(h_val) / (if h_unit is "rad" then 2*Math.PI else if h_unit is "turn" then 1 else 360)
			saturation: Number(s_val) / (if s_unit is "%" then 100 else 1)
			lightness: Number(l_val) / (if l_unit is "%" then 100 else 1)
			alpha: Number(a_val) / (if a_unit is "%" then 100 else 1)
	
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

module.exports.write_css = (palette)->
	"""
	:root {
		#{
			palette.map((color, index)->
				"--#{if color.name then css_escape(color.name.replace(/\s/g, "-")) else "color-#{index+1}"}: #{color};"
			).join("\n\t")
		}
	}
	"""

module.exports.write_styl = (palette)->
	palette.map((color, index)->
		"#{if color.name then css_escape(color.name.replace(/\s/g, "-")) else "color-#{index+1}"} = #{color};"
	).join("\n")

module.exports.write_less = (palette)->
	palette.map((color, index)->
		"@#{if color.name then css_escape(color.name.replace(/\s/g, "-")) else "color-#{index+1}"}: #{color};"
	).join("\n")

module.exports.write_scss = (palette)->
	palette.map((color, index)->
		"$#{if color.name then css_escape(color.name.replace(/\s/g, "-")) else "color-#{index+1}"}: #{color};"
	).join("\n")

module.exports.write_sass = (palette)->
	palette.map((color, index)->
		"$#{if color.name then css_escape(color.name.replace(/\s/g, "-")) else "color-#{index+1}"}: #{color}"
	).join("\n")
