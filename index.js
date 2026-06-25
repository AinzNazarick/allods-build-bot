require('dotenv').config();
require('./db');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const build = require('./commands/build');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
client.commands.set(build.data.name, build);

client.once('clientReady', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command) await command.execute(interaction);
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (command?.autocomplete) await command.autocomplete(interaction);
        } else if (interaction.isButton()) {
            await build.handleButton(interaction);
        }
    } catch (error) {
        console.error(error);
        if (interaction.isRepliable() && !interaction.replied) {
            await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);