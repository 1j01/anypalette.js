fs = require 'fs'
path = require 'path'
glob = require 'glob'
mkdirp = require 'mkdirp'
AnyPalette = require '../build/anypalette.js'

# TODO: maybe return a non-zero exit code if there are changes between the output and what's in git
# i.e. a git status "#{__dirname}/regression-data" with changes listed... other than FOLDER-README.md ideally
# maybe FOLDER-README.md should just be above, in this folder (tests/)?

glob "#{__dirname.replace(/\\/g, "/")}/regression-data/**/*.out.txt", (err, file_paths)->
	if err
		throw err
	for file_path in file_paths
		fs.unlinkSync(file_path)
	console.log "Cleared regression-data folder of all .out.txt files"

	# forward slashes required for glob, but also using this to determine the subfolders for output
	palettes_folder = "#{__dirname.replace(/\\/g, "/")}/../palettes"
	# only match within at least one directory level inside the palettes folder
	glob "#{palettes_folder}/*/**/*", ignore: "**/node_modules/**", nodir: true, (err, file_paths)->
		if err
			throw err
		if file_paths.length is 0
			console.error("No palette files found in #{palettes_folder}.\nMake sure to run: git submodule update --init")
			return
		for file_path in file_paths
			do (file_path)->
				relative_path = path.relative(palettes_folder, file_path)
				AnyPalette.loadPalette file_path, (err, palette, formatUsed, matchedFileExtension)->
					result =
						if err
							err.message
						else
							# TODO: display color names
							# TODO: add a "Can Parse Without Knowing Ext:"
							# - pass {fileExt: null} and make sure / make it so this is treated as explicitly ignoring file extensions
							# - check that it parses exactly the same, including geometry
							"""
							Loaded As:                      #{formatUsed.name} (#{formatUsed.fileExtensionsPretty})

							matchedLoaderFileExtensions:    #{matchedFileExtension}
							geometrySpecifiedByFile:        #{palette.geometrySpecifiedByFile}
							numberOfColumns:                #{palette.numberOfColumns}

							Colors:
							#{AnyPalette.uniqueColors(palette).join('\n')}

							"""
					output_file_path = path.join(__dirname, "regression-data", relative_path + ".out.txt")
					mkdirp.sync	path.dirname(output_file_path)
					fs.writeFileSync output_file_path, result, "utf8"
					console.log "Wrote", (if err then "failed" else "parsed"), output_file_path
