
Color = require "./Color"

component_names = [
	"r", "g", "b", "h", "s", "l", "v", "x", "y", "z", "a", "b", "c", "m", "y", "k",
	"red", "green", "blue", "hue", "saturation", "lightness", "value", "cyan", "magenta", "yellow", "key", "alpha"
]

module.exports =
class Palette extends Array
	
	constructor: (args...)->
		super(args...)
		@name = undefined
		@description = undefined
		@numberOfColumns = undefined
		@geometrySpecifiedByFile = undefined
	
	add: (o)->
		for component_name in component_names when o[component_name]?
			if (not isFinite(o[component_name])) or (typeof o[component_name] isnt "number")
				throw new TypeError("palette.add() component option #{component_name} is not a finite number: #{JSON.stringify(o[component_name])}")
			if o[component_name] < 0 or o[component_name] > 1
				throw new TypeError("palette.add() component option #{component_name} outside range of [0,1]: #{o[component_name]}")

		new_color = if o instanceof Color then o else new Color(o)
		@push new_color
	
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
