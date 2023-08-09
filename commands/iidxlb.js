const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Tachi = require('../utils/Tachi');
const { parseDan } = require('../games/iidx-utils');
const { getUserList } = require('../utils/db');
const { gameTypes } = require('../constants/Games');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('iidxlb')
		.setDescription('Affiche le classement beatmania IIDX.')
        .addStringOption(option => 
            option.setName("playtype")
            .setDescription("Mode de jeu")
            .setRequired(false)
            .setAutocomplete(true)),
	async execute(interaction) {
		await interaction.deferReply();
        const api = new Tachi();
        const players = await getUserList();
        const lines = [];
        playtype = interaction.options.getString("playtype");
        if(playtype === null){
            // playtype isn't specified : use first in array as default.
            playtype = gameTypes.find((game) => game.value === 'iidx').playtypes[0];
        }
        for(const player of players) {
            const response = await api.getPlayerProfile(player.username, 'iidx', playtype);
            if(response.success === true) { // ignore invalid users
                lines.push({
                    ktLamp: response.body.gameStats.ratings.ktLampRating.toFixed(2),
                    bpi: response.body.gameStats.ratings.BPI,
                    player: player.username,
                    dan: parseDan(response.body.gameStats.classes.dan)
                })
            }
        }
        lines.sort((a, b) => b.ktLamp - a.ktLamp);
        const lb = new EmbedBuilder();
        lb.setTitle(`beatmania IIDX (${playtype})`);
        lb.addFields({name: "Classement", value: processLines(lines)});
        await interaction.editReply({ embeds: [lb] });
	},
    async autocomplete(interaction) {
		const game = gameTypes.find((game) => game.value == "iidx");
        if(game === undefined) {
            interaction.respond([]);
            return;
        }
        interaction.respond(game.playtypes.map(playtype => (
            {
                name: playtype,
                value: playtype
            }
        )))
    }
};

function processLines(lines) {
    buffer = "";
    standing = 0;
    for(const line of lines) {
        standing++;
        buffer += `\`#${(standing+"").padEnd(2)} ${(line.ktLamp+"").padStart(6)} | ${(line.bpi ? line.bpi.toFixed(2) : "NO ").padStart(6)}BPI ${line.dan.padStart(11)} | ${line.player}\`\n`
    }
    return buffer;
}