console.log("Starting website builder...");
const express = require('express.js');

const webhook = express();
const childProcess = require('child_process');

const githubUsername = 'tiritto';

webhook.post("/github", (req, res) => {

    // Right away send back status code 200. There is no point in prologing session.
    res.status(200).send();

    const isProductionBranch = (req.body.branch.indexOf('production') > -1);

    if (isProductionBranch && req.body.sender == githubUsername) childProcess.exec(`cd ${__dirname} && ./deploy.sh`, (error, stdout, stderr) => {

        // Print error in the console if something goes wrong
        if (error) return console.error(error);
    });
});