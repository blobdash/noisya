const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getLink, getUserList } = require('../utils/db');
const { getGame } = require('../constants/Games');

const metaresolver = require('../games/meta-resolver.js');

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
        for(const entry of gameslist.body) {
            if(getGame(entry.game)) { // ignores games that aren't supported by the bot
                const profile = await api.getPlayerProfile(user.username, entry.game);
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
        const gameobj = getGame(game);
        const song = lastplay.songID;
        const songslist = metaresolver.resolveSonglist(game);
        const songFromDb = songslist.find((item) => item.id == song);
        let chart = lastplay.chartID;
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
        lb.addFields({name: `Classement (Page ${page})`, value: `${await gameobj.func.chartLeaderboardFormat(lines, (page - 1) * pagesize)}`});
        lb.setFooter({ text: `${gameobj.name}`, iconURL: `${gameobj.icon}`});
        await interaction.editReply({ embeds: [lb] });
	}
};