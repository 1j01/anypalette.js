
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
		|name
		|title
		|id(?:ent(?:ifier)?)?
		|designation
	)
	(?:[-_]?(?:v|val|value|component))?
	[">]?
	\s*
	[=:]?
	\s*
	"?
	\s*
	(\d+(?:\.\d+)?)
///ig

module.exports = ({data})->
	lines = data.split(/[\n\r]+/m)
	palette = new Palette()
	try_parse_line = (line)->
		attributes = {}

		while ((match = attribute_regexp.exec(line)) != null)
			attributes[match[1]] = Number(match[2])

		console.log "attributes", attributes

		if (
			(attributes.r? or attributes.red?) and
			(attributes.g? or attributes.green?) and
			(attributes.b? or attributes.blue?)
		)
			palette.add
				red: (if attributes.red? then attributes.red else attributes.r) / 255
				green: (if attributes.green? then attributes.green else attributes.g) / 255
				blue: (if attributes.blue? then attributes.blue else attributes.b) / 255
				alpha: (if attributes.alpha? then attributes.alpha else attributes.a) / 255
	
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

	palette
