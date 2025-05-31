const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameTypes } = require('../constants/Games.js');
const resolver = require('../games/resolver.js');
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
        const recent = new EmbedBuilder();
        recent.setTitle(`${user.username} - Recent`);
        recent.addFields(
            { name: `${gameTypes.find((game) => game.value === lastplay.game).emoji} ${gameTypes.find((game) => game.value === lastplay.game).name} - ${lastplay.playtype}`, value: `${resolver.formatPlayInfo(lastplay, recent)}` }
        )
		await interaction.editReply({ embeds: [recent] });
	},
};