
# Load a Sketch App JSON palette (.sketchpalette)
# (not related to .spl Sketch RGB palette format)

# based on https://github.com/andrewfiorillo/sketch-palettes/blob/5b6bfa6eb25cb3244a9e6a226df259e8fb31fc2c/Sketch%20Palettes.sketchplugin/Contents/Sketch/sketchPalettes.js

Palette = require "../Palette"

version = 1.4

# TODO: DRY with CSS.coffee
parse_css_hex_color = (hex_color)->
	hex = (x)-> parseInt(x, 16)
	
	match = hex_color.match(///
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
	///gim)

	[$0, $1] = match

	if $1.length > 4
		r: hex $1[0] + $1[1]
		g: hex $1[2] + $1[3]
		b: hex $1[4] + $1[5]
		a: if $1.length is 8 then hex $1[6] + $1[7] else 1
	else
		r: hex $1[0] + $1[0]
		g: hex $1[1] + $1[1]
		b: hex $1[2] + $1[2]
		a: if $1.length is 4 then hex $1[3] + $1[3] else 1

module.exports = ({data})->
	paletteContents = JSON.parse(data)

	compatibleVersion = paletteContents.compatibleVersion

	# Check for presets in file, else set to empty array
	colorDefinitions = paletteContents.colors ? []
	gradientDefinitions = paletteContents.gradients ? []
	imageDefinitions = paletteContents.images ? []
	colorAssets = []
	gradientAssets = []
	images = []

	palette = new Palette

	# Check if plugin is out of date and incompatible with a newer palette version
	if compatibleVersion and compatibleVersion > version
		throw new Error("Can't handle compatibleVersion of #{compatibleVersion}.")
		return

	# Check for older hex code palette version
	if not compatibleVersion or compatibleVersion < 1.4
		# Convert hex colors
		for hex_color in colorDefinitions
			palette.add(parse_css_hex_color(hex_color))
	else
		# Color Fills: convert rgba colors
		if colorDefinitions.length > 0
			for color_definition in colorDefinitions
				palette.add(
					r: color_definition.red * 255
					g: color_definition.green * 255
					b: color_definition.blue * 255
					a: color_definition.alpha * 255
					name: color_definition.name
				)

		# # Pattern Fills: convert base64 strings to MSImageData objects
		# if imageDefinitions.length > 0
		# 	for i in [0..imageDefinitions.length]
		# 		nsdata = NSData.alloc().initWithBase64EncodedString_options(imageDefinitions[i].data, 0)
		# 		nsimage = NSImage.alloc().initWithData(nsdata)
		# 		# msimage = MSImageData.alloc().initWithImageConvertingColorSpace(nsimage)
		# 		msimage = MSImageData.alloc().initWithImage(nsimage)
		# 		images.push(msimage)

		# # Gradient Fills: build MSGradientStop and MSGradient objects
		# if gradientDefinitions.length > 0
		# 	for i in [0..gradientDefinitions.length]
		# 		# Create gradient stops
		# 		gradient = gradientDefinitions[i]
		# 		stops = []
		# 		for j in [0..gradient.stops]
		# 			color = MSColor.colorWithRed_green_blue_alpha(
		# 				gradient.stops[j].color.red,
		# 				gradient.stops[j].color.green,
		# 				gradient.stops[j].color.blue,
		# 				gradient.stops[j].color.alpha
		# 			)
		# 			stops.push(MSGradientStop.stopWithPosition_color_(gradient.stops[j].position, color))

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

		# 		gradientName = gradientDefinitions[i].name ? gradientDefinitions[i].name : null
		# 		gradientAssets.push(MSGradientAsset.alloc().initWithAsset_name(msgradient, gradientName))

	palette
