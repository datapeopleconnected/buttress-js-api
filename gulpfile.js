//
// Includes
//

const gulp = require('gulp');
const bump = require('gulp-bump');

gulp.task('bump-major', function() {
  return gulp.src(['./package.json', './README.md'])
    .pipe(bump({type: 'major'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bump-minor', function() {
  return gulp.src(['./package.json', './README.md'])
    .pipe(bump({type: 'minor'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bump-patch', function() {
  return gulp.src(['./package.json', './README.md'])
    .pipe(bump({type: 'patch'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bump-prerelease', function() {
  return gulp.src(['./package.json', './README.md'])
    .pipe(bump({type: 'prerelease'}))
    .pipe(gulp.dest('./'));
});

