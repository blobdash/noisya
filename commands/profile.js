const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLink } = require('../utils/db.js');
const { gameTypes } = require('../constants/Games.js');
const Tachi = require('../utils/Tachi.js');
const { populateSdvxProfile } = require('../games/sdvx-utils.js');
const { populateIidxProfile } = require('../games/iidx-utils.js');
const { populatePopnProfile } = require('../games/popn-utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription(`Afficher votre profil sur un jeu`)
        .addStringOption(option => 
            option.setName("game")
            .setDescription("Jeu à afficher")
            .setRequired(true)
            .addChoices(gameTypes[0])
            .addChoices(gameTypes[1])
            .addChoices(gameTypes[2]))
        .addStringOption(option => 
            option.setName("playtype")
            .setDescription("Mode de jeu")
            .setRequired(false)
            .setAutocomplete(true))
        .addStringOption(option =>
            option.setName("username")
            .setDescription("Afficher le profil d'un utilisateur (si vide, soi même)")
            .setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();
        const user = await getLink(interaction.user.id);
        if(user === undefined) {
            await interaction.editReply({ content: "Merci de lier votre compte Tachi avec `/link`.", ephemeral: true });
            return;
        }
        playtype = interaction.options.getString("playtype");
        if(playtype === null){
            // playtype isn't specified : use first in array as default.
            playtype = gameTypes.find((game) => game.value === interaction.options.getString("game")).playtypes[0];
        }
        const api = new Tachi();
        const profile = await api.getPlayerProfile(user.username, interaction.options.getString("game"), playtype);
        const prfl = new EmbedBuilder();
        prfl.setTitle(`${user.username} | ${interaction.options.getString("game")} (${playtype})`);
        if(profile.success === false) {
            prfl.addFields({ name: "Erreur", value: `${user.username} n'a pas joué à ce jeu ou dans ce mode de jeu.`})
            await interaction.editReply({ embeds: [prfl]} );
            return;
        }
        prfl.setThumbnail(await api.resolveUserPfp(user.username));
        populateProfile(prfl, profile, interaction.options.getString("game"));
		await interaction.editReply({ embeds: [prfl] });
	},
    async autocomplete(interaction) {
        const game = gameTypes.find((game) => game.value === interaction.options.getString("game"));
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

function populateProfile(prfl, profile, game) {
    switch (game) {
        case 'sdvx':
            return populateSdvxProfile(prfl, profile);
        case 'iidx':
            return populateIidxProfile(prfl, profile);
        case 'popn':
            return populatePopnProfile(prfl, profile);
        default:
            break;
    }
}