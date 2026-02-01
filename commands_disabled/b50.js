const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getLink } = require('../utils/db.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('b50')
		.setDescription(`Afficher une carte avec votre best 50`)
        .addStringOption(option =>
            option.setName("game")
            .setDescription("Jeu")
            .setRequired(true)
            .addChoices({name:"SOUND VOLTEX (EG)", value:"sdvx"})
            .addChoices({name:"SOUND VOLTEX (∇)", value:"sdvxnabla"}))
        .addStringOption(option =>
            option.setName("username")
            .setDescription("Spécifier un utilisateur (si vide, soi même)")
            .setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
        let user = interaction.options.getString("username");
        let game = interaction.options.getString("game");
        if(user === null) {
            user = await getLink(interaction.user.id);
        } else {
            user = { username: user };
        }
        if(user === undefined) {
            await interaction.editReply({ content: "Merci de lier votre compte Tachi avec `/link`.", ephemeral: true });
            return;
        }
        let response;
        let data;
        let b64;
        let attachment;
        let card = new EmbedBuilder();
        switch(game) {
            case "sdvx":
                response = await fetch("https://tachisdvxdata.com/top50", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([user.username, false])
                });
                data = await response.text();
                b64 = Buffer.from(data.substring(data.indexOf("data:image/png"), data.indexOf("1:{\"ok\"")), 'base64');
                attachment = new AttachmentBuilder(b64, 'image.png')
                
                card.setTitle(`SOUND VOLTEX (EG) Best 50 (${user.username})`)
                card.setImage('attachment://image.png')
                card.setFooter({ text: 'Provided by Hoshikara (tachisdvxdata.com)' })
                break;
            case "sdvxnabla":
                response = await fetch("https://tachisdvxdata.com/nablatop50", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([user.username])
                });
                data = await response.text();
                b64 = Buffer.from(data.substring(data.indexOf("data:image/png"), data.indexOf("1:{\"ok\"")), 'base64');
                attachment = new AttachmentBuilder(b64, 'image.png')
                
                card.setTitle(`SOUND VOLTEX (∇) Best 50 (${user.username})`)
                card.setImage('attachment://image.png')
                card.setFooter({ text: 'Provided by Hoshikara (tachisdvxdata.com)' })
                break;
        }
        interaction.editReply({embeds: [card], files: [attachment]})
	},
};