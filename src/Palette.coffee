
Color = require "./Color"

module.exports =
class Palette extends Array
	
	constructor: (args...)->
		super(args...)
	
	add: (o)->
		new_color = new Color(o)
		@push new_color
	
	finalize: ->
		# if not @n_columns
		# 	@guess_dimensions()
		unless @parent_palette_without_duplicates
			@with_duplicates = new Palette
			@with_duplicates.parent_palette_without_duplicates = @
			@with_duplicates[i] = @[i] for i in [0...@length]
			@with_duplicates.n_columns = @n_columns
			@with_duplicates.has_dimensions = @has_dimensions
			@with_duplicates.finalize()
			@withDuplicates = @with_duplicates # TODO: just use camelCase everywhere

			# in-place uniquify
			i = 0
			while i < @length
				i_color = @[i]
				j = i + 1
				while j < @length
					j_color = @[j]
					if i_color.is j_color
						@.splice(j, 1)
						j -= 1
					j += 1
				i += 1

	guess_dimensions: ->
		# TODO: get this working properly and enable

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
		
		# @n_columns = squarest[1]
