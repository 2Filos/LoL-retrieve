# Lesson 2: Reading matchups.html

This lesson explains the structure of the main HTML file in this project: [matchups.html](../matchups.html).

The goal is to connect the general web concepts from the first lesson to the actual page that you are working with.

This file is not just a list of tags. It is the skeleton of the whole editor experience. When you read it, try to answer one question at a time: “What part of the app is this block creating?”

### What to look for in the real file
Pay special attention to the header, the sidebar, the textarea, the buttons, and the script tags. Those are the parts that matter most for understanding how the app works.

---

## 1. What this file is

The file matchups.html is the skeleton of the app.

It defines:
- the visible layout
- the main sections of the page
- the inputs and buttons the user interacts with
- the external files that provide styling and behavior

If you open the file, you can think of it as the blueprint for the whole editor.

---

## 2. The first line: doctype

At the very top of the file you will see:

```html
<!DOCTYPE html>
```

This tells the browser that the document uses HTML5.

It does not show anything visible on the page.

Its job is simply to tell the browser how to interpret the file.

---

## 3. The root element: html

The next major tag is:

```html
<html lang="en">
```

This is the root of the page.

Everything else lives inside it.

The `lang="en"` attribute says that the page language is English.

---

## 4. The head section

Inside the html tag, the first major section is the head:

```html
<head>
  ...
</head>
```

The head is not visible to the user.

It contains setup information such as:
- the page title
- character encoding
- links to stylesheets
- links to JavaScript files

### Important pieces inside head

#### Title

```html
<title>LoL Matchup Portal</title>
```

This is the text shown in the browser tab.

#### Meta charset

```html
<meta charset="UTF-8">
```

This tells the browser how to read the text correctly.

#### External CSS link

```html
<link rel="stylesheet" href="style.css">
```

This tells the browser to load the stylesheet file for the page.

That stylesheet controls the look and layout of the UI.

---

## 5. The body section

After the head comes the body:

```html
<body>
  ...
</body>
```

This is the visible part of the page.

Everything the user sees is inside the body.

---

## 6. The app container

Inside the body, the first important visible block is:

```html
<div class="app-container">
```

This is a container that wraps the whole app.

It helps organize the layout.

A `div` is just a generic container element. It does not have a special meaning by itself, but it is very useful for grouping content.

---

## 7. The header

The page has a header section:

```html
<header>
  <h1>LoL Matchup Portal</h1>
  <div id="connectionStatus" class="status-badge pinging">
    Pinging GitHub API...
  </div>
</header>
```

### What this means
- `<header>` marks the top section of the page
- `<h1>` is the main title
- the connection status area is a little badge that shows whether the app can reach GitHub

This region is the top bar of the app.

---

## 8. The error banners

The page contains several warning or error banners:

```html
<div id="configError" class="error-banner" style="display: none;">
```

These sections are hidden by default.

They appear only when something goes wrong, such as:
- missing configuration
- broken bridge connection
- bad token

### Why this matters
These blocks are not always visible, but they are part of the app’s feedback system.

They tell the user what is wrong.

---

## 9. The main layout container

A very important block is:

```html
<div class="main-layout">
```

This is the main layout structure.

It usually contains multiple columns or sections.

In this project, it holds:
- the sidebar
- the main editor panel

This is one of the core layout containers of the page.

---

## 10. The sidebar

Inside the main layout is a sidebar section:

```html
<div class="sidebar">
```

The sidebar contains controls and lists.

It usually holds:
- champion selection inputs
- load button
- local drafts list
- saved matchups list

### Why this exists
The sidebar is for navigation and state overview.

It helps the user see what they can load or what they already saved.

---

## 11. The form card

Inside the sidebar, there is a card block:

```html
<div class="card">
```

This is a visual grouping container.

Inside it, there are form fields:

```html
<input type="text" id="myChamp" list="championList" placeholder="e.g. Yasuo" disabled>
```

### What this means
- `input` creates a field
- `type="text"` means plain text input
- `id="myChamp"` gives it a unique identifier
- `list="championList"` connects it to a datalist of possible values
- `placeholder` gives an example hint
- `disabled` means the user cannot type into it yet until the app enables it later

This is a good example of how HTML and JavaScript work together.

The HTML creates the field; JavaScript later controls it.

---

## 12. The load button

There is a button like this:

```html
<button id="loadBtn" onclick="loadMatchup()" disabled>Load Matchup</button>
```

### What it means
- `button` creates a clickable action
- `id` gives it a name for JavaScript
- `onclick="loadMatchup()"` says: when clicked, run the function loadMatchup()
- `disabled` means it is inactive until the app enables it

This is a very clear example of HTML connected to JavaScript behavior.

---

## 13. The drafts and saved matchups sections

The sidebar also contains two panels:

```html
<div class="card drafts-panel">
```

and

```html
<div class="card saved-panel">
```

These are likely containers for the lists of:
- pending local drafts
- saved matchups

They are not just decorative. They are part of the app’s state display system.

---

## 14. The main editor card

The main content area is another important section:

```html
<div class="card editor-card">
```

This is the primary editing area.

It contains:
- the current file label
- the star button
- conflict warning banner
- the textarea for notes
- the detected links section
- the action buttons

This is the core workspace of the app.

---

## 15. The editor textarea

The main note entry area is:

```html
<textarea id="editor" placeholder="Select a matchup to start writing notes..." disabled></textarea>
```

This is the most important input in the whole page.

It is where the user writes the matchup notes.

### What matters here
- `textarea` creates a multiline text area
- `id="editor"` gives it a name the JavaScript can target
- `placeholder` shows a hint when empty
- `disabled` means it starts inactive until the app enables it

This is the main writing surface of the app.

---

## 16. The detected links area

Below the editor there is a section for detected links:

```html
<div id="detectedLinksContainer" class="detected-links-container">
```

This is not the main text editor, but a support area.

Its purpose is to show links that appear in the notes.

This is a good example of HTML being used to display dynamic content generated by JavaScript.

---

## 17. The action row

At the bottom of the editor panel there is a row of buttons and status text:

```html
<div class="editor-actions">
```

This includes:
- the status label
- a Mobalytics link button
- the discard draft button
- the sync button

This part is the control bar for the editor.

---

## 18. The datalist container

Near the bottom of the file there is:

```html
<datalist id="championList"></datalist>
```

A datalist provides autocomplete suggestions for an input.

It does not show a visible list by itself.

It is connected to the input fields above.

This is how the app provides champion suggestions.

---

## 19. The script tags

At the end of the file, you will see several script tags:

```html
<script src="utils.js"></script>
<script src="api.js"></script>
<script src="config.js" onerror="handleConfigMissing()"></script>
<script src="editor.js"></script>
```

These files are loaded in order.

### Why this order matters
The page loads the JavaScript files one by one.

That means the app depends on the earlier files being available before later ones run.

In this project:
- utils.js provides helper functions
- api.js handles networking and bridge behavior
- config.js provides optional local config
- editor.js handles the editor interface and logic

---

## 20. How to read this file well

When you study matchups.html, do not just read it as a random chunk of HTML.

Instead, ask:
- What is visible?
- What is hidden?
- What is a container?
- What is a control?
- Which parts are meant to be interactive?
- Which parts are likely manipulated by JavaScript?

That turns the file from a wall of tags into a real map of the app.

---

## 21. What to remember

The main ideas from this lesson are:
- matchups.html is the structural skeleton of the app
- head contains setup information
- body contains the visible page
- containers group content
- inputs and textareas collect user data
- buttons trigger actions
- script tags load the app logic

---

### Bridge to the project
- Read [matchups.html](../matchups.html#L17-L30) again and trace the sections described here: the head, the body, the header, and the main app container.
- Take another look at [matchups.html](../matchups.html#L104-L157) and compare those HTML blocks with the behavior in [editor.js](../editor.js#L566-L578) and the layout rules in [style.css](../style.css#L67-L80).

## 22. Practice question

Try to answer these:
- What is the difference between the head and the body?
- What does the textarea do in this app?
- What is the purpose of the button with onclick?
- Why are the script tags at the bottom important?

If you can answer those, you are ready for the next lesson.
