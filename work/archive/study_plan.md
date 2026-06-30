# Study Plan for LoL-retrieve

This is a beginner-first study plan for you. The goal is not just to read the files. The goal is to understand what each part is doing, why it exists, and how the pieces fit together.

If a term feels confusing, stop and learn that term before moving on. Do not skim past it.

---

## The rule for studying this project

When you read any file, ask these four questions:
1. What is this block doing?
2. What does this word or symbol mean?
3. What part of the page does it affect?
4. What would happen if I removed it?

That habit is what turns reading into understanding.

---

## Phase 0: Learn the web building blocks first

Before you study the app logic, learn the basic grammar of a web page.

### 1. What does <!DOCTYPE html> mean?
- This is the first line of an HTML document.
- It tells the browser: “this file is written in HTML5.”
- It does not show anything on the page.
- It is there so the browser reads the page in the correct mode.

### 2. What is <html>?
- This is the outer container for the whole page.
- Everything else lives inside it.

### 3. What is <head>?
- The head contains information about the page.
- It is not the visible part of the page.
- It usually includes:
  - meta tags
  - the page title
  - links to CSS files
  - links to JavaScript files

### 4. What is <body>?
- This is the visible part of the page.
- Everything the user sees goes inside the body.

### 5. What is <meta charset="UTF-8">?
- This tells the browser how to read the text.
- It helps the page display characters correctly.

### 6. What is <title>?
- This is the text shown in the browser tab.

### 7. What is <link>?
- This connects external files.
- In this project it is used to attach CSS.
- Example: a stylesheet file controls the visual design.

### 8. What is <script>?
- This loads JavaScript into the page.
- JavaScript makes the page interactive.
- In this project, scripts control behavior like loading data, saving drafts, syncing to GitHub, and reacting to clicks.

### 9. What is a tag?
- A tag is the basic HTML syntax that creates an element.
- Example: <div> starts a container and </div> closes it.

### 10. What is an element?
- An element is a complete HTML thing made from a tag and its content.
- Example: <h1>LoL Matchup Portal</h1>

### 11. What is an attribute?
- An attribute gives extra information to an element.
- Example: id="editor" gives one specific name to an element.
- Example: class="card" gives a CSS style group name.

### 12. What is the difference between id and class?
- id is usually unique for one element.
- class can be reused for many elements.

### 13. What is a container?
- A container is an element that holds other elements.
- div is the most common container.

### 14. What is a block-level element?
- It takes its own line or section of space.
- Examples: div, section, header, p.

### 15. What is an inline element?
- It sits inside surrounding text and does not start a new section.
- Example: span, a.

### 16. What is a button?
- It creates a clickable control.
- Buttons trigger actions.

### 17. What is an input?
- It creates a field where the user can type or select a value.
- In this app, inputs are used for champion names.

### 18. What is a textarea?
- It creates a larger text area for multiline writing.
- This is the main note editor.

### 19. What is a label?
- It gives a visible name to a form field.
- Example: “My Champion”.

### 20. What is disabled?
- It makes an element inactive until something else enables it.

### 21. What is placeholder?
- It is light gray example text shown inside an empty field.

### 22. What is onclick?
- It says: “when this is clicked, run this function.”
- In this project it connects buttons to JavaScript behavior.

### 23. What is href?
- It is the destination for a link.

### 24. What is target="_blank"?
- It tells the browser to open the link in a new tab.

### 25. What is style="..."?
- It applies inline CSS directly to one element.

### 26. What is a CSS selector?
- It tells the browser which HTML elements should get a style.
- Example: .card selects elements with class="card".
- Example: #editor selects the element with id="editor".

### 27. What is a CSS property?
- A property is a style setting such as color, padding, display, or border.

### 28. What is a JavaScript function?
- A function is a named block of instructions.
- It lets you reuse behavior.
- Example: loadMatchup() means “run the matchup-loading logic.”

### 29. What is an event?
- An event is something that happens, like a click, a keystroke, or a page load.
- JavaScript can respond to events.

### 30. What is localStorage?
- A browser feature for saving small pieces of data.
- This app uses it to keep local drafts even after refresh.

---

## Phase 1: Study the page structure in matchups.html

Open [../matchups.html](../matchups.html) and study it in three passes.

### Pass 1: Structure
Look only at the tags and blocks.
Ask:
- Where is the header?
- Where is the sidebar?
- Where is the main editor?
- Where are the buttons?

### Pass 2: Meaning of the main elements
Focus on these parts:
- <!DOCTYPE html>
- <html>
- <head>
- <body>
- <header>
- <div class="main-layout">
- <div class="sidebar">
- <div class="card">
- <input>
- <button>
- <textarea>
- <script src="...">

### Pass 3: Connect structure to behavior
Now ask:
- Which part is visible to the user?
- Which part is just configuration?
- Which parts are likely connected to JavaScript?

### What you should understand by the end of this phase
You should be able to explain:
- What the page is made of
- What the main sections are
- Why the file has both HTML and script tags

---

## Phase 2: Study the styling layer in style.css

Open [../style.css](../style.css).

Do not try to memorize every rule. Instead, learn this pattern:
1. Find a selector.
2. Find the HTML element or class it targets.
3. Ask what visual change it makes.

### Focus on these concepts
- selectors such as .card, .sidebar, .editor-card, #editor
- properties such as display, flex, grid, gap, padding, margin, border, background, color
- media queries for mobile layouts

### What you should understand by the end of this phase
You should be able to say:
- Which CSS rules shape the layout
- Which rules affect the editor area
- Which rules make the page look polished or responsive

---

## Phase 3: Study the helper logic in utils.js

Open [../utils.js](../utils.js).

This file is small and much easier to understand once the HTML structure is clear.

### What to learn here
- What a helper function is
- Why names are normalized
- Why champion keys and display names are converted
- How slug mapping helps create links for other sites

### Important terms
- function
- return
- array
- find
- string
- toLowerCase

### What you should understand by the end of this phase
You should be able to explain:
- Why the app needs champion name conversion
- Why a helper function is useful
- How this file makes the rest of the app simpler

---

## Phase 4: Study the editor behavior in editor.js

Open [../editor.js](../editor.js).

This is the main behavior file. It is where the page starts acting like an application.

### Learn these ideas in order
1. What the global state variables mean
   - currentSha
   - CHAMPIONS
   - githubTextCache
   - activeMatchup

2. What extractUrls does
   - It looks through note text and finds links.

3. What updateDetectedLinks does
   - It takes those links and shows them in the UI.

4. What window.onload does
   - It runs when the page first loads.
   - It sets up the initial state.

5. What event listeners do
   - They react when the user types, clicks, or loads something.

### What you should understand by the end of this phase
You should be able to explain:
- What happens when the page loads
- What happens when the editor content changes
- How the app updates the UI based on user actions

---

## Phase 5: Study the persistence and draft system

Open [../learning/local_drafts_persistence.md](../learning/local_drafts_persistence.md) and then return to [../editor.js](../editor.js).

### What to learn
- Why the app saves drafts locally
- Why drafts are useful even before sync
- What conflict means in this context
- Why the app compares local changes with the remote version

### Key mental model
The browser is acting like a temporary memory for the current editing session.

---

## Phase 6: Study the sync layer in api.js

Open [../api.js](../api.js).

This file is about communication.

### Learn these concepts in order
- isConfigValid
- bridgeActive
- handleConfigMissing
- checkBridgeStatus
- bridgeFetch
- getAPIConfig
- checkTokenValidity

### What you should understand by the end of this phase
You should be able to explain:
- Why this project needs a bridge instead of plain direct requests
- What a request flow looks like
- Why credentials and tokens are important

---

## Phase 7: Study the bridge concept in bridge.js

Open [../bridge.js](../bridge.js) and [../learning/cors_bypassing_userscripts.md](../learning/cors_bypassing_userscripts.md).

This is where the security model becomes visible.

### Learn these ideas
- why browser security blocks some requests
- why this app uses a userscript bridge
- how messages are passed between the page and the userscript

### Key mental model
The browser page and the userscript are two different environments. They need a controlled way to talk to each other.

---

## Phase 8: Study the project by user actions, not by file names

Once you know the pieces, trace real user flows.

### Flow 1: Load the app
- What happens first?
- Which files run?
- What is visible right away?

### Flow 2: Type into the editor
- Which element receives the input?
- Which function reacts to it?
- Where is the draft stored?

### Flow 3: Save a matchup
- What changes in the UI?
- What data is written?
- Where does it go?

### Flow 4: Sync to GitHub
- What function is called?
- What data is sent?
- Why does the app need a SHA?

### Flow 5: Resolve a conflict
- What does the conflict mean?
- What options does the user have?
- How does the app decide what to show?

---

## A practical study method

For each file, do this:
1. Read the file once for structure.
2. Read it again and underline any unfamiliar words.
3. Write a one-sentence explanation of each important function.
4. Try to explain it aloud as if you were teaching it to someone else.

If you cannot explain a part in plain English, that is a sign you need to slow down.

---

## The exact beginner glossary you should know

If you want to understand this project, these are the words to learn first:
- HTML: the structure of the page
- CSS: the style of the page
- JavaScript: the behavior of the page
- tag: the HTML syntax for an element
- attribute: extra information attached to an element
- element: a complete HTML unit
- selector: the CSS rule target
- function: reusable code block
- event: a user or browser action
- variable: a named piece of stored data
- localStorage: temporary browser storage
- API: a way for one system to talk to another
- CORS: a browser security rule
- bridge: a middle layer that bypasses the restriction

---

## Recommended order for the actual project files

1. [../README.md](../README.md)
2. [../matchups.html](../matchups.html)
3. [../style.css](../style.css)
4. [../utils.js](../utils.js)
5. [../editor.js](../editor.js)
6. [../learning/local_drafts_persistence.md](../learning/local_drafts_persistence.md)
7. [../api.js](../api.js)
8. [../learning/cors_bypassing_userscripts.md](../learning/cors_bypassing_userscripts.md)
9. [../bridge.js](../bridge.js)
10. [../learning/github_contents_api.md](../learning/github_contents_api.md)

---

## A good checkpoint

You are ready to move on only when you can answer these questions without looking:
- What is the difference between head and body?
- What is the purpose of a script tag?
- What does a button do in HTML?
- What does a textarea do?
- What does a function do in JavaScript?
- What does localStorage do?
- Why does this app need a bridge for GitHub requests?

If you want, the next step can be a much more literal walkthrough of [../matchups.html](../matchups.html) line by line, with every important tag explained one by one.