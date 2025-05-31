const { lb_pagesize, lb_pagesize_small } = require('../config.json');

module.exports = {
    gameTypes: [
        {
            name:"SOUND VOLTEX",
            value:"sdvx",
            icon: "https://i.imgur.com/k9tLrjP.png",
            playtypes: ['Single'],
            lbsize: lb_pagesize
        },
        {
            name:"beatmania IIDX",
            value:"iidx",
            icon: "https://i.imgur.com/edxL1Nr.png",
            playtypes: ['SP', 'DP'],
            lbsize: lb_pagesize_small
        },
        {
            name:"pop'n music",
            value:"popn",
            icon: "https://i.imgur.com/CnOx3On.png",
            playtypes: ['9B'],
            lbsize: lb_pagesize_small
        },
        {
            name:"CHUNITHM",
            value:"chunithm",
            icon: "https://i.imgur.com/8WMqrGW.png",
            playtypes: ['Single'],
            lbsize: lb_pagesize
        },
        {
            name:"jubeat",
            value:"jubeat",
            icon: "https://i.imgur.com/2wnHZUA.png",
            playtypes: ['Single'],
            lbsize: lb_pagesize_small
        },
        {
            name:"maimai FiNALE",
            value:"maimai",
            icon: "https://i.imgur.com/VWP4Kbk.png",
            playtypes: ['Single'],
            lbsize: lb_pagesize_small
        }
    ]
};