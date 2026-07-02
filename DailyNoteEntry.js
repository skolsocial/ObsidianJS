// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;

const ojs = importModule("ObsidianJS");

async function main() {
	const input = args.shortcutParameter || {};

	const done = () => {
		Script.setShortcutOutput("OK");
		Script.complete();
	};

	if (input.type === "setup") {
		ojs.Config.setup(input.scriptableBookmark, input.configPath);
		return done();
	}

	const config = ojs.Config.load();

	if (input.type === "assemble") {
		await new ojs.QuickNoteAssembler(config).run();
		return done();
	}

	const payload = { config };
	payload[input.type] = input;

	if (String(input.quick).toLowerCase() === "true") {
		await new ojs.QuickNote(payload).run();
	} else {
		await new ojs.DailyNote(payload).run();
	}

	done();
}

main();
