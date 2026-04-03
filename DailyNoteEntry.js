// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
const ojs = importModule("ObsidianJS");

const params = args.shortcutParameter || { 
  	config: { 
      bookmark: "obsidian_vault", 
      dailyNotesFolder: "Daily Notes" 
  }, 
  log: { text: 
    "Test entry" 
  } 
};

const note = await new ojs.DailyNote(params).init();
note.save();

Script.setShortcutOutput("OK");
Script.complete();
