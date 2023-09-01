const { feedChuniLbLines, sortChuniLbLines, formatChuniSongInfo, formatChuniLbLines, setChuniSongCover, feedChuniClbLines, formatChuniClbLines, formatChuniPlayInfo } = require("./chuni-utils");
const { feedIidxLbLines, sortIidxLbLines, formatIidxSongInfo, formatIidxLbLines, feedIidxClbLines, formatIidxClbLines, formatTierlistLine, formatIidxPlayInfo } = require("./iidx-utils");
const { feedJubeatLbLines, sortJubeatLbLines, formatJubeatSongInfo, formatJubeatLbLines, formatJubeatClbLines, feedJubeatClbLines, setJubeatSongCover, formatJubeatPlayInfo } = require("./jubeat-utils");
const { formatMaimaiSongInfo, feedMaimaiLbLines, sortMaimaiLbLines, formatMaimaiLbLines, setMaimaiSongCover, formatMaimaiClbLines, feedMaimaiClbLines, formatMaimaiPlayInfo } = require("./maimai-utils");
const { feedPopnLbLines, sortPopnLbLines, formatPopnSongInfo, formatPopnLbLines, setPopnSongCover, formatPopnClbLines, feedPopnClbLines, formatPopnPlayInfo } = require("./popn-utils");
const { feedSdvxLbLines, sortSdvxLbLines, formatSdvxSongInfo, formatSdvxLbLines, formatSdvxClbLines, feedSdvxClbLines, formatDiffTierList, setSdvxSongCover, formatSdvxPlayInfo } = require("./sdvx-utils");

module.exports = {
    async resolveSongInfoFormatter(game, songData, emb, playtype) {
        switch (game) {
            case "sdvx":
                await formatSdvxSongInfo(songData, emb);
                break;
            case "iidx":
                await formatIidxSongInfo(songData, emb, playtype);
                break;
            case "popn":
                formatPopnSongInfo(songData, emb);
                break;
            case "chunithm":
                formatChuniSongInfo(songData, emb);
                break;
            case "jubeat":
                formatJubeatSongInfo(songData, emb);
                break;
            case "maimai":
                formatMaimaiSongInfo(songData, emb);
                break;
        }
    }
    ,
    resolveLineFeeder(game, response, lines, player) {
        switch (game) {
            case "sdvx":
                feedSdvxLbLines(response, lines, player);
                break;
            case "iidx":
                feedIidxLbLines(response, lines, player);
                break;
            case "popn":
                feedPopnLbLines(response, lines, player);
                break;
            case "chunithm":
                feedChuniLbLines(response, lines, player);
                break;
            case "jubeat":
                feedJubeatLbLines(response, lines, player);
                break;
            case "maimai":
                feedMaimaiLbLines(response, lines, player);
                break;
        }
    },
    resolveLineSorter(game, lines) {
        switch (game) {
            case "sdvx":
                sortSdvxLbLines(lines);
                break;
            case "iidx":
                sortIidxLbLines(lines);
                break;
            case "popn":
                sortPopnLbLines(lines);
                break;
            case "chunithm":
                sortChuniLbLines(lines);
                break;
            case "jubeat":
                sortJubeatLbLines(lines);
                break;
            case "maimai":
                sortMaimaiLbLines(lines);
                break;
        }
    },
    resolveLineFormatter(game, lines, standing) {
        switch (game) {
            case "sdvx":
                return formatSdvxLbLines(lines, standing);
            case "iidx":
                return formatIidxLbLines(lines, standing);
            case "popn":
                return formatPopnLbLines(lines, standing);
            case "chunithm":
                return formatChuniLbLines(lines, standing);
            case "jubeat":
                return formatJubeatLbLines(lines, standing);
            case "maimai":
                return formatMaimaiLbLines(lines, standing);
        }
    },
    resolveClbLineFeeder(game, response, lines, player) {
        switch (game) {
            case "sdvx":
                feedSdvxClbLines(response, lines, player);
                break;
            case "iidx":
                feedIidxClbLines(response, lines, player);
                break;
            case "popn":
                feedPopnClbLines(response, lines, player);
                break;
            case "chunithm":
                feedChuniClbLines(response, lines, player);
                break;
            case "jubeat":
                feedJubeatClbLines(response, lines, player);
                break;
            case "maimai":
                feedMaimaiClbLines(response, lines, player)
                break;
        }
    },
    resolveClbLineFormatter(game, lines, standing) {
        switch (game) {
            case "sdvx":
                return formatSdvxClbLines(lines, standing)
            case "iidx":
                return formatIidxClbLines(lines, standing);
            case "popn":
                return formatPopnClbLines(lines, standing);
            case "chunithm":
                return formatChuniClbLines(lines, standing);
            case "jubeat":
                return formatJubeatClbLines(lines, standing);
            case "maimai":
                return formatMaimaiClbLines(lines, standing);
        }
    },
    resolveTierList(game, chart) {
        switch (game) {
            case "sdvx":
                return formatDiffTierList(chart);
            case "iidx":
                return formatTierlistLine(chart);
            default:
                return ""
        }
    },
    setSongCover(game, songData, chartData, emb) {
        switch(game) {
            case "sdvx":
                setSdvxSongCover(chartData.data.inGameID, emb);
                break;
            case "jubeat":
                setJubeatSongCover(songData.title, emb);
                break;
            case "maimai":
                setMaimaiSongCover(songData.title, emb);
                break;
            case "popn":
                setPopnSongCover(chartData.data.inGameID, emb);
                break;
            case "chunithm":
                setChuniSongCover(songData.title, emb);
                break;
            default:
                break;            
        }
    },
    formatPlayInfo(play, emb) {
        switch(play.game) {
            case "sdvx":
                return formatSdvxPlayInfo(play, emb);
            case "iidx":
                return formatIidxPlayInfo(play);
            case "popn":
                return formatPopnPlayInfo(play, emb);
            case "jubeat":
                return formatJubeatPlayInfo(play, emb);
            case "maimai":
                return formatMaimaiPlayInfo(play, emb);
            case "chunithm":
                return formatChuniPlayInfo(play, emb);
        }
    }
}