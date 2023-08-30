const { lb_pagesize, lb_pagesize_small } = require('../config.json');

module.exports = {
    gameTypes: [
        {
            name:"SOUND VOLTEX",
            value:"sdvx",
            playtypes: ['Single'],
            lbsize: lb_pagesize
        },
        {
            name:"beatmania IIDX",
            value:"iidx",
            playtypes: ['SP', 'DP'],
            lbsize: lb_pagesize_small
        },
        {
            name:"pop'n music",
            value:"popn",
            playtypes: ['9B'],
            lbsize: lb_pagesize_small
        },
        {
            name:"CHUNITHM",
            value:"chunithm",
            playtypes: ['Single'],
            lbsize: lb_pagesize
        },
        {
            name:"jubeat",
            value:"jubeat",
            playtypes: ['Single'],
            lbsize: lb_pagesize
        }
    ]
};