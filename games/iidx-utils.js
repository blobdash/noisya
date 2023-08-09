const { iidx_classes } = require("../constants/Classes");
const { iidx } = require("../constants/Versions");

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
            { name: "Joue depuis", value: new Date(profile.body.firstScore.timeAchieved).toLocaleString() }
        )
    },
    formatIidxSongInfo(songData, emb) {
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title} (${songData.body.charts[0].playtype})`);
        emb.addFields(
            { name: "Genre", value: songData.body.song.data.genre },
            { name: "Version", value: iidx[songData.body.song.data.displayVersion] }
        )
        const charts = songData.body.charts.filter((c) => c.data["2dxtraSet"] === null).sort((a, b) => b.levelNum - a.levelNum);
        for(const chart of charts) {
            emb.addFields(
                { name: `${chart.difficulty} ${chart.level}`, value:
                    `${formatTierlistLine(chart)}
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