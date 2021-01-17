
# Read/write Sketch App JSON palette (.sketchpalette)
# (not related to .spl Sketch RGB Palette format)

# based on https://github.com/andrewfiorillo/sketch-palettes/blob/5b6bfa6eb25cb3244a9e6a226df259e8fb31fc2c/Sketch%20Palettes.sketchplugin/Contents/Sketch/sketchPalettes.js

Palette = require "../Palette"
{parse_css_hex_color} = require "../helpers"

version = 1.4

module.exports = ({data})->
	if not data.match(/^\s*{/)
		throw new Error "not sketchpalette JSON"
	paletteContents = JSON.parse(data)

	compatibleVersion = paletteContents.compatibleVersion

	# Check for presets in file, else set to empty array
	colorDefinitions = paletteContents.colors ? []
	# gradientDefinitions = paletteContents.gradients ? []
	# imageDefinitions = paletteContents.images ? []
	colorAssets = []
	gradientAssets = []
	images = []

	palette = new Palette

	# Check if plugin is out of date and incompatible with a newer palette version
	if compatibleVersion and compatibleVersion > version
		throw new Error("Can't handle compatibleVersion of #{compatibleVersion}.")

	# Check for older hex code palette version
	if not compatibleVersion or compatibleVersion < 1.4
		# Convert hex colors
		for hex_color in colorDefinitions
			palette.add(parse_css_hex_color(hex_color))
	else
		# Color Fills: convert rgba colors
		if colorDefinitions.length > 0
			for color_definition in colorDefinitions
				palette.add(color_definition)

		# # Pattern Fills: convert base64 strings to MSImageData objects
		# if imageDefinitions.length > 0
		# 	for imageDefinition in imageDefinitions
		# 		nsdata = NSData.alloc().initWithBase64EncodedString_options(imageDefinition.data, 0)
		# 		nsimage = NSImage.alloc().initWithData(nsdata)
		# 		# msimage = MSImageData.alloc().initWithImageConvertingColorSpace(nsimage)
		# 		msimage = MSImageData.alloc().initWithImage(nsimage)
		# 		images.push(msimage)

		# # Gradient Fills: build MSGradientStop and MSGradient objects
		# if gradientDefinitions.length > 0
		# 	for gradient in gradientDefinitions
		# 		# Create gradient stops
		# 		stops = []
		# 		for stop in gradient.stops
		# 			color = MSColor.colorWithRed_green_blue_alpha(
		# 				stop.color.red,
		# 				stop.color.green,
		# 				stop.color.blue,
		# 				stop.color.alpha
		# 			)
		# 			stops.push(MSGradientStop.stopWithPosition_color_(stop.position, color))

		# 		# Create gradient object and set basic properties
		# 		msgradient = MSGradient.new()
		# 		msgradient.setGradientType(gradient.gradientType)
		# 		# msgradient.shouldSmoothenOpacity = gradient.shouldSmoothenOpacity
		# 		msgradient.elipseLength = gradient.elipseLength
		# 		msgradient.setStops(stops)

		# 		# Parse From and To values into arrays e.g.: from: "{0.1,-0.43}" => fromValue = [0.1, -0.43]
		# 		fromValue = gradient.from.slice(1,-1).split(",")
		# 		toValue = gradient.to.slice(1,-1).split(",")

		# 		# Set CGPoint objects as From and To values
		# 		msgradient.setFrom({ x: fromValue[0], y: fromValue[1] })
		# 		msgradient.setTo({ x: toValue[0], y: toValue[1] })

		# 		gradientName = gradient.name ? null
		# 		gradientAssets.push(MSGradientAsset.alloc().initWithAsset_name(msgradient, gradientName))

	palette

module.exports.write = (palette)->
	JSON.stringify({
		"compatibleVersion": "1.4",
		"pluginVersion": "1.4",
		"colors": palette.map((color)->
			{red, green, blue, alpha} = color
			alpha ?= 1
			{red, green, blue, alpha}
		)
	}, null, "\t")

module.exports.extension = "sketchpalette";
