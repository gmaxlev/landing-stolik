const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const newer = require("gulp-newer");
const imagemin = require("gulp-imagemin");
const googleWebFonts = require("gulp-google-webfonts");
const cleanCss = require("gulp-clean-css");
const fontmin = require("gulp-fontmin");
const gcmq = require("gulp-group-css-media-queries");
const pug = require("gulp-pug");
const beautify = require("gulp-beautify");
const imageminJpegRecompress = require("imagemin-jpeg-recompress");
const imageminPngquant = require("imagemin-pngquant");
const svgsprite = require("gulp-svg-sprite");
const spritesmith = require("gulp.spritesmith");
const terser = require("gulp-terser");
const htmlbeautify = require("gulp-html-beautify");

const paths = {
  scss: "src/scss/main.scss",
  html: "src/views/*.pug",
  js: "src/js/**/*.js",
  videos: "src/videos/**/*",
  vendor: "src/vendor/**/*",
  images: "src/images/**/*",
  fonts: "src/fonts/**/*",
  googltFonts: "src/googleFonts.list",
  svgResult: "src/svg-sprites/defs/svg/sprite.defs.svg",
  fontToCss: "dist/fonts/*.css",
  pngSprites: "src/png-sprites/**/*.png"
};

function gensvgsprite() {
  return gulp
    .src("src/svg/**/*.svg")
    .pipe(
      svgsprite({
        mode: {
          view: {
            bust: false,
            render: {
              scss: true
            }
          },
          css: {
            render: {
              css: true
            }
          },
          defs: true
        }
      })
    )
    .pipe(gulp.dest("src/svg-sprites"));
}

function scss() {
  return gulp
    .src(paths["scss"])
    .pipe(sass())

    .pipe(
      autoprefixer({
        overrideBrowserslist: ["> 0.1%"],
        cascade: false
      })
    )
    .pipe(gcmq())
    .pipe(
      cleanCss({
        level: 2
      })
    )
    .pipe(gulp.dest("dist/css"))
    .pipe(browsersync.stream());
}

function html() {
  return (
    gulp
      .src(paths["html"])
      /* .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    })) */
      .pipe(
        pug({
          // Your options in here.
        })
      )
      .pipe(
        beautify.html({
          indent_size: 4
        })
      )
      .pipe(htmlbeautify())
      .pipe(gulp.dest("dist/"))
      .pipe(browsersync.stream())
  );
}

function js() {
  return (
    gulp
      .src(paths["js"])
      // .pipe(terser())
      .pipe(gulp.dest("dist/js"))
      .pipe(browsersync.stream())
  );
}

function videos() {
  return gulp
    .src(paths["videos"])
    .pipe(gulp.dest("dist/videos"))
    .pipe(browsersync.stream());
}

function vendor() {
  return gulp
    .src(paths["vendor"])
    .pipe(gulp.dest("dist/vendor"))
    .pipe(browsersync.stream());
}

function svgSpriteResult() {
  return gulp
    .src(paths["svgResult"])
    .pipe(gulp.dest("dist/img"))
    .pipe(browsersync.stream());
}

function fontToCss() {
  return gulp
    .src(paths["fontToCss"])
    .pipe(gulp.dest("src/scss/modules/fonts"))
    .pipe(browsersync.stream());
}

function pngSprites(done) {
  var spriteData = gulp.src(paths["pngSprites"]).pipe(
    spritesmith({
      imgName: "png-sprites.png",
      cssName: "png-sprites.scss",
      imgPath: "../img/png-sprites.png",
      cssVarMap: function(sprite) {
        sprite.name = "sprites-png-" + sprite.name;
      }
    })
  );
  spriteData.img.pipe(gulp.dest("dist/img"));

  spriteData.css.pipe(gulp.dest("src/scss/modules"));

  done();
}

function images() {
  return gulp
    .src(paths["images"])
    .pipe(newer("dist/img"))
    .pipe(
      imagemin([
        imagemin.gifsicle({
          interlaced: true
        }),
        imageminJpegRecompress({
          progressive: true,
          max: 80,
          min: 70
        }),
        imageminPngquant({
          quality: [0.7, 0.8]
        }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("dist/img"))
    .pipe(browsersync.stream());
}

function googleFonts() {
  const options = {
    fontsDir: "src/fonts",
    googlecss: "src/scss/vendor",
    filename: "googleFonts.css"
  };

  return gulp
    .src(paths["googltFonts"])
    .pipe(googleWebFonts(options))
    .pipe(gulp.dest("./"))
    .pipe(browsersync.stream());
}

function ttfFontmin() {
  return gulp
    .src("src/fonts/**/*.ttf")
    .pipe(newer("dist/fonts"))
    .pipe(
      fontmin({
        fontPath: "../fonts/"
      })
    )
    .pipe(gulp.dest("dist/fonts"));
}

function watchFiles() {
  gulp.watch("src/scss/**/*", gulp.series(scss));
  gulp.watch("src/views/**/*.pug", gulp.series(html));
  gulp.watch(paths["images"], gulp.series(images));
  gulp.watch(paths["googltFonts"], gulp.series(googleFonts));
  gulp.watch(paths["js"], gulp.series(js));
  gulp.watch(paths["videos"], gulp.series(videos));
  gulp.watch(paths["vendor"], gulp.series(vendor));
  gulp.watch(paths["svgResult"], gulp.series(svgSpriteResult));
  gulp.watch(paths["fontToCss"], gulp.series(fontToCss));
  gulp.watch(paths["pngSprites"], gulp.series(pngSprites));
  gulp.watch("src/fonts/**/*.ttf", gulp.series(ttfFontmin));
  gulp.watch("src/svg/*.svg", gulp.series(gensvgsprite));
}

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "dist/"
    },
    port: 3000
  });
  done();
}

const watch = gulp.parallel(watchFiles, browserSync);

exports.scss = scss;
exports.html = html;
exports.images = images;
exports.googleFonts = googleFonts;
exports.watch = watch;
exports.js = js;
exports.videos = videos;
exports.svgSpriteResult = svgSpriteResult;
exports.fontToCss = fontToCss;
exports.pngSprites = pngSprites;
exports.pngSprites = vendor;
exports.ttfFontmin = ttfFontmin;
exports.svgsprite = gensvgsprite;
exports.build = gulp.parallel(
  scss,
  html,
  images,
  googleFonts,
  js,
  ttfFontmin,
  gensvgsprite,
  videos,
  svgSpriteResult,
  fontToCss,
  pngSprites
);

// const clean = require('gulp-clean-css');
// const replace = require('gulp-replace');
// const uglify = require('gulp-uglify');
// const babel = require('gulp-babel');
// const htmlmin = require('gulp-htmlmin');
// const minify = require('gulp-minify');
