const acorn = require("acorn");
const entities = require("html-entities");
const {distance, closest} = require('fastest-levenshtein');
const iconv = require("iconv-lite");
const { iidx_classes } = require("../constants/Classes");
const { iidx } = require("../constants/Versions");

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
    }
}

function formatTierlistLine(chart) {
    if(chart.data.ncTier || chart.data.hcTier || chart.data.exhcTier) {
        return `${formatDiffTierList(chart.data.ncTier)} / ${formatDiffTierList(chart.data.hcTier)} / ${formatDiffTierList(chart.data.exhcTier)}`
    } else {
        return "*Pas d'info tierlist*";
    }
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