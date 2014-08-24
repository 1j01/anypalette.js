
class Color
	
	constructor: ({
		@r, @g, @b,
		@h, @s, @v, @l,
		c, m, y, k,
		@name
	})->
		if @r? and @g? and @b?
			# Red Green Blue
		else if @h? and @s?
			# Cylindrical Color Space
			if @v?
				# Hue Saturation Value
				@l = (2 - @s / 100) * @v / 2
				@s = @s * @v / (if @l < 50 then @l * 2 else 200 - @l * 2)
				@s = 0 if isNaN @s
			else if @l?
				# Hue Saturation Lightness
			else
				throw new Error "Hue, saturation, and...? (either lightness or value)"
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
				white =
					x: 95.047
					y: 100.000
					z: 108.883
				
				xyz = 
					y: (raw.l + 16) / 116
					x: raw.a / 500 + xyz.y
					z: xyz.y - raw.b / 200
				
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
				throw new Error "Color constructor must be called with {r,g,b} or {h,s,v} or {h,s,l} or {c,m,y,k} or {x,y,z} or {l,a,b}"
		
	
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
		###
		@r is color.r and
		@g is color.g and
		@b is color.b and
		@h is color.h and
		@s is color.s and
		@l is color.l
		###
		@toString() is color.toString()


class RandomColor
	
	constructor: ->
		@randomize()
	
	randomize: ->
		@h = Math.random() * 360
		@s = Math.random() * 100
		@l = Math.random() * 100
	
	toString: ->
		@randomize()
		"hsl(#{@h}, #{@s}%, #{@l}%)"


class Palette extends Array
	
	constructor: ->
		super()
		@with_duplicates = @
		
	add: (o)->
		new_color = new Color(o)
		
		if @with_duplicates is @
			@with_duplicates = new Palette()
		
		@with_duplicates.push new_color
		
		for color in @
			if color.is new_color
				new_color.is_duplicate = true
				return
		
		@push new_color
	
	finalize: ->
		if not @n_columns
			@guess_dimensions()
		if @with_duplicates
			@with_duplicates.guess_dimensions()
		
	guess_dimensions: ->
		len = @length
		candidate_dimensions = []
		for n_columns in [0..len]
			n_rows = len / n_columns
			if n_rows is Math.round n_rows
				candidate_dimensions.push [n_rows, n_columns]
		
		squarest = [0, 3495093]
		for cd in candidate_dimensions
			if Math.abs(cd[0] - cd[1]) < Math.abs(squarest[0] - squarest[1])
				squarest = cd
		
		#@n_columns = squarest[1]
