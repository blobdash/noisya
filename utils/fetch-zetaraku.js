const { urls } = require('../zetaraku-meta.json');
const fs = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

(async() => {
    for(let meta of urls) {
        console.log(`Fetching ${meta.jobname} metadata...`);
        const stream = fs.createWriteStream(`./data/${meta.filename}`);
        const { body } = await fetch(`${meta.url}`);
        await finished(Readable.fromWeb(body).pipe(stream));
        console.log("Done.")
    }
    console.log("Successfully fetched metadata.")
})();