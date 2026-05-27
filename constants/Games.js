const { lb_pagesize, lb_pagesize_small } = require('../config.json');
const sdvx = require('../games/sdvx')
const iidx = require('../games/iidx')
const popn = require('../games/popn')
const chunithm = require('../games/chunithm')
const jubeat = require('../games/jubeat')
const maimai = require('../games/maimai')

const games = [
    {
        name:"SOUND VOLTEX",
        value:"sdvx",
        icon: "https://i.imgur.com/k9tLrjP.png",
        lbsize: lb_pagesize_small,
        func: sdvx
    },
    {
        name:"beatmania IIDX (SP)",
        value:"iidx-sp",
        icon: "https://i.imgur.com/edxL1Nr.png",
        lbsize: lb_pagesize_small,
        func: iidx
    },
    {
        name:"beatmania IIDX (DP)",
        value:"iidx-dp",
        icon: "https://i.imgur.com/edxL1Nr.png",
        lbsize: lb_pagesize_small,
        func: iidx
    },
    {
        name:"pop'n music",
        value:"popn",
        icon: "https://i.imgur.com/CnOx3On.png",
        lbsize: lb_pagesize_small,
        func: popn
    },
    {
        name:"CHUNITHM",
        value:"chunithm",
        icon: "https://i.imgur.com/8WMqrGW.png",
        lbsize: lb_pagesize,
        func: chunithm
    },
    {
        name:"jubeat",
        value:"jubeat",
        icon: "https://i.imgur.com/2wnHZUA.png",
        lbsize: lb_pagesize_small,
        func: jubeat
    },
    {
        name:"maimai FiNALE",
        value:"maimai",
        icon: "https://i.imgur.com/VWP4Kbk.png",
        lbsize: lb_pagesize_small,
        func: maimai
    }
]

function getGame(game) {
    return games.find((item) => item.value === game);
}

module.exports = {
    games,
    gamemeta: games.map((game) => ({name: game.name, value: game.value})), // used to not send whole object when declaring command metadata
    getGame
};