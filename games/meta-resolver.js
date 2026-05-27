const sdvxsongs = require('../data/songs-sdvx.json');
const iidxsongs = require('../data/songs-iidx.json');
const popnsongs = require('../data/songs-popn.json');
const chunisongs = require('../data/songs-chunithm.json');
const jubeatsongs = require('../data/songs-jubeat.json');
const maimaisongs = require('../data/songs-maimai.json');

const sdvxcharts = require('../data/charts-sdvx.json');
const iidxchartssp = require('../data/charts-iidx-sp.json');
const iidxchartsdp = require('../data/charts-iidx-dp.json');
const popncharts = require('../data/charts-popn.json');
const chunicharts = require('../data/charts-chunithm.json');
const jubeatcharts = require('../data/charts-jubeat.json');
const maimaicharts = require('../data/charts-maimai.json');

function resolveSonglist(game) {
    switch (game) {
        case "sdvx":
            return sdvxsongs;
        case "iidx-sp":
        case "iidx-dp":
            return iidxsongs;
        case "popn":
            return popnsongs;
        case "chunithm":
            return chunisongs;
        case "jubeat":
            return jubeatsongs;
        case "maimai":
            return maimaisongs;
    }
}

function resolveChartlist(game) {
    switch (game) {
        case "sdvx":
            return sdvxcharts;
        case "iidx-sp":
            return iidxchartssp;
        case "iidx-dp":
            return iidxchartsdp;
        case "popn":
            return popncharts;
        case "chunithm":
            return chunicharts;
        case "jubeat":
            return jubeatcharts;
        case "maimai":
            return maimaicharts;
    }
}

module.exports = {
    resolveSonglist,
    resolveChartlist
}