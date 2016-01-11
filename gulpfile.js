var gulp        = require('gulp');
var bower       = require('gulp-bower');
var clean       = require('gulp-clean');
var uncss       = require('gulp-uncss');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');
var rename      = require('gulp-rename');
var nano        = require('gulp-cssnano');
var ngAnnotate  = require('gulp-ng-annotate');
var usemin      = require('gulp-usemin');

gulp.task('clean', function(){
  return gulp.src('dist')
        .pipe(clean());
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src(['src/**/*.js','!src/**/lib/**/*'])
        .pipe(jshint({esnext: true}))
        .pipe(jshint.reporter('default'));
});

gulp.task('usemin', ['bower'], function(){
  return gulp.src('src/client/index.html')
    .pipe(usemin({
        ng: [ngAnnotate(), uglify({mangle:false}), 'concat'],
        js: [ngAnnotate(), uglify({mangle:false}), 'concat'],
        css: [uncss({html:['src/client/**/*.html']}), nano(), 'concat']
      })
    )
    .pipe(gulp.dest('dist/client'));
});

gulp.task('copy_fonts', ['bower'], function(){
  return gulp.src(['src/client/lib/bootstrap/dist/fonts/*'])
      .pipe(gulp.dest('dist/client/fonts/'));
});

gulp.task('copy_views', function(){
  return gulp.src(['src/client/views/*'])
      .pipe(gulp.dest('dist/client/views/'));
});

gulp.task('copy_images', function(){
  return gulp.src(['src/client/images/*'])
      .pipe(gulp.dest('dist/client/images/'));
});

gulp.task('copy_node', function(){
  return gulp.src(['src/**/*', '!src/client/**/*', 'src/config.json'])
      .pipe(gulp.dest('dist/'));
});


gulp.task('bower', function() {
  return bower({ directory: 'src/client/lib/'});
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['lint']);
    gulp.watch('src/client/**/*.js', ['scripts']);
});

// Default Task
gulp.task('default', ['lint', 'bower', 'usemin', 'copy_fonts', 'copy_views', 'copy_images', 'copy_node']);
//gulp.task('default', ['lint', 'scripts', 'copy_assets',  'bower', 'uncss']);
