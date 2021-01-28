
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
		new_color = if o instanceof Color then o else new Color(o)
		@push new_color
	
	###
	guess_dimensions: ->
		# TODO: get this working properly and enable
		# probably as a static method AnyPalette.guessDimensions?

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
