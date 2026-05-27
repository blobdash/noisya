const { popn_cdn } = require('../config.json');

const metaresolver = require('../games/meta-resolver.js');

const lamps = {
    "FAILED": "F",
    "EASY CLEAR": "EC",
    "CLEAR": "C",
    "FULL COMBO": "FC",
    "PERFECT": "PF"
}

async function songInfo(songData, emb, game) {
    emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
    emb.addFields(
        { name: "Genre", value: `${songData.body.song.data.genre} ${songData.body.song.data.genreEN ? `(${songData.body.song.data.genreEN})` : ''}` },
    )
    setCover(songData.body.song, songData.body.charts[0], emb);
    const charts = songData.body.charts.sort((a,b) => a.levelNum - b.levelNum);
    let buffer = "";
    for(const chart of charts) {
        buffer = `${buffer.length != 0 ? `${buffer} /`: ""} ${chart.difficulty} ${chart.level}`
    }
    emb.addFields(
        { name: "Difficultés", value: buffer }
    )
}

async function populateProfile(prfl, profile) {
    prfl.addFields(
        { name: "Naive Class", value: profile.body.gameStats.ratings.naiveClassPoints.toFixed(2) },
        { name: "Rang", value: profile.body.gameStats.classes.class },
        { name: "Playcount", value: profile.body.totalScores+"" },
        { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" }
    )
}

async function leaderboardFeeder(response, lines, player) {
    lines.push({
        classpoints: response.body.gameStats.ratings.naiveClassPoints.toFixed(2),
        player: player.username,
        class: response.body.gameStats.classes.class ? response.body.gameStats.classes.class : "NO CLASS"
    })
}

async function leaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.classpoints+"").padStart(6)} | ${line.class.padStart(10)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function lineSorter(lines) {
    lines.sort((a, b) => b.classpoints - a.classpoints);
}

async function formatPlayInfo(play, emb) {
    internalChart = metaresolver.resolveChartlist(play.game).find((chart) => chart.id === play.chartID);
    internalSong = metaresolver.resolveSonglist(play.game).find((song) => song.id === play.songID);
    setCover(internalSong, internalChart, emb);
    return `**${internalSong.artist} - ${internalSong.title} (${internalChart.difficulty.toUpperCase()} ${internalChart.levelNum})**
    ${play.scoreData.grade} / ${play.scoreData.lamp} / ${play.scoreData.score}`
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
        buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(3)} ${line.clear.padStart(3)} ${(line.score+"").padStart(6)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function setCover(songData, chartData, emb) {
    emb.setImage(`${popn_cdn}/${chartData.data.inGameID}.png`);
}

async function resolveTierList(chart) {
    return "";
}

module.exports = {
    songInfo, populateProfile, leaderboardFeeder, leaderboardFormat, lineSorter, formatPlayInfo, chartLeaderboardFeeder, chartLeaderboardFormat, setCover, resolveTierList
}