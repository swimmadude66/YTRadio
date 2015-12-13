var bower = require('gulp-bower');
var gulp        = require('gulp');
var clean       = require('gulp-clean');
var uncss       = require('gulp-uncss');
var jshint      = require('gulp-jshint');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var rename      = require('gulp-rename');
var nano        = require('gulp-cssnano');
var ngAnnotate  = require('gulp-ng-annotate');

gulp.task('clean', function(){
  return gulp.src('dist')
        .pipe(clean());
});

gulp.task('uncss', ['copy_assets', 'bower'], function(){
  return gulp.src(['dist/client/**/*.css', 'src/client/styles/*.css'])
        .pipe(concat('main.css'))
        .pipe(uncss({
            html: ['src/client/**/*.html']
        }))
        .pipe(nano())
        .pipe(rename('styles.min.css'))
        .pipe(gulp.dest('dist/client/styles/'));
});

gulp.task('copy_assets', function(){
  return gulp.src(['src/**/*', 'package.json', '!src/scripts', '!src/scripts/**/*', '!src/client/js/**/*', '!src/client/styles/**/*'])
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
    return gulp.src(['src/client/**/*.js'])
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
gulp.task('default', ['lint', 'scripts', 'copy_assets',  'bower', 'uncss']);
