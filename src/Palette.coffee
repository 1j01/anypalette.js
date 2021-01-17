
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
		# FORMER COLOR RANGES (NOW ALL 0 to 1):
		# alpha: 0 to 1
		# red/green/blue: 0 to 255
		# hue: 0 to 360
		# saturation/lightness/value: 0 to 100
		# cyan/magenta/yellow/key: 0 to 100
		# x/y/z: 0 to 100
		# l/a/b: 0 to 100

		for component_name in component_names when o[component_name]?
			if (not isFinite(o[component_name])) or (typeof o[component_name] isnt "number")
				throw new TypeError("palette.add() component option #{component_name} is not a finite number: #{JSON.stringify(o[component_name])}")
			# if o[component_name] < 0 or o[component_name] > 1
			# 	throw new TypeError("palette.add() component option #{component_name} outside range of [0,1]: #{o[component_name]}")

		if o.r?
			o.red = o.r / 255
			o.green = o.g / 255
			o.blue = o.b / 255
			delete o.b # avoid conflict with L*a*b*
		if o.y?
			o.cyan = o.c / 100
			o.magenta = o.m / 100
			o.yellow = o.y / 100
			o.key = o.k / 100
			delete o.y # avoid conflict with xyz
		if o.h?
			o.hue = o.h / 360
			o.saturation = o.s / 100
			if o.l?
				o.lightness = o.l / 100
				delete o.l # avoid conflict with L*a*b*
			if o.v?
				o.value = o.v / 100
		if o.l? and o.a? and o.b?
			o.l /= 100
			o.a /= 100
			o.b /= 100
		if o.x? and o.y? and o.z?
			o.x /= 100
			o.y /= 100
			o.z /= 100
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
