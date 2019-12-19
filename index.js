console.log("Starting website builder...");

// Loading required libraries
const util = require('util');
const path = require('path');
const fs = require('fs');


const gettextParser = require('gettext-parser');


const src = path.join(__dirname, 'src/');
const build = path.join(__dirname, 'build/');
console.log(src);
return 0;

// Importing gulp and gulpfile as I want to run few of its tasks
const gulp = require('gulp');

const dir = "/srv/discord/websites/hotellewd.com/";



const destination = path.join(__dirname, 'build/');

// Promisifying few methods for later use
const readDirectory = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

// Prepare few functions that Im going to use later on
function getTranslation(translationObject, desiredString) {
    return translationObject.translations[''][desiredString].msgstr[0] || "TRANSLATION_NOT_FOUND";
}

// Rendering PUG files into static HTML pages with multiple translation variants
gulp.task('html', () => {



/*
 * I'm declaring some functions that will come in handy later.
/*/



// Check for available translation files
console.log("Checking available translations in /src/lang directory...");
const translationsPath = path.join(__dirname, 'src/lang/');
readDirectory(translationsPath).then(async files => {

    // Filter out all files that are not using .po extension
    files = files.filter(filename => filename.length == 5 && filename.endsWith('.po'));

    // Load and parse all available language files (writed with .po)
    console.log("Attempting to read and parse all translation files...");
    let availableLanguages = {};
    for (const file of files) {
        const locale = file.slice(0,2);
        console.log(` - Attempt to read and parse '${locale}' translation...`);

        // If for any weird reason this language is already initialized, just continue the loop
        if (availableLanguages[locale]) continue;

        // Attempt to recover translation file
        try {
            const translationFile = await readFile(translationsPath + file, 'utf8');
            availableLanguages[locale] = await gettextParser.po.parse(translationFile, 'utf8');
        } catch (error) {
            console.error(`Something went wrong while trying to load or parse '${file}' file.\nError details:${error}\nNode is not exiting. Moving on...`);
            continue;
        }
    }

    // Checking if at least single translation has been loaded and parsed without a problem
    if (Object.keys(availableLanguages).length < 1) {
        console.error("Not a single translation file has been parsed by the process.\nNode process will now be terminated.");
        process.exitCode = 1; // process.exit() is not recommended by the docs. https://nodejs.org/api/process.html#process_process_exit_code
    } 

    //
    //  Converting Stylus files into CSS and compressing resulted CSS files 
    //

    // Load Stylus 


    for (const language in availableLanguages) {
        console.log(getTranslation(availableLanguages[language], 'NAME_AND_SURNAME'))
    }

}).catch(console.error);

});

//
// Compressing images  
//
const imagemin = require('gulp-imagemin');
const imageSource = src + 'img/*';
gulp.task('img', () => {
    return gulp.src(imageSource)
        .pipe(imagemin([

            // GIF Optimizer: https://github.com/imagemin/imagemin-gifsicle
            imagemin.gifsicle({
                interlaced: false,
                optimizationLevel: 3
            }),

            // JPEG Optimizer: https://github.com/imagemin/imagemin-jpegtran
            imagemin.jpegtran({
                progressive: false,
                arithmetic: true // TODO: Check browser support for this
            }),

            // PNG Optimizer: https://github.com/imagemin/imagemin-optipng
            imagemin.optipng({
                optimizationLevel: 7, // 240 trials for production
                bitDepthReduction: true,
                colorTypeReduction: true,
                paletteReduction: true,
                interlaced: false
            }),

            // SVG Optimizer: https://github.com/imagemin/imagemin-svgo
            imagemin.svgo({
                removeRasterImages: true, // There should be no raster images within SVG files in this project in the first place...
                removeScriptElement: true, // Like above, I'm not going to use any scripts within SVG files in this project...
                removeOffCanvasPaths: true,
                reusePaths: true,
                sortAttrs: true // Aside rom readability, it should also help out with compression a little bit
            })
        ]))
        .pipe(gulp.dest(destination+'public/'));
});

//
// Compressing JavaScript files 
//
const terser = require('gulp-terser');
const jsSource = src + 'js/*';
gulp.task('js', () => {
    return gulp.src(jsSource)
        .pipe(terser({
            'booleans_as_integers': true,
            'drop_console': true, // Discard calls to console.* functions
            'ecma': 6,
            'passes': 5,
            'unsafe_arrows': true, // Convert ES5 style anonymous function expressions to arrow functions if the function body does not reference 'this'
            'unsafe_math': true, // Optimize numerical expressions like 2 * x * 3 into 6 * x, which may give imprecise floating point results
            'unsafe_methods': true, // Converts { m: function(){} } to { m(){} }
        }))
        .pipe(gulp.dest(destination));
});

// 
// Converting Stylus files into CSS and compressing resulted CSS files 
//
const stylus = require('gulp-stylus');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const cssSource = src + 'img/*';
gulp.task('css', () => {
    console.log('Converting stylus files into CSS and compressing resulted CSS files...');
    return gulp.src(cssSource)
        .pipe(stylus())
        .pipe(autoprefixer({
            flexbox: false, // I'm not supporting old versions of IE on my website
            // Detailed instructions on how to define custom usage data: https://github.com/browserslist/browserslist#custom-usage-data
            browsers: '> 0.5%, > 0.25% in PL, last 2 versions, Firefox ESR, cover 97.5% in PL, not dead' // I want near perfect coverage for Poland
        }))
        .pipe(cleanCSS({
            level: {
                1: {
                    all: true,
                    roundingPrecision: 2
                },
                2: {
                    all: true,
                    restructureRules: true
                }
            }
        }))
        .pipe(gulp.dest(destination));
});

//
// Default GULP task
// 
// While it might not be the best idea to connect default task of gulp to it's watcher methods,
// this feels like the easiest and most convinient solution in case of my personal website where
// I am the only person working on that "Project".
//
gulp.task('default', () => {
    gulp.watch(cssSource, gulp.series('css'));
    gulp.watch(dir+'javascript/*.js', gulp.series('js'));
});


// TODO: Convert /src/pug/*.pug files to HTML and move it to /public/*.html

// TODO: Convert /src/stylus/*.styl files to CSS and move it to /public/*.css

// TODO: Compress /src/js/*.js files and move them to /public/*.js