const { jubeat_classes } = require("../constants/Classes");
const { jubeat } = require("../constants/Versions");
const { songs } = require("../data/jubeat-zetaraku.json");
const { zetaraku_cdn } = require('../config.json');
const { jubeat_lamps } = require("../constants/Lamps");

module.exports = {
    parseClass(clazz) {
        return jubeat_classes[clazz];
    },
    populateJubeatProfile(prfl, profile) {
        prfl.addFields(
            { name: "Jubility", value: `${profile.body.gameStats.ratings.jubility.toFixed(2)} (${profile.body.gameStats.ratings.naiveJubility.toFixed(2)})` },
            { name: "Couleur", value: module.exports.parseClass(profile.body.gameStats.classes.colour) },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
            { name: "Rang sur Tachi", value: `#${profile.body.rankingData.jubility.ranking}/${profile.body.rankingData.jubility.outOf}`}
        )
    },
    setJubeatSongCover(title, emb) {
        // Find the song in the zetaraku chart data.
        zetarakuMatch = songs.find((song) => song.title === title);
        if(zetarakuMatch === undefined) {
            // Song was not found. No cover will be displayed.
        } else {
            emb.setImage(`${zetaraku_cdn}/jubeat/img/cover/${zetarakuMatch.imageName}`)
        }
    },
    formatJubeatSongInfo(songData, emb) {
        // Find the song in the zetaraku chart data.
        zetarakuMatch = songs.find((song) => song.title === songData.body.song.title);
        if(zetarakuMatch === undefined) {
            // Song was not found. No cover will be displayed.
        } else {
            emb.setImage(`${zetaraku_cdn}/jubeat/img/cover/${zetarakuMatch.imageName}`)
        }
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
        emb.addFields(
            { name: "Version", value: jubeat[songData.body.song.data.displayVersion] }
        )
        const charts = songData.body.charts.filter((chart) => !chart.difficulty.startsWith("HARD")).sort((a, b) => b.levelNum - a.levelNum);
        let buffer = "";
        for(const chart of charts) {
            buffer = `${buffer.length != 0 ? `${buffer} /`: ""} ${chart.difficulty} ${chart.levelNum}`
        }
        emb.addFields(
            { name: "Difficultés", value: buffer }
        )
    },
    feedJubeatLbLines(response, lines, player) {
        lines.push({
            jubility: response.body.gameStats.ratings.jubility.toFixed(2),
            naiveJubilityDiff: (response.body.gameStats.ratings.jubility - response.body.gameStats.ratings.naiveJubility).toFixed(2),
            player: player.username,
            colour: module.exports.parseClass(response.body.gameStats.classes.colour)
        })
    },
    sortJubeatLbLines(lines) {
        lines.sort((a, b) => b.jubility - a.jubility);
    },
    formatJubeatLbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${(line.jubility+"").padStart(7)} ${`(${line.naiveJubilityDiff})`.padStart("9")} | ${line.colour.padStart(7)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    feedJubeatClbLines(response, lines, player) {
        lines.push({
            score: response.body.pb.scoreData.score,
            grade: response.body.pb.scoreData.grade,
            clear: jubeat_lamps[response.body.pb.scoreData.lamp],
            player: player.username,
            ranking: `#${response.body.pb.rankingData.rank}/${response.body.pb.rankingData.outOf}`,
            musicRate: response.body.pb.scoreData.musicRate
        })
    },
    formatJubeatClbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(4)} ${line.clear.padStart(3)} ${(line.score+"").padStart(8)} | ${(line.musicRate+"").padStart(5)}% | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    }
}