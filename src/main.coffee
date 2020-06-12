
Palette = require "./Palette"
Color = require "./Color"

class RandomColor extends Color
	constructor: ->
		super()
		@randomize()
	
	randomize: ->
		@h = Math.random() * 360
		@s = Math.random() * 100
		@l = Math.random() * 100
	
	toString: ->
		@randomize()
		"hsl(#{@h}, #{@s}%, #{@l}%)"
	
	is: -> no

class RandomPalette extends Palette
	constructor: ->
		super()
		@loader =
			name: "Completely Random Colors™"
			fileExtensions: []
			fileExtensionsPretty: "(.crc sjf(Df09sjdfksdlfmnm ';';"
		@matchedLoaderFileExtensions = no
		@confidence = 0
		@finalize()
		for i in [0..Math.random()*15+5]
			@push new RandomColor()

class LoadingErrors extends Error
	constructor: (@errors)->
		super()
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
			exts: ["txt"]
			load: require "./loaders/Paint.NET"
		}
		{
			name: "GIMP palette"
			exts: ["gpl", "gimp", "colors"]
			load: require "./loaders/GIMP"
		}
		{
			name: "KolourPaint palette"
			exts: ["colors"]
			load: require "./loaders/KolourPaint"
		}
		{
			name: "Skencil palette"
			exts: ["spl"]
			load: require "./loaders/SPL"
		}
		{
			name: "Sketch palette"
			exts: ["sketchpalette"]
			load: require "./loaders/sketchpalette"
		}
		{
			name: "sK1 palette"
			exts: ["skp"]
			load: require "./loaders/SKP"
		}
		{
			name: "CSS colors"
			exts: ["css", "scss", "sass", "less", "styl", "html", "htm", "svg", "js", "ts", "xml", "txt"]
			load: require "./loaders/CSS"
		}
		{
			name: "Windows desktop theme"
			exts: ["theme", "themepack"]
			load: require "./loaders/theme"
		}
		# {
		# 	name: "KDE desktop theme"
		# 	exts: ["colors"]
		# 	load: require "./loaders/theme"
		# }
		{
			name: "tabular colors"
			exts: ["csv", "tsv", "txt"]
			load: require "./loaders/tabular"
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
			name: "HPL palette"
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
		pl.matches_ext = pl.exts.indexOf(o.fileExt) isnt -1
	
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
			msg = "failed to load #{o.fileName} as #{pl.name}: #{e.message}"
			# if pl.matches_ext and not e.message.match(/not a/i)
			# 	console?.error? msg
			# else
			# 	console?.warn? msg
			
			# TODO: maybe this shouldn't be an Error object, just a {message, error} object
			# or {friendlyMessage, error}
			err = new Error msg
			err.error = e
			errors.push err
		
		if palette
			# console?.info? "loaded #{o.fileName} as #{pl.name}"
			palette.confidence = if pl.matches_ext then 0.9 else 0.01
			exts_pretty = ".#{pl.exts.join(", .")}"
			
			# TODO: probably rename loader -> format when 2-way data flow (read/write) is supported
			# TODO: maybe make this a 3rd (and fourth?) argument to the callback
			palette.loader =
				name: pl.name
				fileExtensions: pl.exts
				fileExtensionsPretty: exts_pretty
			palette.matchedLoaderFileExtensions = pl.matches_ext
			
			palette.finalize()
			callback(null, palette)
			return
	
	callback(new LoadingErrors(errors))
	return

normalize_options = (o = {})->
	if typeof o is "string" or o instanceof String
		o = filePath: o
	if File? and o instanceof File
		o = file: o
	
	# o.minColors ?= 2
	# o.maxColors ?= 256
	o.fileName ?= o.file?.name ? (if o.filePath then require("path").basename(o.filePath))
	o.fileExt ?= "#{o.fileName}".split(".").pop()
	o.fileExt = "#{o.fileExt}".toLowerCase()
	o

AnyPalette = {
	Color
	Palette
	RandomColor
	RandomPalette
	# LoadingErrors
}

# Get palette from a file
AnyPalette.loadPalette = (o, callback)->
	if not o
		throw new Error "Parameters required: AnyPalette.loadPalette(options, function callback(err, palette){})"
	if not callback
		throw new Error "Callback required: AnyPalette.loadPalette(options, function callback(err, palette){})"
	
	o = normalize_options o
	
	if o.data
		load_palette(o, callback)
	else if File? and o.file instanceof File
		fr = new FileReader
		fr.onload = ->
			o.data = fr.result
			load_palette(o, callback)
		fr.readAsBinaryString o.file
	else if o.filePath?
		fs = require "fs"
		fs.readFile o.filePath, (err, data)->
			if err
				callback(err)
			else
				o.data = data.toString("binary")
				load_palette(o, callback)
	else
		callback(new Error("Could not load. The File API may not be supported.")) # um...
		# the File API would be supported if you've passed a File
		# TODO: a better error message, about options (not) passed


# Get a palette from a file or by any means necessary
# (as in fall back to completely random data)
AnyPalette.gimmeAPalette = (o, callback)->
	o = normalize_options o
	
	AnyPalette.loadPalette o, (err, palette)->
		callback(null, palette ? new RandomPalette)

# Exports
module.exports = AnyPalette
