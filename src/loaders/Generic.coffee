
# Detect CSS colors (except named colors)

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
	
	data.replace ///
		\# # hashtag # #/
		([0-9A-F]{2})? # alpha
		([0-9A-F]{3}) # three digits (#A0C)
		([0-9A-F]{3})? # six digits (#AA00CC)
		
		(?![0-9A-F]) # (and no more!)
	///gim, (m, $0, $1, $2)->
		
		alpha = hex $0
		
		if $2
			xRGB = $1 + $2
			palette_xRRGGBB.add
				r: hex xRGB[0] + xRGB[1]
				g: hex xRGB[2] + xRGB[3]
				b: hex xRGB[4] + xRGB[5]
				a: alpha
		else
			xRGB = $1
			palette_xRGB.add
				r: hex xRGB[0] + xRGB[0]
				g: hex xRGB[1] + xRGB[1]
				b: hex xRGB[2] + xRGB[2]
				a: alpha
	
	data.replace ///
		rgb\(
			\s*
			([0-9]{1,3}) # red
		,	\s*
			([0-9]{1,3}) # green
		,	\s*
			([0-9]{1,3}) # blue
			\s*
		\)
	///gim, (m)->
		palette_rgb.add
			r: Number m[1]
			g: Number m[2]
			b: Number m[3]
	
	data.replace ///
		rgba\(
			\s*
			([0-9]{1,3}) # red
		,	\s*
			([0-9]{1,3}) # green
		,	\s*
			([0-9]{1,3}) # blue
		,	\s*
			([0-9]{1,3}|0\.[0-9]+) # alpha
			\s*
		\)
	///gim, (m)->
		palette_rgb.add
			r: Number m[1]
			g: Number m[2]
			b: Number m[3]
			a: Number m[4]
	
	data.replace ///
		hsl\(
			\s*
			([0-9]{1,3}) # hue
		,	\s*
			([0-9]{1,3}) # saturation
		,	\s*
			([0-9]{1,3}) # value
			\s*
		\)
	///gim, (m)->
		palette_rgb.add
			h: Number m[1]
			s: Number m[2]
			l: Number m[3]
	
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
