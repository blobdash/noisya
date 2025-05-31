const acorn = require("acorn");
const entities = require("html-entities");
const {distance, closest} = require('fastest-levenshtein');
const iconv = require("iconv-lite");
const { iidx_classes } = require("../constants/Classes");
const { iidx } = require("../constants/Versions");
const { iidx_lamps } = require("../constants/Lamps");
const iidxsongs = require('../data/songs-iidx.json');
const iidxcharts = require('../data/charts-iidx.json');
const resolver = require("./resolver");
const { iidx_cdn } = require('../config.json');

const difficulty_textage = {
    "LEGGENDARIA": "X",
    "ANOTHER": "A",
    "HYPER": "H",
    "NORMAL": "N"
}

const side = {
    "SP": "1",
    "DP": "D"
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

module.exports = {
    parseDan(dan) {
        return iidx_classes[dan];
    },
    populateIidxProfile(prfl, profile) {
        prfl.addFields(
            { name: "KTLamp Rating", value: profile.body.gameStats.ratings.ktLampRating.toFixed(2) },
            { name: "BPI", value: profile.body.gameStats.ratings.BPI == null ? "-" : profile.body.gameStats.ratings.BPI.toFixed(2) },
            { name: "Dan", value: module.exports.parseDan(profile.body.gameStats.classes.dan) },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
            { name: "Rang sur Tachi", value: `#${profile.body.rankingData.ktLampRating.ranking}/${profile.body.rankingData.ktLampRating.outOf}`}
        )
    },
    async formatIidxSongInfo(songData, emb, playtype) {
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title} (${songData.body.charts[0].playtype})`);
        emb.addFields(
            { name: "Genre", value: songData.body.song.data.genre },
            { name: "Version", value: iidx[songData.body.song.data.displayVersion] }
        )
        emb.setImage(`${iidx_cdn}/${(songData.body.charts[0].data.inGameID + "").padStart(5, "0")}.gif`);
        
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
                    `${module.exports.formatTierlistLine(chart)} ${textageUrl ? `\n[Textage](${textageUrl})` : ""}
                    Max EX : ${chart.data.notecount * 2}`
                }
            )
        }
    },
    feedIidxLbLines(response, lines, player) {
        lines.push({
            ktLamp: response.body.gameStats.ratings.ktLampRating.toFixed(2),
            bpi: response.body.gameStats.ratings.BPI,
            player: player.username,
            dan: module.exports.parseDan(response.body.gameStats.classes.dan)
        })
    },
    sortIidxLbLines(lines) {
        lines.sort((a, b) => b.ktLamp - a.ktLamp);
    },
    formatIidxLbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${(line.ktLamp+"").padStart(6)} | ${(line.bpi ? line.bpi.toFixed(2) : "NO ").padStart(6)}BPI ${line.dan.padStart(11)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    feedIidxClbLines(response, lines, player) {
        lines.push({
            score: response.body.pb.scoreData.score,
            grade: response.body.pb.scoreData.grade,
            clear: iidx_lamps[response.body.pb.scoreData.lamp],
            player: player.username,
            ranking: `#${response.body.pb.rankingData.rank}/${response.body.pb.rankingData.outOf}`
        })
    },
    formatIidxClbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(4)} ${line.clear.padStart(4)} ${(line.score+"").padStart(4)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    formatTierlistLine(chart) {
        if(chart.data.ncTier || chart.data.hcTier || chart.data.exhcTier) {
            return `${formatDiffTierList(chart.data.ncTier)} / ${formatDiffTierList(chart.data.hcTier)} / ${formatDiffTierList(chart.data.exhcTier)}`
        } else {
            return "";
        }
    },
    formatIidxPlayInfo(play, emb) {
        internalChart = iidxcharts.find((chart) => chart.chartID === play.chartID);
        internalSong = iidxsongs.find((song) => song.id === play.songID);
        module.exports.setIidxSongCover(internalChart.data.inGameID, emb);
        let bp = play.scoreData.optional.bp ? play.scoreData.optional.bp + "BP" : null
        let cb = play.scoreData.optional.comboBreak ? play.scoreData.optional.comboBreak + "CB" : null
        return `**${internalSong.artist} - ${internalSong.title} [${internalChart.difficulty} ${internalChart.levelNum}] ${module.exports.formatTierlistLine(internalChart)}**
        ${play.scoreData.grade} / ${play.scoreData.lamp} / ${play.scoreData.score}
        ${bp ? cb ? bp + " / " + cb : bp : ""}
        ${getGradeDiffs(internalChart, play)}`
    },
    setIidxSongCover(inGameID, emb) {
        emb.setImage(`${iidx_cdn}/${(inGameID + "").padStart(5, "0")}.gif`);
    },
}

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

function formatDiffTierList(tier) {
    if(tier) {
        return `${tier.text}${tier.individualDifference ? " ⚖️" : ""}`
    } else return "-";
}

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