'use strict';

import FS from 'fs-extra';
import Path from 'path';
import Gulp from 'gulp';
import Babel from 'gulp-babel';
import Package from './package.json';

let distDir = Path.join(__dirname, 'build');

/**
 * Clean the directory and remove all the build files.
 */
const clean = () => new Promise((resolve) => resolve(FS.removeSync(distDir)));

/**
 * Transpile the source into executable javascript.
 */
const transpile = function() {
  return Gulp.src([
      'src/**/*'
    ])
    .pipe(Babel(Package.babel))
    .pipe(Gulp.dest(distDir));
};

/**
 * Build the application.
 */
Gulp.task('build', Gulp.series(transpile));

/**
 * Transpile the application.
 */
Gulp.task('transpile', Gulp.series(clean), transpile);

/**
 * Clean the environment.
 */
Gulp.task('clean', clean);