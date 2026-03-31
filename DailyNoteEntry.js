// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
const ojs = importModule("ObsidianJS");
const params = args.shortcutParameter || { config: {}, log: { text: "Test entry" } };

new ojs.DailyNote(params).save();

Script.setShortcutOutput("OK");
Script.complete();
