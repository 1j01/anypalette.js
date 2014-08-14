var gulp = require('gulp');

var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var scripts = ['src/**/*.coffee'];

gulp.task('build', function(){
	return gulp.src(scripts)
		.pipe(concat('palette.coffee'))
		.pipe(gulp.dest('build'))
		.pipe(coffee())
		.pipe(concat('palette.js'))
		.pipe(gulp.dest('build'))
		.pipe(uglify())
		.pipe(concat('palette.min.js'))
		.pipe(gulp.dest('build'));
});

gulp.task('bundle', function(){
	return gulp.src(scripts)
		.pipe(concat('palette.coffee'))
		.pipe(coffee())
		.pipe(gulp.dest('build'));
});

gulp.task('watch-bundle', function(){
	gulp.watch(scripts, ['bundle']);
});

gulp.task('default', ['watch-bundle']);
