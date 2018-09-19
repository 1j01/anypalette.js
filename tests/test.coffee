fs = require 'fs'
glob = require 'glob'
AnyPalette = require '../build/any-palette.js'

# TODO: maybe return a non-zero exit code if there are changes between the output and what's in git
# i.e. a git status "#{__dirname}/regression-data" with changes listed... other than FOLDER-README.md ideally
# maybe FOLDER-README.md should just be above, in this folder (tests/)?

glob "#{__dirname.replace(/\\/g, "/")}/regression-data/**/*.out.txt", (err, file_paths)->
	if err
		throw err
	for file_path in file_paths
		fs.unlinkSync(file_path)
	console.log "Cleared regression-data folder of all .out.txt files"
	# only match within at least one directory level deeper than palettes/
	glob "#{__dirname.replace(/\\/g, "/")}/../palettes/*/**/*", ignore: "**/node_modules/**", nodir: true, (err, file_paths)->
		if err
			throw err
		for file_path in file_paths
			do (file_path)->
				file_name = require("path").basename(file_path)
				AnyPalette.load file_path, (err, palette)->
					result = (if err then err.message else palette.join('\n')) + "\n"
					output_file_path = "#{__dirname}/regression-data/#{file_name}.out.txt"
					fs.writeFileSync output_file_path, result, "utf8"
					console.log "Wrote", (if err then "failed" else "parsed"), output_file_path
