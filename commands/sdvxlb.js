const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { parseDan } = require('../games/sdvx-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sdvxlb')
		.setDescription('Shows the leaderboard for SOUND VOLTEX.'),
	async execute(interaction) {
		await interaction.deferReply();
        const api = new Tachi();
        const players = ['literallynotavaliduser', 'nythil', 'blobdash', 'Wormi', 'Adamaq01', 'Aeon', 'Lyne', 'monebreaker', 'OwOrigins', 'Kasumi', 'FireAlphaa']
        const lines = [];
        for(const player of players) {
            const response = await api.getPlayerProfile(player, 'sdvx', 'Single');
            if(response.success === true) { // ignore invalid users
                lines.push({
                    vf: response.body.gameStats.ratings.VF6.toFixed(3),
                    player: player,
                    dan: parseDan(response.body.gameStats.classes.dan)
                })
            }
        }
        lines.sort((a, b) => b.vf - a.vf);
        const lb = new EmbedBuilder();
        lb.setTitle("SOUND VOLTEX Leaderboard");
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