import {deleteAsync} from 'del'
import gulp from 'gulp'
import dartSass from 'sass'
import gulpSass from 'gulp-sass'
import nodemon from 'gulp-nodemon'
import * as fs from 'node:fs';
import packageConfig from './package.json' assert {type: "json"}
const sass = gulpSass(dartSass)

function naOnBlank (value) {
  return value || 'N/A'
}

const buildInfoJson = {
  version: naOnBlank(packageConfig.version),
  name: naOnBlank(packageConfig.name),
  description: naOnBlank(packageConfig.description),
  author: naOnBlank(packageConfig.author),
  license: naOnBlank(packageConfig.license),
  buildNumber: naOnBlank(process.env.BUILD_NUMBER),
  branch: naOnBlank(process.env.GIT_BRANCH),
  gitCommit: naOnBlank(process.env.GIT_COMMIT)
}

gulp.task('buildInfo', function (cb) {
  fs.writeFileSync('./public/build-info.json', JSON.stringify(buildInfoJson, null, 2))
  cb()
})

gulp.task('nodemon', function () {
  return nodemon({
    script: './src/bin/www.js',
    ext: 'js html',
    env: { NODE_ENV: 'local' }
  })
})

gulp.task('clean', function () {
  return deleteAsync(['./public/*',
    '.port.tmp'])
})

gulp.task('copyAutocompleteJS', function () {
  return gulp.src(['./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js']).pipe(gulp.dest('./public/js'))
})

gulp.task('copycss', function () {
  return gulp.src(['./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css'])
    .pipe(gulp.dest('./public/css'))
})

gulp.task('copy', function () {
  return gulp.src('./src/public/**/*').pipe(gulp.dest('public/'))
})

gulp.task('copyHeaderTemplate', function () {
  return gulp.src(['./replace/template.njk'])
  .pipe(gulp.dest('./node_modules/govuk-frontend/govuk/components/header'))
})

gulp.task('sass', function () {
  return gulp.src('./public/sass/**/*.scss')
    .pipe(sass.sync({
      includePaths: 'node_modules',
      quietDeps: true
    }).on('error', sass.logError))
    .pipe(gulp.dest('./public/css'))
})

gulp.task('default', gulp.series('clean', 'copy', 'copycss', 'copyAutocompleteJS', 'copyHeaderTemplate', 'sass', 'buildInfo'))

gulp.task('build', gulp.series('clean', 'copy', 'copycss', 'copyAutocompleteJS', 'copyHeaderTemplate', 'sass', 'buildInfo','nodemon'))
