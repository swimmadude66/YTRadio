var gulp        = require('gulp');
var bower       = require('gulp-bower');
var uncss       = require('gulp-uncss');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');
var nano        = require('gulp-cssnano');
var ngAnnotate  = require('gulp-ng-annotate');
var usemin      = require('gulp-usemin');

// Lint Task
gulp.task('lint', function() {
    return gulp.src(['src/**/*.js','!src/**/lib/**/*'])
        .pipe(jshint({esnext: true}))
        .pipe(jshint.reporter('default'));
});

gulp.task('usemin', ['bower', 'copy_views'], function(){
  return gulp.src('src/client/index.html')
    .pipe(usemin({
        ng: [ngAnnotate(), uglify({}), 'concat'],
        js: [ngAnnotate(), uglify(), 'concat'],
        css: [nano(), 'concat']
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

gulp.task('copy_favicon', function(){
  return gulp.src(['src/client/*.ico'])
      .pipe(gulp.dest('dist/client/'));
});

gulp.task('copy_node', function(){
  return gulp.src(['src/**/*', '!src/client/**/*', './package.json'])
      .pipe(gulp.dest('dist/'));
});


gulp.task('bower', function() {
  return bower({ directory: 'src/client/lib/'});
});

// Default Task
gulp.task('default', ['lint', 'bower', 'usemin', 'copy_fonts', 'copy_views', 'copy_images', 'copy_node', 'copy_favicon'], function(){
  console.log('----------------------------\n\nType `cd dist/`\nThen `npm install --production`\nThen `node app.js` to run your own radio!');
});
