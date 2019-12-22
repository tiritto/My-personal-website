const express = require('express');
const path = require('path');
const webserver = express();

const childProcess = require('child_process');

const githubUsername = 'tiritto';

webserver.post("/github", (req, res) => {
    console.log('PRODUCTION PUSH!');

    // Right away send back status code 200. There is no point in prologing session.
    res.status(200).send();

    const isProductionBranch = (req.body.branch.indexOf('production') > -1);

    if (isProductionBranch && req.body.sender == githubUsername) childProcess.exec(`cd ${__dirname} && ./deploy.sh`, (error, stdout, stderr) => {

        console.log('UPDATE DONE!!');
        // Print error in the console if something goes wrong
        if (error) return console.error(error);
    });
});

webserver.use(express.static(path.join(__dirname, 'public')));

webserver.get('/', (req, res) => {
    res.send("Hello world!!! Co tam?");
});

webserver.listen(3100, () => {
    console.log('Listening on port 3100!');
});