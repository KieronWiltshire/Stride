'use strict';

import Fs from 'fs-extra';
import Path from 'path';
import Gulp from 'gulp';
import Babel from 'gulp-babel';

let distDir = Path.join(__dirname, 'build');

/**
 * Clean the directory and remove all
 * build related files.
 */
const clean = () => new Promise((resolve) => resolve(Fs.removeSync(distDir)));

/**
 * Transpile the source into executable
 * javascript.
 */
const transpile = function() {
  return Gulp.src([
      'src/**/*'
    ])
    .pipe(Babel())
    .pipe(Gulp.dest(distDir));
};

/**
 * Build the application
 */
Gulp.task('build', Gulp.series(transpile));

/**
 * Transpile the application
 */
Gulp.task('transpile', Gulp.series(clean), transpile);

/**
 * Clean the environment
 */
Gulp.task('clean', clean);
