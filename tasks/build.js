

'use strict';

var childProcess = require('child_process');
var electron = require('electron-prebuilt');
var gulp = require('gulp');
var jetpack = require('fs-jetpack');
var usemin = require('gulp-usemin');
var uglify = require('gulp-uglify');
var os = require('os');


var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('clean', function (callback) {
    return destDir.dirAsync('.', { empty: true });
});

gulp.task('copy', ['clean'], function () {
   /* gulp.src([
        "./bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.eot",
        "./bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.svg",
        "./bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf",
        "./bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff",
        "./bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2"
    ])
        .pipe(gulp.dest('build/assets/fonts/'));*/

    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: [
            './node_modules/**/*',
            './bower_components/**/*',
            './img/*',
            '*.html',
            '*.css',
            'main.js',
            'package.json'
        ]
    });
});

gulp.task('build', ['copy'], function () {
    return gulp.src('./app/index.html')
        .pipe(usemin({
            js: [uglify()]
        }))
        .pipe(gulp.dest('build/'));
});


gulp.task('run', function () {
    childProcess.spawn(electron, ['./app'], { stdio: 'inherit' });
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch('./main/angular-app.js', ['build']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['run', 'build', 'watch']);
