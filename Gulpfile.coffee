
fs = require 'fs'
child_process = require 'child_process'
gulp = require 'gulp'

browserify = require 'browserify'
licensify = require 'licensify'
# vinyl-source-stream is the glue you need to properly connect Browserify to Gulp
source = require 'vinyl-source-stream'

production = false
production_script_name = "anypalette-#{process.env.npm_package_version}.js"
dev_script_name = "anypalette-dev.js"

gulp.task 'build', ->

	# Make a browserify bundler
	return browserify
		# Define the module entry point
		entries: ['./src/main']
		# Allow .coffee files
		extensions: ['.coffee']
		# Enable source maps
		debug: yes
		# Export with UMD
		standalone: 'AnyPalette'
	
	# Allow access to Node's fs and path modules without bundling them
	.external('fs')
	.external('path')
	# Compile the .coffee files
	.transform('coffeeify')
	
	# Add license header to output
	.plugin(licensify)

	# From Browserify
	.bundle()
	.on('error', (err)->
		console.error(err)
		@destroy() # required for browserify and thus the 'build' task to exit, and for watching to continue
	)
	# To Gulp
	.pipe(source(if production then production_script_name else dev_script_name))
	
	# Output the file
	.pipe(gulp.dest('./build'))


# Rebuild when source files change
gulp.task 'watch', ->
	gulp.watch './src/**/*', gulp.series(['build'])

# Build once, and then rebuild when source files change
gulp.task 'default', gulp.parallel(['watch', 'build'])

# A sad little task
gulp.task 'set-production-flag', (callback)->
	production = true
	callback()

# Monkey-patch new script name
gulp.task 'monkey-patch-script-version', (callback)->
	replace_script_name = (string)->
		string.replace(
			/build\/anypalette-v?[x\d.]+\.js/g,
			"build/#{production_script_name}"
		)
	# NOTE: MUST update git add below
	fs.writeFileSync("demo.html", replace_script_name(fs.readFileSync("demo.html", "utf8")), "utf8")
	fs.writeFileSync("README.md", replace_script_name(fs.readFileSync("README.md", "utf8")), "utf8")
	fs.writeFileSync("package.json", replace_script_name(fs.readFileSync("package.json", "utf8")), "utf8")
	callback()

# Add files to git for they'll be accepted by npm version
gulp.task 'git-add-for-npm-version', (callback)->
	child_process.exec "git add demo.html README.md package.json build", (err, stdout, stderr)->
		console.log "git stderr:", stderr
		console.log "git stdout:", stdout
		console.log "---------------------------------"
		console.log "Remember to update the changelog!"
		console.log "---------------------------------"
		callback(err)

# Run when building a new production version
gulp.task 'production-version', gulp.series([
	'set-production-flag'
	'monkey-patch-script-version'
	'build'
	'git-add-for-npm-version'
])
