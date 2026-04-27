// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
const ojs = importModule("ObsidianJS");
const input = args.shortcutParameter || {};

// build config
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const monthName = ojs.DateFormatter.toDisplayDate(now).split(' ')[0];
const config = {
  bookmark: "obsidian_vault",
  dailyNotes: {
  folder: "Daily Notes",
  template: "Obsidian/Templates/Daily Note.md"
  },
  assetsFolder: `Daily Notes/${year}/${month} ${monthName}/assets`
};
// route by type
const type = input.type;
const payload = { config };
payload[type] = input;

const note = await new ojs.DailyNote(payload).init();
// note.save();

console.log(JSON.stringify(payload));

Script.setShortcutOutput("OK");
Script.complete();
