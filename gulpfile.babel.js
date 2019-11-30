'use strict'
/****************************************************************************************************/
//MODULES REQUIRE
/****************************************************************************************************/
import gulp from 'gulp'
import less from 'gulp-less'
import postcss from 'gulp-postcss'
import csso from 'postcss-csso'
import customProperties from 'postcss-custom-properties'
import apply from 'postcss-apply'
import postcssNesting from 'postcss-nesting'
import postcssNested from 'postcss-nested'
import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
// import mqp from 'css-mqpacker'
import gcmq from 'gulp-group-css-media-queries'
import uglify from 'gulp-uglify'
import sourcemaps from 'gulp-sourcemaps'
import newer from 'gulp-newer'
import debug from 'gulp-debug'
import gulpIf from 'gulp-if'
import imagemin from 'gulp-imagemin'
import svgmin from 'gulp-svgmin'
import svgSymbols from 'gulp-svg-symbols'
import smushit from 'gulp-smushit'
import del from 'del'
import mainBowerFiles from 'main-bower-files'
import flatten from 'gulp-flatten'
import { create } from 'browser-sync'
import remember from 'gulp-remember'
import cached from 'gulp-cached'
import babel from 'gulp-babel'
import path from 'path'
import webpack from 'webpack'
import gulpwebpack from 'webpack-stream'
import plumber from 'gulp-plumber'
import fileinclude from 'gulp-file-include'

const browserSync = create()
/****************************************************************************************************/
//DEV OR PRODUCTION
/****************************************************************************************************/
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
/*Чтобы вывести продакшен версию нужно в терминале ввести
  NODE_ENV=production gulp build
*/
/****************************************************************************************************/
//PATHS AND SETTINGS
/****************************************************************************************************/
const cms = {
  modx: {
    html: 'build/',
    css: 'build/assets/css/',
    js: 'build/assets/js/',
    img: 'build/assets/',
    libs: 'build/assets/libs/',
    fonts: 'build/assets/fonts/'
  },
  wordpress:{
    html: 'build/',
    css: 'build/css/',
    js: 'build/js/',
    img: 'build/',
    libs: 'build/libs/',
    fonts: 'build/fonts/'
  }
}
/****************************************************************************************************/
//HTML task
/****************************************************************************************************/
gulp.task('html', () => {
  return gulp.src('src/*.html', {since: gulp.lastRun('html')})
    .pipe(plumber())
    .pipe(fileinclude())
    .pipe(gulp.dest(cms.wordpress.html))
})

/****************************************************************************************************/
//HTML templates task
/****************************************************************************************************/
gulp.task('html:templates', () => {
  return gulp.src('src/*.html')
    .pipe(plumber())
    .pipe(fileinclude())
    .pipe(gulp.dest(cms.wordpress.html))
})
/****************************************************************************************************/
//LESS task
/****************************************************************************************************/
gulp.task('less', () => {
    return gulp.src('src/precss/styles.less')
        .pipe(plumber())
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(less())
        .pipe(gulpIf(isDevelopment, sourcemaps.write('.')))
        .pipe(gulpIf(isDevelopment, gulp.dest(cms.wordpress.css), gulp.dest('src/css')))
        //.pipe(gulpIf(!isDevelopment, gulp.dest('src/css')))
})

/****************************************************************************************************/
//CSS task
/****************************************************************************************************/

gulp.task('css', () => {
  let processors = [
    postcssImport({path: ['src/css']}),
    customProperties,
    apply,
    postcssNesting,
    postcssNested,
    autoprefixer({cascade: false})
    //mqp({sort: true})
  ]
  return gulp.src('src/css/styles.css')
    .pipe(plumber())
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(postcss(processors))
    .pipe(gcmq())
    .pipe(gulpIf(!isDevelopment, postcss([csso({restructure: false, debug: true})])))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulp.dest(cms.wordpress.css))
})
/****************************************************************************************************/
//JS task
/****************************************************************************************************/
gulp.task('js', () => {
  return gulp.src('src/js/scripts.js')
    .pipe(plumber())
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(gulpwebpack(require('./webpack.config.js'), webpack))
    .pipe(gulpIf(!isDevelopment, uglify()))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulp.dest(cms.wordpress.js))
})
/****************************************************************************************************/
//LIBS task
/****************************************************************************************************/
gulp.task('libs', () => {
  return gulp.src(mainBowerFiles(
    {
      'overrides': {
        'jquery': {
          'main': 'dist/jquery.min.js'
        },
        'svg4everybody': {
          'main': 'dist/svg4everybody.min.js'
        },
        'slick-carousel': {
          'main': [
            "slick/slick.js"
          ]
        }
      }
    }
  ), {base: './src/libs'})
    .pipe(flatten({includeParents: 1}))
    .pipe(newer(cms.wordpress.libs))
    .pipe(gulp.dest(cms.wordpress.libs))
})
/****************************************************************************************************/
//MY LIBS task
/****************************************************************************************************/

gulp.task('mylibs', () => {
  return gulp.src('src/libs/mylibs/**/*.*')
    .pipe(flatten({includeParents: 1}))
    .pipe(gulp.dest(cms.wordpress.libs))
})
/****************************************************************************************************/
//FONTS task
/****************************************************************************************************/
gulp.task('fonts', () => {
    return gulp.src('src/fonts/**/*.*')
        .pipe(newer(cms.wordpress.fonts))
        .pipe(gulp.dest(cms.wordpress.fonts))
})
/****************************************************************************************************/
//IMG task (jpg,png,gif)
/****************************************************************************************************/
gulp.task('img', () => {
    return gulp.src(['src/img/**/*.{jpg,png,gif}', 'src/images/**/*.{jpg,png,gif}'], {base: 'src'})
        .pipe(newer(cms.wordpress.img))
        //.pipe(gulpIf(!isDevelopment, imagemin({progressive: true})))
         .pipe(gulpIf(!isDevelopment, smushit({verbose: true})))
        .pipe(gulpIf(isDevelopment, gulp.symlink(cms.wordpress.img), gulp.dest(cms.wordpress.img)))
})
/****************************************************************************************************/
//SVG task
/****************************************************************************************************/
gulp.task('svg', () => {
    return gulp.src('src/img/svg/**/*.svg', {base: 'src'})
        .pipe(newer(cms.wordpress.img))
        .pipe(gulpIf(!isDevelopment, gulp.dest(cms.wordpress.img), gulp.symlink(cms.wordpress.img)))
})
/****************************************************************************************************/
//SVG sprite icons
/****************************************************************************************************/
gulp.task('svg:icons', () => {
  return gulp.src('src/img/svg/icons/*.svg')
    .pipe(cached('svg:icons'))
    .pipe(svgmin({
      plugins: [
        {removeEditorsNSData: true},
        {removeTitle: true}
      ]
    }))
    .pipe(remember('svg:icons'))
    .pipe(svgSymbols({
      templates: [
        'default-svg'
      ]
    }))
    .pipe(svgmin({
      plugins: [
        {cleanupIDs: false}
      ]
    }))
    .pipe(gulp.dest('src/img/svg'))
})
/****************************************************************************************************/
//DEL build directory
/****************************************************************************************************/
gulp.task('clean', () => del('build'))

/****************************************************************************************************/
//Copy favicon
/****************************************************************************************************/
gulp.task('favicon', () => {
    return gulp.src('src/favicon.ico')
        .pipe(gulpIf(!isDevelopment, gulp.dest(cms.wordpress.html), gulp.symlink(cms.wordpress.html)))
})
/****************************************************************************************************/
//WATCHERS
/****************************************************************************************************/
gulp.task('watch', () => {
  gulp.watch('src/*.html', gulp.series('html')).on('unlink', function (filepath) {
    let filePathFromSrc = path.relative(path.resolve('src/'), filepath)
    let destFilePath = path.resolve(cms.wordpress.html, filePathFromSrc)
    del.sync(destFilePath)
  })
  gulp.watch('src/templates/*.html', gulp.series('html:templates'))
  gulp.watch(`${cms.wordpress.html}*.html`).on('change', browserSync.reload)
  gulp.watch('src/precss/**/*.less', gulp.series('less'))
  gulp.watch('src/css/*.css', gulp.series('css'))
  gulp.watch(`${cms.wordpress.css}styles.css`).on('change', browserSync.reload)
  gulp.watch('src/js/*.js', gulp.series('js'))
  gulp.watch(`${cms.wordpress.js}scripts.js`).on('change', browserSync.reload)
  gulp.watch('src/**/*.{jpg,png,gif}', gulp.series('img')).on('unlink', function (filepath) {
    let filePathFromSrc = path.relative(path.resolve('src/'), filepath)
    let destFilePath = path.resolve(cms.wordpress.img, filePathFromSrc)
    del.sync(destFilePath)
  })
  gulp.watch(['src/img/svg/*.svg', 'src/img/svg/icons/*.svg'], gulp.series('svg')).on('unlink', function (filepath) {
    let filePathFromSrc = path.relative(path.resolve('src/'), filepath)
    let destFilePath = path.resolve(cms.wordpress.img, filePathFromSrc)
    del.sync(destFilePath)
  })
  gulp.watch('src/img/svg/icons/*.svg', gulp.series('svg:icons')).on('unlink', function (filepath) {
    remember.forget('svg:icons', path.resolve(filepath))
    delete cached.caches['svg:icons'][path.resolve(filepath)]
  })
  gulp.watch('src/fonts/**/*.*', gulp.series('fonts')).on('unlink', function (filepath) {
    let filePathFromSrc = path.relative(path.resolve('src/fonts'), filepath)
    let destFilePath = path.resolve(cms.wordpress.fonts, filePathFromSrc)
    del.sync(destFilePath)
  })
})
/****************************************************************************************************/
//BROWSER-SYNC task
/****************************************************************************************************/
gulp.task('serve', () => {
  browserSync.init({
    server: {
      baseDir:'./build'
    },
      // tunnel: true,
    open: true,
    notify: true
  })
})
/****************************************************************************************************/
//GLOBAL TASKS
/****************************************************************************************************/
gulp.task('build', gulp.series(gulp.parallel('html', 'less', 'css', 'js', 'libs', 'mylibs', 'favicon', 'fonts', 'img', 'svg:icons'), 'svg'))
gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')))


/****************************************************************************************************/
//TASKS grid
/****************************************************************************************************/

let smartgrid = require('smart-grid');
function grid(done){
    let settings = {//Настройки Лаврика Дмитрия
        // columns: 24,
        // offset: "10px",
        // //mobileFirst: true,
        // container: {
        //     maxWidth: "950px",
        //     fields: "30px"
        // },
        // breakPoints: {
        //     md: {
        //         width: "920px",
        //         fields: "15px"
        //     },
        //     sm: {
        //         width: "720px"
        //     },
        //     xs: {
        //         width: "576px"
        //     },
        //     xxs: {
        //         width: "420px"
        //     }
        outputStyle: 'less', /* less || scss || sass || styl */
        columns: 12, /* number of grid columns */
        offset: '30px', /* gutter width px || % || rem */
        mobileFirst: false, /* mobileFirst ? 'min-width' : 'max-width' */
        container: {
            maxWidth: '1110px', /* max-width оn very large screen */
            fields: '15px' /* side fields */
        },
        breakPoints: {
            lg: {
                width: '1200px', /* -> @media (max-width: 1100px) */
            },
            md: {
                width: '992px'
            },
            sm: {
                width: '720px',
                /*fields: '15px'  set fields only if you want to change container.fields */
            },
            xs: {
                width: '576px'
            }
        }
    };

    smartgrid('./src/precss/', settings);
    done();
}

gulp.task('grid', grid);