const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { parseDan } = require('../games/sdvx-utils');
const { getUserList } = require('../utils/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sdvxlb')
		.setDescription('Affiche le classement SOUND VOLTEX.'),
	async execute(interaction) {
		await interaction.deferReply();
        const api = new Tachi();
        const players = await getUserList();
        const lines = [];
        for(const player of players) {
            const response = await api.getPlayerProfile(player.username, 'sdvx', 'Single');
            if(response.success === true) { // ignore invalid users
                lines.push({
                    vf: response.body.gameStats.ratings.VF6.toFixed(3),
                    player: player.username,
                    dan: parseDan(response.body.gameStats.classes.dan)
                })
            }
        }
        lines.sort((a, b) => b.vf - a.vf);
        const lb = new EmbedBuilder();
        lb.setTitle("SOUND VOLTEX");
        lb.addFields({name: "Classement", value: processLines(lines)});
        await interaction.editReply({ embeds: [lb] });
	},
};

function processLines(lines) {
    buffer = "";
    standing = 0;
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.vf+"").padStart(6)}VF ${line.dan.padStart(4)} | ${line.player}\`\n`
    }
    return buffer;
}