const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getUserList } = require('../utils/db');
const { lb_pagesize } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('popnlb')
		.setDescription("Affiche le classement pop'n music.")
        .addIntegerOption(option =>
            option.setName("page")
            .setDescription("Page à afficher")
            .setMinValue(1)
            .setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();
        const api = new Tachi();
        const players = await getUserList();
        let lines = [];
        for(const player of players) {
            const response = await api.getPlayerProfile(player.username, 'popn', '9B');
            if(response.success === true) { // ignore invalid users
                lines.push({
                    classpoints: response.body.gameStats.ratings.naiveClassPoints.toFixed(2),
                    player: player.username,
                    class: response.body.gameStats.classes.class ? response.body.gameStats.classes.class : "NO CLASS"
                })
            }
        }
        lines.sort((a, b) => b.classpoints - a.classpoints);
        // paginate
        let page = interaction.options.getInteger("page");
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * lb_pagesize, page * lb_pagesize);
        const lb = new EmbedBuilder();
        lb.setTitle(`pop'n music`);
        lb.addFields({name: `Classement (Page ${page})`, value: processLines(lines, (page - 1) * lb_pagesize)});
        await interaction.editReply({ embeds: [lb] });
	}
};

function processLines(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.classpoints+"").padStart(6)} | ${line.class.padStart(10)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}