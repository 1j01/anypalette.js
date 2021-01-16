
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
		fileExtensions: ["pal", "psppalette"]
		load: require "./formats/PaintShopPro"
	}
	RIFF_PALETTE: {
		name: "RIFF PAL"
		fileExtensions: ["pal"]
		load: require "./formats/RIFF"
	}
	COLORSCHEMER_PALETTE: {
		name: "ColorSchemer palette"
		fileExtensions: ["cs"]
		load: require "./formats/ColorSchemer"
	}
	PAINTDOTNET_PALETTE: {
		name: "Paint.NET palette"
		fileExtensions: ["txt"]
		load: require "./formats/Paint.NET"
		write: (require "./formats/Paint.NET").write
	}
	GIMP_PALETTE: {
		name: "GIMP palette"
		fileExtensions: ["gpl", "gimp", "colors"]
		load: require "./formats/GIMP"
		write: (require "./formats/GIMP").write
	}
	KOULORPAINT_PALETTE: {
		name: "KolourPaint palette"
		fileExtensions: ["colors"]
		load: require "./formats/KolourPaint"
	}
	SKENCIL_PALETTE: {
		name: "Skencil palette"
		fileExtensions: ["spl"]
		load: require "./formats/SPL"
	}
	SKETCH_JSON_PALETTE: {
		name: "Sketch palette"
		fileExtensions: ["sketchpalette"]
		load: require "./formats/sketchpalette"
		write: (require "./formats/sketchpalette").write
	}
	SK1_PALETTE: {
		name: "sK1 palette"
		fileExtensions: ["skp"]
		load: require "./formats/SKP"
	}
	CSS_COLORS: {
		name: "CSS colors"
		fileExtensions: ["css", "scss", "sass", "less", "styl", "html", "htm", "svg", "js", "ts", "xml", "txt"]
		load: require "./formats/CSS"
		write: (require "./formats/CSS").write
	}
	WINDOWS_THEME_COLORS: {
		name: "Windows desktop theme"
		fileExtensions: ["theme", "themepack"]
		load: require "./formats/theme"
	}
	# KDE_THEME_COLORS: {
	# 	name: "KDE desktop theme"
	# 	fileExtensions: ["colors"]
	# 	load: require "./formats/theme"
	# }
	KDE_RGB_PALETTE: {
		name: "KolourPaint palette"
		fileExtensions: ["colors"]
		write: (require "./formats/KolourPaint").write
	}
	# ADOBE_COLOR_SWATCH_PALETTE: {
	# 	name: "Adobe Color Swatch"
	# 	fileExtensions: ["aco"]
	# 	load: require "./formats/AdobeColorSwatch"
	# }
	ADOBE_COLOR_TABLE_PALETTE: {
		name: "Adobe Color Table"
		fileExtensions: ["act"]
		load: require "./formats/AdobeColorTable"
	}
	# ADOBE_SWATCH_EXCHANGE_PALETTE: {
	# 	name: "Adobe Swatch Exchange"
	# 	fileExtensions: ["ase"]
	# 	load: require "./formats/AdobeSwatchExchange"
	# }
	# ADOBE_COLOR_BOOK_PALETTE: {
	# 	name: "Adobe Color Book"
	# 	fileExtensions: ["acb"]
	# 	load: require "./formats/AdobeColorBook"
	# }
	HOMESITE_PALETTE: {
		name: "Homesite palette"
		fileExtensions: ["hpl"]
		load: require "./formats/Homesite"
	}
	STARCRAFT_PALETTE: {
		name: "StarCraft palette"
		fileExtensions: ["pal"]
		load: require "./formats/StarCraft"
	}
	STARCRAFT_PADDED: {
		name: "StarCraft terrain palette"
		fileExtensions: ["wpe"]
		load: require "./formats/StarCraftPadded"
	}

	# AUTOCAD_COLOR_BOOK_PALETTE: {
	# 	name: "AutoCAD Color Book"
	# 	fileExtensions: ["acb"]
	# 	load: require "./formats/AutoCADColorBook"
	# }

	# CORELDRAW_PALETTE: {
	# 	# (same as Paint Shop Pro palette?)
	# 	name: "CorelDRAW palette"
	# 	fileExtensions: ["pal", "cpl"]
	# 	load: require "./formats/CorelDRAW"
	# }
	TABULAR: {
		name: "tabular colors"
		fileExtensions: ["csv", "tsv", "txt"]
		load: require "./formats/tabular"
	}

for format_id in Object.keys(formats)
	format = formats[format_id]
	format.fileExtensionsPretty = ".#{format.fileExtensions.join(", .")}"

load_palette = (o, callback)->
	
	# find formats that use this file extension
	matching_ext = {}
	for format_id in Object.keys(formats)
		if formats[format_id].fileExtensions.indexOf(o.fileExt) > -1
			matching_ext[format_id] = true
	
	# sort formats to the beginning that use this file extension
	format_ids = Object.keys(formats)
	format_ids.sort (format_id_1, format_id_2)->
		matching_ext[format_id_2]? - matching_ext[format_id_1]?
	
	# try loading stuff
	errors = []
	for format_id in format_ids
		format = formats[format_id]
		if not format.load
			continue # skip this format
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
			
			callback(null, palette, format, matching_ext[format_id]?)
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

AnyPalette.writePalette = (palette, format)->
	format ?= AnyPalette.formats.GIMP_PALETTE

	palette_content_string = format.write(palette)
	return palette_content_string
	# file = new File([palette_content_string], (palette.name ? "Saved Colors") + ".#{format.fileExtensions[0]}")
	# return [file, format.fileExtensions[0]]


# Exports
module.exports = AnyPalette
