
Color = require "./Color"

module.exports =
class Palette extends Array
	
	constructor: (args...)->
		super(args...)
	
	add: (o)->
		new_color = new Color(o)
		@push new_color
	
	finalize: ->
		# TODO: get this working properly and enable
		# if not @numberOfColumns
		# 	@guess_dimensions()
		unless @parentPaletteWithoutDuplicates
			@withDuplicates = new Palette
			@withDuplicates.parentPaletteWithoutDuplicates = @
			@withDuplicates[i] = @[i] for i in [0...@length]
			@withDuplicates.numberOfColumns = @numberOfColumns
			@withDuplicates.geometrySpecifiedByFile = @geometrySpecifiedByFile
			@withDuplicates.finalize()

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
