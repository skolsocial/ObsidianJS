// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;


// static utility imports *****************************************************
const CalendarJS = globalThis.Calendar;
const ScriptableLocation = globalThis.Location;

// Utility classes ************************************************************
// DateFormatter class for consistent date/time formatting
class DateFormatter {

	// Parse a date string or return Date object as-is 
  static parseDate(input) { 
	if (!input) return null; 
	if (input instanceof Date) return input; 
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
  
  // Format time as 12-hour: 09:00 AM
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

		// If it's already an array, process it
		if (Array.isArray(tags)) {
			return tags.map((tag) => this._cleanTag(tag)).filter((tag) => tag);
		}

		// If it's a string, split by common delimiters
		if (typeof tags === "string") {
			// Handle: "work, urgent" or "work urgent" or "#work #urgent"
			return tags
				.split(/[,\s]+/) // Split on comma or space
				.map((tag) => this._cleanTag(tag)) // Clean each tag
				.filter((tag) => tag); // Remove empty strings
		}

		return [];
	}

	_cleanTag(tag) {
		return tag.trim().replace(/^#/, ""); // Remove # and whitespace
	}

	// Convert to array (for FrontMatter YAML)
	toArray() {
		return this.tags;
	}

	// Convert to inline format with hashes (for Task markdown)
	toInlineString(separator = ObsidianTask.space) {
		if (this.tags.length === 0) return ObsidianFile.nullstring;
		return this.tags.map((tag) => `#${tag}`).join(separator);
	}

	// Add a tag
	add(tag) {
		const cleaned = this._cleanTag(tag);
		if (cleaned && !this.tags.includes(cleaned)) {
			this.tags.push(cleaned);
		}
	}

	// Remove a tag
	remove(tag) {
		const cleaned = this._cleanTag(tag);
		this.tags = this.tags.filter((t) => t !== cleaned);
	}

	// Check if tag exists
	has(tag) {
		const cleaned = this._cleanTag(tag);
		return this.tags.includes(cleaned);
	}

	// Get count
	get length() {
		return this.tags.length;
	}

	// Check if empty
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

			// Handle arrays [item1, item2]
			if (
				value.startsWith(FrontMatter.leftsquarebracket) &&
				value.endsWith(FrontMatter.rightsquarebracket)
			) {
				value = value
					.slice(1, -1)
					.split(FrontMatter.comma)
					.map((item) =>
						item
							.trim()
							.replace(/^["']|["']$/g, ObsidianFile.nullstring)
					);
			}
			// Handle quoted strings
			else if (
				(value.startsWith(FrontMatter.doublequote) &&
					value.endsWith(FrontMatter.doublequote)) ||
				(value.startsWith(FrontMatter.singlequote) &&
					value.endsWith(FrontMatter.singlequote))
			) {
				value = value.slice(1, -1);
			}
			// Handle booleans and numbers
			else if (value === FrontMatter.true_string) value = true;
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
			this.data[key]= tagsObj.toArray();
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
				lines.push(
					`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`
				);
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
	static header = "#";
	static space = " ";

	constructor({
		header = ObsidianFile.nullstring,
		content = ObsidianFile.nullstring,
		level = 1,
		parent = null,
	}) {
		this.header = header;
		this.content = content;
		this.level = level; // Header level (1-6 for H1-H6)
		this._parent = parent;
	}

	_notifyParent() {
		if (this._parent) {
			this._parent._markDirty();
		}
	}

	get headerMarkdown() {
		if (!this.header) return ObsidianFile.nullstring;
		return Section.header.repeat(this.level) + Section.space + this.header;
	}

	append(text) {
		if (this.content && !this.content.endsWith(ObsidianFile.newline)) {
			this.content += ObsidianFile.newline;
		}
		this.content += text;
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
			parts.push(this.content);
		}
		return parts.join(ObsidianFile.newline);
	}

	// Get all subsections (sections with higher level numbers)
	getSubsections(allSections) {
		const currentIndex = allSections.indexOf(this);
		if (currentIndex === -1) return [];

		const subsections = [];
		for (let i = currentIndex + 1; i < allSections.length; i++) {
			const section = allSections[i];
			if (section.level <= this.level) break; // Stop at same or higher level
			subsections.push(section);
		}
		return subsections;
	}
}

// Classes that extend/use base classes ***************************************
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
		this.tags = new Tags(tags); // Use Tags object
	}

	toMarkdown() {
		let line = this.completed
			? ObsidianTask.checkboxCompleted
			: ObsidianTask.checkbox;
		line += ObsidianTask.space + this.description;

		if (this.dueDate) {
			line += ` 📅 ${DateFormatter.toISO(this.dueDate)}`;
		}

		if (this.scheduledDate) {
			line += ` ⏰ ${DateFormatter.toISO(this.scheduledDate)}`;
		}

		if (this.startDate) {
			line += ` 🛫 ${DateFormatter.toISO(this.startDate)}`;
		}

		line += this.getPrioritySymbol();

		// Use Tags inline format
		if (!this.tags.isEmpty()) {
			line += ObsidianTask.space + this.tags.toInlineString();
		}

		return line;
	}
}


class Sections {
	constructor(sectionsArray, parent) {
		this._sections = sectionsArray;
		this._parent = parent; // Reference to ObsidianNote
	}

	// Find by simple header name (first match)
	find(headerText) {
		return this._sections.find(
			(section) =>
				section.header.toLowerCase() === headerText.toLowerCase()
		);
	}

	// Find by path
	findByPath(pathString, delimiter = " > ") {
		const pathParts = pathString.split(delimiter).map((s) => s.trim());

		let currentLevel = 0;
		let found = null;

		for (const headerText of pathParts) {
			const startIndex = found ? this._sections.indexOf(found) + 1 : 0;

			found = null;
			for (let i = startIndex; i < this._sections.length; i++) {
				const section = this._sections[i];

				if (
					found === null &&
					currentLevel > 0 &&
					section.level <= currentLevel
				) {
					break;
				}

				if (section.header.toLowerCase() === headerText.toLowerCase()) {
					found = section;
					currentLevel = section.level;
					break;
				}
			}

			if (!found) return null;
		}

		return found;
	}

	// Find all sections with matching header
	findAll(headerText) {
		return this._sections.filter(
			(section) =>
				section.header.toLowerCase() === headerText.toLowerCase()
		);
	}

	// Find by level
	findByLevel(level) {
		return this._sections.filter((section) => section.level === level);
	}

	// Add a new section
	add(
		headerText,
		content = ObsidianFile.nullstring,
		level = 1,
		insertAfter = null
	) {
		const newSection = new Section({
			header: headerText,
			content,
			level,
			parent: this._parent,
		});

		if (insertAfter) {
			const index = this._sections.findIndex(
				(s) => s.header === insertAfter
			);
			if (index !== -1) {
				this._sections.splice(index + 1, 0, newSection);
			} else {
				this._sections.push(newSection);
			}
		} else {
			this._sections.push(newSection);
		}

		this._parent._markDirty();
		return newSection; // Return the section for immediate use
	}

	// Remove a section
	remove(headerOrSection) {
		let index;

		if (typeof headerOrSection === "string") {
			// Remove by header text (first match)
			index = this._sections.findIndex(
				(s) => s.header === headerOrSection
			);
		} else {
			// Remove the specific Section object
			index = this._sections.indexOf(headerOrSection);
		}

		if (index !== -1) {
			this._sections.splice(index, 1);
			this._parent._markDirty();
			return true;
		}
		return false;
	}

	// Get all as array
	toArray() {
		return this._sections;
	}

	// Get all headers
	getHeaders() {
		return this._sections
			.filter((section) => section.header)
			.map((section) => ({
				text: section.header,
				level: section.level,
				section: section,
			}));
	}

	// Allow iteration
	[Symbol.iterator]() {
		return this._sections[Symbol.iterator]();
	}

	get length() {
		return this._sections.length;
	}
}

// ObsidianNote class extending your ObsidianFile
class ObsidianNote extends ObsidianFile {
	constructor(options) {
		super(options);
		this._frontMatter = null;
		this._sections = null;
		this._parsed = false;
	}

	// Parse the file into frontmatter and sections
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

		// Check for frontmatter
		if (lines[0] === FrontMatter.lines) {
			for (let i = 1; i < lines.length; i++) {
				if (lines[i] === FrontMatter.lines) {
					frontMatterEnd = i + 1;
					frontMatterContent = lines
						.slice(1, i)
						.join(ObsidianFile.newline);
					break;
				}
			}
		}

		this._frontMatter = new FrontMatter(frontMatterContent);

		// Parse sections
		this._sections = [];
		const contentLines = lines.slice(frontMatterEnd);

		let currentSection = new Section({
			header: ObsidianFile.nullstring,
			content: ObsidianFile.nullstring,
			level: 0,
			parent: this,
		}); // Root section

		for (const line of contentLines) {
			const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

			if (headerMatch) {
				// Save previous section if it has content
				if (currentSection.header || currentSection.content.trim()) {
					this._sections.push(currentSection);
				}

				// Start new section
				const level = headerMatch[1].length;
				const header = headerMatch[2];
				currentSection = new Section({
					header,
					content: ObsidianFile.nullstring,
					level,
					parent: this,
				});
			} else {
				// Add line to current section content
				if (currentSection.content || line.trim()) {
					// Don't add empty lines at start
					currentSection.content +=
						(currentSection.content
							? ObsidianFile.newline
							: ObsidianFile.nullstring) + line;
				}
			}
		}

		// Don't forget the last section
		if (currentSection.header || currentSection.content.trim()) {
			this._sections.push(currentSection);
		}

		this._parsed = true;
	}

	// Get frontmatter
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

	// Get all sections
	get sections() {
		this.parse();
		return new Sections(this._sections, this);
	}

	// add location functionality to Obidian note
    async addLocationToFrontmatter(key = 'location') {
        const location = await ObsidianLocation.getCurrent();
        const coords = ObsidianLocation.toCoordinatesString(location);
        this.setFrontMatterProperty(key, coords);
        return location;
    }
    
    async appendToLocationsHistory() {
        const location = await ObsidianLocation.getCurrent();
        const coords = ObsidianLocation.toCoordinatesString(location);
        const timestamp = DateFormatter.toISO(new Date()) + ' ' + DateFormatter.toTime24Hour(new Date());
        
        // Get existing locations array
        const locations = this.frontMatter.get('locations') || [];
        locations.push(`${timestamp}: ${coords}`);
        
        this.setFrontMatterProperty('locations', locations);
        return location;
    }

	// Save changes back to file
	save() {
		this.parse(); // Ensure we're parsed

		const parts = [];

		// Add frontmatter if it exists
		if (this._frontMatter.exists()) {
			parts.push(this._frontMatter.toString());
		}

		// Add sections
		for (const section of this._sections) {
			if (
				parts.length > 0 &&
				!parts[parts.length - 1].endsWith(ObsidianFile.newline)
			) {
				parts.push(ObsidianFile.nullstring); // Add blank line
			}
			parts.push(section.toString());
		}

		this.write(parts.join(ObsidianFile.newline));
		this._markDirty(false);
	}

	// Mark as needing save
	_markDirty(dirty = true) {
		this._isDirty = dirty;
	}

	get isDirty() {
		return this._isDirty || false;
	}

	// Get all headers as a flat list
	getHeaders() {
		return this.sections
			.filter((section) => section.header)
			.map((section) => ({
				text: section.header,
				level: section.level,
				section: section,
			}));
	}

	// Get content without frontmatter
	getContent() {
		return this.sections
			.map((section) => section.toString())
			.join(ObsidianFile.newline);
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
		return this.attendees
			.map((a) => a.emailAddress)
			.filter((email) => email);
	}

	hasAttendees() {
		return this.attendees.length > 0;
	}

	getOtherAttendees() {
		return this.attendees.filter((a) => !a.isCurrentUser);
	}
	
	// generate a consistant hash for deduplication
	getEventHash() {
	
		const startISO = this.startDate.toISOString();
		const endISO = this.endDate.toISOString();
		const hashString = `${this.title}|${startISO}|${endISO}`;
		
		let hash = 0;
		for (let i = 0; i < hashString.length; i++) {
			const char = hashString.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}	
		return hash.toString();
	}
	
toDayPlannerString(newLines = 2) {
    let result = '';
    
    // Time and title
    if (this.isAllDay) {
        result = `${ObsidianTask.checkbox} ${this.title} (All Day)`;
    } else {
        const startTime = DateFormatter.toTime24Hour(this.startDate);
        const endTime = DateFormatter.toTime24Hour(this.endDate);
        result = `${ObsidianTask.checkbox} ${startTime} - ${endTime} ${this.title}`;
    }
    
    // Add attendees if they exist
    if (this.hasAttendees()) {
        const attendeeNames = this.getAttendeeNames();
        result += `${ObsidianFile.newline}  - Attendees: ${attendeeNames.join(', ')}`;
    }
    
    // Add notes if they exist
    if (this.notes && this.notes.trim()) {
        result += `${ObsidianFile.newline}  - Notes: ${this.notes.trim()}`;
    }
    
    // Add multiple newlines
    return result + ObsidianFile.newline.repeat(newLines);
	}

}

// ObsidianCalendar - manages calendar access with wrapped events
class ObsidianCalendar {
	// Factory method handles both string and array
	static async create(calendarNames) {
		const calendar = new ObsidianCalendar();
		await calendar._initializeCalendars(calendarNames);
		return calendar;
	}

	async _initializeCalendars(calendarNames) {
		// Handle string, array, or nothing
		if (!calendarNames) {
			this.calendars = await CalendarJS.forEvents();
		} else {
			// Convert string to array if needed
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

		// Use native CalendarEvent.between()
		const events = await CalendarEvent.between(startOfDay, endOfDay, this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getEventsBetween(startDate, endDate) {
		// Use native CalendarEvent.between()
		const events = await CalendarEvent.between(startDate, endDate, this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getById(id) {
		// Fetch today's events and search for matching ID
		const allEvents = await this.getTodaysEvents();
		const event = allEvents.find(e => e.id === id);
		return event || null;
	}

	async getTodaysEvents() {
		// Use native CalendarEvent.today()
		const events = await CalendarEvent.today(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getTomorrowsEvents() {
		// Use native CalendarEvent.tomorrow()
		const events = await CalendarEvent.tomorrow(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getYesterdaysEvents() {
		// Use native CalendarEvent.yesterday()
		const events = await CalendarEvent.yesterday(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getThisWeeksEvents() {
		// Use native CalendarEvent.thisWeek()
		const events = await CalendarEvent.thisWeek(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getNextWeeksEvents() {
		// Use native CalendarEvent.nextWeek()
		const events = await CalendarEvent.nextWeek(this.calendars);
		return events.map((event) => new ObsidianCalendarEvent(event));
	}

	async getLastWeeksEvents() {
		// Use native CalendarEvent.lastWeek()
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
class ObsidianLocation {
    // Get current location with specified accuracy
    static async getCurrent(accuracy = 'kilometer') {
        const accuracyMethods = {
            'best': ScriptableLocation.setAccuracyToBest,
            'tenMeters': ScriptableLocation.setAccuracyToTenMeters,
            'hundredMeters': ScriptableLocation.setAccuracyToHundredMeters,
            'kilometer': ScriptableLocation.setAccuracyToKilometer,
            'threeKilometers': ScriptableLocation.setAccuracyToThreeKilometers
        };
        
        if (accuracyMethods[accuracy]) {
            accuracyMethods[accuracy]();
        }
        
        const loc = await ScriptableLocation.current();
        return {
            latitude: loc.latitude,
            longitude: loc.longitude,
            altitude: loc.altitude,
            timestamp: new Date()
        };
    }
    
    // Get address from coordinates
    static async reverseGeocode(latitude, longitude) {
        const results = await ScriptableLocation.reverseGeocode(latitude, longitude);
        if (results && results.length > 0) {
            const place = results[0];
            return {
                street: place.thoroughfare || '',
                city: place.locality || '',
                state: place.administrativeArea || '',
                country: place.country || '',
                postalCode: place.postalCode || '',
                formattedAddress: ObsidianLocation.formatAddress(place)
            };
        }
        return null;
    }
    
    static formatAddress(place) {
        const parts = [];
        if (place.thoroughfare) parts.push(place.thoroughfare);
        if (place.locality) parts.push(place.locality);
        if (place.administrativeArea) parts.push(place.administrativeArea);
        return parts.join(', ');
    }
    
    // Format as coordinates string
    static toCoordinatesString(location) {
        return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    
    // Format as Obsidian map link
    static toMapLink(location, label = 'Map') {
        const coords = ObsidianLocation.toCoordinatesString(location);
        return `[${label}](geo:${location.latitude},${location.longitude})`;
    }
    
    // Format as embedded map (using Obsidian Leaflet plugin syntax)
    static toEmbeddedMap(location, zoom = 15) {
        return `\`\`\`leaflet
			id: map-${Date.now()}
			lat: ${location.latitude}
			long: ${location.longitude}
			zoom: ${zoom}
			\`\`\``;
	}

class ObsidianController {
    // ... existing methods ...
    // 1. Journal entry with location link
    static async addJournalEntryWithLocation(params) {
        const { entry, date = new Date() } = params;
        
        const location = await ObsidianLocation.getCurrent();
        const mapLink = ObsidianLocation.toMapLink(location, '📍');
        const filename = `${DateFormatter.toISO(date)}.md`;
        const note = new ObsidianNote({
            folder: "Daily Notes",
            filename: filename
        });
        
        let section = note.sections.find("Journal");
        if (!section) {
            section = note.sections.add("Journal", "", 2);
        }
        
        section.append(`- ${entry} ${mapLink}`);
        await note.appendToLocationsHistory();
        note.save();
        return { success: true, location: ObsidianLocation.toCoordinatesString(location) };
    }
    
    // 2. Map journal entry (embedded map + text)
    static async addMapJournalEntry(params) {
        const { entry, locationName, date = new Date(), zoom = 15 } = params;
        const location = await ObsidianLocation.getCurrent();
        const address = await ObsidianLocation.reverseGeocode(location.latitude, location.longitude);
        const embeddedMap = ObsidianLocation.toEmbeddedMap(location, zoom);
        const displayName = locationName || address?.city || 'Current Location';
        const filename = `${DateFormatter.toISO(date)}.md`;
        const note = new ObsidianNote({
            folder: "Daily Notes",
            filename: filename
        });
        
        let section = note.sections.find("Journal");
        if (!section) {
            section = note.sections.add("Journal", "", 2);
        }
        
        const content = `### ${displayName}${ObsidianFile.newline}${embeddedMap}${ObsidianFile.newline}${entry}`;
        section.append(content);
        await note.appendToLocationsHistory();
        note.save();
        return { success: true, location: displayName };
    }
    
    // 3. Create new map note
    static async createMapNote(params) {
        const { title, content = '', folder = 'Maps', zoom = 15 } = params;
        const location = await ObsidianLocation.getCurrent();
        const address = await ObsidianLocation.reverseGeocode(location.latitude, location.longitude);
        const coords = ObsidianLocation.toCoordinatesString(location);
        const embeddedMap = ObsidianLocation.toEmbeddedMap(location, zoom);
        const filename = `${title || address?.formattedAddress || 'Location'}.md`;
        const note = new ObsidianNote({
            folder: folder,
            filename: filename
        });
        
        // Set frontmatter
        await note.addLocationToFrontmatter('location');
        note.setFrontMatterProperty('created', DateFormatter.toISO(new Date()) + ' ' + DateFormatter.toTime24Hour(new Date()));
        if (address) {
            note.setFrontMatterProperty('address', address.formattedAddress);
        }
        
        // Add map section
        const mapSection = note.sections.add(title || 'Location', embeddedMap, 1);
        if (content) {
            mapSection.append(ObsidianFile.newline + content);
        }
        note.save();       
        return { success: true, filename: filename, coordinates: coords };
    }
}
// Namespace and export *******************************************************
const ObsidianJS = {
	Calendar: ObsidianCalendar,
	CalendarEvent: ObsidianCalendarEvent,
	DateFormatter: DateFormatter,
	execute: ObsidianController.execute.bind(ObsidianController),
	File: ObsidianFile,
	FrontMatter: FrontMatter,
	Location: ObsidianLocation,
	Note: ObsidianNote,
	Section: Section,
	Sections: Sections,
	Tags: Tags,
	Task: ObsidianTask
};

module.exports = ObsidianJS;
