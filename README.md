# ObsidianJS Library Documentation

A JavaScript library for Scriptable (iOS) to interact with Obsidian vaults, manage notes, and integrate with iOS Calendar.

## Table of Contents

- [[# Utility Classes]]
    - [[# DateFormatter]]
    - [[# Tags]]
- [[# File Management]]
    - [[# ObsidianFile]]
    - [[# ObsidianNote]]
- [[# Note Components]]
    - [[# FrontMatter]]
    - [[# Section]]
    - [[# Sections]]
- [[# Task Management]]
    - [[# ObsidianTask]]
- [[# Calendar Integration]]
    - [[# Calendar]]
    - [[# CalendarEvent]]

---

## Installation

```javascript
const ObsidianJS = importModule('ObsidianJS');
```

---

## Utility Classes

### DateFormatter

Static utility class for consistent date and time formatting.

#### Methods

##### `parseDate(input)`

Parse a date string or return Date object as-is.

- **input**: `Date | String | null`
- **Returns**: `Date | null`

##### `toISO(date)`

Format date as ISO string.

- **date**: `Date | String`
- **Returns**: `String` - Format: `2025-10-05`

##### `toTime12Hour(date)`

Format time in 12-hour format.

- **date**: `Date | String`
- **Returns**: `String` - Format: `09:00 AM`

##### `toTime24Hour(date)`

Format time in 24-hour format.

- **date**: `Date | String`
- **Returns**: `String` - Format: `09:00`

##### `toFilename(date)`

Format date for use in filenames.

- **date**: `Date | String`
- **Returns**: `String` - Format: `2025-10-05`

##### `toDisplayDate(date)`

Format date for display.

- **date**: `Date | String`
- **Returns**: `String` - Format: `October 5, 2025`

##### `toDayOfWeek(date)`

Get day of week name.

- **date**: `Date | String`
- **Returns**: `String` - Format: `Monday`

##### `toShortDate(date)`

Format date in short format.

- **date**: `Date | String`
- **Returns**: `String` - Format: `Oct 5, 2025`

##### `getToday()`

Get today's date at midnight.

- **Returns**: `Date`

##### `getStartOfDay(date)`

Get start of day (00:00:00) for any date.

- **date**: `Date | String`
- **Returns**: `Date`

##### `getEndOfDay(date)`

Get end of day (23:59:59) for any date.

- **date**: `Date | String`
- **Returns**: `Date`

#### Example Usage

```javascript
const now = new Date();
DateFormatter.toISO(now);           // "2025-10-05"
DateFormatter.toTime12Hour(now);    // "2:30 PM"
DateFormatter.toDisplayDate(now);   // "October 5, 2025"

// Also accepts strings
DateFormatter.toISO('2025-10-05');  // "2025-10-05"
```

---

### Tags

Centralized tag handling for both FrontMatter YAML and inline markdown tags.

#### Constructor

```javascript
new Tags(tags)
```

- **tags**: `Array<String> | String` - Array of tags or comma/space-separated string

#### Methods

##### `toArray()`

Convert to array (for FrontMatter YAML).

- **Returns**: `Array<String>` - Tags without `#` prefix

##### `toInlineString(separator = ' ')`

Convert to inline format with hashes (for Task markdown).

- **separator**: `String` - Separator between tags
- **Returns**: `String` - Format: `#work #urgent`

##### `add(tag)`

Add a tag if it doesn't exist.

- **tag**: `String` - Tag to add (with or without `#`)

##### `remove(tag)`

Remove a tag.

- **tag**: `String` - Tag to remove

##### `has(tag)`

Check if tag exists.

- **tag**: `String` - Tag to check
- **Returns**: `Boolean`

##### `isEmpty()`

Check if no tags exist.

- **Returns**: `Boolean`

#### Properties

##### `length`

Number of tags.

- **Type**: `Number` (read-only)

#### Example Usage

```javascript
// From string (iOS Shortcuts friendly)
const tags = new ObsidianJS.Tags('work, urgent, home');

// From array
const tags2 = new ObsidianJS.Tags(['work', 'urgent']);

// Manipulate
tags.add('priority');
tags.remove('home');
tags.has('work');        // true

// Output
tags.toArray();          // ['work', 'urgent', 'priority']
tags.toInlineString();   // '#work #urgent #priority'
```

---

## File Management

### ObsidianFile

Base class for file I/O operations with Obsidian vault.

#### Constructor

```javascript
new ObsidianFile({ bookmark, folder, filename })
```

- **bookmark**: `String` - Scriptable bookmark name (default: `"obsidian_vault"`)
- **folder**: `String` - Folder path within vault (default: `""`)
- **filename**: `String` - File name (default: `""`)

#### Static Properties

- `newline`: `String` - `"\n"`
- `nullstring`: `String` - `""`

#### Methods

##### `exists()`

Check if file exists.

- **Returns**: `Boolean`

##### `read()`

Read file contents.

- **Returns**: `String` - File contents or empty string if not exists

##### `write(content)`

Write content to file.

- **content**: `String` - Content to write

##### `append(content)`

Append content to file.

- **content**: `String` - Content to append

##### `getLines()`

Get file contents as array of lines.

- **Returns**: `Array<String>`

##### `saveLines(lines)`

Save array of lines to file.

- **lines**: `Array<String>`

#### Example Usage

```javascript
const file = new ObsidianJS.File({
  folder: 'Daily Notes',
  filename: '2025-10-05.md'
});

if (file.exists()) {
  const content = file.read();
  file.append('\nNew line');
}
```

---

### ObsidianNote

Extended file class for managing Obsidian notes with frontmatter and sections.

#### Constructor

```javascript
new ObsidianNote({ bookmark, folder, filename })
```

Same parameters as ObsidianFile.

#### Properties

##### `frontMatter`

Get frontmatter object (auto-parses on first access).

- **Type**: `FrontMatter` (read-only)

##### `sections`

Get sections collection (auto-parses on first access).

- **Type**: `Sections` (read-only)

##### `isDirty`

Check if note has unsaved changes.

- **Type**: `Boolean` (read-only)

#### Methods

##### `setFrontMatterProperty(key, value)`

Set a single frontmatter property.

- **key**: `String`
- **value**: `Any`
- **Returns**: `this` (chainable)

##### `setFrontMatter(dataObject)`

Set multiple frontmatter properties.

- **dataObject**: `Object` - Key-value pairs
- **Returns**: `this` (chainable)

##### `save()`

Save all changes to file.

##### `getHeaders()`

Get all section headers as flat list.

- **Returns**: `Array<Object>` - Format: `[{ text, level, section }]`

##### `getContent()`

Get all content without frontmatter.

- **Returns**: `String`

#### Example Usage

```javascript
const note = new ObsidianJS.Note({
  folder: 'Daily Notes',
  filename: '2025-10-05.md'
});

// Set frontmatter
note.setFrontMatter({
  created: '2025-10-05',
  tags: 'daily-notes, work'
});

// Work with sections
const section = note.sections.find('Tasks');
section.append('- [ ] New task');

// Save changes
note.save();
```

---

## Note Components

### FrontMatter

Handles YAML frontmatter parsing and generation.

#### Constructor

```javascript
new FrontMatter(yamlString)
```

- **yamlString**: `String` - YAML content (without `---` delimiters)

#### Methods

##### `get(key)`

Get frontmatter property value.

- **key**: `String`
- **Returns**: `Any`

##### `set(key, value)`

Set frontmatter property. Automatically normalizes tags.

- **key**: `String`
- **value**: `Any`

##### `remove(key)`

Remove frontmatter property.

- **key**: `String`

##### `toString()`

Convert to YAML string with delimiters.

- **Returns**: `String`

##### `exists()`

Check if frontmatter has any properties.

- **Returns**: `Boolean`

#### Example Usage

```javascript
const fm = note.frontMatter;
fm.set('title', 'My Note');
fm.set('tags', 'work, urgent');  // Normalized to array
fm.get('title');                 // "My Note"
fm.remove('draft');
```

---

### Section

Represents a single section of a note (header + content).

#### Constructor

```javascript
new Section({ header, content, level, parent })
```

- **header**: `String` - Header text (without `#`)
- **content**: `String` - Section content
- **level**: `Number` - Header level (1-6 for H1-H6)
- **parent**: `ObsidianNote` - Parent note (for dirty tracking)

#### Properties

##### `headerMarkdown`

Get formatted header with `#` symbols.

- **Type**: `String` (read-only)

#### Methods

##### `append(text)`

Append text to section content.

- **text**: `String`

##### `prepend(text)`

Prepend text to section content.

- **text**: `String`

##### `isEmpty()`

Check if section has no content.

- **Returns**: `Boolean`

##### `toString()`

Convert to markdown string.

- **Returns**: `String`

##### `getSubsections(allSections)`

Get all subsections (higher level numbers).

- **allSections**: `Array<Section>` - All sections in note
- **Returns**: `Array<Section>`

#### Example Usage

```javascript
const section = note.sections.find('Introduction');
section.append('More content');
section.prepend('Opening line');
console.log(section.isEmpty());  // false
```

---

### Sections

Collection class for managing multiple sections within a note.

#### Methods

##### `find(headerText)`

Find first section with matching header.

- **headerText**: `String` - Header text to search (case-insensitive)
- **Returns**: `Section | undefined`

##### `findByPath(pathString, delimiter = ' > ')`

Find section by hierarchical path.

- **pathString**: `String` - Format: `"Parent > Child > Section"`
- **delimiter**: `String` - Path separator
- **Returns**: `Section | null`

##### `findAll(headerText)`

Find all sections with matching header.

- **headerText**: `String`
- **Returns**: `Array<Section>`

##### `findByLevel(level)`

Find all sections at specific level.

- **level**: `Number` - Header level (1-6)
- **Returns**: `Array<Section>`

##### `add(headerText, content, level, insertAfter)`

Add a new section.

- **headerText**: `String`
- **content**: `String` (optional)
- **level**: `Number` (default: 1)
- **insertAfter**: `String` - Header to insert after (optional)
- **Returns**: `Section` - The created section

##### `remove(headerOrSection)`

Remove a section.

- **headerOrSection**: `String | Section` - Header text or Section object
- **Returns**: `Boolean` - Success status

##### `toArray()`

Get sections as array.

- **Returns**: `Array<Section>`

##### `getHeaders()`

Get all headers with metadata.

- **Returns**: `Array<Object>` - Format: `[{ text, level, section }]`

#### Properties

##### `length`

Number of sections.

- **Type**: `Number` (read-only)

#### Example Usage

```javascript
// Find sections
const intro = note.sections.find('Introduction');
const nested = note.sections.findByPath('2025-10-05 > Attendees');
const allH2 = note.sections.findByLevel(2);

// Add section
note.sections.add('Conclusion', 'Final thoughts', 1);

// Remove section
const section = note.sections.findByPath('2025-10-05 > Notes');
note.sections.remove(section);

// Iterate
for (const section of note.sections) {
  console.log(section.header);
}
```

---

## Task Management

### ObsidianTask

Represents a task in Obsidian Tasks plugin format.

#### Constructor

```javascript
new ObsidianTask({
  description,
  completed,
  dueDate,
  scheduledDate,
  startDate,
  priority,
  tags
})
```

- **description**: `String` - Task description
- **completed**: `Boolean` - Completion status (default: false)
- **dueDate**: `Date | String | null` - Due date
- **scheduledDate**: `Date | String | null` - Scheduled date
- **startDate**: `Date | String | null` - Start date
- **priority**: `'high' | 'medium' | 'low' | null` - Priority level
- **tags**: `Array<String> | String` - Tags (accepts arrays or comma/space-separated strings)

#### Properties

- **tags**: `Tags` - Tags object

#### Methods

##### `toMarkdown()`

Convert task to Obsidian Tasks plugin markdown format.

- **Returns**: `String`

Format: `- [ ] Description 📅 YYYY-MM-DD ⏰ YYYY-MM-DD 🛫 YYYY-MM-DD ⏫ #tag1 #tag2`

#### Example Usage

```javascript
// iOS Shortcuts friendly - pass strings
const task = new ObsidianJS.Task({
  description: 'Call plumber',
  dueDate: '2025-10-10',
  priority: 'high',
  tags: 'home, urgent'
});

console.log(task.toMarkdown());
// - [ ] Call plumber 📅 2025-10-10 ⏫ #home #urgent

// Script friendly - pass objects/arrays
const task2 = new ObsidianJS.Task({
  description: 'Review code',
  dueDate: new Date('2025-10-10'),
  tags: ['work', 'code-review']
});

// Manipulate tags
task2.tags.add('urgent');
task2.tags.remove('code-review');
```

---

## Calendar Integration

### Calendar

Wrapper around iOS Calendar API for fetching events.

#### Constructor

```javascript
new Calendar(calendarNames)
```

- **calendarNames**: `Array<String>` - Calendar names to include. Empty = all calendars

#### Methods

##### `getEventsForDate(date)`

Get all events for a specific date.

- **date**: `Date`
- **Returns**: `Array<CalendarEvent>`

##### `getEventsBetween(startDate, endDate)`

Get all events within date range.

- **startDate**: `Date`
- **endDate**: `Date`
- **Returns**: `Array<CalendarEvent>`

##### `getById(id)`

Get specific event by identifier.

- **id**: `String` - Event identifier
- **Returns**: `CalendarEvent | null`

##### `getTodaysEvents()`

Get all events for today.

- **Returns**: `Array<CalendarEvent>`

##### `getMajorEvents(startDate, endDate, predicateFn)`

Get events matching predicate within date range.

- **startDate**: `Date`
- **endDate**: `Date`
- **predicateFn**: `Function(CalendarEvent) => Boolean` - Filter function
- **Returns**: `Array<CalendarEvent>`

##### `getMajorEventsForDate(date, predicateFn)`

Get events matching predicate for specific date.

- **date**: `Date`
- **predicateFn**: `Function(CalendarEvent) => Boolean` - Filter function
- **Returns**: `Array<CalendarEvent>`

##### `getCalendarNames()`

Get names of all monitored calendars.

- **Returns**: `Array<String>`

#### Example Usage

```javascript
const cal = new ObsidianJS.Calendar(['Work', 'Personal']);

// Get events
const today = cal.getTodaysEvents();
const thisMonth = cal.getEventsBetween(
  new Date('2025-10-01'),
  new Date('2025-10-31')
);

// Find major events (duration >= 2 hours)
const longEvents = cal.getMajorEvents(
  new Date('2025-10-01'),
  new Date('2025-10-31'),
  (event) => event.getDurationHours() >= 2
);

// All-day events
const allDay = cal.getMajorEvents(
  new Date('2025-10-01'),
  new Date('2025-12-31'),
  (event) => event.isAllDay
);

// Events marked in notes
const marked = cal.getMajorEvents(
  new Date('2025-10-01'),
  new Date('2025-12-31'),
  (event) => event.notes.includes('[major]')
);
```

---

### CalendarEvent

Represents a calendar event with helper methods.

#### Constructor

```javascript
new CalendarEvent(nativeEvent)
```

- **nativeEvent**: `Object` - Native Scriptable Calendar event
- **Note**: Typically created by Calendar methods, not directly

#### Properties (Read-only)

|Property|Type|Description|
|---|---|---|
|`title`|`String`|Event title|
|`startDate`|`Date`|Start date/time|
|`endDate`|`Date`|End date/time|
|`isAllDay`|`Boolean`|All-day event flag|
|`location`|`String`|Event location|
|`notes`|`String`|Event notes|
|`calendarName`|`String`|Calendar name|
|`id`|`String`|Event identifier|
|`attendees`|`Array<Object>`|Attendee objects|
|`nativeEvent`|`Object`|Native event object|

#### Methods

##### `getDurationHours()`

Calculate event duration in hours.

- **Returns**: `Number`

##### `isMajorEvent(predicateFn)`

Test if event matches predicate.

- **predicateFn**: `Function(CalendarEvent) => Boolean`
- **Returns**: `Boolean`

##### `getAttendeeNames()`

Get names of all attendees.

- **Returns**: `Array<String>`

##### `getAttendeeEmails()`

Get email addresses of all attendees.

- **Returns**: `Array<String>`

##### `hasAttendees()`

Check if event has attendees.

- **Returns**: `Boolean`

##### `getOtherAttendees()`

Get attendees excluding current user.

- **Returns**: `Array<Object>`

#### Example Usage

```javascript
const events = cal.getTodaysEvents();
const event = events[0];

// Access properties
console.log(event.title);              // "Team Meeting"
console.log(event.location);           // "Conference Room A"
console.log(event.getDurationHours()); // 1.5

// Check attendees
if (event.hasAttendees()) {
  const names = event.getAttendeeNames();
  console.log(`Attendees: ${names.join(', ')}`);
}

// Custom predicate
const isLong = event.isMajorEvent(e => e.getDurationHours() > 2);
```

---

## Complete Example

```javascript
const ObsidianJS = importModule('ObsidianJS');

// Get today's calendar events
const cal = new ObsidianJS.Calendar(['Work', 'Personal']);
const events = cal.getTodaysEvents();

// Create/update daily note
const today = DateFormatter.toFilename(new Date());
const note = new ObsidianJS.Note({
  folder: 'Daily Notes',
  filename: `${today}.md`
});

// Set frontmatter
note.setFrontMatter({
  created: today,
  tags: 'daily-notes'
});

// Update Day Planner section
const dayPlanner = note.sections.find('Day Planner');
if (dayPlanner) {
  const eventLines = events.map(e => {
    const time = e.isAllDay 
      ? 'All Day'
      : `${DateFormatter.toTime12Hour(e.startDate)} - ${DateFormatter.toTime12Hour(e.endDate)}`;
    return `- ${time} ${e.title}`;
  }).join('\n');
  
  dayPlanner.setContent(eventLines);
}

// Add tasks
const tasks = note.sections.find('Tasks');
if (tasks) {
  const task = new ObsidianJS.Task({
    description: 'Review meeting notes',
    dueDate: today,
    tags: 'work'
  });
  tasks.append(task.toMarkdown());
}

// Save all changes
note.save();
```

---
