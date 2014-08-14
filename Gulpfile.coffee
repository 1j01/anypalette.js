gulp = require 'gulp'

coffee = require 'gulp-coffee'
concat = require 'gulp-concat'
uglify = require 'gulp-uglify'

scripts = ['src/**/*.coffee']

gulp.task 'build', ->
	gulp.src(scripts)
		.pipe(concat('palette.coffee'))
		.pipe(gulp.dest('build'))
		.pipe(coffee())
		.pipe(concat('palette.js'))
		.pipe(gulp.dest('build'))
		.pipe(uglify())
		.pipe(concat('palette.min.js'))
		.pipe(gulp.dest('build'))


gulp.task 'bundle', ->
	gulp.src(scripts)
		.pipe(concat('palette.coffee'))
		.pipe(coffee())
		.pipe(gulp.dest('build'))


gulp.task 'watch-bundle', ->
	gulp.watch scripts, ['bundle']


gulp.task 'default', ['watch-bundle']
