const { chuni_classes, chuni_classes_padded } = require("../constants/Classes");
const { chuni } = require("../constants/Versions");
const { songs } = require("../data/chuni-zetaraku.json");
const { zetaraku_cdn } = require('../config.json');
const { chuni_lamps } = require("../constants/Lamps");
const chunisongs = require('../data/songs-chunithm.json');
const chunicharts = require('../data/charts-chunithm.json');
const resolver = require("./resolver");

module.exports = {
    parseClass(clazz) {
        return chuni_classes[clazz];
    },
    populateChuniProfile(prfl, profile) {
        prfl.addFields(
            { name: "Naive Rating", value: profile.body.gameStats.ratings.naiveRating.toFixed(2) },
            { name: "Couleur", value: `${module.exports.parseClass(profile.body.gameStats.classes.colour)}` },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
            { name: "Rang sur Tachi", value: `#${profile.body.rankingData.naiveRating.ranking}/${profile.body.rankingData.naiveRating.outOf}`}
        )
    },
    setChuniSongCover(title, emb) {
        if(title === 'Synthesis.') {
            emb.setImage(`https://i.imgur.com/rNYBg1M.png`);
            return;
        }
        // Find the song in the zetaraku chart data.
        zetarakuMatch = songs.find((song) => song.title === title);
        if(zetarakuMatch === undefined) {
            // Song was not found. No cover will be displayed.
        } else {
            emb.setImage(`${zetaraku_cdn}/chunithm/img/cover/${zetarakuMatch.imageName}`)
        }
    },
    formatChuniSongInfo(songData, emb) {
        module.exports.setChuniSongCover(songData.body.song.title, emb);
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
        emb.addFields(
            { name: "Catégorie", value: songData.body.song.data.genre },
            { name: "Version", value: chuni[songData.body.song.data.displayVersion] }
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
    feedChuniLbLines(response, lines, player) {
        lines.push({
            naiverating: response.body.gameStats.ratings.naiveRating.toFixed(2),
            player: player.username,
            colour: `${module.exports.parseClass(response.body.gameStats.classes.colour)}`
        })
    },
    sortChuniLbLines(lines) {
        lines.sort((a, b) => b.naiverating - a.naiverating);
    },
    formatChuniLbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${(line.naiverating+"").padStart(6)} | ${line.colour.padEnd(4)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    feedChuniClbLines(response, lines, player) {
        lines.push({
            score: response.body.pb.scoreData.score,
            grade: response.body.pb.scoreData.grade,
            clear: chuni_lamps[response.body.pb.scoreData.lamp],
            player: player.username,
            ranking: `#${response.body.pb.rankingData.rank}/${response.body.pb.rankingData.outOf}`
        })
    },
    formatChuniClbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(3)} ${line.clear.padStart(3)} ${(line.score+"").padStart(6)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    formatChuniPlayInfo(play, emb) {
        internalChart = chunicharts.find((chart) => chart.chartID === play.chartID);
        internalSong = chunisongs.find((song) => song.id === play.songID);
        module.exports.setChuniSongCover(internalSong.title, emb);
        return `**${internalSong.artist} - ${internalSong.title} ${internalChart.difficulty} ${internalChart.levelNum}**
        ${play.scoreData.grade} / ${play.scoreData.lamp} / ${play.scoreData.score}`
    }
}