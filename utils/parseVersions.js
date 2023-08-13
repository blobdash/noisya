const jubeatsongs = require('../data/songs-jubeat.json');


let versions = [];
for(let song of jubeatsongs) {
    if(!versions.includes(song.data.displayVersion)) {
        versions.push(song.data.displayVersion);
    }
}

console.log(versions);