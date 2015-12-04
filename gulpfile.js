var gulp = require('gulp');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var bower = require('gulp-bower');

gulp.task('clean', function(){
  return gulp.src('dist')
        .pipe(clean());
});

gulp.task('copy_assets', function(){
  return gulp.src(['src/**/*', '!src/scripts', '!src/scripts/**/*', '!src/client/js/**/*'])
      .pipe(gulp.dest('dist'));
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src('src/**/*.js')
        .pipe(jshint({esnext: true}))
        .pipe(jshint.reporter('default'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('src/client/**/*.js')
        .pipe(ngAnnotate())
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist/client/js'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/client/js'));
});

gulp.task('bower', function() {
  return bower({ directory: 'dist/client/lib/'})
    .pipe(gulp.dest('dist/client/lib/'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['lint']);
    gulp.watch('src/client/**/*.js', ['scripts']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'copy_assets', 'bower']);
