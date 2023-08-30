const { feedChuniLbLines, sortChuniLbLines, formatChuniSongInfo, formatChuniLbLines } = require("./chuni-utils");
const { feedIidxLbLines, sortIidxLbLines, formatIidxSongInfo, formatIidxLbLines } = require("./iidx-utils");
const { feedJubeatLbLines, sortJubeatLbLines, formatJubeatSongInfo, formatJubeatLbLines } = require("./jubeat-utils");
const { formatMaimaiSongInfo, feedMaimaiLbLines, sortMaimaiLbLines, formatMaimaiLbLines } = require("./maimai-utils");
const { feedPopnLbLines, sortPopnLbLines, formatPopnSongInfo, formatPopnLbLines } = require("./popn-utils");
const { feedSdvxLbLines, sortSdvxLbLines, formatSdvxSongInfo, formatSdvxLbLines } = require("./sdvx-utils");

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
    }
}