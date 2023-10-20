const { tachi_cdn } = require("../config.json");
const { popn_lamps } = require("../constants/Lamps");
const popnsongs = require('../data/songs-popn.json');
const popncharts = require('../data/charts-popn.json');
const resolver = require("./resolver");

module.exports = {
    populatePopnProfile(prfl, profile) {
        prfl.addFields(
            { name: "Naive Class", value: profile.body.gameStats.ratings.naiveClassPoints.toFixed(2) },
            { name: "Rang", value: profile.body.gameStats.classes.class },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" }
        )
    },
    setPopnSongCover(inGameID, emb) {
        emb.setImage(`${tachi_cdn}/misc/popn/banners/${inGameID}.png`);
    },
    formatPopnSongInfo(songData, emb) {
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
        emb.addFields(
            { name: "Genre", value: `${songData.body.song.data.genre} (${songData.body.song.data.genreEN})` },
        )
        emb.setImage(`${tachi_cdn}/misc/popn/banners/${songData.body.charts[0].data.inGameID}.png`);
        const charts = songData.body.charts.sort((a,b) => a.levelNum - b.levelNum);
        let buffer = "";
        for(const chart of charts) {
            buffer = `${buffer.length != 0 ? `${buffer} /`: ""} ${chart.difficulty} ${chart.level}`
        }
        emb.addFields(
            { name: "Difficultés", value: buffer }
        )
    },
    feedPopnLbLines(response, lines, player) {
        lines.push({
            classpoints: response.body.gameStats.ratings.naiveClassPoints.toFixed(2),
            player: player.username,
            class: response.body.gameStats.classes.class ? response.body.gameStats.classes.class : "NO CLASS"
        })
    },
    sortPopnLbLines(lines) {
        lines.sort((a, b) => b.classpoints - a.classpoints);
    },
    formatPopnLbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${(line.classpoints+"").padStart(6)} | ${line.class.padStart(10)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    feedPopnClbLines(response, lines, player) {
        lines.push({
            score: response.body.pb.scoreData.score,
            grade: response.body.pb.scoreData.grade,
            clear: popn_lamps[response.body.pb.scoreData.lamp],
            player: player.username,
            ranking: `#${response.body.pb.rankingData.rank}/${response.body.pb.rankingData.outOf}`
        })
    },
    formatPopnClbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(3)} ${line.clear.padStart(3)} ${(line.score+"").padStart(6)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    formatPopnPlayInfo(play, emb) {
        internalChart = popncharts.find((chart) => chart.chartID === play.chartID);
        internalSong = popnsongs.find((song) => song.id === play.songID);
        module.exports.setPopnSongCover(internalChart.data.inGameID, emb);
        return `**${internalSong.artist} - ${internalSong.title} (${internalChart.difficulty.toUpperCase()} ${internalChart.levelNum})**
        ${play.scoreData.grade} / ${play.scoreData.lamp} / ${play.scoreData.score}`
    }
}