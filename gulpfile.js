var fs          	= require('fs');
var path			= require('path');
var span            = require('child_process').spawn;
var gulp        	= require('gulp');
var sass            = require('node-sass');
var webpack         = require('webpack');
var AotPlugin       = require('@ngtools/webpack').AotPlugin;
var webpackConfig   = require('./webpack.config');
var browserSync     = require('browser-sync-webpack-plugin');
var ts_project	    = require('gulp-typescript').createProject('./src/server/tsconfig.json');

var server_proc;

function sassNodeModulesImporter(url, file, done){
    // if it starts with a tilde, search in node_modules;
    if (url.indexOf('~') === 0){
        var nmPath = path.join(__dirname, 'node_modules', url.substring(1)||'');
        return done({ file: nmPath });
    } else {
        return done({ file: url });
    }
}

gulp.task('compile_node', function(){
	return gulp.src('./src/server/**/*.ts')
	.pipe(ts_project()).js
	.pipe(gulp.dest('dist/server/'));
});

gulp.task('copy_client_root', ['copy_client_assets'], function(done){
    gulp.src('src/client/index.html')
    .pipe(gulp.dest('dist/client/'));

    sass.render({
        file: 'src/client/styles.scss',
        outputStyle: 'compressed',
        importer: sassNodeModulesImporter
    }, function(err, result){
        if(err){
            throw err;
        }
        fs.writeFileSync('dist/client/styles.min.css', result.css);
        return done();
    });
});

gulp.task('copy_client_assets', function(){
  return gulp.src(['src/client/assets/**/*'])
      .pipe(gulp.dest('dist/client/assets'));
});

gulp.task('copy_fonts', ['copy_client_assets'], function(){
  return gulp.src(['node_modules/font-awesome/fonts/*', 'src/client/fonts/*'])
      .pipe(gulp.dest('dist/client/fonts'));
});

gulp.task('start-server', ['compile_node'], function(){
    if (server_proc) {
        server_proc.kill();
        server_proc = undefined;
    }
    server_proc = span('node', ['dist/server/app.js'], {
        cwd: __dirname,
        stdio: [0, 1, 2, 'ipc']
    });
});

gulp.task('webpack', function(done) {
    var config = webpackConfig;
    config.module.rules.push({
        test: /\.ts$/,
        loader: '@ngtools/webpack'
    });
    config.plugins.push(
        new webpack.optimize.UglifyJsPlugin(),
        new AotPlugin({
            tsConfigPath: path.join(__dirname, './src/client/tsconfig.json'),
            mainPath: path.join(__dirname, './src/client/main.ts')
        })
    );
    config.stats = 'minimal';
    return webpack(config, function(err, stats){
        if (err) {
            console.error(err);
        }
        return done(err);
    });
});

gulp.task('webpack-watch', function() {
    var config = webpackConfig;
    config.watch = true;
    config.cache = true;
    config.bail = false;
    config.stats = 'errors-only';
    config.module.rules.push(
        {
            enforce: 'pre',
            test: /\.ts$/,
            use: 'source-map-loader'
        },
        {
            test: /\.ts$/,
            use: [
                {
                    loader: 'awesome-typescript-loader',
                    options: {
                        configFileName: './src/client/tsconfig.json'
                    }
                },
                {
                    loader: 'angular-router-loader'
                },
                {
                    loader: 'angular2-template-loader'
                },
            ]
        }
    );
    config.plugins.push(
        new browserSync({
            host: 'localhost',
            port: 3001,
            proxy: 'localhost:3000',
            ws: true,
            open: !(process.env.DOCKER_MODE)
        })
    );
    webpack(config, function(err, stats) {
        if (err) {
            console.error(err);
        }
    });
});

gulp.task('copy', ['copy_client_root', 'copy_client_assets', 'copy_fonts']);

gulp.task('watch', ['copy', 'start-server', 'webpack-watch'], function(){
  	console.log('watching for changes...');
	gulp.watch(['src/client/assets/**/*'], ['copy_client_assets']);
	gulp.watch(['src/client/index.html', 'src/client/styles.scss', 'src/client/scss/*.scss'], ['copy_client_root']);
	gulp.watch(['node_modules/font-awesome/fonts/*', 'src/client/fonts/*'], ['copy_fonts']);
	gulp.watch(['src/server/**/*.ts'], ['start-server']);
});

// Default Task
gulp.task('default', ['copy', 'compile_node', 'webpack']);
