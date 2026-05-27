const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGame } = require('../constants/Games.js');
const { getLink } = require('../utils/db.js')
const Tachi = require('../utils/Tachi.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('recent')
		.setDescription(`Affiche le play le plus récent.`),
	async execute(interaction) {
		await interaction.deferReply();
        user = await getLink(interaction.user.id);
        if(user === undefined) {
            await interaction.editReply({ content: "Merci de lier votre compte Tachi avec `/link`.", ephemeral: true });
            return;
        }
        const api = new Tachi();
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
                    if(lastplay === null && profile.body.mostRecentScore) {
                        lastplay = profile.body.mostRecentScore;
                    } else {
                        if(profile.body.mostRecentScore && lastplay.timeAchieved < profile.body.mostRecentScore.timeAchieved) {
                            lastplay = profile.body.mostRecentScore;
                        }
                    }
                }
            }            
        }
        const recent = new EmbedBuilder();
        const lastplayGame = getGame(lastplay.game);
        recent.setTitle(`${user.username} - Recent`);
        recent.addFields(
            { name: `${lastplayGame.name}`, value: `${await lastplayGame.func.formatPlayInfo(lastplay, recent)}` }
        )
        recent.setFooter({ text: `${lastplayGame.name}`, iconURL: `${lastplayGame.icon}`});
		await interaction.editReply({ embeds: [recent] });
	},
};