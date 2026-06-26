const { EmbedBuilder } = require('discord.js');

function buildEmbed(b, extraFooter = '') {
    const embed = new EmbedBuilder()
        .setTitle(`${b.class} — ${b.role} — ${b.content}${b.title ? ` (${b.title})` : ''}`)
        .setColor(0x5865F2)
        .addFields({ name: '🔗 Lien', value: b.link })
        .setFooter({ text: `Par ${b.owner_username}${extraFooter}` });

    const off = [];
    if (b.stat_proficiency != null) off.push(`Proficiency: **${b.stat_proficiency}**`);
    if (b.stat_determination != null) off.push(`Determination: **${b.stat_determination}**`);
    if (b.stat_brutality != null) off.push(`Brutality: **${b.stat_brutality}**`);
    if (b.stat_luck != null) off.push(`Luck: **${b.stat_luck}**`);
    if (b.stat_supremacy != null) off.push(`Supremacy: **${b.stat_supremacy}**`);
    if (off.length) embed.addFields({ name: '⚔️ Stats offensives', value: off.join('\n'), inline: true });

    const def = [];
    if (b.stat_vitality != null) def.push(`Vitality: **${b.stat_vitality}**`);
    if (b.stat_bloodlust != null) def.push(`Bloodlust: **${b.stat_bloodlust}**`);
    if (b.stat_survivability != null) def.push(`Survivability: **${b.stat_survivability}**`);
    if (b.stat_caution != null) def.push(`Caution: **${b.stat_caution}**`);
    if (def.length) embed.addFields({ name: '🛡️ Stats défensives', value: def.join('\n'), inline: true });

    return embed;
}

module.exports = { buildEmbed };