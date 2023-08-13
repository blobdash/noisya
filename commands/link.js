const { SlashCommandBuilder } = require('discord.js');
const { setLink } = require('../utils/db.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription(`Lier un compte Tachi`)
        .addStringOption(option =>
            option.setName("username")
            .setDescription("Tachi Username")
            .setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
        setLink(
            interaction.options.getString("username"),
            interaction.user.id
        )
		await interaction.editReply({ content: 'Votre compte Tachi a été lié à votre compte Discord.', ephemeral: true });
	},
};