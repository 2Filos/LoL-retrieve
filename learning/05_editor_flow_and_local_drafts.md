# Lesson 5: Editor Flow and Local Drafts

This lesson explains how the main editor works in this project.

The goal is to connect the earlier web and JavaScript lessons to the actual behavior of the app: typing, saving drafts, and updating the UI.

A very practical way to read this lesson is to imagine a real user action: the user opens the page, starts typing, and then refreshes the page. What should still be there? That question is the heart of the draft system.

### What to look for in the real file
In [editor.js](../editor.js), pay attention to the startup flow, the draft-saving behavior, and anything that updates the visible UI. The app is constantly translating internal state into visible changes.

---

## 1. What the editor is doing

The editor is the main workspace of the app.

It is the place where the user writes matchup notes.

In the HTML, this is the textarea:

```html
<textarea id="editor"></textarea>
```

That element is the main input surface. Everything else around it supports it.

---

## 2. The editor is not just a textbox

At first glance, this looks like a simple text area.

But in this app it is more than that.

It is also connected to:
- local draft saving
- UI updates
- link detection
- matchup state
- conflict handling

So the editor is both a text input and a small application state system.

---

## 3. What happens when the page loads

When the page opens, the app initializes itself.

That means it prepares the editor and checks for previous draft data.

In the code, this happens through a startup function that runs when the page loads.

The app may:
- read saved draft content from browser storage
- set the current file label
- enable or disable the textarea
- show a status message
- update the discard button

This is the first important behavior of the app.

---

## 4. What local drafts are

A local draft is a copy of the notes saved inside the browser.

This is useful because the user might:
- refresh the page
- close the tab and reopen it
- keep editing over time

The draft is stored locally so the work is not lost immediately.

Think of it as the browser keeping a temporary working copy of the notes.

---

## 5. Why the app saves drafts while you type

The app listens for user input and saves the current content as the user writes.

This means the draft is updated continuously.

That is useful because it reduces the chance of losing work if the page refreshes or something unexpected happens.

The important idea is: the app does not wait for a formal save button before it starts preserving the content.

---

## 6. What the app is tracking

The editor logic keeps track of several pieces of information.

Some important ones are:
- the current matchup being edited
- the current file label
- the current GitHub SHA if the file has been synced
- the content of the current draft
- whether the user has unsaved local changes

These values allow the app to know what is currently open and whether it is in sync with GitHub.

---

## 7. What happens when the user types

When the user types into the textarea, the app can react in several ways.

A typical flow is:
1. the user types into the editor
2. the app detects the change
3. the app updates its local draft state
4. the UI may refresh or show a new status

This is the heart of the editor interaction loop.

---

## 8. How the app detects links inside notes

One interesting feature of the editor is that it looks through the note text and finds URLs.

If the text contains a web link, the app can show it as a clickable detected-link item.

This means the notes are not just plain text. The app can turn important URLs into visible UI elements.

This is a good example of JavaScript reading the content and updating the page dynamically.

---

## 9. Why the app updates the UI dynamically

The editor does not just store text. It also changes what the user sees.

For example, it might:
- show the current matchup label
- show a warning banner when there is a conflict
- enable or disable buttons based on state
- update the detected links list

So the app is always translating internal state into visible UI changes.

---

## 10. What a conflict means here

A conflict happens when the local draft and the remote GitHub version are different.

This is important because if the user edits something locally and someone else changed the file remotely, the app must avoid overwriting one version with the other blindly.

The editor logic may therefore show a conflict banner and offer the user choices:
- use the local draft
- use the GitHub version

This is one of the more advanced pieces of behavior in the app.

---

## 11. The role of browser storage

The browser storage layer is central to the editor experience.

The app saves draft data so that:
- the user does not lose work accidentally
- the app can restore the draft on reload
- the UI can reflect the latest local state

This is a very practical use of browser-based storage.

---

## 12. A simple mental model

A good way to think about the editor flow is:

1. the page loads
2. the app prepares the editor state
3. the user types
4. the app stores the current text locally
5. the UI updates based on that state
6. the app may later sync the content to GitHub

That is the main loop of the editor experience.

---

## 13. What this lesson teaches you about reading the code

When you read the editor logic, look for these patterns:
- where the page initializes on load
- where user input is listened for
- where the draft gets stored
- where the UI is updated
- where state is compared with remote content

Those are the main structural questions to ask.

---

## 14. What to remember

The main ideas from this lesson are:
- the editor is the core writing surface
- local drafts preserve work in the browser
- the app reacts to typing and updates the UI
- link detection is a dynamic feature of the editor
- conflicts are handled by comparing local and remote versions

---

## 15. Practice question

Try to answer these in your own words:
- Why does the app save drafts locally?
- What happens when the user types into the editor?
- What is a conflict in this context?
- Why does the editor update the UI dynamically?

If you can answer those, you are ready for the next lesson.
