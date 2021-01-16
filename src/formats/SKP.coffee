# Load sK1 palettes (.skp)
# These files seem like python source code or similar,
# but let's just try to parse them in a basic, non-general way

Palette = require "../Palette"

module.exports = ({data})->
	lines = data.split(/[\n\r]+/m)

	palette = new Palette

	fns =
		set_name: (name)-> palette.name = name
		add_comments: (line)->
			palette.description ?= ""
			palette.description += line + "\n"
		set_columns: (columns)->
			palette.numberOfColumns = columns
		color: ([color_type, components, alpha, name])->
			switch color_type
				when "RGB"
					palette.add
						r: components[0] * 255
						g: components[1] * 255
						b: components[2] * 255
						alpha: alpha
				when "Grayscale"
					palette.add
						r: components[0] * 255
						g: components[0] * 255
						b: components[0] * 255
						alpha: alpha
				when "CMYK"
					palette.add
						c: components[0] * 100
						m: components[1] * 100
						y: components[2] * 100
						k: components[3] * 100
						alpha: alpha
				when "HSL"
					palette.add
						h: components[0] * 360
						s: components[1] * 100
						l: components[2] * 100
						alpha: alpha
	
	for line in lines
		match = line.match(/([\w_]+)\((.*)\)/)
		if match
			[_, fn_name, args_str] = match
			fn = fns[fn_name]
			if fn
				# TODO: proper parsing that handles u"You've got mail!" etc.
				args = JSON.parse("[#{args_str.replace(/\bu(['"])/g, "$1").replace(/'/g, '"')}]")
				fn(args...)

	n = palette.length
	if n < 2
		throw new Error([
			"No colors found"
			"Only one color found"
		][n] + " (#{n})")
	
	palette
