const Database = require('better-sqlite3');
const path = require('node:path');

const db = new Database(path.join(__dirname, 'builds.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS builds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id TEXT NOT NULL,
    owner_username TEXT,
    class TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    title TEXT,
    link TEXT NOT NULL,
    stat_proficiency INTEGER,
    stat_determination INTEGER,
    stat_brutality INTEGER,
    stat_luck INTEGER,
    stat_supremacy INTEGER,
    stat_vitality INTEGER,
    stat_bloodlust INTEGER,
    stat_survivability INTEGER,
    stat_caution INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

module.exports = db;