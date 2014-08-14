
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
		[load_jasc_pal, exts:["pal", "psppalette"], name:"Paint Shop Pro palette"]
		[load_riff_pal, exts:["pal"], name:"RIFF PAL"]
		#[load_corel_pal, exts:["pal", "cpl"], name:"CorelDRAW palette"] (same as above, right?)
		[load_color_scheme, exts:["cs"], name:"ColorSchemer palette"]
		[load_pdn_palette, exts:["txt", "pdn"], name:"Paint.NET palette"]
		[load_gimp_palette, exts:["gpl", "gimp", "colors"], name:"GIMP palette"]
		
		[load_colors_generically, exts:["txt", "html", "css", "xml", "svg", "etc"], name:"hey look some colors"]
		
		[load_adobe_color_swatch, exts:["aco"], name:"Adobe Color Swatch"]
		[load_adobe_color_table, exts:["act"], name:"Adobe Color Table"]
		[load_adobe_swatch_exchange, exts:["ase"], name:"Adobe Swatch Exchange"]
		[load_adobe_color_book, exts:["acb"], name:"Adobe Color Book"]
		#[load_autocad_color_book, exts:["acb"], name:"AutoCAD Color Book"]
		[load_hpl, exts:["hpl"], name:"Houndstooth Palette Locellate"]
		[load_starcraft_pal, exts:["pal"], name:"StarCraft palette"] # Perpetual Allocation Location
		[load_starcraft_wpe, exts:["wpe"], name:"StarCraft terrain palette"] # Weirdly Padded Endianness
	]
	
	for pl in palette_loaders
		pl.matches_ext = pl[1].exts.indexOf(o.file_ext) isnt -1
	
	# move palette loaders to the beginning that use this file extension
	palette_loaders.sort (pl1, pl2)->
		pl2.matches_ext - pl1.matches_ext
	
	#if o.file_ext is "colors"
	#	console?.debug? palette_loaders
	
	# try loading stuff
	errors = []
	for pl in palette_loaders
		
		try
			palette = pl[0](o)
			if palette.length is 0
				palette = null
				throw new Error "no colors returned"
		catch e
			msg = "failed to load #{o.file_name} as #{pl[1].name}: #{e.message}"
			if pl.matches_ext and not e.message.match(/not a/i)
				console?.error? msg
			else
				console?.warn? msg
			
			err = new Error msg
			err.error = e
			errors.push err
		
		if palette
			console?.info? "loaded #{o.file_name} as #{pl[1].name}"
			palette.confidence = if pl.matches_ext then 0.9 else 0.01
			palette.loaded_as = pl[1].name
			exts_pretty = "(." + pl[1].exts.join(", .") + ")"
			
			if pl.matches_ext
				palette.loaded_as_clause = exts_pretty
			else
				palette.loaded_as_clause = " for some reason"
			
			palette.finalize()
			return callback(null, palette)
	
	return callback(new LoadingErrors(errors))

options = (o = {})->
	if File? and o instanceof File
		console.log file: o
		o = file: o
	
	o.min_colors ?= o.minColors ? 2
	o.max_colors ?= o.maxColors ? 256
	o.file_name ?= o.fileName ? o.fname ? o.file?.name ? "an.unknown file"
	o.file_ext ?= o.file_name.split(".").pop()
	o.file_ext = (o.file_ext+"").toLowerCase()
	o
	

# Get palette from a file
Palette.load = (o, callback)->
	o = options o
	
	if o.data
		load_palette(o, callback)
	else if File? and o.file instanceof File
		fr = new FileReader
		fr.onload = ->
			o.data = fr.result
			load_palette(o, callback)
		fr.readAsBinaryString o.file
	else if require? and o.file_name and o.file_name isnt "an.unknown file"
		fs = require "fs"
		fs.readFile o.file_name, (err, data)->
			o.data = data
			load_palette(o, callback)
	else
		callback(new Error("Could not load. The File API may not be supported."))


# Get palette from a file any means nessesary (as in from completely random data)
Palette.gimme = (o, callback)->
	o = options o
	
	Palette.load o, (err, palette)->
		callback(null, palette ? new RandomPalette)

if module?
	module.exports = Palette
else
	window.Palette = Palette
