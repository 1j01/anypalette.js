
Palette = require './colors'

class RandomPalette extends Palette
	constructor: ->
		super()
		@loaded_as = "Completely Random Colors™"
		@loaded_as_clause = "(.crc sjf(Df09sjdfksdlfmnm ';';"
		@confidence = 0
		@finalize()
		for i in [0..Math.random()*15+5]
			@push new RandomColor()

class LoadingErrors extends Error
	constructor: (@errors)->
		@message = "Some errors were encountered when loading:" +
			for error in @errors
				"\n\t" + error.message

load_palette = (o, callback)->
	
	palette_loaders = [
		{
			name: "Paint Shop Pro palette"
			exts: ["pal", "psppalette"]
			load: require "./loaders/PaintShopPro"
		}
		{
			name: "RIFF PAL"
			exts: ["pal"]
			load: require "./loaders/RIFF"
		}
		{
			name: "ColorSchemer palette"
			exts: ["cs"]
			load: require "./loaders/ColorSchemer"
		}
		{
			name: "Paint.NET palette"
			exts: ["txt", "pdn"]
			load: require "./loaders/Paint.NET"
		}
		{
			name: "GIMP palette"
			exts: ["gpl", "gimp", "colors"]
			load: require "./loaders/GIMP"
		}
		{
			name: "hey look some colors"
			exts: ["txt", "html", "css", "xml", "svg", "etc"]
			# @TODO: rename this to "CSS" (it's not very "generic")
			load: require "./loaders/Generic"
		}
		# {
		# 	name: "Adobe Color Swatch"
		# 	exts: ["aco"]
		# 	load: require "./loaders/AdobeColorSwatch"
		# }
		# {
		# 	name: "Adobe Color Table"
		# 	exts: ["act"]
		# 	load: require "./loaders/AdobeColorTable"
		# }
		# {
		# 	name: "Adobe Swatch Exchange"
		# 	exts: ["ase"]
		# 	load: require "./loaders/AdobeSwatchExchange"
		# }
		# {
		# 	name: "Adobe Color Book"
		# 	exts: ["acb"]
		# 	load: require "./loaders/AdobeColorBook"
		# }
		{
			name: "Houndstooth Palette Locellate"
			exts: ["hpl"]
			load: require "./loaders/HPL"
		}
		{
			name: "StarCraft palette"
			exts: ["pal"]
			load: require "./loaders/StarCraft"
		}
		{
			name: "StarCraft terrain palette"
			exts: ["wpe"]
			load: require "./loaders/StarCraftPadded"
		}
		
		# {
		# 	name: "AutoCAD Color Book"
		# 	exts: ["acb"]
		# 	load: require "./loaders/AutoCADColorBook"
		# }
		
		# {
		# 	# (same as Paint Shop Pro palette?)
		# 	name: "CorelDRAW palette"
		# 	exts: ["pal", "cpl"]
		# 	load: require "./loaders/CorelDRAW"
		# }
	]
	
	# find palette loaders that use this file extension
	for pl in palette_loaders
		pl.matches_ext = pl.exts.indexOf(o.file_ext) isnt -1
	
	# move palette loaders to the beginning that use this file extension
	palette_loaders.sort (pl1, pl2)->
		pl2.matches_ext - pl1.matches_ext
	
	# try loading stuff
	errors = []
	for pl in palette_loaders
		
		try
			palette = pl.load(o)
			if palette.length is 0
				palette = null
				throw new Error "no colors returned"
		catch e
			msg = "failed to load #{o.file_name} as #{pl.name}: #{e.message}"
			if pl.matches_ext and not e.message.match(/not a/i)
				console?.error? msg
			else
				console?.warn? msg
			
			err = new Error msg
			err.error = e
			errors.push err
		
		if palette
			console?.info? "loaded #{o.file_name} as #{pl.name}"
			palette.confidence = if pl.matches_ext then 0.9 else 0.01
			palette.loaded_as = pl.name
			exts_pretty = "(." + pl.exts.join(", .") + ")"
			
			if pl.matches_ext
				palette.loaded_as_clause = exts_pretty
			else
				palette.loaded_as_clause = " for some reason"
			
			palette.finalize()
			return callback(null, palette)
	
	return callback(new LoadingErrors(errors))

options = (o = {})->
	if typeof o is "string" or o instanceof String
		o = file_name: o
	if File? and o instanceof File
		o = file: o
	
	o.min_colors ?= o.minColors ? 2
	o.max_colors ?= o.maxColors ? 256
	o.file_name ?= o.fileName ? o.fname ? o.file?.name
	o.file_ext ?= o.fileExt ? "#{o.file_name}".split(".").pop()
	o.file_ext = ("#{o.file_ext}").toLowerCase()
	o
	

# Get palette from a file
Palette.load = (o, callback)->
	if not o
		throw new Error "Parameters required: Palette.load(options, function callback(err, palette){})"
	if not callback
		throw new Error "Callback required: Palette.load(options, function callback(err, palette){})"
	
	o = options o
	
	if o.data
		load_palette(o, callback)
	else if File? and o.file instanceof File
		fr = new FileReader
		fr.onload = ->
			o.data = fr.result
			load_palette(o, callback)
		fr.readAsBinaryString o.file
	else if global? and o.file_name
		fs = require "fs"
		fs.readFile o.file_name, (err, data)->
			o.data = data.toString()
			load_palette(o, callback)
	else
		callback(new Error("Could not load. The File API may not be supported."))


# Get a palette from a file or by any means nessesary
# (as in fall back to completely random data)
Palette.gimme = (o, callback)->
	o = options o
	
	Palette.load o, (err, palette)->
		callback(null, palette ? new RandomPalette)


module.exports = Palette
#window?.Palette = Palette

