const { XMLParser } = require('fast-xml-parser')
const fs = require("fs");
const iconv = require("iconv-lite");
const { sdvx_cdn } = require('../config.json');

const metaresolver = require('../games/meta-resolver.js');

const lamps = {
    "FAILED": "F",
    "CLEAR": "C",
    "EXCESSIVE CLEAR": "HC",
    "MAXXIVE CLEAR": "MC",
    "ULTIMATE CHAIN": "UC",
    "PERFECT ULTIMATE CHAIN": "PUC",
}

const versions = {
    "booth": "BOOTH",
    "inf": "-infinite infection-",
    "gw": "GRAVITY WARS",
    "heaven": "HEAVENLY HAVEN",
    "vivid": "VIVID WAVE",
    "exceed": "EXCEED GEAR",
    "konaste": "Konaste",
    "nabla": "∇"
}

const diffMapper = {
    "NOV": "NOVICE",
    "ADV": "ADVANCED",
    "EXH": "EXHAUST",
    "MXM": "MAXIMUM",
    "INF": "INFINITE",
    "GRV": "GRAVITY",
    "HVN": "HEAVENLY",
    "VVD": "VIVID",
    "XCD": "EXCEED",
    "ULT": "ULTIMATE"
}

function parseDan(dan) {
    if(dan === undefined) return 'n/a';
    if(dan.startsWith('DAN_')) {
        return dan.replaceAll('DAN_', 'SL');
    } else if(dan === 'INF') {
        return 'SL ∞';
    } else {
        return ' -- ';
    }
}

async function songInfo(songData, emb, game) {
    // Read music_db.xml. Since it's encoded in Shift JIS, some iconv wizardry is needed.
    const musicDb = fs.readFileSync('./data/music_db.xml');
    const musicDbDecr = iconv.decode(Buffer.from(musicDb), "Shift_JIS");
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "_", });
    const mDb = parser.parse(musicDbDecr);
    const mdbEntry = mDb.mdb.music.find((mdbSongEntry) => mdbSongEntry._id == songData.body.song.id)
    
    // try to fetch kana from mDb
    let kana;
    if(mdbEntry === undefined) {
        // Chart is not present in your current music_db. Song was probably removed from the game, or is a konaste exclusive.
        kana = "-";
    } else {
        kana = mdbEntry.info.title_yomigana.charAt(0);
    }

    setCover(songData.body.song, songData.body.charts[0], emb);
    emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
    emb.addFields(
        { name: "Kana", value: kana},
        { name: "Version", value: versions[songData.body.song.data.displayVersion] }
    )
    const charts = songData.body.charts.sort((a,b) => a.levelNum - b.levelNum);
    let buffer = "";
    for(const chart of charts) {
        buffer = `${buffer.length != 0 ? `${buffer} /`: ""} ${chart.difficulty} ${chart.level} ${await resolveTierList(chart)}`
    }
    emb.addFields(
        { name: "Difficultés", value: buffer }
    )
}

async function populateProfile(prfl, profile) {
    prfl.addFields(
        { name: "VF6", value: profile.body.gameStats.ratings.VF6.toFixed(3) },
        { name: "VF7", value: profile.body.gameStats.ratings.VF7.toFixed(3) },
        { name: "Dan", value: parseDan(profile.body.gameStats.classes.dan) },
        { name: "Playcount", value: profile.body.totalScores+"" },
        { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
        { name: "Rang sur Tachi", value: `#${profile.body.rankingData.VF6.ranking}/${profile.body.rankingData.VF6.outOf}`}
    )
}

async function leaderboardFeeder(response, lines, player) {
    lines.push({
        vf: response.body.gameStats.ratings.VF7.toFixed(3),
        player: player.username,
        dan: parseDan(response.body.gameStats.classes.dan)
    })
}

async function leaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.vf+"").padStart(6)}VF ${line.dan.padStart(4)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function lineSorter(lines) {
    lines.sort((a, b) => b.vf - a.vf);
}

async function formatPlayInfo(play, emb) {
    internalChart = metaresolver.resolveChartlist(play.game).find((chart) => chart.id === play.chartID);
    internalSong = metaresolver.resolveSonglist(play.game).find((song) => song.id === play.songID);
    setCover(internalSong, internalChart, emb);
    return `**${internalSong.artist} - ${internalSong.title} [${internalChart.difficulty} ${internalChart.levelNum}] ${await resolveTierList(internalChart)}**
    ${play.scoreData.grade} / ${play.scoreData.lamp} ${play.scoreData.optional.gauge ? "(" + play.scoreData.optional.gauge + "%)" : ""} / ${play.scoreData.score} 
    *${play.calculatedData.VF6} (VF6) / ${play.calculatedData.VF7} (VF7)*
    ${play.scoreData.judgements.critical} / ${play.scoreData.judgements.near} / ${play.scoreData.judgements.miss}`
}

async function chartLeaderboardFeeder(response, lines, player) {
    lines.push({
        score: response.body.pb.scoreData.score,
        grade: response.body.pb.scoreData.grade,
        clear: lamps[response.body.pb.scoreData.lamp],
        player: player.username
    })
}

async function chartLeaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(4)} ${line.clear.padStart(3)} ${(line.score+"").padStart(8)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function setCover(songData, chartData, emb) {
    emb.setImage(`${sdvx_cdn}/api/games/sdvx/musics/${chartData.data.inGameID}/${diffMapper[chartData.difficulty]}.png?fallback=game&size=big`);
}

async function resolveTierList(chart) {
    if(chart.data.clearTier) {
        const clearTier = `${chart.data.clearTier.text}${chart.data.clearTier.individualDifference ? " ⚖️" : ""}`;
        if(chart.data.sTier) {
            return `(${clearTier}, S ${chart.data.sTier.text})`
        } else {
            return `(${clearTier})`
        }
    } else if(chart.data.sTier) {
        return `(S ${chart.data.sTier.text})`;
    } else return "\u200B";
}

module.exports = {
    songInfo, populateProfile, leaderboardFeeder, leaderboardFormat, lineSorter, formatPlayInfo, chartLeaderboardFeeder, chartLeaderboardFormat, setCover, resolveTierList
}