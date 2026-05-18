const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { games } = require('../constants/Games.js');
const Tachi = require('../utils/Tachi.js');

const metaresolver = require('../games/meta-resolver.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chart')
		.setDescription(`Avoir les informations d'une chart`)
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
            .setAutocomplete(true)),
	async execute(interaction) {
		await interaction.deferReply();
        let emb = new EmbedBuilder();
        const api = new Tachi();
        const game = interaction.options.getString("game");
        const songData = await api.getSongInfo(game, interaction.options.getString("song"));
        if(songData.success === false) {
            interaction.editReply("Chart introuvable.");
            return;
        }
        await getGame(game).func.songInfo(songData, emb, game);
        interaction.editReply({ embeds: [emb] });
	},
    async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
        let choices;
        switch (focusedOption.name) {
            case "song":
                const songlist = metaresolver.resolveSonglist(interaction.options.getString("game"));
                const song = focusedOption.value.toLowerCase();
                const matches = songlist.filter((item) =>
                    item.title.toLowerCase().includes(song) ||
                    item.searchTerms.filter((alt) => alt.toLowerCase().includes(song)).length !== 0);
                if(matches.length >= 25) {
                    const perfectMatch = songlist.find((item) => item.title.toLowerCase() == song);
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
        }
        if(choices.length >= 25) choices.length = 25;
        await interaction.respond(choices);
    }
};