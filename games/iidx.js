const { iidx_cdn } = require('../config.json');
const acorn = require("acorn");
const entities = require("html-entities");
const {distance, closest} = require('fastest-levenshtein');
const iconv = require("iconv-lite");

const metaresolver = require('../games/meta-resolver.js');

const lamps = {
    "NO PLAY": "NP",
    "FAILED": "F",
    "ASSIST CLEAR": "AC",
    "EASY CLEAR": "EC",
    "CLEAR": "NC",
    "HARD CLEAR": "HC",
    "EX HARD CLEAR": "EXHC",
    "FULL COMBO": "FC",
    undefined: "?"
}

const versions = {
    "inf": "INFINITAS",
    "1": "1st style",
    "sub": "substream",
    "2": "2nd style",
    "3": "3rd style",
    "4": "4th style",
    "5": "5th style",
    "6": "6th style",
    "7": "7th style",
    "8": "8th style",
    "9": "9th style",
    "10": "10th style",
    "11": "11 IIDX RED",
    "12": "HAPPY SKY",
    "13": "DistorteD",
    "14": "GOLD",
    "15": "DJ TROOPERS",
    "16": "EMPRESS",
    "17": "SIRIUS",
    "18": "Resort Anthem",
    "19": "Lincle",
    "20": "tricoro",
    "21": "SPADA",
    "22": "PENDUAL",
    "23": "copula",
    "24": "SINOBUZ",
    "25": "CANNON BALLERS",
    "26": "ROOTAGE",
    "27": "HEROIC VERSE",
    "28": "BISTROVER",
    "29": "CastHour",
    "30": "RESIDENT",
    "31": "EPOLIS",
    "32": "Pinky Crush",
    "33": "Sparkle Shower",
    "inf2020": "Infinitas",
    default: "Removed"
}

const classes = {
    "KAIDEN": "皆伝(KAIDEN)",
    "CHUUDEN": "中伝(CHUUDEN)",
    "DAN_10": "十段(10th)",
    "DAN_9": "九段(9th)",
    "DAN_8": "八段(8th)",
    "DAN_7": "七段(7th)",
    "DAN_6": "六段(6th)",
    "DAN_5": "五段(5th)",
    "DAN_4": "四段(4th)",
    "DAN_3": "三段(3rd)",
    "DAN_2": "二段(2nd)",
    "DAN_1": "初段(1st)",
    "KYU_1": "一級(1st)",
    "KYU_2": "二級(2nd)",
    "KYU_3": "三級(3rd)",
    "KYU_4": "四級(4th)",
    "KYU_5": "五級(5th)",
    "KYU_6": "六級(6th)",
    "KYU_7": "七級(7th)",
    null:  "ノ段",
    undefined: "ノ段"
}

const grades = [
    {percentage: 8/9, prefix: "AAA"},
    {percentage: 7/9, prefix: "AA"},
    {percentage: 6/9, prefix: "A"},
    {percentage: 5/9, prefix: "B"},
    {percentage: 4/9, prefix: "C"},
    {percentage: 3/9, prefix: "D"},
    {percentage: 2/9, prefix: "E"},
    {percentage: 0, prefix: "F"}
]

async function songInfo(songData, emb, game) {
    const playtype = game.slice(-2);
    emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title} (${playtype.toUpperCase()})`);
    emb.addFields(
        { name: "Genre", value: songData.body.song.data.genre },
        { name: "Version", value: versions[songData.body.song.data.displayVersion] }
    )
    setCover(songData.body.song, songData.body.charts[0], emb);
    
    // init textage db
    const url = "https://textage.cc/score/titletbl.js";
    const response = await fetch(url);
    const tablejs = await response.arrayBuffer();
    const jsDecr = iconv.decode(Buffer.from(tablejs), "Shift_JIS");
    const textageTable = parseJs(jsDecr);

    const charts = songData.body.charts.filter((c) => c.data["2dxtraSet"] === null).sort((a, b) => b.levelNum - a.levelNum);
    for(const chart of charts) {
        const textageUrl = getTextageUrl(chart, songData.body.song.title, textageTable, playtype);
        emb.addFields(
            { name: `${chart.difficulty} ${chart.level}`, value:
                `${formatTierlistLine(chart)} ${textageUrl ? `\n[Textage](${textageUrl})` : ""}
                Max EX : ${chart.data.notecount * 2}`
            }
        )
    }
}

async function populateProfile(prfl, profile) {
    prfl.addFields(
        { name: "KTLamp Rating", value: `${profile.body.gameStats.ratings.ktLampRating.toFixed(2)} / ${profile.body.gameStats.ratings.ktLampRatingHC.toFixed(2)} (HC) / ${profile.body.gameStats.ratings.ktLampRatingEXHC.toFixed(2)} (EXHC)` },
        { name: "BPI", value: `${profile.body.gameStats.ratings.BPI == null ? "-" : profile.body.gameStats.ratings.BPI.toFixed(2)}` },
        { name: "Dan", value: `${classes[profile.body.gameStats.classes.dan]}` },
        { name: "Playcount", value: `${profile.body.totalScores}` },
        { name: "Joue depuis", value: `${profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu"}` },
        { name: "Rang sur Tachi", value: `#${profile.body.rankingData.ktLampRating.ranking}/${profile.body.rankingData.ktLampRating.outOf}`}
    )
}

async function leaderboardFeeder(response, lines, player) {
    lines.push({
        ktLamp: response.body.gameStats.ratings.ktLampRating.toFixed(2),
        bpi: response.body.gameStats.ratings.BPI,
        player: player.username,
        dan: classes[response.body.gameStats.classes.dan]
    })
}

async function leaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.ktLamp+"").padStart(6)} | ${(line.bpi ? line.bpi.toFixed(2) : "NO ").padStart(6)}BPI ${line.dan.padStart(11)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function lineSorter(lines) {
    lines.sort((a, b) => b.ktLamp - a.ktLamp);
}

async function formatPlayInfo(play, emb) {
    internalChart = metaresolver.resolveChartlist(play.game).find((chart) => chart.id === play.chartID);
    internalSong = metaresolver.resolveSonglist(play.game).find((song) => song.id === play.songID);
    setCover(internalSong, internalChart, emb);
    let bp = play.scoreData.optional.bp ? play.scoreData.optional.bp + "BP" : null
    let cb = play.scoreData.optional.comboBreak ? play.scoreData.optional.comboBreak + "CB" : null
    return `**${internalSong.artist} - ${internalSong.title} [${internalChart.difficulty} ${internalChart.levelNum}] ${formatTierlistLine(internalChart)}**
    ${play.scoreData.grade} / ${play.scoreData.lamp} / ${play.scoreData.score}
    ${bp ? cb ? bp + " / " + cb : bp : ""}
    ${getGradeDiffs(internalChart, play)}`
}

async function chartLeaderboardFeeder(response, lines, player) {
    lines.push({
        score: response.body.pb.scoreData.score,
        grade: response.body.pb.scoreData.grade,
        clear: lamps[response.body.pb.scoreData.lamp],
        player: player.username
    });
}

async function chartLeaderboardFormat(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(4)} ${line.clear.padStart(4)} ${(line.score+"").padStart(4)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}

async function setCover(songData, chartData, emb) {
    emb.setImage(`${iidx_cdn}/${(chartData.data.inGameID + "").padStart(5, "0")}.gif`);
}

async function resolveTierList(chart) {
    if(chart.data.ncTier || chart.data.hcTier || chart.data.exhcTier) {
        return `${formatDiffTierList(chart.data.ncTier)} / ${formatDiffTierList(chart.data.hcTier)} / ${formatDiffTierList(chart.data.exhcTier)}`
    } else {
        return "";
    }
}

const difficulty_textage = {
    "LEGGENDARIA": "X",
    "ANOTHER": "A",
    "HYPER": "H",
    "NORMAL": "N"
}

const side = {
    "sp": "1",
    "dp": "D"
}

const edgeCases = [ // Needed because some songs just have different names that don't work with levenshtein
    {'query': 'サナ・モレッテ・ネ・エンテ', 'name': 'sanamol'},
    {'query': 'サナ・モレッテ・ネ・エンテ(B.L.T.STYLE)', 'name': 'sana_blt'},
    {'query': 'THE BIG VOYAGER', 'name': 'tvoyager'},
    {'query': 'ＵＬＴｉＭΛＴＥ', 'name': 'ultimate'},
    {'query': 'Back Into The Light (recut)', 'name': 'backindd'},
    {'query': 'The Hope of Tomorrow (recut)', 'name': 'thehoped'},
    {'query': 'CROSSROAD ～Left Story～', 'name': 'crosroad'},
    {'query': 'City Never Sleeps (IIDX Edition)', 'name': 'citynvrs'},
]

function getTextageUrl(chart, title, table, playtype) {
    const textageMatch = findSong(title, table);
    if(textageMatch) {
        return `https://textage.cc/score/${textageMatch.ver}/${textageMatch.name}.html?${side[playtype]}${difficulty_textage[chart.difficulty]}${chart.levelNum.toString(16)}00`;
    }
    return null;
}

// Author : Sayaka
// Parses the js using acorn without executing it, with proper json mapping and html entities cleanup
function parseJs(text) {
    const ast = acorn.parse(text, {ecmaVersion: 'latest'});
    const objname = ast.body[ast.body.length - 1].expression.left.name;
    if (objname === 'titletbl') {
        const res = ast.body[ast.body.length - 1].expression.right.properties.map(x => (
            {
                "name": x.key.value,
                "ver": x.value.elements[0].value,
                "id": x.value.elements[1].value,
                "opt": x.value.elements[2].value,
                "genre": x.value.elements[3].value,
                "artist": x.value.elements[4].value,
                "title": x.value.elements[5].type === 'CallExpression' ? entities.decode(x.value.elements[5].callee.object.value).replace( /(<([^>]+)>)/ig, '') : entities.decode(x.value.elements[5].value).replace( /(<([^>]+)>)/ig, ''),
                "subtitle": x.value.elements.length === 7 ? x.value.elements[6].type === 'CallExpression' ? entities.decode(x.value.elements[6].callee.object.value).replace( /(<([^>]+)>)/ig, '') : entities.decode(x.value.elements[6].value).replace( /(<([^>]+)>)/ig, '') : ""
            }
        ));
        return res;
    }
    return null;
};

function findSong(title, songs) {
    let r = songs.find(x => x.title + x.subtitle === title);
    if(r === undefined) r = edgeCases.find(x => x.query === title);
    if(r !== undefined) {
        // matched edge case; return the entire object by going through the table (edge case is loose)
        return songs.find(x => x.name === r.name);
    } else {
        const fallback = closest(title, songs.map(x => x.title + x.subtitle));
        const d = distance(title, fallback);
        if (d <= 4)
            r = songs.find(x => x.title + x.subtitle === fallback);
    }
    return r;
};

function getGradeDiffs(internalChart, play) {
    let maxEx = internalChart.data.notecount * 2;
    if(play.scoreData.score == maxEx) return "MAX+0";
    if(play.scoreData.score >= maxEx * (8.5/9)) return `MAX-${maxEx - play.scoreData.score}`;
    let closestGrade = {grade:"", unsignedDiff: null};
    for(let grade of grades) {
        let diff = play.scoreData.score - (maxEx * grade.percentage);
        let unsignedDiff = diff < 0 ? -diff : diff;
        if(closestGrade.unsignedDiff == null || closestGrade.unsignedDiff > unsignedDiff) {
            closestGrade = {
                grade: `${grade.prefix}${diff < 0 ? "" : "+"}${Math.round(diff)}`,
                unsignedDiff: unsignedDiff
            }
        }
    }
    return closestGrade.grade;
}

function formatTierlistLine(chart) {
    if(chart.data.ncTier || chart.data.hcTier || chart.data.exhcTier) {
        return `${formatDiffTierList(chart.data.ncTier)} / ${formatDiffTierList(chart.data.hcTier)} / ${formatDiffTierList(chart.data.exhcTier)}`
    } else {
        return "";
    }
}

function formatDiffTierList(tier) {
    if(tier) {
        return `${tier.text}${tier.individualDifference ? " ⚖️" : ""}`
    } else return "-";
}

module.exports = {
    songInfo, populateProfile, leaderboardFeeder, leaderboardFormat, lineSorter, formatPlayInfo, chartLeaderboardFeeder, chartLeaderboardFormat, setCover, resolveTierList
}