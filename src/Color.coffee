
# color value ranges are all 0 to 1

# input: hue,saturation,lightness in [0,1] - output: red,green,blue in [0,1]
hsl2rgb = (hue, saturation, lightness)->
	a = saturation * Math.min(lightness, 1-lightness)
	f = (n, k = (n+hue*12)%12)-> lightness - a*Math.max(Math.min(k-3, 9-k, 1), -1)
	return [f(0), f(8), f(4)].map((component)-> component)

component_names = ["red", "green", "blue", "hue", "saturation", "lightness", "value", "cyan", "magenta", "yellow", "key", "alpha", "x", "y", "z", "l", "a", "b"]

module.exports =
class Color
	constructor: (options)->
		# @TODO: don't assign all of {@red, @green, @blue, @hue, @saturation, @value, @lightness} right away
		# only assign the properties that are used
		{
			@red, @green, @blue,
			@hue, @saturation, @value, @lightness,
			cyan, magenta, yellow, key,
			@alpha,
			@name
		} = options

		for component_name in component_names when options[component_name]?
			if (not isFinite(options[component_name])) or (typeof options[component_name] isnt "number")
				throw new TypeError("Color component option #{component_name} is not a finite number: #{JSON.stringify(options[component_name])}")
			if options[component_name] < 0 or options[component_name] > 1
				throw new TypeError("Color component option #{component_name} outside range of [0,1]: #{options[component_name]}")

		if @red? and @green? and @blue?
			# Red Green Blue
			# (no conversions needed here)
		else if @hue? and @saturation?
			# Cylindrical Color Space
			if @value?
				# Hue Saturation Value
				@lightness = (2 - @saturation) * @value / 2
				@saturation = @saturation * @value / (if @lightness < 0.5 then @lightness * 2 else 2 - @lightness * 2)
				@saturation = 0 if isNaN @saturation
			else if @lightness?
				# Hue Saturation Lightness
				# (no conversions needed here)
			else if options.brightness?
				throw new TypeError "{hue, saturation, brightness} not supported. Use either {hue, saturation, lightness} or {hue, saturation, value} for cylindrical a color space."
			else
				throw new TypeError "Hue, saturation, and.. what? (either lightness (l) or value (value) expected)"
			[@red, @green, @blue] = hsl2rgb(@hue, @saturation, @lightness)
		else if cyan? and magenta? and yellow? and key?
			# Cyan Magenta Yellow blacK
			# UNTESTED
			@red = (1 - Math.min(1, cyan * (1 - key) + key))
			@green = (1 - Math.min(1, magenta * (1 - key) + key))
			@blue = (1 - Math.min(1, yellow * (1 - key) + key))
		else
			# TODO: rename l -> lightness?
			# a/b -> aChroma/bChroma? aChrominance/bChrominance??
			if options.l? and options.a? and options.b?
				white_D50 =
					x: 96.422
					y: 100.000
					z: 82.521
				# white_D65 =
				# 	x: 95.047
				# 	y: 100.000
				# 	z: 108.883
				
				options.a -= 1/2
				options.b -= 1/2
				# TODO: Get this actually working, using Information and Math instead of Fiddling Around
				# It would be nice if I could find some XYZ palettes,
				# since the LAB handling depends on the XYZ handling.
				options.l = Math.pow(options.l, 2) # messing around
				options.l *= 15 # messing around
				options.a *= 80 # messing around
				options.b *= 80 # messing around

				xyz =
					y: (options.l + 16) / 116
				xyz.x = options.a / 500 + xyz.y
				xyz.z = xyz.y - options.b / 200
				
				for c in "xyz"
					powed = Math.pow(xyz[c], 3)

					if powed > 0.008856
						xyz[c] = powed
					else
						xyz[c] = (xyz[c] - 16 / 116) / 7.787
					# set {x, y, z} options for fallthrough
					options[c] = xyz[c] * white_D50[c]
			# fallthrough
			if options.x? and options.y? and options.z?
				{x, y, z} = options
				
				rgb =
					r: x * 3.2406 + y * -1.5372 + z * -0.4986
					g: x * -0.9689 + y * 1.8758 + z * 0.0415
					b: x * 0.0557 + y * -0.2040 + z * 1.0570
				
				# r =  3.2404542*x - 1.5371385*y - 0.4985314*z
				# g = -0.9692660*x + 1.8760108*y + 0.0415560*z
				# b =  0.0556434*x - 0.2040259*y + 1.0572252*z

				for c in "rgb"
					if rgb[c] < 0
						rgb[c] = 0
					
					if rgb[c] > 0.0031308
						rgb[c] = 1.055 * Math.pow(rgb[c], (1 / 2.4)) - 0.055
					else
						rgb[c] *= 12.92
					
				@red = rgb.r
				@green = rgb.g
				@blue = rgb.b
			else
				throw new TypeError "Color constructor must be called with {red,green,blue} or {hue,saturation,value} or {hue,saturation,lightness} or {cyan,magenta,yellow,key} or {x,y,z} or {l,a,b},
					#{
						try
							"got #{JSON.stringify(options)}"
						catch
							"got something that couldn't be displayed with JSON.stringify for this error message"
					}
				"
		
	
	toString: ->
		if @hue?
			# Hue Saturation Lightness
			if @alpha?
				"hsla(#{@hue * 360}, #{@saturation * 100}%, #{@lightness * 100}%, #{@alpha})"
			else
				"hsl(#{@hue * 360}, #{@saturation * 100}%, #{@lightness * 100}%)"
		else if @red?
			# Red Green Blue
			if @alpha?
				"rgba(#{@red * 255}, #{@green * 255}, #{@blue * 255}, #{@alpha})"
			else
				"rgb(#{@red * 255}, #{@green * 255}, #{@blue * 255})"
	
	@is: (colorA, colorB, epsilon=0.0001)->
		Math.abs(colorA.red - colorB.red) < epsilon and
		Math.abs(colorA.green - colorB.green) < epsilon and
		Math.abs(colorA.blue - colorB.blue) < epsilon and
		Math.abs((colorA.alpha ? 1) - (colorB.alpha ? 1)) < epsilon
