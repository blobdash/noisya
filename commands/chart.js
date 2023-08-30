const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameTypes } = require('../constants/Games.js');
const Tachi = require('../utils/Tachi.js');

const sdvxsongs = require('../data/songs-sdvx.json');
const iidxsongs = require('../data/songs-iidx.json');
const popnsongs = require('../data/songs-popn.json');
const chunisongs = require('../data/songs-chunithm.json');
const jubeatsongs = require('../data/songs-jubeat.json');
const resolver = require('../games/resolver.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chart')
		.setDescription(`Avoir les informations d'une chart`)
        .addStringOption(option =>
            option.setName("game")
            .setDescription("Jeu")
            .setRequired(true)
            .addChoices(gameTypes[0])
            .addChoices(gameTypes[1])
            .addChoices(gameTypes[2])
            .addChoices(gameTypes[3])
            .addChoices(gameTypes[4]))
        .addStringOption(option =>
            option.setName("song")
            .setDescription("Chart")
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option => 
            option.setName("playtype")
            .setDescription("Mode de jeu")
            .setRequired(false)
            .setAutocomplete(true)),
	async execute(interaction) {
		await interaction.deferReply();
        playtype = interaction.options.getString("playtype");
        if(playtype === null){
            // playtype isn't specified : use first in array as default.
            playtype = gameTypes.find((game) => game.value === interaction.options.getString("game")).playtypes[0];
        }
        let emb = new EmbedBuilder();
        const api = new Tachi();
        const songData = await api.getSongInfo(interaction.options.getString("game"), playtype, interaction.options.getString("song"));
        if(songData.success === false) {
            interaction.editReply("Chart introuvable.");
            return;
        }
        resolver.resolveSongInfoFormatter(interaction.options.getString("game"), songData, emb, playtype);
        interaction.editReply({ embeds: [emb] });
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
    }
}