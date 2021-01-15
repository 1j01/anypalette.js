# Write a Sketch App JSON palette (.sketchpalette)
# (not related to .spl Sketch RGB Palette format)

module.exports = (palette)->
	JSON.stringify({
		"compatibleVersion": "1.4",
		"pluginVersion": "1.4",
		"colors": palette.map((color)->
			{
				"red": color.r / 255
				"green": color.g / 255
				"blue": color.b / 255
				"alpha": color.a ? 1
			}
		)
	}, null, "\t")

module.exports.extension = "sketchpalette";
