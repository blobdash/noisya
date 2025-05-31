const { lb_pagesize, lb_pagesize_small } = require('../config.json');

module.exports = {
    gameTypes: [
        {
            name:"SOUND VOLTEX",
            value:"sdvx",
            emoji: "<:sdvxlogo:1378360858253590578>",
            playtypes: ['Single'],
            lbsize: lb_pagesize
        },
        {
            name:"beatmania IIDX",
            value:"iidx",
            emoji: "<:iidxlogo:1378351557376086076>",
            playtypes: ['SP', 'DP'],
            lbsize: lb_pagesize_small
        },
        {
            name:"pop'n music",
            value:"popn",
            emoji: "<:popkun:1378360856638918766>",
            playtypes: ['9B'],
            lbsize: lb_pagesize_small
        },
        {
            name:"CHUNITHM",
            value:"chunithm",
            emoji: "<:chunilogo:1378360860350746644>",
            playtypes: ['Single'],
            lbsize: lb_pagesize
        },
        {
            name:"jubeat",
            value:"jubeat",
            emoji: "<:jubeatlogo:1378360861806297168>",
            playtypes: ['Single'],
            lbsize: lb_pagesize_small
        },
        {
            name:"maimai FiNALE",
            value:"maimai",
            emoji: "<:maimailogo:1378361009802317834>",
            playtypes: ['Single'],
            lbsize: lb_pagesize_small
        }
    ]
};