const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLink } = require('../utils/db.js');
const { gamemeta, getGame } = require('../constants/Games.js');
const Tachi = require('../utils/Tachi.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription(`Afficher votre profil sur un jeu`)
        .addStringOption(option => 
            option.setName("game")
            .setDescription("Jeu à afficher")
            .setRequired(true)
            .addChoices(gamemeta[0])
            .addChoices(gamemeta[1])
            .addChoices(gamemeta[2])
            .addChoices(gamemeta[3])
            .addChoices(gamemeta[4])
            .addChoices(gamemeta[5])
            .addChoices(gamemeta[6]))
        .addStringOption(option =>
            option.setName("username")
            .setDescription("Afficher le profil d'un utilisateur (si vide, soi même)")
            .setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();
        let user = interaction.options.getString("username");
        if(user === null) {
            user = await getLink(interaction.user.id);
        } else {
            user = { username: user };
        }
        if(user === undefined) {
            await interaction.editReply({ content: "Merci de lier votre compte Tachi avec `/link`.", ephemeral: true });
            return;
        }
        const api = new Tachi();
        const game = interaction.options.getString("game");
        const profile = await api.getPlayerProfile(user.username, game);
        const prfl = new EmbedBuilder();
        prfl.setTitle(`${user.username} | ${gameTypes.find((game) => game.value === interaction.options.getString("game")).name} ${game.startsWith('iidx-') ? `(${game.slice(-2).toUpperCase()})` : ""}`);
        prfl.setURL(api.getProfileUrl(user.username, game));
        if(profile.success === false) {
            prfl.addFields({ name: "Erreur", value: `${user.username} n'a pas joué à ce jeu ou dans ce mode de jeu.`})
            await interaction.editReply({ embeds: [prfl]} );
            return;
        }
        getGame(game).func.populateProfile(prfl, profile);
        prfl.setThumbnail("attachment://image.png");
		await interaction.editReply({ embeds: [prfl], files: [{
            attachment: await api.resolveUserPfp(user.username),
            name:'image.png'
        }]});
	}
};