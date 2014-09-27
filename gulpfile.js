var gulp 	= require('gulp'),
	concat 	= require('gulp-concat'),
	rename 	= require('gulp-rename'),
	watch 	= require('gulp-watch'),
	uglify 	= require('gulp-uglify'),
	less 	= require('gulp-stylus'),
	minifyCSS = require('gulp-minify-css'),
	imagemin = require('gulp-imagemin'),
	pngcrush = require('imagemin-pngcrush');

var baseDirDev = './public/dev/',
	baseDirJs = './public/dev/js/',
	baseDirImg = './public/dev/img/',
	baseDirCSS = './public/dev/css/';

var paths = {
	dev 	: './public/dev/',
	prod 	: './public/',
	// scripts : [baseDirJs + 'jquery-1.11.1.js', baseDirJs + 'js/bootstrap.js'],
	// images 	: [baseDirDev +'img/*.jpg', baseDirDev +'img/*.png'],
	fonts	: 'fonts/*',
	less 	: 'less/*.less',
	css 	: [baseDirCSS + 'bootstrap.css', baseDirCSS + 'econtinua.css', baseDirCSS + 'econtinua-responsive.css', baseDirCSS + 'font-awesome.css']
	// stylus 	: 'stylus/*.styl'
};


gulp.task('default', function() {
  // place code for your default task here
})