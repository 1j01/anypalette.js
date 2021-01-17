# Load sK1 palettes (.skp)
#
# These files are actually sort of python source code,
# but let's just try to parse them as if it's a declarative language.
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
			palette.geometrySpecifiedByFile = true
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
						red: components[0]
						green: components[1]
						blue: components[2]
						alpha: alpha
						name: name
				when "Grayscale"
					palette.add
						red: components[0]
						green: components[0]
						blue: components[0]
						alpha: alpha
						name: name
				when "CMYK"
					palette.add
						cyan: components[0]
						magenta: components[1]
						yellow: components[2]
						key: components[3]
						alpha: alpha
						name: name
				when "HSL"
					palette.add
						hue: components[0]
						saturation: components[1]
						lightness: components[2]
						alpha: alpha
						name: name
	
	parse_args = (args_str, line_number)->
		# JSON.parse("[#{args_str.replace(/\bu(['"])/g, "$1").replace(/"/g, '\\"').replace(/'/g, '"')}]")
		# TODO: proper parsing that handles u"You've got mail!" etc.
		args = []
		index = 0
		parse_string = ->
			str = ""
			quote_char = args_str[index]
			if quote_char not in ["'", '"']
				throw new Error("Expected to start parsing string on a quote character")
			index += 1
			while index < args_str.length
				if args_str[index] is "\\"
					index += 1
					if args_str[index] is "\\"
						str += "\\"
					else if args_str[index] is "r"
						str += "\r"
					else if args_str[index] is "n"
						str += "\n"
					else if args_str[index] is "t"
						str += "\t"
					else if args_str[index] is "v"
						str += "\v"
					else if args_str[index] is "a"
						str += "\a"
					else if args_str[index] is "b"
						str += "\b"
					else if args_str[index] is "'"
						str += "'"
					else if args_str[index] is '"'
						str += '"'
					else if args_str[index].match(/\d/)
						# TODO: handle octal escape
					else if args_str[index] is "x"
						# TODO: handle hex escape
					else if args_str[index] is "N"
						# TODO: character by Unicode name
					else if args_str[index] is "u"
						# TODO: character with 16-bit hex value (four hexadecimal digits).
					else if args_str[index] is "U"
						# TODO: character with 32-bit hex value (eight hexadecimal digits).
					else
						console.log "Warning: unecessary escape in python string: \\#{args_str[index]}" # TODO: disable
						str += args_str[index]
				else if args_str[index] is quote_char
					return str
				else
					str += args_str[index]
				index += 1
			throw new SyntaxError("Expected end of string on line #{line_number}")

		parse_number = ->
			# not super robust - 127.0.0.1 is just a number, right?
			# could be done a lot simpler too with a single regexp match
			num_str = ""
			while index < args_str.length
				if args_str[index].match(/[\d\.]/)
					num_str += args_str[index]
				else
					break
				index += 1
			index -= 1
			return parseFloat(num_str)

		parse_array = ->
			index += 1
			values = []
			while index < args_str.length
				if args_str[index] is "u"
					index += 1
					if args_str[index] in ["'", '"']
						values.push(parse_string())
					else
						throw new SyntaxError("Unexpected 'u#{args_str[index..]}' on line #{line_number}")
				else if args_str[index] in ["'", '"']
					values.push(parse_string())
				else if args_str[index] is "["
					values.push(parse_array())
				else if args_str[index].match(/\d/)
					values.push(parse_number())
				else if args_str[index] is "]"
					return values
				else if args_str[index] is ","
					# not keeping track of commas, you could duplicate or omit them and we'd still parse
				else if args_str[index].match(/\S/)
					throw new SyntaxError("Unexpected '#{args_str[index..]}' on line #{line_number}")
				index += 1
			throw new SyntaxError("Expected end of array on line #{line_number}")
		
		while index < args_str.length
			if args_str[index] is "u"
				index += 1
				if args_str[index] in ["'", '"']
					args.push(parse_string())
				else
					throw new SyntaxError("Unexpected 'u#{args_str[index..]}' on line #{line_number}")
			else if args_str[index] in ["'", '"']
				args.push(parse_string())
			else if args_str[index] is "["
				args.push(parse_array())
			else if args_str[index].match(/\d/)
				args.push(parse_number())
			else if args_str[index] is ","
				# not keeping track of commas, you could duplicate or omit them and we'd still parse
			else if args_str[index].match(/\S/)
				throw new SyntaxError("Unexpected '#{args_str[index..]}' on line #{line_number}")
			index += 1
		
		return args

	for line, line_index in lines
		match = line.match(/([\w_]+)\((.*)\)/)
		if match
			[_, fn_name, args_str] = match
			fn = fns[fn_name]
			if fn
				args = parse_args(args_str, line_index + 1)
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
	for color in palette
		if color.hue?
			color_type = "HSL"
			components = [color.hue, color.saturation, color.lightness]
		else
			color_type = "RGB"
			components = [color.red, color.green, color.blue]
		alpha = color.alpha ? 1
		name = color.name ? color.toString()
		str += "color([#{serialize_str(color_type)}, [#{components.join(", ")}], #{alpha}, #{serialize_str(name)}])\n"
	str += "palette_end()\n"
	str