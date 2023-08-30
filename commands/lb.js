const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getUserList } = require('../utils/db');
const { gameTypes } = require('../constants/Games');
const resolver = require('../games/resolver');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lb')
		.setDescription('Affiche le classement.')
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
        playtype = interaction.options.getString("playtype");
        if(playtype === null){
            // playtype isn't specified : use first in array as default.
            playtype = gameTypes.find((gameobj) => gameobj.value === game).playtypes[0];
        }
        for(const player of players) {
            const response = await api.getPlayerProfile(player.username, game, playtype);
            if(response.success === true) { // ignore invalid users
                // feed lines object with correct game objects
                resolver.resolveLineFeeder(game, response, lines, player);
            }
        }
        resolver.resolveLineSorter(game, lines)
        // paginate
        let page = interaction.options.getInteger("page");
        const pagesize = gameTypes.find((gameobj) => gameobj.value === game).lbsize;
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * pagesize, page * pagesize);
        const lb = new EmbedBuilder();
        lb.setTitle(`${gameTypes.find((gameobj) => gameobj.value === game).name} (${playtype})`);
        lb.addFields({name: `Classement (Page ${page})`, value: resolver.resolveLineFormatter(game, lines, (page - 1) * pagesize)});
        await interaction.editReply({ embeds: [lb] });
	},
    async autocomplete(interaction) {
		const game = gameTypes.find((game) => game.value == interaction.options.getString("game"));
        if(game === undefined) {
            interaction.respond([]);
            return;
        }
        interaction.respond(game.playtypes.map(playtype => (
            {
                name: playtype,
                value: playtype
            }
        )))
    }
};