// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
// DailyNoteEntry.js
// Called from iOS Shortcuts with: { text }

const ojs = importModule("ObsidianJS");
const params = args.shortcutParameter;
const text = params.text || "";

async function getCoordinates() {
  try {
    const location = await Promise.race([
      Location.current(),
      new Promise((_, reject) =>
        Timer.schedule(10, false, () => reject(new Error("GPS timeout")))
      )
    ]);
    return {
      latitude: location.latitude.toFixed(6),
      longitude: location.longitude.toFixed(6)
    };
  } catch (e) {
    return { latitude: "", longitude: "" };
  }
}

// --- Main ---

const now = new Date();
const filename = `${ojs.DateFormatter.toFilename(now)}.md`;
const timestamp = `${ojs.DateFormatter.toISO(now)} ${ojs.DateFormatter.toTime24Hour(now)}`;
const timeHeader = ojs.DateFormatter.toTime24Hour(now);
const coords = await getCoordinates();

const note = new ojs.Note({
  folder: "Daily Notes",
  filename: filename
});

if (!note.exists()) {
  note.setFrontMatter({
    created: timestamp,
    tags: ["daily-notes"],
    location: `${coords.latitude}, ${coords.longitude}`,
    locations: null,
    type: "note"
  });
}

note.append(`\n### ${timeHeader}\n\n${text}`);

Script.setShortcutOutput("OK");
Script.complete();
