const { maimai_classes, maimai_color } = require("../constants/Classes");
const { songs } = require("../data/maimai-zetaraku.json");
const { zetaraku_cdn } = require('../config.json');
const { maimai_lamps } = require("../constants/Lamps");

module.exports = {
    parseClass(clazz) {
        return maimai_classes[clazz];
    },
    parseColor(color) {
        return maimai_color[color];
    },
    populateMaimaiProfile(prfl, profile) {
        prfl.addFields(
            { name: "Naive Rating", value: profile.body.gameStats.ratings.naiveRate.toFixed(2) },
            { name: "Dan", value: module.exports.parseClass(profile.body.gameStats.classes.dan) },
            { name: "Couleur", value: module.exports.parseColor(profile.body.gameStats.classes.colour) },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
            { name: "Rang sur Tachi", value: `#${profile.body.rankingData.naiveRate.ranking}/${profile.body.rankingData.naiveRate.outOf}`}
        )
    },
    setMaimaiSongCover(title, emb) {
        // Find the song in the zetaraku chart data.
        zetarakuMatch = songs.find((song) => song.title === title);
        if(zetarakuMatch === undefined) {
            // Song was not found. No cover will be displayed.
        } else {
            emb.setImage(`${zetaraku_cdn}/maimai/img/cover/${zetarakuMatch.imageName}`)
        }
    },
    formatMaimaiSongInfo(songData, emb) {// Find the song in the zetaraku chart data.
        zetarakuMatch = songs.find((song) => song.title === songData.body.song.title);
        if(zetarakuMatch === undefined) {
            // Song was not found. No cover will be displayed.
        } else {
            emb.setImage(`${zetaraku_cdn}/maimai/img/cover/${zetarakuMatch.imageName}`)
        }
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
        emb.addFields(
            { name: "Version", value: songData.body.song.data.displayVersion }
        )
        const charts = songData.body.charts.sort((a, b) => b.levelNum - a.levelNum);
        let buffer = "";
        for(const chart of charts) {
            buffer = `${buffer.length != 0 ? `${buffer}\n`: ""} ${chart.difficulty} ${chart.level} (${chart.levelNum})`
        }
        emb.addFields(
            { name: "Difficultés", value: buffer }
        )
    },
    feedMaimaiLbLines(response, lines, player) {
        lines.push({
            naiverating: response.body.gameStats.ratings.naiveRate.toFixed(2),
            player: player.username,
            dan: module.exports.parseClass(response.body.gameStats.classes.dan),
            colour: module.exports.parseColor(response.body.gameStats.classes.colour)
        })
    },
    sortMaimaiLbLines(lines) {
        lines.sort((a, b) => b.naiverating - a.naiverating);
    },
    formatMaimaiLbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${(line.naiverating+"").padStart(6)} | ${line.dan.padStart(12)} | ${line.colour.padStart(7)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    feedMaimaiClbLines(response, lines, player) {
        lines.push({
            score: response.body.pb.scoreData.percent,
            grade: response.body.pb.scoreData.grade,
            clear: maimai_lamps[response.body.pb.scoreData.lamp],
            player: player.username,
            ranking: `#${response.body.pb.rankingData.rank}/${response.body.pb.rankingData.outOf}`
        })
    },
    formatMaimaiClbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(3)} ${line.clear.padStart(3)} ${(line.score+"").padStart(6)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    }
}