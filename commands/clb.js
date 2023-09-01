const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getUserList } = require('../utils/db');
const { gameTypes } = require('../constants/Games');
const resolver = require('../games/resolver');
const { lb_pagesize_small } = require('../config.json');

const sdvxsongs = require('../data/songs-sdvx.json');
const iidxsongs = require('../data/songs-iidx.json');
const popnsongs = require('../data/songs-popn.json');
const chunisongs = require('../data/songs-chunithm.json');
const jubeatsongs = require('../data/songs-jubeat.json');
const maimaisongs = require('../data/songs-maimai.json');

const sdvxcharts = require('../data/charts-sdvx.json');
const iidxcharts = require('../data/charts-iidx.json');
const popncharts = require('../data/charts-popn.json');
const chunicharts = require('../data/charts-chunithm.json');
const jubeatcharts = require('../data/charts-jubeat.json');
const maimaicharts = require('../data/charts-maimai.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clb')
		.setDescription(`Affiche le classement d'une chart.`)
        .addStringOption(option =>
            option.setName("game")
            .setDescription("Jeu")
            .setRequired(true)
            .addChoices(gameTypes[0])
            .addChoices(gameTypes[1])
            .addChoices(gameTypes[2])
            .addChoices(gameTypes[3])
            .addChoices(gameTypes[4])
            .addChoices(gameTypes[5]))
        .addStringOption(option =>
            option.setName("song")
            .setDescription("Chart")
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option =>
            option.setName("diff")
            .setDescription("Difficulté de la chart")
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option => 
            option.setName("playtype")
            .setDescription("Mode de jeu")
            .setRequired(false)
            .setAutocomplete(true))
        .addIntegerOption(option =>
            option.setName("page")
            .setDescription("Page à afficher")
            .setMinValue(1)
            .setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();
        const api = new Tachi();
        const players = await getUserList();
        let lines = [];

        const game = interaction.options.getString("game");
        const song = interaction.options.getString("song");
        const songslist = resolveGameSongslist(game);
        const songFromDb = songslist.find((item) => item.id == song);
        let chart = interaction.options.getString("diff");
        const chartslist = resolveGameChartslist(game);
        let chartFromDb = chartslist.find((item) => item.chartID == chart);

        playtype = interaction.options.getString("playtype");
        if(playtype === null){
            // playtype isn't specified : use first in array as default.
            playtype = gameTypes.find((gameobj) => gameobj.value === game).playtypes[0];
        }

        if(chartFromDb.playtype !== playtype) {
            // user has selected a chart with a different playtype than manually specified, try to resolve the chart id for the other playtype
            // this happens when chart is selected before picking a playtype, cannot be really fixed, so this should do.
            const temp = chartslist.find((item) => item.songID == song && item.playtype == playtype && item.difficulty == chartFromDb.difficulty);
            if(temp) {
                chartFromDb = temp;
                chart = temp.chartID;
            }
        }

        for(const player of players) {
            const response = await api.getScoreOnChartForPlayer(player.username, game, playtype, chart);
            if(response.success === true) { // ignore invalid users
                // feed lines object with correct game objects
                resolver.resolveClbLineFeeder(game, response, lines, player);
            }
        }
        lines.sort((a, b) => b.score - a.score);
        // paginate
        let page = interaction.options.getInteger("page");
        const pagesize = lb_pagesize_small;
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * pagesize, page * pagesize);
        const lb = new EmbedBuilder();
        resolver.setSongCover(game, songFromDb, chartFromDb, lb);
        lb.setTitle(`${songFromDb.artist} - ${songFromDb.title} [${chartFromDb.difficulty} ${chartFromDb.levelNum}]${resolver.resolveTierList(game, chartFromDb)} - ${playtype}`);
        lb.addFields({name: `Classement (Page ${page})`, value: resolver.resolveClbLineFormatter(game, lines, (page - 1) * pagesize)});
        await interaction.editReply({ embeds: [lb] });
	},
    async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
        let choices;
        switch (focusedOption.name) {
            case "playtype":
                const game = gameTypes.find((game) => game.value === interaction.options.getString("game"));
                if(game === undefined) {
                    choices = [];
                    break;
                }
                choices = game.playtypes.map(playtype => (
                    {
                        name: playtype,
                        value: playtype
                    }
                ));
                break;
            case "song":
                const songslist = resolveGameSongslist(interaction.options.getString("game"));
                const song = focusedOption.value.toLowerCase();
                const matches = songslist.filter((item) =>
                    item.title.toLowerCase().includes(song) ||
                    item.searchTerms.filter((alt) => alt.toLowerCase().includes(song)).length !== 0);
                choices = matches.map(match => (
                    {
                        name: match.title,
                        value: String(match.id)
                    }
                ));
                break;
            case "diff":
                const chartslist = resolveGameChartslist(interaction.options.getString("game"));
                const songId = interaction.options.getString("song");
                const gamediff = interaction.options.getString("game");
                if(!songId || gamediff === undefined) {
                    choices = [];
                    break;
                }
                playtype = interaction.options.getString("playtype");
                if(playtype === null){
                    // playtype isn't specified : use first in array as default.
                    playtype = gameTypes.find((gameobj) => gameobj.value === gamediff).playtypes[0];
                }
                let chartMatches = chartslist.filter((item) => item.songID == songId && item.playtype == playtype);
                if(gamediff === 'iidx') {
                    chartMatches = chartMatches.filter((item) => item.data["2dxtraSet"] === null);
                }
                chartMatches.sort((a, b) => b.levelNum - a.levelNum);
                choices = chartMatches.map(match => (
                    {
                        name: match.difficulty,
                        value: match.chartID
                    }
                ));
                break;
        }
        if(choices.length >= 25) choices.length = 25;
        await interaction.respond(choices);
    }
};

function resolveGameSongslist(game) {
    switch (game) {
        case "sdvx":
            return sdvxsongs;
        case "iidx":
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

function resolveGameChartslist(game) {
    switch (game) {
        case "sdvx":
            return sdvxcharts;
        case "iidx":
            return iidxcharts;
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