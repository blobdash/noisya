const { XMLParser } = require('fast-xml-parser')
const fs = require("fs");
const iconv = require("iconv-lite");
const { sdvx } = require('../constants/Versions');
const { sdvx_cdn } = require('../config.json');

module.exports = {
    parseDan(dan) {
        if(dan === undefined) return 'n/a';
        if(dan.startsWith('DAN_')) {
            return dan.replaceAll('DAN_', 'SL');
        } else if(dan === 'INF') {
            return 'SL ∞';
        } else {
            return ' -- ';
        }
    },
    populateSdvxProfile(prfl, profile) {
        prfl.addFields(
            { name: "VF6", value: profile.body.gameStats.ratings.VF6.toFixed(3) },
            { name: "Dan", value: module.exports.parseDan(profile.body.gameStats.classes.dan) },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: new Date(profile.body.firstScore.timeAchieved).toLocaleString() },
            { name: "Rang sur Tachi", value: `#${profile.body.rankingData.VF6.ranking}/${profile.body.rankingData.VF6.outOf}`}
        )
    },
    formatSdvxSongInfo(songData, emb) {
        // Read music_db.xml. Since it's encoded in Shift JIS, some iconv wizardry is needed.
        const musicDb = fs.readFileSync('./data/music_db.xml');
        const musicDbDecr = iconv.decode(Buffer.from(musicDb), "Shift_JIS");
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "_", });
        const mDb = parser.parse(musicDbDecr);
        const mdbEntry = mDb.mdb.music.find((mdbSongEntry) => mdbSongEntry._id == songData.body.song.id)
        
        // try to fetch kana from mDb
        let kanji;
        if(mdbEntry === undefined) {
            // Chart is not present in your current music_db. Song was probably removed from the game, or is a konaste exclusive.
            kana = "-";
        } else {
            kana = mdbEntry.info.title_yomigana.charAt(0);
        }

        emb.setImage(`${sdvx_cdn}/api/games/sdvx/musics/${songData.body.song.id}/EXHAUST.png?fallback=game`)
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
        emb.addFields(
            { name: "Kana", value: kana},
            { name: "Version", value: sdvx[songData.body.song.data.displayVersion] }
        )
        const charts = songData.body.charts.sort((a,b) => a.levelNum - b.levelNum);
        let buffer = "";
        for(const chart of charts) {
            buffer = `${buffer.length != 0 ? `${buffer} /`: ""} ${chart.difficulty} ${chart.level} ${formatDiffTierList(chart)}`
        }
        emb.addFields(
            { name: "Difficultés", value: buffer }
        )
    }
}

function formatDiffTierList(chart) {
    if(chart.data.clearTier) {
        return `(${chart.data.clearTier.text}${chart.data.clearTier.individualDifference ? " ⚖️" : ""})`
    } else return "\u200B";
}