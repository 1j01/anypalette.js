
fs = require 'fs'
path = require 'path'
child_process = require 'child_process'
gulp = require 'gulp'

browserify = require 'browserify'
licensify = require 'licensify'
# vinyl-source-stream is the glue you need to properly connect Browserify to Gulp
source = require 'vinyl-source-stream'

production = false
# version = process.env.npm_package_version # new version even during `preversion`
version = require("./package.json").version # old version during `preversion`, new version during `version`
# console.log 'process.env.npm_package_version', process.env.npm_package_version
# console.log 'require("./package.json").version', require("./package.json").version
production_script_name = "anypalette-#{version}.js"
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
files_to_patch = [
	"demo.html"
	"README.md"
	"package.json"
]
gulp.task 'monkey-patch-script-version', (callback)->
	replace_script_name = (string)->
		string.replace(
			/anypalette-v?[x\d.]+\.js/g,
			production_script_name
		)
	for file in files_to_patch
		fs.writeFileSync(file, replace_script_name(fs.readFileSync(file, "utf8")), "utf8")
		console.log "Patched '#{file}' to point to new version #{production_script_name}"
	callback()

# Add files to git for they'll be accepted by npm version
gulp.task 'git-add-for-npm-version', (callback)->
	child_process.exec "git add #{files_to_patch.join(" ")} build", (err, stdout, stderr)->
		console.log "---------------------------------"
		console.log "git stderr:", stderr
		console.log "git stdout:", stdout
		console.log "---------------------------------"
		console.log "Remember to update the changelog!"
		console.log "---------------------------------"
		callback(err)

# Run before building a new production version
gulp.task 'npm-preversion', (callback)->
	old_build_file = path.join("build", production_script_name)
	console.log "Removing old build file '#{old_build_file}'"
	fs.unlink old_build_file, (err)->
		if err and err.code is "ENOENT"
			return callback() # file didn't actually exist
		else if err
			return callback(err)
		child_process.exec "git add #{old_build_file}", (err, stdout, stderr)->
			console.log "---------------------------------"
			console.log "git stderr:", stderr
			console.log "git stdout:", stdout
			console.log "---------------------------------"
			callback(err)

# Run when building a new production version
gulp.task 'npm-version', gulp.series([
	'set-production-flag'
	'monkey-patch-script-version'
	'build'
	'git-add-for-npm-version'
])
