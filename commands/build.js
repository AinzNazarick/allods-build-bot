const {
    SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, LabelBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    TextInputBuilder, TextInputStyle
} = require('discord.js');
const db = require('../db');
const { CLASSES, ROLES, CONTENTS } = require('../constants');
const { buildEmbed } = require('../utils/embeds');

const OFFENSIVE_FIELDS = [
    { id: 'proficiency', label: 'Proficiency' },
    { id: 'determination', label: 'Determination' },
    { id: 'brutality', label: 'Brutality' },
    { id: 'luck', label: 'Luck' },
    { id: 'supremacy', label: 'Supremacy' }
];
const DEFENSIVE_FIELDS = [
    { id: 'vitality', label: 'Vitality' },
    { id: 'bloodlust', label: 'Bloodlust' },
    { id: 'survivability', label: 'Survivability' },
    { id: 'caution', label: 'Caution' }
];

const data = new SlashCommandBuilder()
    .setName('build')
    .setDescription('Gérer les builds Allods Online')
    .addSubcommand(sub => sub.setName('ajouter').setDescription('Ajouter un nouveau build'))
    .addSubcommand(sub => sub.setName('consulter').setDescription('Consulter les builds existants'))
    .addSubcommand(sub =>
        sub.setName('modifier')
            .setDescription('Modifier un de tes builds')
            .addStringOption(opt =>
                opt.setName('selection').setDescription('Quel build modifier').setRequired(true).setAutocomplete(true))
    )
    .addSubcommand(sub =>
        sub.setName('supprimer')
            .setDescription('Supprimer un de tes builds')
            .addStringOption(opt =>
                opt.setName('selection').setDescription('Quel build supprimer').setRequired(true).setAutocomplete(true))
    );

function buildLabel(b) {
    return `${b.class} - ${b.role} - ${b.content}${b.title ? ` (${b.title})` : ''}`.slice(0, 100);
}

function selectWithDefault(customId, values, current) {
    return new StringSelectMenuBuilder().setCustomId(customId).addOptions(
        values.map(v => new StringSelectMenuOptionBuilder().setLabel(v).setValue(v).setDefault(v === current))
    );
}

// ---------- /build ajouter & stats communes ----------

function afterSaveComponents(id) {
    return [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`addstats_off_${id}`).setLabel('+ Stats offensives').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`addstats_def_${id}`).setLabel('+ Stats défensives').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`addstats_done_${id}`).setLabel('Terminer').setStyle(ButtonStyle.Success)
    )];
}

function statsModal(customId, title, fields) {
    const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
    const labels = fields.map(f =>
        new LabelBuilder().setLabel(f.label).setTextInputComponent(
            new TextInputBuilder().setCustomId(f.id).setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Nombre, ex: 500')
        )
    );
    modal.addLabelComponents(...labels);
    return modal;
}

async function showAjouterModal(interaction) {
    const modal = new ModalBuilder().setCustomId('ajouter_modal').setTitle('Ajouter un build');

    const classeSelect = new StringSelectMenuBuilder().setCustomId('classe')
        .addOptions(CLASSES.map(c => new StringSelectMenuOptionBuilder().setLabel(c).setValue(c)));
    const roleSelect = new StringSelectMenuBuilder().setCustomId('role')
        .addOptions(ROLES.map(r => new StringSelectMenuOptionBuilder().setLabel(r).setValue(r)));
    const contenuSelect = new StringSelectMenuBuilder().setCustomId('contenu')
        .addOptions(CONTENTS.map(c => new StringSelectMenuOptionBuilder().setLabel(c).setValue(c)));

    const titreInput = new TextInputBuilder().setCustomId('titre').setStyle(TextInputStyle.Short)
        .setRequired(false).setPlaceholder('Ex: Full Crit');
    const lienInput = new TextInputBuilder().setCustomId('lien').setStyle(TextInputStyle.Short)
        .setRequired(true).setPlaceholder('https://...');

    modal.addLabelComponents(
        new LabelBuilder().setLabel('Classe').setStringSelectMenuComponent(classeSelect),
        new LabelBuilder().setLabel('Rôle').setStringSelectMenuComponent(roleSelect),
        new LabelBuilder().setLabel('Contenu').setStringSelectMenuComponent(contenuSelect),
        new LabelBuilder().setLabel('Titre (optionnel)').setTextInputComponent(titreInput),
        new LabelBuilder().setLabel('Lien du build').setTextInputComponent(lienInput)
    );

    await interaction.showModal(modal);
}

// ---------- /build modifier ----------

async function showModifierModal(interaction, build) {
    const modal = new ModalBuilder().setCustomId(`modifier_modal_${build.id}`).setTitle('Modifier le build');

    const classeSelect = selectWithDefault('classe', CLASSES, build.class);
    const roleSelect = selectWithDefault('role', ROLES, build.role);
    const contenuSelect = selectWithDefault('contenu', CONTENTS, build.content);

    const titreInput = new TextInputBuilder().setCustomId('titre').setStyle(TextInputStyle.Short)
        .setRequired(false).setValue(build.title || '');
    const lienInput = new TextInputBuilder().setCustomId('lien').setStyle(TextInputStyle.Short)
        .setRequired(true).setValue(build.link);

    modal.addLabelComponents(
        new LabelBuilder().setLabel('Classe').setStringSelectMenuComponent(classeSelect),
        new LabelBuilder().setLabel('Rôle').setStringSelectMenuComponent(roleSelect),
        new LabelBuilder().setLabel('Contenu').setStringSelectMenuComponent(contenuSelect),
        new LabelBuilder().setLabel('Titre (optionnel)').setTextInputComponent(titreInput),
        new LabelBuilder().setLabel('Lien du build').setTextInputComponent(lienInput)
    );

    await interaction.showModal(modal);
}

// ---------- /build consulter ----------

function buildFilterRow(customId, allLabel, placeholder, values, selected) {
    const select = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel(allLabel).setValue('ALL').setDefault(selected === 'ALL'),
            ...values.map(v => new StringSelectMenuOptionBuilder().setLabel(v).setValue(v).setDefault(selected === v))
        );
    return new ActionRowBuilder().addComponents(select);
}

function consulterRows(filters = { classe: 'ALL', role: 'ALL', contenu: 'ALL' }) {
    return [
        buildFilterRow('filter_classe', 'Toutes les classes', 'Classe', CLASSES, filters.classe),
        buildFilterRow('filter_role', 'Tous les rôles', 'Rôle', ROLES, filters.role),
        buildFilterRow('filter_contenu', 'Tous les contenus', 'Contenu', CONTENTS, filters.contenu),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('consulter_search').setLabel('🔍 Rechercher').setStyle(ButtonStyle.Primary)
        )
    ];
}

function getCurrentFilters(message) {
    const filters = { classe: 'ALL', role: 'ALL', contenu: 'ALL' };
    for (const row of message.components) {
        for (const comp of row.components) {
            if (!comp.options) continue;
            const value = comp.options.find(o => o.default)?.value || 'ALL';
            if (comp.customId === 'filter_classe') filters.classe = value;
            if (comp.customId === 'filter_role') filters.role = value;
            if (comp.customId === 'filter_contenu') filters.contenu = value;
        }
    }
    return filters;
}

function queryBuilds(filters) {
    let query = 'SELECT * FROM builds WHERE 1=1';
    const params = [];
    if (filters.classe !== 'ALL') { query += ' AND class = ?'; params.push(filters.classe); }
    if (filters.role !== 'ALL') { query += ' AND role = ?'; params.push(filters.role); }
    if (filters.contenu !== 'ALL') { query += ' AND content = ?'; params.push(filters.contenu); }
    query += ' ORDER BY created_at DESC';
    return db.prepare(query).all(...params);
}

function buildResultView(builds, page, filters) {
    const total = builds.length;
    const embed = buildEmbed(builds[page], ` • Build ${page + 1}/${total}`);

    const encode = (p) => `consultpage|${p}|${filters.classe}|${filters.role}|${filters.contenu}`;
    const prevDisabled = page === 0;
    const nextDisabled = page === total - 1;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(prevDisabled ? 'noop_prev' : encode(page - 1))
            .setLabel('◀️ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(prevDisabled),
        new ButtonBuilder()
            .setCustomId(nextDisabled ? 'noop_next' : encode(page + 1))
            .setLabel('Suivant ▶️').setStyle(ButtonStyle.Secondary).setDisabled(nextDisabled)
    );

    return { embed, row };
}

// ---------- execute / autocomplete ----------

async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'ajouter') {
        await showAjouterModal(interaction);
        return;
    }

    if (sub === 'consulter') {
        await interaction.reply({
            content: 'Choisis tes filtres (ou laisse "Toutes/Tous") puis clique sur Rechercher :',
            components: consulterRows(),
            ephemeral: true
        });
        return;
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

        await showModifierModal(interaction, existing);
        return;
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
            content: '⚠️ Confirmer la suppression de ce build ?',
            embeds: [buildEmbed(existing)],
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

async function handleModalSubmit(interaction) {
    if (interaction.customId === 'ajouter_modal') {
        const classe = interaction.fields.getStringSelectValues('classe')[0];
        const role = interaction.fields.getStringSelectValues('role')[0];
        const contenu = interaction.fields.getStringSelectValues('contenu')[0];
        const titre = interaction.fields.getTextInputValue('titre') || null;
        const lien = interaction.fields.getTextInputValue('lien');

        const result = db.prepare(`
            INSERT INTO builds (owner_id, owner_username, class, role, content, title, link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(interaction.user.id, interaction.user.username, classe, role, contenu, titre, lien);

        const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(result.lastInsertRowid);

        await interaction.reply({
            content: '✅ Build créé ! Tu peux ajouter des stats maintenant ou plus tard via `/build modifier`.',
            embeds: [buildEmbed(build)],
            components: afterSaveComponents(build.id),
            ephemeral: true
        });
        return;
    }

    const modMatch = interaction.customId.match(/^modifier_modal_(\d+)$/);
    if (modMatch) {
        const id = modMatch[1];
        const existing = db.prepare('SELECT * FROM builds WHERE id = ?').get(id);
        if (!existing || existing.owner_id !== interaction.user.id) {
            await interaction.reply({ content: '❌ Action impossible.', ephemeral: true });
            return;
        }

        const classe = interaction.fields.getStringSelectValues('classe')[0];
        const role = interaction.fields.getStringSelectValues('role')[0];
        const contenu = interaction.fields.getStringSelectValues('contenu')[0];
        const titre = interaction.fields.getTextInputValue('titre') || null;
        const lien = interaction.fields.getTextInputValue('lien');

        db.prepare(`
      UPDATE builds SET class = ?, role = ?, content = ?, title = ?, link = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(classe, role, contenu, titre, lien, id);

        const updated = db.prepare('SELECT * FROM builds WHERE id = ?').get(id);

        await interaction.reply({
            content: '✅ Build modifié ! Tu peux aussi ajuster les stats ci-dessous.',
            embeds: [buildEmbed(updated)],
            components: afterSaveComponents(id),
            ephemeral: true
        });
        return;
    }

    const offMatch = interaction.customId.match(/^statsoff_modal_(\d+)$/);
    const defMatch = interaction.customId.match(/^statsdef_modal_(\d+)$/);

    if (offMatch || defMatch) {
        const id = (offMatch || defMatch)[1];
        const existing = db.prepare('SELECT * FROM builds WHERE id = ?').get(id);
        if (!existing || existing.owner_id !== interaction.user.id) {
            await interaction.reply({ content: '❌ Action impossible.', ephemeral: true });
            return;
        }

        const fieldsList = offMatch ? OFFENSIVE_FIELDS : DEFENSIVE_FIELDS;
        const updates = [];
        const params = [];
        for (const f of fieldsList) {
            const raw = interaction.fields.getTextInputValue(f.id);
            if (raw !== '') {
                const num = parseInt(raw, 10);
                if (!Number.isNaN(num)) {
                    updates.push(`stat_${f.id} = ?`);
                    params.push(num);
                }
            }
        }

        if (updates.length) {
            updates.push("updated_at = datetime('now')");
            params.push(id);
            db.prepare(`UPDATE builds SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        const updated = db.prepare('SELECT * FROM builds WHERE id = ?').get(id);
        await interaction.reply({
            content: '✅ Stats mises à jour !',
            embeds: [buildEmbed(updated)],
            components: afterSaveComponents(id),
            ephemeral: true
        });
    }
}

async function handleSelectMenu(interaction) {
    if (!['filter_classe', 'filter_role', 'filter_contenu'].includes(interaction.customId)) return;

    const filters = getCurrentFilters(interaction.message);
    const value = interaction.values[0];
    if (interaction.customId === 'filter_classe') filters.classe = value;
    if (interaction.customId === 'filter_role') filters.role = value;
    if (interaction.customId === 'filter_contenu') filters.contenu = value;

    await interaction.update({ components: consulterRows(filters) });
}

async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'noop_prev' || customId === 'noop_next') return;

    if (customId === 'consulter_search') {
        const filters = getCurrentFilters(interaction.message);
        const builds = queryBuilds(filters);
        if (builds.length === 0) {
            await interaction.update({ content: 'Aucun build trouvé avec ces critères.', embeds: [], components: [] });
            return;
        }
        const { embed, row } = buildResultView(builds, 0, filters);
        await interaction.update({ content: null, embeds: [embed], components: [row] });
        return;
    }

    if (customId.startsWith('consultpage|')) {
        const [, pageStr, classe, role, contenu] = customId.split('|');
        const filters = { classe, role, contenu };
        const builds = queryBuilds(filters);
        const page = parseInt(pageStr, 10);
        const { embed, row } = buildResultView(builds, page, filters);
        await interaction.update({ embeds: [embed], components: [row] });
        return;
    }

    if (customId.startsWith('addstats_off_')) {
        const id = customId.replace('addstats_off_', '');
        await interaction.showModal(statsModal(`statsoff_modal_${id}`, 'Stats offensives', OFFENSIVE_FIELDS));
        return;
    }
    if (customId.startsWith('addstats_def_')) {
        const id = customId.replace('addstats_def_', '');
        await interaction.showModal(statsModal(`statsdef_modal_${id}`, 'Stats défensives', DEFENSIVE_FIELDS));
        return;
    }
    if (customId.startsWith('addstats_done_')) {
        await interaction.update({ content: '✅ Build finalisé.', components: [] });
        return;
    }

    const [action, decision, id] = customId.split('_');
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
    await interaction.update({ content: '🗑️ Build supprimé avec succès.', embeds: [], components: [] });
}

module.exports = { data, execute, autocomplete, handleButton, handleModalSubmit, handleSelectMenu };