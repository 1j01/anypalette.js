
# Load XML/JSON/etc. colors

Palette = require "../Palette"

attribute_regexp = ///
	(
		r(?:ed)?
		|g(?:reen)?
		|b(?:lue)?
		|a(?:lpha)?
		|h(?:ue)?
		|s(?:at(?:uration)?)?
		|v(?:al(?:ue)?)?
		|l(?:ightness)?
		|b(?:r(?:ightness)?)?
		|o(?:pacity)?
		|c(?:yan)?
		|y(?:el(?:l(?:ow)?)?)?
		|m(?:ag(?:enta)?)?
		|bl(?:ack)?
		|k(?:ey)?
		|(?:color[-_]?)?(?:
			name
			|title
			|id(?:ent(?:ifier)?)?
			|designation
		)
	)
	(?:[-_]?(?:v|val|value|component))?
	[">]?
	\s*
	[=:]?
	\s*
	"?
	(\d+(?:\.\d+)?)
///ig

attribute_mappings =
	red: ["red", "r"]
	green: ["green", "g"]
	blue: ["blue", "b"]
	alpha: ["alpha", "opacity", "a", "o"]
	hue: ["hue", "h"]
	saturation: ["saturation", "sat", "s"]
	value: ["brightness", "value", "br", "b"]
	lightness: ["lightness", "l"]
	a: ["a"]
	b: ["b"]
	cyan: ["cyan", "c"]
	magenta: ["magenta", "mag", "m"]
	yellow: ["yellow", "c"]
	key: ["black", "key", "k", "bl"]
	name: ["name", "designation", "title", "identifier", "ident", "id"]

color_spaces = [
	# Note: VisiBone2_mamcp.txt has RGB and HSV attributes but the HSV are all 0
	["red", "green", "blue"]
	["hue", "saturation", "value"]
	["hue", "saturation", "lightness"]
	# ["cyan", "magenta", "yellow", "key"]
	# ["l", "a", "b"]
]

module.exports = ({data, fileName})->
	lines = data.split(/[\n\r]+/m)
	palette = new Palette()
	add_color = (attributes)->
		console.log fileName, "attributes", attributes
		for color_space in color_spaces
			color_options = {}

			for option_name in color_space
				for attribute_name in attribute_mappings[option_name]
					if attributes[attribute_name]?
						color_options[option_name] = attributes[attribute_name]
						break
			
			if not color_space.every((option_name)-> color_options[option_name]?)
				continue # skip to next color space

			for option_name in ["alpha", "name"]
				for attribute_name in attribute_mappings[option_name]
					if attributes[attribute_name]
						color_options[option_name] = attributes[attribute_name]
						break
			
			for k, v of color_options
				if k isnt "name"
					color_options[k] = Number(v) / 255

			palette.add(color_options)
			return
	
	try_parse_line = (line)->
		attributes = {}

		while ((match = attribute_regexp.exec(line)) != null)
			key = match[1].toLowerCase().replace(/color[-_]?/, "")
			value = match[2]
			# "if there's a repeat attribute, it's probably a new color, right?"
			# (There would need to be some nuance with start/ends of the list, e.g. a palette-name=Foo, color-name=foo, color-rgb=blah, vs palette-name=Foo, color-rgb=blah, color-name=foo)
			if attributes[key]
				add_color(attributes)
				attributes = {}
			attributes[key] = value

		add_color(attributes)

	for line in lines
		try_parse_line line
	
	n = palette.length
	if n < 4
		throw new Error([
			"No colors found"
			"Only one color found"
			"Only a couple colors found"
			"Only a few colors found"
		][n] + " (#{n})")
	
	if palette.every((color)-> color.red <= 1/255 and color.green <= 1/255 and color.blue <= 1/255)
		palette.forEach (color)->
			color.red *= 255
			color.green *= 255
			color.blue *= 255
	if palette.every((color)-> not color.alpha? or color.alpha <= 1/255)
		palette.forEach (color)->
			if color.alpha?
				color.alpha *= 255

	palette
