// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
const ojs = importModule("ObsidianJS");
const params = args.shortcutParameter || { 
  text: "Blank entry",
  latitude: '',
  longitude: '',
  name: '',
  street: ''
	};

const location = new ojs.EntryLocation(
  { latitude: params.location.latitude, 
    longitude: params.location.longitude,
    name: params.location.name,
    street: params.location.street
  });
const note = new ojs.Note({ folder: "Daily Notes", filename: ojs.DateFormatter.toFilename(new Date()) + ".md" });

if (!note.exists()) {
  note.setFrontMatter({ created: ojs.DateFormatter.toISO(new Date()), tags: ["daily-notes"], location: "", locations: null, type: "note" });
}

note.append("\n#### " + ojs.DateFormatter.toTime24Hour(new Date()) + "\n" + params.text);
note.save();
Script.setShortcutOutput("OK");
Script.complete();
