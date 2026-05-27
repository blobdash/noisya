const { songs } = require("../data/maimai-zetaraku.json");

const metaresolver = require('../games/meta-resolver.js');

const lamps = {
    "FAILED": "F",
    "CLEAR": "C",
    "FULL COMBO": "FC",
    "ALL PERFECT": "AP",
    "ALL PERFECT+": "AP+"
}

const classes = {
    "DAN_1": "初段(1st)",
    "DAN_2": "二段(2nd)",
    "DAN_3": "三段(3rd)",
    "DAN_4": "四段(4th)",
    "DAN_5": "五段(5th)",
    "DAN_6": "六段(6th)",
    "DAN_7": "七段(7th)",
    "DAN_8": "八段(8th)",
    "DAN_9": "九段(9th)",
    "DAN_10": "十段(10th)",
    "KAIDEN": "皆伝(KAIDEN)",
    "SHINDAN_1": "真初段(S1st)",
    "SHINDAN_2": "真二段(S2nd)",
    "SHINDAN_3": "真三段(S3rd)",
    "SHINDAN_4": "真四段(S4th)",
    "SHINDAN_5": "真五段(S5th)",
    "SHINDAN_6": "真六段(S6th)",
    "SHINDAN_7": "真七段(S7th)",
    "SHINDAN_8": "真八段(S8th)",
    "SHINDAN_9": "真九段(S9th)",
    "SHINDAN_10": "真十段(S10th)",
    "SHINKAIDEN": "真皆伝(SKAIDEN)",
    undefined: "ノ段"
}

const colors = {
    "WHITE": "White",
    "BLUE": "Blue",
    "GREEN": "Green",
    "YELLOW": "Yellow",
    "RED": "Red",
    "PURPLE": "Purple",
    "BRONZE": "Bronze",
    "SILVER": "Silver",
    "GOLD": "Gold",
    "RAINBOW": "RAINBOW",
    undefined: "-"
}

async function songInfo(songData, emb, game) {
    emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
    emb.addFields(
        { name: "Version", value: songData.body.song.data.displayVersion }
    )
    setCover(songData.body.song, songData.body.charts[0], emb);

    const charts = songData.body.charts.sort((a, b) => b.levelNum - a.levelNum);
    let buffer = "";
    for(const chart of charts) {
        buffer = `${buffer.length != 0 ? `${buffer}\n`: ""} ${chart.difficulty} ${chart.level} (${chart.levelNum})`
    }
    emb.addFields(
        { name: "Difficultés", value: buffer }
    )
}

async function populateProfile(prfl, profile) {
    prfl.addFields(
        { name: "Naive Rating", value: profile.body.gameStats.ratings.naiveRate.toFixed(2) },
        { name: "Dan", value: classes[profile.body.gameStats.classes.dan] },
        { name: "Couleur", value: colors[profile.body.gameStats.classes.colour] },
        { name: "Playcount", value: profile.body.totalScores+"" },
        { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
        { name: "Rang sur Tachi", value: `#${profile.body.rankingData.naiveRate.ranking}/${profile.body.rankingData.naiveRate.outOf}`}
    )
}

async function leaderboardFeeder(response, lines, player) {
    lines.push({
        naiverating: response.body.gameStats.ratings.naiveRate.toFixed(2),
        player: player.username,
        dan: classes[response.body.gameStats.classes.dan],
        colour: colors[response.body.gameStats.classes.colour]
    })
}

async function leaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.naiverating+"").padStart(6)} | ${line.dan.padStart(12)} | ${line.colour.padStart(7)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function lineSorter(lines) {
    lines.sort((a, b) => b.naiverating - a.naiverating);
}

async function formatPlayInfo(play, emb) {
    internalChart = metaresolver.resolveChartlist(play.game).find((chart) => chart.id === play.chartID);
    internalSong = metaresolver.resolveSonglist(play.game).find((song) => song.id === play.songID);
    setCover(internalSong, internalChart, emb);
    return `**${internalSong.artist} - ${internalSong.title} (${internalChart.difficulty} ${internalChart.levelNum})**
    ${play.scoreData.grade} / ${play.scoreData.lamp} / ${play.scoreData.percent}%`
}

async function chartLeaderboardFeeder(response, lines, player) {
    lines.push({
        score: response.body.pb.scoreData.percent,
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
    // Find the song in the zetaraku chart data.
    zetarakuMatch = songs.find((song) => song.title === songData.title);
    if(zetarakuMatch === undefined) {
        // Song was not found. No cover will be displayed.
    } else {
        emb.setImage(`${zetaraku_cdn}/maimai/img/cover/${zetarakuMatch.imageName}`)
    }
}

async function resolveTierList(chart) {
    return "";    
}

module.exports = {
    songInfo, populateProfile, leaderboardFeeder, leaderboardFormat, lineSorter, formatPlayInfo, chartLeaderboardFeeder, chartLeaderboardFormat, setCover, resolveTierList
}