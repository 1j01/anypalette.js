
gulp = require 'gulp'

browserify = require 'browserify'
# vinyl-source-stream is the glue you need to properly connect Browserify to Gulp
source = require 'vinyl-source-stream'

gulp.task 'build', ->
	# Make a browserify bundler
	browserify
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
	
	# From Browserify
	.bundle()
	.on('error', (err)->
		console.error(err)
		@destroy() # required for browserify and thus the 'build' task to exit, and for watching to continue
	)
	# To Gulp
	.pipe(source('anypalette.js'))
	
	# Output the file
	.pipe(gulp.dest('./build'))

# Rebuild when source files change
gulp.task 'watch', ->
	gulp.watch './src/**/*', gulp.series(['build'])

# Build once, and then rebuild when source files change
gulp.task 'default', gulp.parallel(['watch', 'build'])
