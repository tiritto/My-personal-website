console.log("Starting website builder...");

// Loading required libraries
const gulp = require('gulp');
const util = require('util');
const path = require('path');
const fs = require('fs');

// Promisifying few methods for later use
const readFile = util.promisify(fs.readFile);

// Declaring few constant values
const inProduction = (process.env.NODE_ENV == 'production');
const src = path.join(__dirname, 'src/');
const destination = path.join(__dirname, 'build/');

//
// Rendering PUG files into static HTML pages with multiple translation variants
//
const pug = require('gulp-pug');
const nop = require('gulp-nop');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const htmlmin = require('gulp-htmlmin');
const gettextParser = require('gettext-parser');
const htmlSource = src + "pug/*";
gulp.task('html', async () => {
    console.log("Checking available translations in /src/lang directory...");

    // Search translations directory and filter out all files that are not using .po extension
    let files = fs.readdirSync(path.join(__dirname, 'src/lang/')).filter(filename => filename.length == 5 && filename.endsWith('.po'));

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
        console.error("Not a single translation file has been parsed by the process.\Gulp task will end now.");
        return;
        //process.exitCode = 1; // process.exit() is not recommended by the docs. https://nodejs.org/api/process.html#process_process_exit_code
    } 

    // Compile diferent file outputs for each language
    for (const language in availableLanguages) {

        // Create a table containing all translation strings that will be passed to PUG parser
        let translationTable = {};
        for (const string in availableLanguages[language].translations['']) {
            translationTable[string] = availableLanguages[language].translations[''][string].msgstr[0];
        }

        // Begin actual task, renaming files depending on language and parsing .pug files
        gulp.src(htmlSource)
            .pipe(rename(path => { path.basename += "_" + language; }))
            .pipe(pug({
                locals: translationTable // Passed variables
            }))
            .pipe(htmlmin({
                html5: true,
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                conservativeCollapse: true,
                quoteCharacter: '"',
                removeAttributeQuotes: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeEmptyElements: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true, // Removes type="text/javascript" from <script> tags. It's their default type in HTML5 so it doesn't matter.
                removeStyleLinkTypeAttributes: true, // Removes type="text/css" from <style> tags. It's their default type in HTML5 so it doesn't matter.
                sortAttributes: true, // Sorting attributes will improve effectiveness of GZip compression once file is sent
                sortClassName: true, // Same as before, but for classes.
                useShortDoctype: true
            }))
            .pipe(isProduction ? nop() : replace('</body>', `<script id="__bs_script__">//<![CDATA[
                document.write("<script async src='http://HOST:3000/browser-sync/browser-sync-client.js?v=2.26.7'><\/script>".replace("HOST", location.hostname));
            //]]></script></body>`))
            .pipe(gulp.dest(destination));
    }

    // It's done!
    return console.log("Website pages has been created!");
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
                optimizationLevel: inProduction ? 3 : 1 // Use simple optimization while not in production
            }),

            // JPEG Optimizer: https://github.com/imagemin/imagemin-jpegtran
            imagemin.jpegtran({
                progressive: false,
                arithmetic: true // TODO: Check browser support for this
            }),

            // PNG Optimizer: https://github.com/imagemin/imagemin-optipng
            imagemin.optipng({
                optimizationLevel: inProduction ? 7 : 1, // 240 trials for production, otherwise use just one
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
            'passes': inProduction ? 6 : 1, // Use 6 passes in production, but just one is enough for development
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
// Task that will automatically run all other tasks to make a build
//
gulp.task('build', () => {
    gulp.parallel('html', 'css', 'js', 'img');
});

//
// Default GULP task
// 
// While it might not be the best idea to connect default task of gulp to it's watcher methods,
// this feels like the easiest and most convinient solution in case of my personal website where
// I am the only person working on that "Project".
//
if (!inProduction) {
    let browserSync = require("browser-sync").create();
    gulp.task('default', () => {

        // Initialize browser sync for development
        browserSync.init();

        // Watch file changes
        gulp.watch(htmlSource, gulp.series('html')).on('change', browserSync.reload);
        gulp.watch(cssSource, gulp.series('css')).on('change', browserSync.reload);
        gulp.watch(jsSource, gulp.series('js')).on('change', browserSync.reload);
        gulp.watch(imageSource, gulp.series('img')).on('change', browserSync.reload);
    });
}