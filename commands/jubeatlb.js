const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { getUserList } = require('../utils/db');
const { lb_pagesize_small } = require('../config.json');
const { parseClass } = require('../games/jubeat-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jubeatlb')
		.setDescription("Affiche le classement jubeat.")
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
            const response = await api.getPlayerProfile(player.username, 'jubeat', 'Single');
            if(response.success === true) { // ignore invalid users
                lines.push({
                    jubility: response.body.gameStats.ratings.jubility.toFixed(2),
                    naiveJubilityDiff: (response.body.gameStats.ratings.jubility - response.body.gameStats.ratings.naiveJubility).toFixed(2),
                    player: player.username,
                    colour: parseClass(response.body.gameStats.classes.colour)
                })
            }
        }
        lines.sort((a, b) => b.jubility - a.jubility);
        // paginate
        let page = interaction.options.getInteger("page");
        if(page === null) page = 1;
        lines = lines.slice((page - 1) * lb_pagesize_small, page * lb_pagesize_small);
        const lb = new EmbedBuilder();
        lb.setTitle(`jubeat`);
        lb.addFields({name: `Classement (Page ${page})`, value: processLines(lines, (page - 1) * lb_pagesize_small)});
        await interaction.editReply({ embeds: [lb] });
	}
};

function processLines(lines, standing) {
    buffer = "";
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.jubility+"").padStart(7)} ${`(${line.naiveJubilityDiff})`.padStart("9")} | ${line.colour.padStart(7)} | ${line.player}\`\n`
    }
    if(buffer.length === 0) return "Aucun joueur dans cette page!";
    return buffer;
}