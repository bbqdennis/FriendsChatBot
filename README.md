# MSN Chat Viewer

MSN Chat Viewer is a single-page web app for browsing exported MSN Messenger XML logs directly in the browser. It offers chat-style rendering, nickname selection, keyword highlights, and automatic conversion of classic MSN emoticon shortcuts into modern emoji.

## Project layout

- `ChatHistory/index.html` – Main HTML page that wires up the interface, loads styles, and pulls in the JavaScript bundle.
- `ChatHistory/styles.css` – Styling for the viewer shell, chat bubbles, buttons, and responsive layout.
- `ChatHistory/app.js` – All client-side logic: file reading, XML parsing, rendering, search, emoji substitution, and identity inference.
- `ChatHistory/XML/` – Sample MSN Messenger logs plus the original stylesheet included with the export.
- `MSN_Chat_Viewer_spec.txt` – Requirements brief provided by the user, kept verbatim as a reference.

## JavaScript functions

_All functions live in `ChatHistory/app.js`._

- `setStatus(message)` – Updates the status banner with contextual feedback.
- `handleFileSelection(event)` – Reads the selected XML file, parses it, and populates state.
- `enableControls()` – Unlocks search/reload controls once a log loads successfully.
- `resetApp()` – Clears state, UI, and returns the viewer to the landing state.
- `triggerSearch()` – Stores the current keyword and re-renders messages with highlights.
- `populateIdentityOptions()` – Refreshes the "我的暱稱" selector using parsed participant names.
- `renderMessages(searchTerm)` – Builds the chat transcript DOM and applies match highlighting.
- `formatMessageText(rawText, normalizedTerm)` – Converts message text into safe HTML with emoji, highlights, and line breaks.
- `formatDate(date)` – Formats message timestamps using a zh-Hant presentation.
- `escapeHtml(text)` – Escapes HTML-sensitive characters in raw log content.
- `escapeRegExp(text)` – Escapes strings before inserting them into regular expressions.
- `replaceEmoticons(html)` – Swaps MSN emoticon shortcuts for their modern emoji equivalents.
- `formatDisplayName(name)` – Applies emoticon replacement to display names with a fallback label.
- `showError(message)` – Renders an error banner within the chat window when parsing fails.
- `parseMsnXml(xmlString)` – Parses the raw XML string into message objects and participant statistics.
- `decodeMessageNode(node, index)` – Normalizes a `<Message>` element into the internal message structure.
- `extractSender(node)` – Retrieves the sender's friendly name from attributes or nested metadata.
- `findFriendlyName(contextNode, allowTextFallback)` – Recursively searches a node tree for display-name attributes or text.
- `extractMessageText(node)` – Pulls the textual payload from `<Text>` nodes or inline text fallback.
- `collectTextContent(node)` – Flattens nested `<Text>` content while preserving emoticon shortcuts, breaks, and links.
- `extractTimestamp(node)` – Derives a JavaScript `Date` from the various timestamp fields on a message.
- `combineTimestamp(previous, nextPart)` – Merges separate date/time fragments into one timestamp string.
- `parseTimestampString(value)` – Attempts multiple date formats until a valid `Date` can be produced.
- `getAttributeCaseInsensitive(node, attributeName)` – Looks up attributes without caring about case differences.
- `inferSelfIdentity(parsed, messages)` – Guesses which participant is the local user to align the bubbles by default.

## Running the viewer

Serve the `ChatHistory/` directory with any static file server (for example `python3 -m http.server`) and open `http://localhost:8000/index.html`. Choose an XML file to load, then adjust "我的暱稱" and search as needed.
