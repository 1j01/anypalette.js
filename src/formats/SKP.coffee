# Load sK1 palettes (.skp)
#
# These files are actually sort of python source code,
# but let's just try to parse them in a basic, non-general way
#
# Normally the format is handled line by line but compiling python code for each line:
# https://github.com/sk1project/uniconvertor/blob/751a4f559bac48ded59028d9b2cf6778d1267a8f/src/uc2/formats/skp/skp_filters.py#L43-L44

Palette = require "../Palette"
{parse_css_hex_color} = require "../helpers"

module.exports = ({data})->
	lines = data.split(/[\n\r]+/m)

	palette = new Palette

	fns =
		set_name: (name)-> palette.name = name
		# set_source: (source)-> palette.source = source
		add_comments: (line)->
			palette.description ?= ""
			if palette.description.length > 0
				palette.description += "\n"
			palette.description += line
		set_columns: (columns)->
			palette.numberOfColumns = columns
		hexcolor: (hexcolor, name)->
			# TODO: find example palettes with hexcolor()
			color = parse_css_hex_color("#" + hexcolor)
			color.name = name
			palette.add(color)
		rgbcolor: (r, g, b, name)->
			# TODO: find example palettes with rgbcolor()
			palette.add({r, g, b, name})
		color: ([color_type, components, alpha, name])->
			switch color_type
				when "RGB"
					palette.add
						r: components[0] * 255
						g: components[1] * 255
						b: components[2] * 255
						alpha: alpha
						name: name
				when "Grayscale"
					palette.add
						r: components[0] * 255
						g: components[0] * 255
						b: components[0] * 255
						alpha: alpha
						name: name
				when "CMYK"
					palette.add
						c: components[0] * 100
						m: components[1] * 100
						y: components[2] * 100
						k: components[3] * 100
						alpha: alpha
						name: name
				when "HSL"
					palette.add
						h: components[0] * 360
						s: components[1] * 100
						l: components[2] * 100
						alpha: alpha
						name: name
	
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

module.exports.write = (palette)->
	serialize_str = (str)-> "'#{str.replace(/[\r\n]+/g, " ").replace(/'/g, "\\'")}'"
	str = "##sK1 palette\n"
	str += "palette()\n"
	if palette.name
		str += "set_name(#{serialize_str(palette.name)})\n"
	if palette.source
		str += "set_source(#{serialize_str(palette.source)})\n"
	if palette.description
		for item in palette.description.split(/\r?\n/g)
			str += "add_comments(#{serialize_str(item)})\n"
	if palette.numberOfColumns
		str += "set_columns(#{palette.numberOfColumns})\n"
	# TODO: what does field_to_str do for a color?
	for color in palette
		if color.h?
			color_type = "HSL"
			components = [color.h / 360, color.s / 100, color.l / 100]
		else
			color_type = "RGB"
			components = [color.r / 255, color.g / 255, color.b / 255]
		alpha = color.alpha ? 1
		name = color.name
		str += "color(#{JSON.stringify([color_type, components, alpha, name])})\n"
	str += "palette_end()\n"
	str