const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getUserList } = require('../utils/db');
const { gamemeta, getGame } = require('../constants/Games');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lb')
		.setDescription('Affiche le classement.')
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
        for(const player of players) {
            try {
                const response = await api.getPlayerProfile(player.username, game);
                if(response.success === true && response.body.totalScores > 0) { // ignore invalid users
                    // feed lines object with correct game objects
                    await gameobj.func.leaderboardFeeder(response, lines, player);
                }
            } catch(err) {
                await interaction.editReply({ content: "Erreur de récupération des leaderboards côté Tachi.", ephemeral: true });
                console.error(err);
                return;
            }
        }
        await gameobj.func.lineSorter(lines);
        // paginate
        let page = interaction.options.getInteger("page");
        const pagesize = gameobj.lbsize;
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * pagesize, page * pagesize);
        const lb = new EmbedBuilder();
        lb.setTitle(`${gameobj.name}`);
        lb.addFields({name: `Classement (Page ${page})`, value: await gameobj.func.leaderboardFormat(lines, (page - 1) * pagesize)});
        lb.setFooter({ text: `${gameobj.name}`, iconURL: `${gameobj.icon}`});
        await interaction.editReply({ embeds: [lb] });
	}
};