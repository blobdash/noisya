const { XMLParser } = require('fast-xml-parser')
const fs = require("fs");
const iconv = require("iconv-lite");
const { sdvx } = require('../constants/Versions');
const { sdvx_cdn } = require('../config.json');
const { sdvx_lamps } = require('../constants/Lamps');
const sdvxcharts = require('../data/charts-sdvx.json');
const sdvxsongs = require('../data/songs-sdvx.json');
const resolver = require("./resolver");

module.exports = {
    parseDan(dan) {
        if(dan === undefined) return 'n/a';
        if(dan.startsWith('DAN_')) {
            return dan.replaceAll('DAN_', 'SL');
        } else if(dan === 'INF') {
            return 'SL ∞';
        } else {
            return ' -- ';
        }
    },
    populateSdvxProfile(prfl, profile) {
        prfl.addFields(
            { name: "VF6", value: profile.body.gameStats.ratings.VF6.toFixed(3) },
            { name: "Dan", value: module.exports.parseDan(profile.body.gameStats.classes.dan) },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: profile.body.firstScore ? new Date(profile.body.firstScore.timeAchieved).toLocaleString() : "Inconnu" },
            { name: "Rang sur Tachi", value: `#${profile.body.rankingData.VF6.ranking}/${profile.body.rankingData.VF6.outOf}`}
        )
    },
    setSdvxSongCover(songId, emb) {
        emb.setImage(`${sdvx_cdn}/api/games/sdvx/musics/${songId}/EXHAUST.png?fallback=game`);
    },
    async formatSdvxSongInfo(songData, emb) {
        // Read music_db.xml. Since it's encoded in Shift JIS, some iconv wizardry is needed.
        const musicDb = fs.readFileSync('./data/music_db.xml');
        const musicDbDecr = iconv.decode(Buffer.from(musicDb), "Shift_JIS");
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "_", });
        const mDb = parser.parse(musicDbDecr);
        const mdbEntry = mDb.mdb.music.find((mdbSongEntry) => mdbSongEntry._id == songData.body.song.id)
        const internalChart = sdvxcharts.find((item) => item.songID === songData.body.song.id);
        
        // try to fetch kana from mDb
        let kanji;
        if(mdbEntry === undefined) {
            // Chart is not present in your current music_db. Song was probably removed from the game, or is a konaste exclusive.
            kana = "-";
        } else {
            kana = mdbEntry.info.title_yomigana.charAt(0);
        }

        emb.setImage(`${sdvx_cdn}/api/games/sdvx/musics/${internalChart.data.inGameID}/EXHAUST.png?fallback=game`);
        emb.setTitle(`${songData.body.song.artist} - ${songData.body.song.title}`);
        emb.addFields(
            { name: "Kana", value: kana},
            { name: "Version", value: sdvx[songData.body.song.data.displayVersion] }
        )
        const charts = songData.body.charts.sort((a,b) => a.levelNum - b.levelNum);
        let buffer = "";
        for(const chart of charts) {
            buffer = `${buffer.length != 0 ? `${buffer} /`: ""} ${await formatDiffText(chart, songData.body.song.title)}${module.exports.formatDiffTierList(chart)}`
        }
        emb.addFields(
            { name: "Difficultés", value: buffer }
        )
    },
    feedSdvxLbLines(response, lines, player) {
        lines.push({
            vf: response.body.gameStats.ratings.VF6.toFixed(3),
            player: player.username,
            dan: module.exports.parseDan(response.body.gameStats.classes.dan)
        })
    },
    sortSdvxLbLines(lines) {
        lines.sort((a, b) => b.vf - a.vf);
    },
    formatSdvxLbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${(line.vf+"").padStart(6)}VF ${line.dan.padStart(4)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    feedSdvxClbLines(response, lines, player) {
        lines.push({
            score: response.body.pb.scoreData.score,
            grade: response.body.pb.scoreData.grade,
            clear: sdvx_lamps[response.body.pb.scoreData.lamp],
            player: player.username,
            ranking: `#${response.body.pb.rankingData.rank}/${response.body.pb.rankingData.outOf}`
        })
    },
    formatSdvxClbLines(lines, standing) {
        buffer = "";
        for(const line of lines) {
            standing++;
            buffer += `\`#${(standing+"").padEnd(2)} ${line.grade.padStart(4)} ${line.clear.padStart(3)} ${(line.score+"").padStart(8)} | ${line.player}\`\n`
        }
        if(buffer.length === 0) return "Aucun joueur dans cette page!";
        return buffer;
    },
    formatDiffTierList(chart) {
        if(chart.data.clearTier) {
            return ` (${chart.data.clearTier.text}${chart.data.clearTier.individualDifference ? " ⚖️" : ""})`
        } else return "\u200B";
    },
    formatSdvxPlayInfo(play, emb) {
        internalChart = sdvxcharts.find((chart) => chart.chartID === play.chartID);
        internalSong = sdvxsongs.find((song) => song.id === play.songID);
        module.exports.setSdvxSongCover(internalChart.data.inGameID, emb);
        return `**${internalSong.title} - ${internalSong.artist} [${internalChart.difficulty} ${internalChart.levelNum}]${module.exports.formatDiffTierList(internalChart)}**
        ${play.scoreData.grade} / ${play.scoreData.lamp} / ${play.scoreData.score}
        *VF : ${play.calculatedData.VF6}*`
    }
}

async function formatDiffText(chart, title) {
    const cvLink = await fetchSdvxInLink(chart, title);
    if(cvLink) {
        return `[${chart.difficulty} ${chart.level}](${cvLink})`;
    }
    return `${chart.difficulty} ${chart.level}`;
}

async function fetchSdvxInLink(chart, title) {
    const response = await fetch(`https://sdvx.in/sort/sort_${chart.levelNum}.htm`);
    const parsedPage = await response.text();
    const lines = parsedPage.split("\n");
    const match = lines.find((line) => line.includes(title));
    if(match) {
        code = match.slice(20, 25);
        return `https://sdvx.in/${getVersionCode(chart, code)}/${code}${chart.difficulty.toLowerCase().charAt(0)}.htm`
    }
    return null;
}

function getVersionCode(chart, code) {
    switch (chart.difficulty) {
        case "MXM":
        case "EXH":
        case "ADV":
        case "NOV":
            return code.slice(0, 2);
        case "INF":
            return "02";
        case "GRV":
            return "03";
        case "HVN":
            return "04";
        case "VVD":
            return "05";
        case "XCD":
            return "06";
    }
}