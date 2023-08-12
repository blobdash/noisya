const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getUserList } = require('../utils/db');
const { lb_pagesize } = require('../config.json');
const { parseClass } = require('../games/chuni-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chunilb')
		.setDescription("Affiche le classement CHUNITHM.")
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
            const response = await api.getPlayerProfile(player.username, 'chunithm', 'Single');
            if(response.success === true) { // ignore invalid users
                lines.push({
                    naiverating: response.body.gameStats.ratings.naiveRating.toFixed(2),
                    player: player.username,
                    colour: `${response.body.gameStats.classes.colour}(${parseClass(response.body.gameStats.classes.colour)})`
                })
            }
        }
        lines.sort((a, b) => b.naiverating - a.naiverating);
        // paginate
        let page = interaction.options.getInteger("page");
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * lb_pagesize, page * lb_pagesize);
        const lb = new EmbedBuilder();
        lb.setTitle(`CHUNITHM`);
        lb.addFields({name: `Classement (Page ${page})`, value: processLines(lines, (page - 1) * lb_pagesize)});
        await interaction.editReply({ embeds: [lb] });
	}
};

function processLines(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.naiverating+"").padStart(6)} | ${line.colour.padStart(11)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}