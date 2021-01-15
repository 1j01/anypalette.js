
Color = require "./Color"

module.exports =
class Palette extends Array
	
	constructor: (args...)->
		super(args...)
		@name = undefined
		@description = undefined
		@numberOfColumns = undefined
		@geometrySpecifiedByFile = undefined
	
	add: (o)->
		new_color = new Color(o)
		@push new_color
	
	withoutDuplicates: ->
		new_palette = new Palette
		new_palette.name = @name

		# These aren't super meaningful if some colors are removed:
		# new_palette.numberOfColumns = @numberOfColumns
		# new_palette.geometrySpecifiedByFile = @geometrySpecifiedByFile

		new_palette[..] = @[..]
		# In-place uniquify
		# (Can't simply use `new_palette[..] = [...new Set(@)]` because it's Color objects, not strings)
		i = 0
		while i < new_palette.length
			i_color = new_palette[i]
			j = i + 1
			while j < new_palette.length
				j_color = new_palette[j]
				if i_color.is j_color
					new_palette.splice(j, 1)
					j -= 1
				j += 1
			i += 1
		
		new_palette

	###
	guess_dimensions: ->
		# TODO: get this working properly and enable

		len = @length
		candidate_dimensions = []
		for numberOfColumns in [0..len]
			n_rows = len / numberOfColumns
			if n_rows is Math.round n_rows
				candidate_dimensions.push [n_rows, numberOfColumns]
		
		squarest = [0, 3495093]
		for cd in candidate_dimensions
			if Math.abs(cd[0] - cd[1]) < Math.abs(squarest[0] - squarest[1])
				squarest = cd
		
		@numberOfColumns = squarest[1]
	###
