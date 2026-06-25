const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../db');
const { CLASSES, ROLES, CONTENTS } = require('../constants');

const data = new SlashCommandBuilder()
    .setName('build')
    .setDescription('Gérer les builds Allods Online')
    .addSubcommand(sub =>
        sub.setName('ajouter')
            .setDescription('Ajouter un nouveau build')
            .addStringOption(opt =>
                opt.setName('classe').setDescription('Classe').setRequired(true)
                    .addChoices(...CLASSES.map(c => ({ name: c, value: c }))))
            .addStringOption(opt =>
                opt.setName('role').setDescription('Rôle').setRequired(true)
                    .addChoices(...ROLES.map(r => ({ name: r, value: r }))))
            .addStringOption(opt =>
                opt.setName('contenu').setDescription('Contenu').setRequired(true)
                    .addChoices(...CONTENTS.map(c => ({ name: c, value: c }))))
            .addStringOption(opt =>
                opt.setName('lien').setDescription('Lien du build').setRequired(true))
            .addStringOption(opt =>
                opt.setName('titre').setDescription('Titre du build (ex: Full Crit)').setRequired(false))
            .addIntegerOption(opt => opt.setName('proficiency').setDescription('Stat Proficiency').setRequired(false))
            .addIntegerOption(opt => opt.setName('determination').setDescription('Stat Determination').setRequired(false))
            .addIntegerOption(opt => opt.setName('brutality').setDescription('Stat Brutality').setRequired(false))
            .addIntegerOption(opt => opt.setName('luck').setDescription('Stat Luck').setRequired(false))
            .addIntegerOption(opt => opt.setName('supremacy').setDescription('Stat Supremacy').setRequired(false))
            .addIntegerOption(opt => opt.setName('vitality').setDescription('Stat Vitality').setRequired(false))
            .addIntegerOption(opt => opt.setName('bloodlust').setDescription('Stat Bloodlust').setRequired(false))
            .addIntegerOption(opt => opt.setName('survivability').setDescription('Stat Survivability').setRequired(false))
            .addIntegerOption(opt => opt.setName('caution').setDescription('Stat Caution').setRequired(false))
    )
    .addSubcommand(sub =>
        sub.setName('consulter')
            .setDescription('Consulter les builds existants')
            .addStringOption(opt =>
                opt.setName('classe').setDescription('Filtrer par classe').setRequired(false)
                    .addChoices(...CLASSES.map(c => ({ name: c, value: c }))))
            .addStringOption(opt =>
                opt.setName('role').setDescription('Filtrer par rôle').setRequired(false)
                    .addChoices(...ROLES.map(r => ({ name: r, value: r }))))
            .addStringOption(opt =>
                opt.setName('contenu').setDescription('Filtrer par contenu').setRequired(false)
                    .addChoices(...CONTENTS.map(c => ({ name: c, value: c }))))
    )
    .addSubcommand(sub =>
        sub.setName('modifier')
            .setDescription('Modifier un de tes builds')
            .addStringOption(opt =>
                opt.setName('selection').setDescription('Quel build modifier').setRequired(true).setAutocomplete(true))
            .addStringOption(opt =>
                opt.setName('classe').setDescription('Nouvelle classe').setRequired(false)
                    .addChoices(...CLASSES.map(c => ({ name: c, value: c }))))
            .addStringOption(opt =>
                opt.setName('role').setDescription('Nouveau rôle').setRequired(false)
                    .addChoices(...ROLES.map(r => ({ name: r, value: r }))))
            .addStringOption(opt =>
                opt.setName('contenu').setDescription('Nouveau contenu').setRequired(false)
                    .addChoices(...CONTENTS.map(c => ({ name: c, value: c }))))
            .addStringOption(opt => opt.setName('lien').setDescription('Nouveau lien').setRequired(false))
            .addStringOption(opt => opt.setName('titre').setDescription('Nouveau titre').setRequired(false))
            .addIntegerOption(opt => opt.setName('proficiency').setDescription('Stat Proficiency').setRequired(false))
            .addIntegerOption(opt => opt.setName('determination').setDescription('Stat Determination').setRequired(false))
            .addIntegerOption(opt => opt.setName('brutality').setDescription('Stat Brutality').setRequired(false))
            .addIntegerOption(opt => opt.setName('luck').setDescription('Stat Luck').setRequired(false))
            .addIntegerOption(opt => opt.setName('supremacy').setDescription('Stat Supremacy').setRequired(false))
            .addIntegerOption(opt => opt.setName('vitality').setDescription('Stat Vitality').setRequired(false))
            .addIntegerOption(opt => opt.setName('bloodlust').setDescription('Stat Bloodlust').setRequired(false))
            .addIntegerOption(opt => opt.setName('survivability').setDescription('Stat Survivability').setRequired(false))
            .addIntegerOption(opt => opt.setName('caution').setDescription('Stat Caution').setRequired(false))
    )
    .addSubcommand(sub =>
        sub.setName('supprimer')
            .setDescription('Supprimer un de tes builds')
            .addStringOption(opt =>
                opt.setName('selection').setDescription('Quel build supprimer').setRequired(true).setAutocomplete(true))
    );

function formatBuild(b) {
    const statsOff = [];
    if (b.stat_proficiency != null) statsOff.push(`Proficiency: ${b.stat_proficiency}`);
    if (b.stat_determination != null) statsOff.push(`Determination: ${b.stat_determination}`);
    if (b.stat_brutality != null) statsOff.push(`Brutality: ${b.stat_brutality}`);
    if (b.stat_luck != null) statsOff.push(`Luck: ${b.stat_luck}`);
    if (b.stat_supremacy != null) statsOff.push(`Supremacy: ${b.stat_supremacy}`);

    const statsDef = [];
    if (b.stat_vitality != null) statsDef.push(`Vitality: ${b.stat_vitality}`);
    if (b.stat_bloodlust != null) statsDef.push(`Bloodlust: ${b.stat_bloodlust}`);
    if (b.stat_survivability != null) statsDef.push(`Survivability: ${b.stat_survivability}`);
    if (b.stat_caution != null) statsDef.push(`Caution: ${b.stat_caution}`);

    let text = `**${b.class} - ${b.role} - ${b.content}**${b.title ? ` (${b.title})` : ''}\n`;
    text += `🔗 ${b.link}\n`;
    text += `👤 Par ${b.owner_username}\n`;
    if (statsOff.length) text += `⚔️ ${statsOff.join(' | ')}\n`;
    if (statsDef.length) text += `🛡️ ${statsDef.join(' | ')}\n`;
    return text;
}

function buildLabel(b) {
    return `${b.class} - ${b.role} - ${b.content}${b.title ? ` (${b.title})` : ''}`.slice(0, 100);
}

async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'ajouter') {
        const classe = interaction.options.getString('classe');
        const role = interaction.options.getString('role');
        const contenu = interaction.options.getString('contenu');
        const lien = interaction.options.getString('lien');
        const titre = interaction.options.getString('titre');

        db.prepare(`
            INSERT INTO builds (
                owner_id, owner_username, class, role, content, title, link,
                stat_proficiency, stat_determination, stat_brutality, stat_luck, stat_supremacy,
                stat_vitality, stat_bloodlust, stat_survivability, stat_caution
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            interaction.user.id, interaction.user.username, classe, role, contenu, titre, lien,
            interaction.options.getInteger('proficiency'),
            interaction.options.getInteger('determination'),
            interaction.options.getInteger('brutality'),
            interaction.options.getInteger('luck'),
            interaction.options.getInteger('supremacy'),
            interaction.options.getInteger('vitality'),
            interaction.options.getInteger('bloodlust'),
            interaction.options.getInteger('survivability'),
            interaction.options.getInteger('caution')
        );

        await interaction.reply({
            content: `✅ Build **${classe} - ${role} - ${contenu}** ajouté avec succès !`,
            ephemeral: true
        });
    }

    if (sub === 'consulter') {
        const classe = interaction.options.getString('classe');
        const role = interaction.options.getString('role');
        const contenu = interaction.options.getString('contenu');

        let query = 'SELECT * FROM builds WHERE 1=1';
        const params = [];
        if (classe) { query += ' AND class = ?'; params.push(classe); }
        if (role) { query += ' AND role = ?'; params.push(role); }
        if (contenu) { query += ' AND content = ?'; params.push(contenu); }

        const builds = db.prepare(query).all(...params);

        if (builds.length === 0) {
            await interaction.reply({ content: 'Aucun build trouvé avec ces critères.', ephemeral: true });
            return;
        }

        await interaction.reply({ content: builds.map(formatBuild).join('\n'), ephemeral: true });
    }

    if (sub === 'modifier') {
        const id = interaction.options.getString('selection');
        const existing = db.prepare('SELECT * FROM builds WHERE id = ?').get(id);

        if (!existing) {
            await interaction.reply({ content: '❌ Build introuvable.', ephemeral: true });
            return;
        }
        if (existing.owner_id !== interaction.user.id) {
            await interaction.reply({ content: '❌ Tu ne peux modifier que tes propres builds.', ephemeral: true });
            return;
        }

        const map = {
            classe: 'class', role: 'role', contenu: 'content', lien: 'link', titre: 'title',
            proficiency: 'stat_proficiency', determination: 'stat_determination', brutality: 'stat_brutality',
            luck: 'stat_luck', supremacy: 'stat_supremacy', vitality: 'stat_vitality', bloodlust: 'stat_bloodlust',
            survivability: 'stat_survivability', caution: 'stat_caution'
        };
        const isInt = new Set(['proficiency','determination','brutality','luck','supremacy','vitality','bloodlust','survivability','caution']);

        const fields = [];
        const params = [];
        for (const [optName, column] of Object.entries(map)) {
            const value = isInt.has(optName)
                ? interaction.options.getInteger(optName)
                : interaction.options.getString(optName);
            if (value !== null) {
                fields.push(`${column} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) {
            await interaction.reply({ content: 'Aucune modification fournie.', ephemeral: true });
            return;
        }

        fields.push("updated_at = datetime('now')");
        params.push(id);
        db.prepare(`UPDATE builds SET ${fields.join(', ')} WHERE id = ?`).run(...params);

        await interaction.reply({ content: '✅ Build modifié avec succès.', ephemeral: true });
    }

    if (sub === 'supprimer') {
        const id = interaction.options.getString('selection');
        const existing = db.prepare('SELECT * FROM builds WHERE id = ?').get(id);

        if (!existing) {
            await interaction.reply({ content: '❌ Build introuvable.', ephemeral: true });
            return;
        }
        if (existing.owner_id !== interaction.user.id) {
            await interaction.reply({ content: '❌ Tu ne peux supprimer que tes propres builds.', ephemeral: true });
            return;
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`delete_confirm_${id}`).setLabel('Confirmer').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`delete_cancel_${id}`).setLabel('Annuler').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            content: `⚠️ Supprimer le build **${buildLabel(existing)}** ?`,
            components: [row],
            ephemeral: true
        });
    }
}

async function autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const builds = db.prepare('SELECT * FROM builds WHERE owner_id = ?').all(interaction.user.id);

    const filtered = builds
        .filter(b => buildLabel(b).toLowerCase().includes(focused))
        .slice(0, 25)
        .map(b => ({ name: buildLabel(b), value: String(b.id) }));

    await interaction.respond(filtered);
}

async function handleButton(interaction) {
    const [action, decision, id] = interaction.customId.split('_');
    if (action !== 'delete') return;

    if (decision === 'cancel') {
        await interaction.update({ content: '❌ Suppression annulée.', components: [] });
        return;
    }

    const existing = db.prepare('SELECT * FROM builds WHERE id = ?').get(id);
    if (!existing || existing.owner_id !== interaction.user.id) {
        await interaction.update({ content: '❌ Action impossible.', components: [] });
        return;
    }

    db.prepare('DELETE FROM builds WHERE id = ?').run(id);
    await interaction.update({ content: '🗑️ Build supprimé avec succès.', components: [] });
}

module.exports = { data, execute, autocomplete, handleButton };