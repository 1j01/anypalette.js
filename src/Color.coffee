
# color value ranges:
# a: 0 to 1
# r/g/b: 0 to 255
# h: 0 to 360
# s/l: 0 to 100
# c/m/y/k: 0 to 100

module.exports =
class Color
	constructor: (options)->
		# @TODO: don't assign all of {@r, @g, @b, @h, @s, @v, @l} right away
		# only assign the properties that are used
		# also maybe always have @r @g @b (or @red @green @blue) but still stringify to hsl() if hsl or hsv given
		# TODO: expect numbers or convert to numbers
		{
			@r, @g, @b,
			@h, @s, @v, @l,
			c, m, y, k,
			@name
		} = options

		if @r? and @g? and @b?
			# Red Green Blue
			# (no conversions needed here)
		else if @h? and @s?
			# Cylindrical Color Space
			if @v?
				# Hue Saturation Value
				@l = (2 - @s / 100) * @v / 2
				@s = @s * @v / (if @l < 50 then @l * 2 else 200 - @l * 2)
				@s = 0 if isNaN @s
			else if @l?
				# Hue Saturation Lightness
				# (no conversions needed here)
			else
				# TODO: improve error message (especially if @b given)
				throw new Error "Hue, saturation, and...? (either lightness or value)"
			# TODO: maybe convert to @r @g @b here
		else if c? and m? and y? and k?
			# Cyan Magenta Yellow blacK
			# UNTESTED
			c /= 100
			m /= 100
			y /= 100
			k /= 100
			
			@r = 255 * (1 - Math.min(1, c * (1 - k) + k))
			@g = 255 * (1 - Math.min(1, m * (1 - k) + k))
			@b = 255 * (1 - Math.min(1, y * (1 - k) + k))
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
					x: raw.x / 100
					y: raw.y / 100
					z: raw.z / 100
				
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
				throw new Error "Color constructor must be called with {r,g,b} or {h,s,v} or {h,s,l} or {c,m,y,k} or {x,y,z} or {l,a,b},
					#{
						try
							"got #{JSON.stringify(options)}"
						catch
							"got something that couldn't be displayed with JSON.stringify for this error message"
					}
				"
		
	
	toString: ->
		if @r?
			# Red Green Blue
			if @a? # Alpha
				"rgba(#{@r}, #{@g}, #{@b}, #{@a})"
			else # Opaque
				"rgb(#{@r}, #{@g}, #{@b})"
		else if @h?
			# Hue Saturation Lightness
			# (Assume h:0-360, s:0-100, l:0-100)
			if @a? # Alpha
				"hsla(#{@h}, #{@s}%, #{@l}%, #{@a})"
			else # Opaque
				"hsl(#{@h}, #{@s}%, #{@l}%)"
	
	is: (color)->
		# compare as strings
		"#{@}" is "#{color}"
