// Loading libraries that will be used in this process
const childProcess = require('child_process');
const express = require('express');
const path = require('path');

// Defining some constant values
const webserver = express();
const port = 80; // Use port number defined in environment variables
const githubUsername = 'tiritto';
const isRunningInProduction = process.env.APP_ENV == 'production';

// Update and deploy all updates in GitHub production branch. Ignore on non-production environments.
// NOTE: It might be a possibility that someone might use this webhook as vector of an attact on my server
//       so I might need to write some extra check functions that would make sure that webhook comes from GitHub.
if (isRunningInProduction) webserver.post("/github", (req, res) => {
    console.log('New push has been submitted to GitHub repository!');

    // Right away send back status code 200. There is no point in prolonging session.
    res.status(200).send();

    // Check if production branch was affected and re-deploy files
    const isFromProductionBranch = (req.body.branch.indexOf('production') > -1);
    if (isFromProductionBranch && req.body.sender == githubUsername) {
        console.log('New changes has been pulled into production branch!');
            childProcess.exec(`cd ${__dirname} && ./update.sh`, (error, stdout, stderr) => {
            return error ? console.error(error) : console.log("Deployment procedure has been issued.");
        });
    }

    // Production branch wasn't affected - ignore this call.
    else console.log('Production branch was not affected. No action will be taken.');
});

// Serve all files published in ./public/ directory as static files
//webserver.use(express.static(path.join(__dirname, 'public')));

const fs = require('fs');
webserver.get('/', (req, res) => {
    console.log("something is going on!");
    fs.readFile('./src/hi.txt', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            fs.writeFile('./src/hi.txt', "hello world!", () => { console.log("File created!")});
        }
        else {
            console.log('OK!');
            console.log(data);
        }
    });
});

// Start listening on port defined by environment variable
webserver.listen(port, () => console.log(`Webserver is now listening on port ${port}!!`));