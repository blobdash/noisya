const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getLink, getUserList } = require('../utils/db');
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
		.setName('rclb')
		.setDescription(`Affiche le classement de la dernière chart que vous avez joué.`)
        .addIntegerOption(option =>
            option.setName("page")
            .setDescription("Page à afficher")
            .setMinValue(1)
            .setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();
        let user = await getLink(interaction.user.id);
        if(user === undefined) {
            await interaction.editReply({ content: "Merci de lier votre compte Tachi avec `/link`.", ephemeral: true });
            return;
        }
        const api = new Tachi();
        const players = await getUserList();
        let lines = [];

        // fetch most recent play
        const gameslist = await api.getUserGames(user.username);
        if(gameslist.success === false) {
            interaction.editReply("Profil introuvable.");
            return;
        }
        let lastplay = null;
        for(const game of gameslist.body) {
            if(gameTypes.find((gametype) => game.game === gametype.value)) { // ignores games that aren't supported by the bot
                const profile = await api.getPlayerProfile(user.username, game.game, game.playtype);
                if(profile.success) {
                    if(lastplay === null) {
                        lastplay = profile.body.mostRecentScore;
                    } else {
                        if(lastplay.timeAchieved < profile.body.mostRecentScore.timeAchieved) {
                            lastplay = profile.body.mostRecentScore;
                        }
                    }
                }
            }
        }

        const game = lastplay.game;
        const gameType = gameTypes.find((a) => a.value === game);
        const song = lastplay.songID;
        const songslist = resolveGameSongslist(game);
        const songFromDb = songslist.find((item) => item.id == song);
        let chart = lastplay.chartID;
        const chartslist = resolveGameChartslist(game);
        let chartFromDb = chartslist.find((item) => item.chartID == chart);

        playtype = lastplay.playtype;

        for(const player of players) {
            try {
                const response = await api.getScoreOnChartForPlayer(player.username, game, playtype, chart);
                if(response.success === true) { // ignore invalid users
                    // feed lines object with correct game objects
                    resolver.resolveClbLineFeeder(game, response, lines, player);
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
        const pagesize = lb_pagesize_small;
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * pagesize, page * pagesize);
        const lb = new EmbedBuilder();
        resolver.setSongCover(game, songFromDb, chartFromDb, lb);
        lb.setTitle(`${gameType.emoji} ${songFromDb.artist} - ${songFromDb.title} [${chartFromDb.difficulty} ${chartFromDb.levelNum}]${resolver.resolveTierList(game, chartFromDb)} - ${playtype}`);
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