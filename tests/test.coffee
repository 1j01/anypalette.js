fs = require 'fs'
glob = require 'glob'
Palette = require '../build/palette.js'

# TODO: delete regression-data/* except for the FOLDER-README.md

# TODO: maybe return a non-zero exit code if there are changes between the output and what's in git
# i.e. a git status "#{__dirname}/regression-data" with changes listed... other than FOLDER-README.md
# maybe FOLDER-README.md should just be above, in this folder (tests/)?

glob "#{__dirname.replace(/\\/g, "/")}/../palettes/**/*", (err, file_paths)->
	if err
		throw err
	for file_path in file_paths
		do (file_path)->
			file_name = require("path").basename(file_path)
			console.log "input", file_path
			Palette.load file_path, (err, palette)->
				if err then return console.error err
				output_file_path = "#{__dirname}/regression-data/#{file_name}"
				console.log "output", output_file_path
				# console.log palette.join('\n')
				# console.log palette.toJSON()
				fs.writeFileSync output_file_path, palette.join('\n'), "utf8"
