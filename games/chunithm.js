const { songs } = require('../data/chuni-zetaraku.json');
const { zetaraku_cdn } = require('../config.json');

const metaresolver = require('../games/meta-resolver.js');

const lamps = {
    "FAILED": "F",
    "CLEAR": "C",
    "FULL COMBO": "FC",
    "ALL JUSTICE": "AJ",
    "ALL JUSTICE CRITICAL": "AJC"
}

const versions = {
    "chuni": "CHUNITHM",
    "chuniplus": "CHUNITHM PLUS",
    "air": "AIR",
    "airplus": "AIR PLUS",
    "star": "STAR",
    "starplus": "STAR PLUS",
    "amazon": "AMAZON",
    "amazonplus": "AMAZON PLUS",
    "crystal": "CRYSTAL",
    "crystalplus": "CRYSTAL PLUS",
    "paradise": "PARADISE",
    "paradiselost": "PARADISE LOST",
    "new": "NEW",
    "newplus": "NEW PLUS",
    "sun": "SUN",
    "sunplus": "SUN PLUS",
    "luminous": "LUMINOUS",
    "luminousplus": "LUMINOUS PLUS",
    "verse": "VERSE",
    "verseplus": "VERSE PLUS",
    "xverse": "X-VERSE",
    "xversex": "X-VERSE-X"
}

const classes = {
    "BLUE": "🟦",
    "GREEN": "🟩",
    "ORANGE": "🟧",
    "RED": "🟥",
    "PURPLE": "🟪",
    "COPPER": "🟫",
    "SILVER": "🌫️",
    "GOLD": "🟨",
    "PLATINUM": "⬜",
    "PLATINUM_II": "⬜2️⃣",
    "PLATINUM_III": "⬜3️⃣",
    "RAINBOW": "🌈",
    "RAINBOW_II": "🌈2️⃣",
    "RAINBOW_III": "🌈3️⃣",
    "RAINBOW_IV": "🌈4️⃣",
    "RAINBOW_EX_I": "🌈EX",
    "RAINBOW_EX_II": "🌈EX2️⃣",
    "RAINBOW_EX_III": "🌈EX3️⃣",
    null: "-",
    undefined: "-"
}

async function songInfo(songData, emb, game) {
    emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
    emb.addFields(
        { name: "Catégorie", value: `${songData.body.song.data.genre}` }
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
        { name: "Naive Rating", value: profile.body.gameStats.ratings.naiveRating.toFixed(2) },
        { name: "Couleur", value: `${classes[profile.body.gameStats.classes.colour]}` },
        { name: "Playcount", value: profile.body.totalScores+"" },
        { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
        { name: "Rang sur Tachi", value: `#${profile.body.rankingData.naiveRating.ranking}/${profile.body.rankingData.naiveRating.outOf}`}
    )
}

async function leaderboardFeeder(response, lines, player) {
    lines.push({
        naiverating: response.body.gameStats.ratings.naiveRating.toFixed(2),
        player: player.username,
        colour: `${classes[response.body.gameStats.classes.colour]}`
    })
}

async function leaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.naiverating+"").padStart(6)} | ${line.colour.padEnd(4)} | ${line.player}\`\n`
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
    return `**${internalSong.artist} - ${internalSong.title} ${internalChart.difficulty} ${internalChart.levelNum}**
    ${play.scoreData.grade} / ${formatTraditionalClear(play)} / ${play.scoreData.score}
    ${play.scoreData.judgements.jcrit}-${play.scoreData.judgements.justice}-${play.scoreData.judgements.attack}-${play.scoreData.judgements.miss}`
}

async function chartLeaderboardFeeder(response, lines, player) {
    lines.push({
        score: response.body.pb.scoreData.score,
        grade: response.body.pb.scoreData.grade,
        clear: lamps[formatTraditionalClear(response.body.pb)],
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
    if(songData.title === 'Synthesis.') {
        emb.setImage(`https://i.imgur.com/rNYBg1M.png`);
        return;
    }
    // Find the song in the zetaraku chart data.
    zetarakuMatch = songs.find((song) => song.title === songData.title);
    if(zetarakuMatch === undefined) {
        // Song was not found. No cover will be displayed.
    } else {
        emb.setImage(`${zetaraku_cdn}/chunithm/img/cover/${zetarakuMatch.imageName}`)
    }
}

async function resolveTierList(chart) {
    return "";
}

function formatTraditionalClear(score) {
    if(score.scoreData.noteLamp === 'NONE') {
        if(score.scoreData.clearLamp === 'FAILED') return 'FAILED'
        return 'CLEAR';
    }
    return score.scoreData.noteLamp;
}

module.exports = {
    songInfo, populateProfile, leaderboardFeeder, leaderboardFormat, lineSorter, formatPlayInfo, chartLeaderboardFeeder, chartLeaderboardFormat, setCover, resolveTierList
}