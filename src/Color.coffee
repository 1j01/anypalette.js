
# color value ranges are all 0 to 1
# FORMERLY:
# alpha: 0 to 1
# red/green/blue: 0 to 255
# hue: 0 to 360
# saturation/lightness: 0 to 100
# cyan/magenta/yellow/key: 0 to 100

# input: hue,saturation,lightness in [0,1] - output: red,green,blue in [0,1]
hsl2rgb = (hue, saturation, lightness)->
	a = saturation * Math.min(lightness, 1-lightness)
	f = (n, k = (n+hue*12)%12)-> lightness - a*Math.max(Math.min(k-3, 9-k, 1), -1)
	return [f(0), f(8), f(4)].map((component)-> component)

module.exports =
class Color
	constructor: (options)->
		# @TODO: don't assign all of {@red, @green, @blue, @hue, @saturation, @value, @lightness} right away
		# only assign the properties that are used
		# TODO: expect numbers or convert to numbers
		# TODO: warn/error for numbers outside range
		{
			@red, @green, @blue,
			@hue, @saturation, @value, @lightness,
			cyan, magenta, yellow, key,
			@alpha, # can't be @a because of CIELAB color space (L*a*b*)
			@name
		} = options

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
				throw new Error "{hue, saturation, brightness} not supported. Use either {hue, saturation, lightness} or {hue, saturation, value} for cylindrical a color space."
			else
				throw new Error "Hue, saturation, and.. what? (either lightness (l) or value (value) expected)"
			[@red, @green, @blue] = hsl2rgb(@hue, @saturation, @lightness)
		else if cyan? and magenta? and yellow? and key?
			# Cyan Magenta Yellow blacK
			# UNTESTED
			@red = (1 - Math.min(1, cyan * (1 - key) + key))
			@green = (1 - Math.min(1, magenta * (1 - key) + key))
			@blue = (1 - Math.min(1, yellow * (1 - key) + key))
		else
			# UNTESTED UNTESTED UNTESTED UNTESTED UNTESTED UNTESTED
			if @l? and @a? and @b?
				# white =
				# 	x: 95.047
				# 	y: 100.000
				# 	z: 108.883
				
				xyz =
					y: (raw.l + 16) / 116
				xyz.x = raw.a / 500 + xyz.y
				xyz.z = xyz.y - raw.b / 200
				
				for _ in "xyz"
					powed = Math.pow(xyz[_], 3)
					
					if powed > 0.008856
						xyz[_] = powed
					else
						xyz[_] = (xyz[_] - 16 / 116) / 7.787
					
					#xyz[_] = _round(xyz[_] * white[_])
				
			# UNTESTED UNTESTED UNTESTED UNTESTED
			if @x? and @y? and @z?
				xyz =
					x: raw.x
					y: raw.y
					z: raw.z
				
				rgb =
					r: xyz.x * 3.2406 + xyz.y * -1.5372 + xyz.z * -0.4986
					g: xyz.x * -0.9689 + xyz.y * 1.8758 + xyz.z * 0.0415
					b: xyz.x * 0.0557 + xyz.y * -0.2040 + xyz.z * 1.0570
				
				for _ in "rgb"
					#rgb[_] = _round(rgb[_])
					
					if rgb[_] < 0
						rgb[_] = 0
					
					if rgb[_] > 0.0031308
						rgb[_] = 1.055 * Math.pow(rgb[_], (1 / 2.4)) - 0.055
					else
						rgb[_] *= 12.92
					
					
					#rgb[_] = Math.round(rgb[_] * 255)
			else
				throw new Error "Color constructor must be called with {red,green,blue} or {hue,saturation,value} or {hue,saturation,lightness} or {cyan,magenta,yellow,key} or {x,y,z} or {l,a,b},
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
