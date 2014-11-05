
Color = require "./Color"

module.exports =
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
