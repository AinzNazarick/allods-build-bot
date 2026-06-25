require('dotenv').config();
const { REST, Routes } = require('discord.js');
const build = require('./commands/build');

const commands = [build.data.toJSON()];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        const app = await rest.get(Routes.oauth2CurrentApplication());
        await rest.put(Routes.applicationCommands(app.id), { body: commands });
        console.log(`${commands.length} commande(s) enregistrée(s) avec succès.`);
    } catch (error) {
        console.error(error);
    }
})();