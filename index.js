console.log("Starting website builder...");

// Loading required libraries
const util = require('util');
const path = require('path');
const fs = require('fs');

const stylus = require('gulp-stylus');

const gettextParser = require('gettext-parser');


// Importing gulp and gulpfile as I want to run few of its tasks
const gulp = require('gulp');

const dir = "/srv/discord/websites/hotellewd.com/";



const destination = path.join(__dirname, 'build');

//
// Compressing JavaScript files 
//
const terser = require('gulp-terser');
gulp.task('js', () => {
    return gulp.src(dir+'javascript/*.js')
        .pipe(terser({
            'booleans_as_integers': true,
            'drop_console': true, // Discard calls to console.* functions
            'ecma': 6,
            'passes': 5,
            'unsafe_arrows': true, // Convert ES5 style anonymous function expressions to arrow functions if the function body does not reference 'this'
            'unsafe_math': true, // Optimize numerical expressions like 2 * x * 3 into 6 * x, which may give imprecise floating point results
            'unsafe_methods': true, // Converts { m: function(){} } to { m(){} }.

        }))
        .pipe(gulp.dest(dir+'public/'));
});

// 
// Converting Stylus files into CSS and compressing resulted CSS files 
//
const stylus   = require('gulp-stylus');
const cleanCSS = require('gulp-clean-css');
const stylusDirectory = path.join(__dirname, 'src/stylus/');
const stylusFiles = stylusDirectory+ '*.styl';
gulp.task('css', () => {
    console.log('Converting stylus files into CSS and compressing resulted CSS files...');
    return gulp.src(stylusFiles)
        .pipe(stylus())
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
    gulp.watch(stylusFiles, gulp.series('css'));
    gulp.watch(dir+'javascript/*.js', gulp.series('js'));
});

// Promisifying few methods for later use
const readDirectory = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

/*
 * I'm declaring some functions that will come in handy later.
/*/

function getTranslation(translationObject, desiredString) {
    return translationObject.translations[''][desiredString].msgstr[0] || null;
}

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


// TODO: Convert /src/pug/*.pug files to HTML and move it to /public/*.html

// TODO: Convert /src/stylus/*.styl files to CSS and move it to /public/*.css

// TODO: Compress /src/js/*.js files and move them to /public/*.js