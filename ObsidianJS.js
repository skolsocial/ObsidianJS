// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;

// Config *********************************************************************
const ObsidianConfig = {
  dailyNotesFolder: "Daily Notes",
  bookmark: "obsidian_vault"
};

// static utility imports *****************************************************
const CalendarJS = globalThis.Calendar;

// Utility classes ************************************************************
// DateFormatter class for consistent date/time formatting
class DateFormatter {

	// Parse a date string or return Date object as-is
	static parseDate(input) {
		if (!input) return null;
		if (typeof input === 'object' && typeof input.getFullYear === 'function') return input;
		if (typeof input === 'string') return new Date(input);
		return null;
	}

	// Format date as ISO string: 2025-10-05
	static toISO(date) {
		date = DateFormatter.parseDate(date);
		if (!date) return ObsidianFile.nullstring;
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Format time as 12-hour: 9:00 AM
	static toTime12Hour(date) {
		date = DateFormatter.parseDate(date);
		if (!date) return ObsidianFile.nullstring;
		const hours = date.getHours();
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const ampm = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${minutes} ${ampm}`;
	}

	// Format time as 24-hour: 09:00
	static toTime24Hour(date) {
		date = DateFormatter.parseDate(date);
		if (!date) return ObsidianFile.nullstring;
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	// Format for filename: 2025-10-05
	static toFilename(date) {
		return DateFormatter.toISO(date);
	}

	// Format as display date: October 5, 2025
	static toDisplayDate(date) {
		date = DateFormatter.parseDate(date);
		if (!date) return ObsidianFile.nullstring;
		const options = { year: 'numeric', month: 'long', day: 'numeric' };
		return date.toLocaleDateString('en-US', options);
	}

	// Format as day of week: Monday
	static toDayOfWeek(date) {
		date = DateFormatter.parseDate(date);
		if (!date) return ObsidianFile.nullstring;
		const options = { weekday: 'long' };
		return date.toLocaleDateString('en-US', options);
	}

	// Format as short date: Oct 5, 2025
	static toShortDate(date) {
		date = DateFormatter.parseDate(date);
		if (!date) return ObsidianFile.nullstring;
		const options = { year: 'numeric', month: 'short', day: 'numeric' };
		return date.toLocaleDateString('en-US', options);
	}

	// Get today's date at midnight
	static getToday() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return today;
	}

	// Get start of day for any date
	static getStartOfDay(date) {
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		return start;
	}

	// Get end of day for any date
	static getEndOfDay(date) {
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);
		return end;
	}
}

// Tags class - central tag handling for both FrontMatter and Tasks
class Tags {
	constructor(tags = []) {
		this.tags = this._parseTags(tags);
	}

	_parseTags(tags) {
		if (!tags) return [];
		if (Array.isArray(tags)) {
			return tags.map((tag) => this._cleanTag(tag)).filter((tag) => tag);
		}
		if (typeof tags === "string") {
			return tags
				.split(/[,\s]+/)
				.map((tag) => this._cleanTag(tag))
				.filter((tag) => tag);
		}
		return [];
	}

	_cleanTag(tag) {
		return tag.trim().replace(/^#/, "");
	}

	toArray() {
		return this.tags;
	}

	toInlineString(separator = " ") {
		if (this.tags.length === 0) return ObsidianFile.nullstring;
		return this.tags.map((tag) => `#${tag}`).join(separator);
	}

	add(tag) {
		const cleaned = this._cleanTag(tag);
		if (cleaned && !this.tags.includes(cleaned)) {
			this.tags.push(cleaned);
		}
	}

	remove(tag) {
		const cleaned = this._cleanTag(tag);
		this.tags = this.tags.filter((t) => t !== cleaned);
	}

	has(tag) {
		const cleaned = this._cleanTag(tag);
		return this.tags.includes(cleaned);
	}

	get length() {
		return this.tags.length;
	}

	isEmpty() {
		return this.tags.length === 0;
	}
}

// Base classes ***************************************************************
// ObsidianFile class: Base class that handles file io
class ObsidianFile {
	static newline = "\n";
	static nullstring = "";

	constructor({
		bookmark = "obsidian_vault",
		folder = ObsidianFile.nullstring,
		filename = ObsidianFile.nullstring,
	}) {
		this.fm = FileManager.local();
		this.vaultPath = this.fm.bookmarkedPath(bookmark);
		this.folderPath = folder
			? this.fm.joinPath(this.vaultPath, folder)
			: this.vaultPath;
		this.fileName = filename;
		this.filePath = this.fm.joinPath(this.folderPath, this.fileName);
	}

	exists() {
		return this.fm.fileExists(this.filePath);
	}

	read() {
		if (!this.exists()) return ObsidianFile.nullstring;
		return this.fm.readString(this.filePath);
	}

	write(content) {
		this.fm.writeString(this.filePath, content);
	}

	append(content) {
		let existing = this.read();
		this.write([existing, content].join(ObsidianFile.newline));
	}

	getLines() {
		return this.read().split(ObsidianFile.newline);
	}

	saveLines(lines) {
		this.write(lines.join(ObsidianFile.newline));
	}

	static normalizePath(path) {
		return (path || '').replace(/\|/g, '/').replace(/\\\//g, '/');
	}

	static ensureDirectory(fm, path) {
		const parts = path.split('/');
		let current = '';
		for (const part of parts) {
			current = current ? fm.joinPath(current, part) : part;
			if (!fm.fileExists(current)) {
				fm.createDirectory(current, false);
			}
		}
	}
}

// FrontMatter class to handle YAML metadata
class FrontMatter {
	static comma = ",";
	static colon = ":";
	static doublequote = '"';
	static false_string = "false";
	static leftsquarebracket = "[";
	static lines = "---";
	static rightsquarebracket = "]";
	static singlequote = "'";
	static true_string = "true";

	constructor(yamlString = ObsidianFile.nullstring) {
		this.raw = yamlString;
		this.data = this.parse(yamlString);
	}

	parse(yamlString) {
		if (!yamlString.trim()) return {};
		const data = {};
		const lines = yamlString.split(ObsidianFile.newline);
		for (const line of lines) {
			if (line.trim() === FrontMatter.lines || !line.trim()) continue;
			const colonIndex = line.indexOf(FrontMatter.colon);
			if (colonIndex === -1) continue;
			const key = line.substring(0, colonIndex).trim();
			let value = line.substring(colonIndex + 1).trim();
			if (
				value.startsWith(FrontMatter.leftsquarebracket) &&
				value.endsWith(FrontMatter.rightsquarebracket)
			) {
				value = value
					.slice(1, -1)
					.split(FrontMatter.comma)
					.map((item) =>
						item.trim().replace(/^["']|["']$/g, ObsidianFile.nullstring)
					);
			} else if (
				(value.startsWith(FrontMatter.doublequote) &&
					value.endsWith(FrontMatter.doublequote)) ||
				(value.startsWith(FrontMatter.singlequote) &&
					value.endsWith(FrontMatter.singlequote))
			) {
				value = value.slice(1, -1);
			} else if (value === FrontMatter.true_string) value = true;
			else if (value === FrontMatter.false_string) value = false;
			else if (!isNaN(value) && !isNaN(parseFloat(value)))
				value = parseFloat(value);
			data[key] = value;
		}
		return data;
	}

	get(key) {
		return this.data[key];
	}

	set(key, value) {
		if (key === 'tags') {
			const tagsObj = new Tags(value);
			this.data[key] = tagsObj.toArray();
		} else {
			this.data[key] = value;
		}
	}

	remove(key) {
		delete this.data[key];
	}

	toString() {
		if (Object.keys(this.data).length === 0) return ObsidianFile.nullstring;
		const lines = [FrontMatter.lines];
		for (const [key, value] of Object.entries(this.data)) {
			if (Array.isArray(value)) {
				lines.push(`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`);
			} else if (typeof value === "string") {
				lines.push(`${key}: "${value}"`);
			} else {
				lines.push(`${key}: ${value}`);
			}
		}
		lines.push(FrontMatter.lines);
		return lines.join(ObsidianFile.newline);
	}

	exists() {
		return Object.keys(this.data).length > 0;
	}
}

// Section class to handle individual sections of content
class Section {
	static marker = "#";
	static space = " ";

	constructor({
		header = ObsidianFile.nullstring,
		content = ObsidianFile.nullstring,
		level = 1,
		parent = null,
	}) {
		this.header = header;
		this.content = content;
		this.level = level;
		this._parent = parent;
	}

	_notifyParent() {
		if (this._parent) {
			this._parent._markDirty();
		}
	}

	get headerMarkdown() {
		if (!this.header) return ObsidianFile.nullstring;
		return Section.marker.repeat(this.level) + Section.space + this.header;
	}

	append(text) {
		if (this.content) {
			this.content = this.content.trimEnd() + ObsidianFile.newline + text.trimStart();
		} else {
			this.content = text.trimStart();
		}
		this._notifyParent();
	}

	prepend(text) {
		if (text && !text.endsWith(ObsidianFile.newline)) {
			text += ObsidianFile.newline;
		}
		this.content = text + this.content;
		this._notifyParent();
	}

	isEmpty() {
		return !this.content.trim();
	}

	toString() {
		const parts = [];
		if (this.header) {
			parts.push(this.headerMarkdown);
		}
		if (this.content) {
			parts.push(this.content.trimEnd());
		}
		return parts.join(ObsidianFile.newline);
	}

	getSubsections(allSections) {
		const currentIndex = allSections.indexOf(this);
		if (currentIndex === -1) return [];
		const subsections = [];
		for (let i = currentIndex + 1; i < allSections.length; i++) {
			const section = allSections[i];
			if (section.level <= this.level) break;
			subsections.push(section);
		}
		return subsections;
	}
}

// Sections class - manages a collection of Section objects
class Sections {
	constructor(sectionsArray, parent) {
		this._sections = sectionsArray;
		this._parent = parent;
	}

	// Find first section matching header name (case-insensitive)
	find(headerText) {
		return this._sections.find(
			(section) => section.header.toLowerCase() === headerText.toLowerCase()
		);
	}

	// Find all sections matching header name
	findAll(headerText) {
		return this._sections.filter(
			(section) => section.header.toLowerCase() === headerText.toLowerCase()
		);
	}

	// Find sections by level
	findByLevel(level) {
		return this._sections.filter((section) => section.level === level);
	}

	// Add a new section at the end of the note
	add(headerText, content = ObsidianFile.nullstring, level = 1) {
		const newSection = new Section({
			header: headerText,
			content,
			level,
			parent: this._parent,
		});
		this._sections.push(newSection);
		this._parent._markDirty();
		return newSection;
	}

	// Remove a section by header text or Section object
	remove(headerOrSection) {
		let index;
		if (typeof headerOrSection === "string") {
			index = this._sections.findIndex((s) => s.header === headerOrSection);
		} else {
			index = this._sections.indexOf(headerOrSection);
		}
		if (index !== -1) {
			this._sections.splice(index, 1);
			this._parent._markDirty();
			return true;
		}
		return false;
	}

	toArray() {
		return this._sections;
	}

	getHeaders() {
		return this._sections
			.filter((section) => section.header)
			.map((section) => ({
				text: section.header,
				level: section.level,
				section: section,
			}));
	}

	[Symbol.iterator]() {
		return this._sections[Symbol.iterator]();
	}

	get length() {
		return this._sections.length;
	}
}

// ObsidianTask class
class ObsidianTask {
	static checkbox = "- [ ]";
	static checkboxCompleted = "- [x]";
	static space = " ";

	constructor({
		description = ObsidianFile.nullstring,
		completed = false,
		dueDate = null,
		scheduledDate = null,
		startDate = null,
		priority = null,
		tags = [],
	}) {
		this.description = description;
		this.completed = completed;
		this.dueDate = dueDate;
		this.scheduledDate = scheduledDate;
		this.startDate = startDate;
		this.priority = priority;
		this.tags = new Tags(tags);
	}

	toMarkdown() {
		let line = this.completed
			? ObsidianTask.checkboxCompleted
			: ObsidianTask.checkbox;
		line += ObsidianTask.space + this.description;
		if (this.dueDate) line += ` 📅 ${DateFormatter.toISO(this.dueDate)}`;
		if (this.scheduledDate) line += ` ⏰ ${DateFormatter.toISO(this.scheduledDate)}`;
		if (this.startDate) line += ` 🛫 ${DateFormatter.toISO(this.startDate)}`;
		if (!this.tags.isEmpty()) line += ObsidianTask.space + this.tags.toInlineString();
		return line;
	}
}

// ObsidianNote class
class ObsidianNote extends ObsidianFile {
	constructor(options) {
		super(options);
		this._frontMatter = null;
		this._sections = null;
		this._parsed = false;
	}

	parse() {
		if (this._parsed) return;
		const content = this.read();
		if (!content) {
			this._frontMatter = new FrontMatter();
			this._sections = [];
			this._parsed = true;
			return;
		}

		const lines = content.split(ObsidianFile.newline);
		let frontMatterEnd = 0;
		let frontMatterContent = ObsidianFile.nullstring;

		if (lines[0] === FrontMatter.lines) {
			for (let i = 1; i < lines.length; i++) {
				if (lines[i] === FrontMatter.lines) {
					frontMatterEnd = i + 1;
					frontMatterContent = lines.slice(1, i).join(ObsidianFile.newline);
					break;
				}
			}
		}

		this._frontMatter = new FrontMatter(frontMatterContent);
		this._sections = [];
		const contentLines = lines.slice(frontMatterEnd);

		let currentSection = new Section({
			header: ObsidianFile.nullstring,
			content: ObsidianFile.nullstring,
			level: 0,
			parent: this,
		});

		for (const line of contentLines) {
			const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
			if (headerMatch) {
				if (currentSection.header || currentSection.content.trim()) {
					this._sections.push(currentSection);
				}
				currentSection = new Section({
					header: headerMatch[2],
					content: ObsidianFile.nullstring,
					level: headerMatch[1].length,
					parent: this,
				});
			} else {
				if (currentSection.content || line.trim()) {
					currentSection.content +=
						(currentSection.content ? ObsidianFile.newline : ObsidianFile.nullstring) + line;
				}
			}
		}

		if (currentSection.header || currentSection.content.trim()) {
			this._sections.push(currentSection);
		}

		this._parsed = true;
	}

	get frontMatter() {
		this.parse();
		return this._frontMatter;
	}

	setFrontMatterProperty(key, value) {
		this.parse();
		this._frontMatter.set(key, value);
		this._markDirty();
		return this;
	}

	setFrontMatter(dataObject) {
		Object.entries(dataObject).forEach(([key, value]) => {
			this.setFrontMatterProperty(key, value);
		});
		return this;
	}

	append(content) {
		this.parse();
		const lastSection = this._sections[this._sections.length - 1];
		if (lastSection) {
			lastSection.append(content);
		} else {
			this._sections.push(new Section({
				header: ObsidianFile.nullstring,
				content: content,
				level: 0,
				parent: this,
			}));
		}
		this._markDirty();
	}

	get sections() {
		this.parse();
		return new Sections(this._sections, this);
	}

	save() {
		this.parse();
		const parts = [];
		if (this._frontMatter.exists()) {
			parts.push(this._frontMatter.toString());
		}
		for (const section of this._sections) {
			parts.push(section.toString());
		}
		this.write(parts.join(ObsidianFile.newline));
		this._markDirty(false);
	}

	_markDirty(dirty = true) {
		this._isDirty = dirty;
	}

	get isDirty() {
		return this._isDirty || false;
	}

	getHeaders() {
		return this.sections
			.filter((section) => section.header)
			.map((section) => ({
				text: section.header,
				level: section.level,
				section: section,
			}));
	}

	getContent() {
		return this.sections
			.map((section) => section.toString())
			.join(ObsidianFile.newline);
	}
}

// Entry classes **************************************************************
// Entry: base class for all note entries.
// All entries render as an H4 header + body text.
// Subclasses define what goes in the header and body.
class Entry {
	static level = 4;

	// Override in subclasses
	get header() {
		return ObsidianFile.nullstring;
	}

	// Override in subclasses
	get body() {
		return ObsidianFile.nullstring;
	}

	// Renders the full markdown block for appending to a note section
	toMarkdown() {
		const hashes = '#'.repeat(Entry.level);
		const parts = [];
		if (this.header) {
			parts.push(`${hashes} ${this.header}`);
		}
		if (this.body) {
			parts.push(this.body);
		}
		return parts.join(ObsidianFile.newline);
	}
}

// LogEntry: first line of text is the H4 header, remaining lines become bullets
class LogEntry extends Entry {
	constructor({ text = '' } = {}) {
		super();
		const lines = text.split('\n').map(l => l.trim()).filter(l => l);
		this._header = lines[0] || '';
		this._bullets = lines.slice(1);
	}

	get header() {
		return this._header;
	}

	get body() {
		if (this._bullets.length === 0) return ObsidianFile.nullstring;
		return this._bullets.map(l => `- ${l}`).join(ObsidianFile.newline);
	}
}

// CheckinEntry: timestamp + location link as header, optional note as body
class CheckinEntry extends Entry {
	constructor({ location = null, note = '' } = {}) {
		super();
		const time = DateFormatter.toTime12Hour(new Date());
		const loc = location && location.hasLocation;
		this._header = loc ? `${time} — ${location.mapViewUrl}` : time;
		this._body = note || ObsidianFile.nullstring;
	}

	get header() {
		return this._header;
	}

	get body() {
		return this._body;
	}
}

// PhotoEntry: timestamp + caption as header, Obsidian image embed as body
class PhotoEntry extends Entry {
	constructor({ caption = '', filename = '', assetsFolder = '' } = {}) {
		super();
		const time = DateFormatter.toTime12Hour(new Date());
		this._header = caption ? `${time} — ${caption}` : `${time} — Photo`;
		this._body = `![[${assetsFolder}/${filename}]]`;
	}

	get header() {
		return this._header;
	}

	get body() {
		return this._body;
	}
}

// LinkEntry: timestamp + page title as header, checkbox + cardlink block as body
class LinkEntry extends Entry {
	constructor({ url = '', title = '', description = '' } = {}) {
		super();
		const time = DateFormatter.toTime12Hour(new Date());
		const displayTitle = title || url;
		this._header = `${time} — ${displayTitle}`;

		const host = (() => {
			try { return new URL(url).hostname; } catch(e) { return ''; }
		})();

		const lines = [];
		lines.push(`- [ ] [${displayTitle}](${url})`);
		lines.push('');
		lines.push('```cardlink');
		lines.push(`url: ${url}`);
		lines.push(`title: "${displayTitle}"`);
		if (description) lines.push(`description: "${description}"`);
		if (host) lines.push(`host: ${host}`);
		lines.push('```');

		this._body = lines.join(ObsidianFile.newline);
	}

	get header() {
		return this._header;
	}

	get body() {
		return this._body;
	}
}

// Data/factory classes *******************************************************
// EntryLocation: holds and formats location data
class EntryLocation {
	constructor(locationDict = {}) {
		this.latitude = locationDict.latitude || '';
		this.longitude = locationDict.longitude || '';
		this.altitude = locationDict.altitude || '';
		this.poi = locationDict.poi || '';
		this.name = locationDict.name || '';
		this.street = locationDict.street || '';
		this.neighborhood = locationDict.neighborhood || '';
		this.city = locationDict.city || '';
		this.county = locationDict.county || '';
		this.state = locationDict.state || '';
		this.country = locationDict.country || '';
		this.zip = locationDict.zip || '';
		this.timezone = locationDict.timezone || '';
		this.isoCountry = locationDict.isoCountry || '';
	}

	get hasLocation() {
		return this.latitude && this.longitude;
	}

	get label() {
		if (this.poi) return this.poi;
		if (this.neighborhood && this.city) return `${this.neighborhood}, ${this.city}`;
		if (this.street) return this.street;
		if (this.city) return this.city;
		return `${this.latitude}, ${this.longitude}`;
	}

	get appleUrl() {
		const applemaps = 'https://maps.apple.com/?ll=';
		const latlong = `${this.latitude},${this.longitude}`;
		const query = encodeURIComponent(this.label);
		return `[${this.label}](${applemaps}${latlong}&q=${query})`;
	}

	get mapViewUrl() {
		return `[${this.label}](geo:${this.latitude},${this.longitude})`;
	}

	static async current() {
		const loc = await Location.current();
		const geo = await Location.reverseGeocode(loc.latitude, loc.longitude);
		const place = geo[0] || {};
		return new EntryLocation({
			latitude: loc.latitude,
			longitude: loc.longitude,
			altitude: loc.altitude,
			poi: (place.areasOfInterest && place.areasOfInterest.length)
				? place.areasOfInterest[0] : '',
			name: place.name || '',
			street: place.thoroughfare
				? `${place.subThoroughfare || ''} ${place.thoroughfare}`.trim() : '',
			city: place.locality || '',
			neighborhood: place.subLocality || '',
			state: place.postalAddress.state || place.administrativeArea || '',
			county: place.subAdministrativeArea || '',
			country: place.country || '',
			zip: place.postalCode || '',
			timezone: place.timeZone || '',
			isoCountry: place.isoCountryCode || ''
		});
	}
}

// EntryLinkData: fetches URL metadata, used to construct a LinkEntry
class EntryLinkData {
	constructor({ url = '', title = '', description = '' } = {}) {
		this.url = url;
		this.title = title || url;
		this.description = description;
	}

	static async fetch(url) {
		try {
			const req = new Request(url);
			req.timeoutInterval = 10;
			const html = await req.loadString();
			const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
			const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
			const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
			const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
			const title = (ogTitle?.[1] || titleMatch?.[1] || '').trim();
			const description = (ogDesc?.[1] || metaDesc?.[1] || '').trim();
			return { title, description };
		} catch (e) {
			return { title: '', description: '' };
		}
	}

	static async create(url) {
		const { title, description } = await EntryLinkData.fetch(url);
		return new EntryLinkData({ url, title, description });
	}
}

// EntryPhotoData: saves an image to the vault, used to construct a PhotoEntry
class EntryPhotoData {
	constructor({ caption = '', filename = '', assetsFolder = '' } = {}) {
		this.caption = caption;
		this.filename = filename;
		this.assetsFolder = assetsFolder;
	}

	static async create({ caption = '', assetsFolder = '', bookmark = '' } = {}) {
		const image = args.images[0];
		if (!image) throw new Error("No image provided");
		const now = new Date();
		const d = DateFormatter.toFilename(now);
		const t = DateFormatter.toTime24Hour(now).replace(':', '');
		const filename = `${d}-${t}.jpg`;
		const fm = FileManager.local();
		const vaultPath = fm.bookmarkedPath(bookmark);
		const folderPath = fm.joinPath(vaultPath, assetsFolder);
		if (!fm.fileExists(folderPath)) {
			ObsidianFile.ensureDirectory(fm, folderPath);
		}
		fm.write(fm.joinPath(folderPath, filename), Data.fromJPEG(image));
		return new EntryPhotoData({ caption, filename, assetsFolder });
	}
}

// DailyNote class ************************************************************
class DailyNote extends ObsidianNote {

	constructor(params = {}) {
		if (!params.config) throw new Error("Config is required");
		const config = params.config;
		const bookmark = config.bookmark;
		const folder = ObsidianFile.normalizePath(config.dailyNotesFolder);
		super({
			bookmark,
			folder,
			filename: DateFormatter.toFilename(new Date()) + ".md"
		});
		this._params = params;
	}

	async init() {
		const isNew = !this.exists();

		if (isNew) {
			const iso = DateFormatter.toISO(new Date());
			const time = DateFormatter.toTime24Hour(new Date());
			this.setFrontMatter({
				created: `${iso} ${time}`,
				tags: ["daily-notes"],
				type: "note"
			});
		}

		if (this._params.log) {
			this._addToNote(
				new LogEntry({ text: this._params.log.text }),
				this._params.log.section
			);
		}

		if (this._params.checkin) {
			const location = await EntryLocation.current();
			// Also stamp location in frontmatter on first checkin of a new note
			if (isNew && location.hasLocation) {
				this.setFrontMatterProperty('location',
					`${location.latitude},${location.longitude}`);
			}
			this._addToNote(
				new CheckinEntry({
					location,
					note: this._params.checkin.note || ''
				}),
				this._params.checkin.section
			);
		}

		if (this._params.photo) {
			const assetsFolder = ObsidianFile.normalizePath(
				this._params.config.assetsFolder
			);
			const photoData = await EntryPhotoData.create({
				caption: this._params.photo.caption || '',
				assetsFolder: assetsFolder || '',
				bookmark: this._params.config.bookmark
			});
			this._addToNote(
				new PhotoEntry({
					caption: photoData.caption,
					filename: photoData.filename,
					assetsFolder: photoData.assetsFolder
				}),
				this._params.photo.section
			);
		}

		if (this._params.link) {
			const linkData = await EntryLinkData.create(this._params.link.url);
			this._addToNote(
				new LinkEntry({
					url: linkData.url,
					title: linkData.title,
					description: linkData.description
				}),
				this._params.link.section
			);
		}

		return this;
	}

	// Append an entry to a named section.
	// If the section exists: append the entry's markdown to it.
	// If not: create the section at the bottom, then append.
	// If no section specified: append to the bottom of the note.
	_addToNote(entry, sectionName = null) {
		const markdown = entry.toMarkdown();

		if (sectionName) {
			let section = this.sections.find(sectionName);
			if (!section) {
				section = this.sections.add(sectionName, ObsidianFile.nullstring, 2);
			}
			section.append(markdown);
		} else {
			// No section — append to the last section or create a root section
			this.append(markdown);
		}
	}
}

// ObsidianCalendarEvent - wraps the native Scriptable CalendarEvent
class ObsidianCalendarEvent {
	constructor(nativeEvent) {
		this.nativeEvent = nativeEvent;
		this.title = nativeEvent.title;
		this.startDate = nativeEvent.startDate;
		this.endDate = nativeEvent.endDate;
		this.isAllDay = nativeEvent.isAllDay;
		this.location = nativeEvent.location || ObsidianFile.nullstring;
		this.notes = nativeEvent.notes || ObsidianFile.nullstring;
		this.calendarName = nativeEvent.calendar.title;
		this.id = nativeEvent.identifier;
		this.attendees = nativeEvent.attendees || [];
	}

	getDurationHours() {
		return (this.endDate - this.startDate) / (1000 * 60 * 60);
	}

	isMajorEvent(predicateFn) {
		return predicateFn(this);
	}

	getAttendeeNames() {
		return this.attendees.map((a) => a.name).filter((name) => name);
	}

	getAttendeeEmails() {
		return this.attendees.map((a) => a.emailAddress).filter((email) => email);
	}

	hasAttendees() {
		return this.attendees.length > 0;
	}

	getOtherAttendees() {
		return this.attendees.filter((a) => !a.isCurrentUser);
	}
}

// ObsidianCalendar - manages calendar access with wrapped events
class ObsidianCalendar {
	static async create(calendarNames) {
		const calendar = new ObsidianCalendar();
		await calendar._initializeCalendars(calendarNames);
		return calendar;
	}

	async _initializeCalendars(calendarNames) {
		if (!calendarNames) {
			this.calendars = await CalendarJS.forEvents();
		} else {
			const namesArray = Array.isArray(calendarNames)
				? calendarNames
				: [calendarNames];
			this.calendars = await this._findCalendarsByName(namesArray);
		}
	}

	async _findCalendarsByName(names) {
		const allCalendars = await CalendarJS.forEvents();
		return allCalendars.filter((cal) => names.includes(cal.title));
	}

	async getEventsForDate(date) {
		const startOfDay = DateFormatter.getStartOfDay(date);
		const endOfDay = DateFormatter.getEndOfDay(date);
		const events = await CalendarEvent.between(startOfDay, endOfDay, this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getEventsBetween(startDate, endDate) {
		const events = await CalendarEvent.between(startDate, endDate, this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getById(id) {
		const allEvents = await this.getTodaysEvents();
		const event = allEvents.find(e => e.id === id);
		return event || null;
	}

	async getTodaysEvents() {
		const events = await CalendarEvent.today(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getTomorrowsEvents() {
		const events = await CalendarEvent.tomorrow(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getYesterdaysEvents() {
		const events = await CalendarEvent.yesterday(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getThisWeeksEvents() {
		const events = await CalendarEvent.thisWeek(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getNextWeeksEvents() {
		const events = await CalendarEvent.nextWeek(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getLastWeeksEvents() {
		const events = await CalendarEvent.lastWeek(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getMajorEvents(startDate, endDate, predicateFn) {
		const events = await this.getEventsBetween(startDate, endDate);
		return events.filter((event) => event.isMajorEvent(predicateFn));
	}

	async getMajorEventsForDate(date, predicateFn) {
		const events = await this.getEventsForDate(date);
		return events.filter((event) => event.isMajorEvent(predicateFn));
	}

	getCalendarNames() {
		return this.calendars ? this.calendars.map((cal) => cal.title) : [];
	}
}

// Namespace and export *******************************************************
const ObsidianJS = {
	Calendar: ObsidianCalendar,
	CalendarEvent: ObsidianCalendarEvent,
	Config: ObsidianConfig,
	DateFormatter: DateFormatter,
	DailyNote: DailyNote,
	Entry: Entry,
	CheckinEntry: CheckinEntry,
	LinkEntry: LinkEntry,
	LogEntry: LogEntry,
	PhotoEntry: PhotoEntry,
	EntryLinkData: EntryLinkData,
	EntryLocation: EntryLocation,
	EntryPhotoData: EntryPhotoData,
	File: ObsidianFile,
	FrontMatter: FrontMatter,
	Note: ObsidianNote,
	Section: Section,
	Sections: Sections,
	Tags: Tags,
	Task: ObsidianTask
};

module.exports = ObsidianJS;
