const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getUserList } = require('../utils/db');
const { gamemeta, getGame } = require('../constants/Games');
const metaresolver = require('../games/meta-resolver.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clb')
		.setDescription(`Affiche le classement d'une chart.`)
        .addStringOption(option =>
            option.setName("game")
            .setDescription("Jeu")
            .setRequired(true)
            .addChoices(gamemeta[0])
            .addChoices(gamemeta[1])
            .addChoices(gamemeta[2])
            .addChoices(gamemeta[3])
            .addChoices(gamemeta[4])
            .addChoices(gamemeta[5])
            .addChoices(gamemeta[6]))
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
        const gameobj = getGame(game);
        const song = interaction.options.getString("song");
        const songslist = metaresolver.resolveSonglist(game);
        const songFromDb = songslist.find((item) => item.id == song);
        let chart = interaction.options.getString("diff");
        const chartslist = metaresolver.resolveChartlist(game);
        let chartFromDb = chartslist.find((item) => item.id == chart);

        for(const player of players) {
            try {
                const response = await api.getScoreOnChartForPlayer(player.username, game, chart);
                if(response.success === true) { // ignore invalid users
                    // feed lines object with correct game objects
                    gameobj.func.chartLeaderboardFeeder(response, lines, player);
                }
            } catch(err) {
                await interaction.editReply({ content: "Erreur de récupération des leaderboards côté Tachi.", ephemeral: true });
                console.error(err);
                return;
            }
        }
        lines.sort((a, b) => b.score - a.score);
        // paginate
        let page = interaction.options.getInteger("page");
        const pagesize = gameobj.lbsize;
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * pagesize, page * pagesize);
        const lb = new EmbedBuilder();
        gameobj.func.setCover(songFromDb, chartFromDb, lb);
        lb.setTitle(`${songFromDb.artist} - ${songFromDb.title} [${chartFromDb.difficulty} ${chartFromDb.levelNum}] ${await gameobj.func.resolveTierList(chartFromDb)}`);
        lb.addFields({ name: `Classement (Page ${page})`, value: `${await gameobj.func.chartLeaderboardFormat(lines, (page - 1) * pagesize)}` });
        lb.setFooter({ text: `${gameobj.name}`, iconURL: `${gameobj.icon}`});
        await interaction.editReply({ embeds: [lb] });
	},
    async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
        let choices;
        switch (focusedOption.name) {
            case "song":
                const songslist = metaresolver.resolveSonglist(interaction.options.getString("game"));
                const song = focusedOption.value.toLowerCase();
                const matches = songslist.filter((item) =>
                    item.title.toLowerCase().includes(song) ||
                    item.searchTerms.filter((alt) => alt.toLowerCase().includes(song)).length !== 0);
                if(matches.length >= 25) {
                    const perfectMatch = songslist.find((item) => item.title.toLowerCase() == song);
                    if(perfectMatch) {
                        matches.unshift(perfectMatch);
                    }
                }
                choices = matches.map(match => (
                    {
                        name: match.title,
                        value: String(match.id)
                    }
                ));
                break;
            case "diff":
                const chartslist = metaresolver.resolveChartlist(interaction.options.getString("game"));
                const songId = interaction.options.getString("song");
                const gamediff = interaction.options.getString("game");
                if(!songId || gamediff === undefined) {
                    choices = [];
                    break;
                }
                let chartMatches = chartslist.filter((item) => item.songID == songId);
                if(gamediff.startsWith('iidx')) {
                    chartMatches = chartMatches.filter((item) => item.data["2dxtraSet"] === null);
                }
                chartMatches.sort((a, b) => b.levelNum - a.levelNum);
                choices = chartMatches.map(match => (
                    {
                        name: match.difficulty,
                        value: match.id
                    }
                ));
                break;
        }
        if(choices.length >= 25) choices.length = 25;
        await interaction.respond(choices);
    }
};