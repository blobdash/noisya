const { songs } = require("../data/jubeat-zetaraku.json");
const { zetaraku_cdn } = require('../config.json');

const metaresolver = require('../games/meta-resolver.js');

const lamps = {
    "FAILED": "F",
    "CLEAR": "C",
    "FULL COMBO": "FC",
    "EXCELLENT": "EXC"
}

const versions = {
    "jubeat": "jubeat",
    "ripples": "ripples",
    "knit": "knit",
    "copious": "copious",
    "saucer": "saucer",
    "prop": "prop",
    "qubell": "Qubell",
    "clan": "clan",
    "festo": "festo",
    "ave": "Ave.",
    "beyond": "Beyond the Ave."
}

const classes = {
    "BLACK": "Black",
    "YELLOW_GREEN": "Yel-Gre",
    "GREEN": "Green",
    "LIGHT_BLUE": "L. Blue",
    "BLUE": "Blue",
    "VIOLET": "Violet",
    "PURPLE": "Purple",
    "PINK": "Pink",
    "ORANGE": "Orange",
    "GOLD": "Gold",
    null: "/",
    undefined: "/"
}

async function songInfo(songData, emb, game) {
    emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
    emb.addFields(
        { name: "Version", value: versions[songData.body.song.data.displayVersion] }
    )
    setCover(songData.body.song, songData.body.charts[0], emb);

    const charts = songData.body.charts.filter((chart) => !chart.difficulty.startsWith("HARD")).sort((a, b) => b.levelNum - a.levelNum);
    let buffer = "";
    for(const chart of charts) {
        buffer = `${buffer.length != 0 ? `${buffer} /`: ""} ${chart.difficulty} ${chart.levelNum}`
    }
    emb.addFields(
        { name: "Difficultés", value: buffer }
    )
}

async function populateProfile(prfl, profile) {
    prfl.addFields(
        { name: "Jubility", value: `${profile.body.gameStats.ratings.jubility.toFixed(2)} (${profile.body.gameStats.ratings.naiveJubility.toFixed(2)})` },
        { name: "Couleur", value: classes[profile.body.gameStats.classes.colour] },
        { name: "Playcount", value: profile.body.totalScores+"" },
        { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
        { name: "Rang sur Tachi", value: `#${profile.body.rankingData.jubility.ranking}/${profile.body.rankingData.jubility.outOf}`}
    )
}

async function leaderboardFeeder(response, lines, player) {
    lines.push({
        jubility: response.body.gameStats.ratings.jubility.toFixed(2),
        naiveJubilityDiff: (response.body.gameStats.ratings.jubility - response.body.gameStats.ratings.naiveJubility).toFixed(2),
        player: player.username,
        colour: classes[response.body.gameStats.classes.colour]
    })
}

async function leaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.jubility+"").padStart(7)} ${`(${line.naiveJubilityDiff})`.padStart("9")} | ${line.colour.padStart(7)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function lineSorter(lines) {
    lines.sort((a, b) => b.jubility - a.jubility);
}

async function formatPlayInfo(play, emb) {
    internalChart = metaresolver.resolveChartlist(play.game).find((chart) => chart.id === play.chartID);
    internalSong = metaresolver.resolveSonglist(play.game).find((song) => song.id === play.songID);
    setCover(internalSong, internalChart, emb);
    return `**${internalSong.artist} - ${internalSong.title} [${internalChart.difficulty} ${internalChart.levelNum}]**
    ${play.scoreData.grade} / ${play.scoreData.musicRate.toFixed(2)}% / ${play.scoreData.score}`
}

async function chartLeaderboardFeeder(response, lines, player) {
    lines.push({
        score: response.body.pb.scoreData.score,
        grade: response.body.pb.scoreData.grade,
        clear: lamps[response.body.pb.scoreData.lamp],
        player: player.username,
        musicRate: response.body.pb.scoreData.musicRate
    })
}

async function chartLeaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(4)} ${line.clear.padStart(3)} ${(line.score+"").padStart(8)} | ${(line.musicRate+"").padStart(5)}% | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function setCover(songData, chartData, emb) {
    // Find the song in the zetaraku chart data.
    zetarakuMatch = songs.find((song) => song.title === songData.title);
    if(zetarakuMatch === undefined) {
        // Song was not found. No cover will be displayed.
    } else {
        emb.setImage(`${zetaraku_cdn}/jubeat/img/cover/${zetarakuMatch.imageName}`)
    }
}

async function resolveTierList(chart) {
    return "";
}

module.exports = {
    songInfo, populateProfile, leaderboardFeeder, leaderboardFormat, lineSorter, formatPlayInfo, chartLeaderboardFeeder, chartLeaderboardFormat, setCover, resolveTierList
}