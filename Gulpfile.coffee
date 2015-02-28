
gulp = require 'gulp'

browserify = require 'browserify'
# vinyl-source-stream is the glue you need to properly connect Browserify to Gulp
source = require 'vinyl-source-stream'

gulp.task 'build', ->
	# Make a browerify bundler
	browserify
		# Define the module entry point
		entries: ['./src/main']
		# Allow .coffee files
		extensions: ['.coffee']
		# Enable source maps
		debug: yes
		# Export with UMD
		standalone: 'Palette'
	
	# Allow acess to Node's fs module in the bundle (doesn't work yet)
	.external('fs')
	# Compile the .coffee files
	.transform('coffeeify')
	
	# From Browserify
	.bundle()
	# To Gulp
	.pipe(source('palette.js'))
	
	# Output the file
	.pipe(gulp.dest('./build'))

# Rebuild when source files change
gulp.task 'watch', ['serve'], ->
	gulp.watch './src/**/*', ['build']

# Serve the static files
gulp.task 'serve', ->
	host = "localhost"
	port = process.env.PORT ? 3000
	express = require 'express'
	app = express()
	app.use express.static "#{__dirname}"
	app.listen port
	console.log "[|| || ||] Listening on http://#{host}:#{port}"



# Build once, and then rebuild when source files change
gulp.task 'default', ['watch', 'build']

# Testing, testing, 123
gulp.task 'test', ->
	Palette = require './build/palette.js'
	Palette.load './palettes/db32.act', (err, palette)->
		if err then return console.error err
		console.log palette.join('\n')
		#console.log palette.toJSON()
