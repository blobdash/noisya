const { SlashCommandBuilder } = require('discord.js');
const { getLink } = require('../utils/db.js')
const { gameTypes } = require('../constants/Games.js');
const Tachi = require('../utils/Tachi.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('time')
		.setDescription(`Affiche le temps passé sur un jeu.`)
        .addStringOption(option => 
            option.setName("game")
            .setDescription("Jeu à afficher")
            .setRequired(true)
            .addChoices(gameTypes[0])
            .addChoices(gameTypes[1])
            .addChoices(gameTypes[2])
            .addChoices(gameTypes[3])
            .addChoices(gameTypes[4]))
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
        playtype = interaction.options.getString("playtype");
        if(playtype === null){
            // playtype isn't specified : use first in array as default.
            playtype = gameTypes.find((game) => game.value === interaction.options.getString("game")).playtypes[0];
        }
        const api = new Tachi();
        const sessions = await api.getUserSessions(user.username, interaction.options.getString("game"), playtype);
        if(!sessions.success) {
            await interaction.editReply({ content: 'Impossible de récupérer les sessions.' });
            return;
        }
        let time = 0;
        for(let session of sessions.body) {
            time += session.timeEnded - session.timeStarted;
        }
		await interaction.editReply({ content: `${user.username} a joué a ${gameTypes.find((game) => game.value === interaction.options.getString("game")).name} pendant ${formatTime(time)}.` });
	},
};

function formatTime(time) {
    seconds = time/1000;
    days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60
    seconds = Math.floor(seconds);
    return `${days} jour${days > 1 ? "s" : ""}, ${hours} heure${hours > 1 ? "s" : ""}, ${minutes} minute${minutes > 1 ? "s" : ""} et ${seconds} seconde${seconds > 1 ? "s" : ""}`;
}