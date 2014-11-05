
gulp = require 'gulp'

browserify = require 'browserify'
source = require 'vinyl-source-stream'

gulp.task 'build', ->
	# Make a browerify bundler
	browserify
		# Define the module entry point
		entries: ['./src/load_palette']
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
gulp.task 'watch', ->
	gulp.watch './src/**/*', ['build']

# Build once, and then rebuild when source files change
gulp.task 'default', ['watch', 'build']

# Testing, testing, 123
gulp.task 'test', ->
	Palette = require './build/palette.js'
	Palette.load './palettes/drf.color.styl.txt', (err, palette)->
		if err then return console.error err
		console.log palette
