const vm = require('vm');
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
        context = { titletbl: [] };
        vm.createContext(context);
        vm.runInContext(jsDecr, context);

        const charts = songData.body.charts.filter((c) => c.data["2dxtraSet"] === null).sort((a, b) => b.levelNum - a.levelNum);
        for(const chart of charts) {
            const textageUrl = getTextageUrl(chart, songData.body.song.title, context.titletbl, playtype);
            emb.addFields(
                { name: `${chart.difficulty} ${chart.level}`, value:
                    `${formatTierlistLine(chart)} ${textageUrl ? `\n[Textage](${textageUrl})` : ""}
                    Max EX : ${chart.data.notecount * 2}`
                }
            )
        }
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
    const textageKey = findSongInTable(title, table);
    if(textageKey) {
        return `https://textage.cc/score/${table[textageKey][0]}/${textageKey}.html?${side[playtype]}${difficulty_textage[chart.difficulty]}${chart.levelNum.toString(16)}00`;
    }
    return null;
}

function findSongInTable(song, table) {
    for(const [key, value] of Object.entries(table)) {
        if(value[5].includes(song)) return key;
    }
    return null;
}