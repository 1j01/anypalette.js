
Palette = require "./Palette"
Color = require "./Color"

class LoadingErrors extends Error
	constructor: (@errors)->
		super()
		@message = "Some errors were encountered when loading:" +
			for error in @errors
				"\n\t" + error.message

formats =
	PAINT_SHOP_PRO_PALETTE: {
		name: "Paint Shop Pro palette"
		exts: ["pal", "psppalette"]
		load: require "./loaders/PaintShopPro"
	}
	RIFF_PALETTE: {
		name: "RIFF PAL"
		exts: ["pal"]
		load: require "./loaders/RIFF"
	}
	COLORSCHEMER_PALETTE: {
		name: "ColorSchemer palette"
		exts: ["cs"]
		load: require "./loaders/ColorSchemer"
	}
	PAINTDOTNET_PALETTE: {
		name: "Paint.NET palette"
		exts: ["txt"]
		load: require "./loaders/Paint.NET"
	}
	GIMP_PALETTE: {
		name: "GIMP palette"
		exts: ["gpl", "gimp", "colors"]
		load: require "./loaders/GIMP"
		write: require "./writers/GIMP"
	}
	KOULORPAINT_PALETTE: {
		name: "KolourPaint palette"
		exts: ["colors"]
		load: require "./loaders/KolourPaint"
	}
	SKENCIL_PALETTE: {
		name: "Skencil palette"
		exts: ["spl"]
		load: require "./loaders/SPL"
	}
	SKETCH_JSON_PALETTE: {
		name: "Sketch palette"
		exts: ["sketchpalette"]
		load: require "./loaders/sketchpalette"
		write: require "./writers/sketchpalette"
	}
	SK1_PALETTE: {
		name: "sK1 palette"
		exts: ["skp"]
		load: require "./loaders/SKP"
	}
	CSS_COLORS: {
		name: "CSS colors"
		exts: ["css", "scss", "sass", "less", "styl", "html", "htm", "svg", "js", "ts", "xml", "txt"]
		load: require "./loaders/CSS"
	}
	WINDOWS_THEME_COLORS: {
		name: "Windows desktop theme"
		exts: ["theme", "themepack"]
		load: require "./loaders/theme"
	}
	# KDE_THEME_COLORS: {
	# 	name: "KDE desktop theme"
	# 	exts: ["colors"]
	# 	load: require "./loaders/theme"
	# }
	KDE_RGB_PALETTE: {
		name: "KolourPaint palette"
		exts: ["colors"]
		write: require "./writers/KolourPaint"
	}
	# ADOBE_COLOR_SWATCH_PALETTE: {
	# 	name: "Adobe Color Swatch"
	# 	exts: ["aco"]
	# 	load: require "./loaders/AdobeColorSwatch"
	# }
	ADOBE_COLOR_TABLE_PALETTE: {
		name: "Adobe Color Table"
		exts: ["act"]
		load: require "./loaders/AdobeColorTable"
	}
	# ADOBE_SWATCH_EXCHANGE_PALETTE: {
	# 	name: "Adobe Swatch Exchange"
	# 	exts: ["ase"]
	# 	load: require "./loaders/AdobeSwatchExchange"
	# }
	# ADOBE_COLOR_BOOK_PALETTE: {
	# 	name: "Adobe Color Book"
	# 	exts: ["acb"]
	# 	load: require "./loaders/AdobeColorBook"
	# }
	HOMESITE_PALETTE: {
		name: "Homesite palette"
		exts: ["hpl"]
		load: require "./loaders/Homesite"
	}
	STARCRAFT_PALETTE: {
		name: "StarCraft palette"
		exts: ["pal"]
		load: require "./loaders/StarCraft"
	}
	STARCRAFT_PADDED: {
		name: "StarCraft terrain palette"
		exts: ["wpe"]
		load: require "./loaders/StarCraftPadded"
	}

	# AUTOCAD_COLOR_BOOK_PALETTE: {
	# 	name: "AutoCAD Color Book"
	# 	exts: ["acb"]
	# 	load: require "./loaders/AutoCADColorBook"
	# }

	# CORELDRAW_PALETTE: {
	# 	# (same as Paint Shop Pro palette?)
	# 	name: "CorelDRAW palette"
	# 	exts: ["pal", "cpl"]
	# 	load: require "./loaders/CorelDRAW"
	# }
	TABULAR: {
		name: "tabular colors"
		exts: ["csv", "tsv", "txt"]
		load: require "./loaders/tabular"
	}

load_palette = (o, callback)->
	
	# find formats that use this file extension
	matching_ext = {}
	for format_id in Object.keys(formats)
		if formats[format_id].exts.indexOf(o.fileExt) > -1
			matching_ext[format_id] = true
	
	# sort formats to the beginning that use this file extension
	format_ids = Object.keys(formats)
	format_ids.sort (format_id_1, format_id_2)->
		matching_ext[format_id_2]? - matching_ext[format_id_1]?
	
	# try loading stuff
	errors = []
	for format_id in format_ids
		format = formats[format_id]
		try
			palette = format.load(o)
			if palette.length is 0
				palette = null
				throw new Error "no colors returned"
		catch e
			msg = "failed to load #{o.fileName} as #{format.name}: #{e.message}"
			# if matching_ext[format_id]? and not e.message.match(/not a/i)
			# 	console?.error? msg
			# else
			# 	console?.warn? msg
			
			# TODO: maybe this shouldn't be an Error object, just a {message, error} object
			# or {friendlyMessage, error}
			err = new Error msg
			err.error = e
			errors.push err
		
		if palette
			# console?.info? "loaded #{o.fileName} as #{format.name}"
			palette.confidence = if matching_ext[format_id]? then 0.9 else 0.01
			exts_pretty = ".#{format.exts.join(", .")}"
			
			# TODO: probably rename loader -> format when 2-way data flow (read/write) is supported
			# TODO: maybe make this a 3rd (and fourth?) argument to the callback
			palette.loader =
				name: format.name
				fileExtensions: format.exts
				fileExtensionsPretty: exts_pretty
			palette.matchedLoaderFileExtensions = matching_ext[format_id]?
			
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
	# LoadingErrors
	formats
}

# Get palette from a file
AnyPalette.loadPalette = (o, callback)->
	if not o
		throw new TypeError "parameters required: AnyPalette.loadPalette(options, function callback(error, palette){})"
	if not callback
		throw new TypeError "callback required: AnyPalette.loadPalette(options, function callback(error, palette){})"
	
	o = normalize_options o
	
	if o.data
		load_palette(o, callback)
	else if o.file
		if not (o.file instanceof File)
			throw new TypeError "options.file was passed but it is not a File"
		fr = new FileReader
		fr.onerror = ->
			callback(fr.error)
		fr.onload = ->
			o.data = fr.result
			load_palette(o, callback)
		fr.readAsBinaryString o.file
	else if o.filePath?
		fs = require "fs"
		fs.readFile o.filePath, (error, data)->
			if error
				callback(error)
			else
				o.data = data.toString("binary")
				load_palette(o, callback)
	else
		throw new TypeError "either options.data or options.file or options.filePath must be passed"

AnyPalette.savePalette = (palette, format)->
	format ?= AnyPalette.formats.GIMP_PALETTE

	palette_content = format.write(palette)
	file = new File([palette_content], (palette.name ? "Saved Colors") + ".#{format.exts[0]}")
	return [file, format.exts[0]]


# Exports
module.exports = AnyPalette
