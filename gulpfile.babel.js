'use strict';

import gulp from 'gulp'
import zip from 'gulp-zip'
import addsrc from 'gulp-add-src'
import jasmine from 'gulp-jasmine'

const dir = {
    dest: './dist'
};

gulp.task('build', () => {
    gulp.src(['js/**.js'])
        .pipe(addsrc('node_modules/**', {base: '.'}))
        .pipe(zip('lambda.zip'))
        .pipe(gulp.dest(dir.dest))
});

gulp.task('test', () => {
    gulp.src('js/spec/**Spec.js')
        .pipe(jasmine({verbose: true}))
});
