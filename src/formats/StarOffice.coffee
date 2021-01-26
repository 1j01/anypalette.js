# Read/write StarOffice / OpenOffice / LibreOffice palette (.soc)

convert = require "xml-js"
Palette = require "../Palette"
{parse_css_hex_color} = require "../helpers"

module.exports.read_staroffice_soc = ({fileContentString})->
	unless fileContentString.match(/^\s*<\?\s*xml/i) # I doubt space is actually allowed between <? and xml
		throw new Error("not a StarOffice palette (no <?xml...?> declaration)")
	palette = new Palette()
	parsed = convert.xml2js fileContentString, compact: false
	unless parsed.elements?.length
		throw new Error("No XML elements found")
	for element in parsed.elements when element.name is "office:color-table" and element.elements
		for child in element.elements when child.name is "draw:color" and child.attributes["draw:color"]?.match(/#/)
			# TODO: probably can be any CSS color
			color_options = parse_css_hex_color(child.attributes["draw:color"])
			color_options.name = child.attributes["draw:name"]
			palette.add(color_options)
	return palette


module.exports.write_staroffice_soc = (palette)->
	
	component_to_hex = (component)->
		hex = Math.round(component * 255).toString(16)
		if hex.length is 1 then "0#{hex}" else hex
	to_css_hex_color = (color)->
		{red, green, blue} = color
		"#" + [red, green, blue].map(component_to_hex).join("")
	convert.js2xml {
		declaration:
			attributes:
				version: "1.0"
				encoding: "UTF-8"
		elements: [
			# {
			#  	type: "comment"
			#  	comment: ""
			# }
			{
				type: "element"
				name: "office:color-table"
				attributes:
					# "xmlns:form": "http://openoffice.org/2000/form"
					# "xmlns:number": "http://openoffice.org/2000/datastyle"
					# "xmlns:xlink": "http://www.w3.org/1999/xlink"
					"xmlns:office": "http://openoffice.org/2000/office"
					# "xmlns:meta": "http://openoffice.org/2000/meta"
					# "xmlns:math": "http://www.w3.org/1998/Math/MathML"
					# "xmlns:svg": "http://www.w3.org/2000/svg"
					# "xmlns:dr3d": "http://openoffice.org/2000/dr3d"
					# "xmlns:text": "http://openoffice.org/2000/text"
					# "xmlns:style": "http://openoffice.org/2000/style"
					# "xmlns:script": "http://openoffice.org/2000/script"
					# "xmlns:chart": "http://openoffice.org/2000/chart"
					"xmlns:draw": "http://openoffice.org/2000/drawing"
					# "xmlns:table": "http://openoffice.org/2000/table"
					# "xmlns:fo": "http://www.w3.org/1999/XSL/Format"
					# "xmlns:config": "http://openoffice.org/2001/config"
					# "xmlns:dc": "http://purl.org/dc/elements/1.1/"
				elements:
					for color in palette
						type: "element"
						name: "draw:color"
						attributes:
							"draw:name": color.name or color.toString()
							"draw:color": to_css_hex_color(color)
			}
		]
	}, spaces: "\t"

