# Lesson 1: Web Foundations

This is the first lesson in the course. It introduces the basic building blocks of any web page.

The goal is simple: before you try to understand this project, you need to understand the language that the project is written in.

This lesson is intentionally basic. If some of it feels obvious, that is not a problem. A lot of programming confusion comes from missing the vocabulary, not from missing intelligence.

A good rule for this course is: if you cannot explain a term in plain English, slow down and revisit it before moving on.

### Project connection
In this project, the browser reads HTML, CSS, and JavaScript together. The page you will study is built from all three.

---

## 1. What is a web page?

A web page is a document that a browser can read and display.

A browser takes the page and turns it into something visible:
- text
- buttons
- images
- forms
- layout
- styling

In this project, the web page is the matchup editor interface.

---

## 2. What is HTML?

HTML stands for HyperText Markup Language.

It is the structure of a web page.

Think of it as the skeleton of a page.

It tells the browser:
- what content exists
- what sections the page has
- what things are headings, buttons, forms, or text areas

Example:

```html
<h1>My Page</h1>
<p>This is a paragraph.</p>
<button>Click me</button>
```

### What these pieces mean
- `<h1>` = a big heading
- `<p>` = a paragraph of text
- `<button>` = a clickable button

HTML gives the page its basic shape.

---

## 3. What is CSS?

CSS stands for Cascading Style Sheets.

CSS is the visual layer.

If HTML is the skeleton, CSS is the paint, clothing, and layout.

CSS controls things like:
- colors
- spacing
- font size
- borders
- alignment
- layout structure

Example:

```css
button {
  background: gold;
  color: black;
}
```

This says: “make buttons look gold and dark text.”

---

## 4. What is JavaScript?

JavaScript is the behavior layer.

It makes the page interactive.

JavaScript can:
- react to clicks
- react to typing
- load data
- save information
- update the page without reloading it

Example:

```javascript
function greet() {
  alert("Hello!");
}
```

This defines a function that can be run when something happens.

---

## 5. The three layers of a web page

A web page is usually built from three layers:

1. HTML = structure
2. CSS = appearance
3. JavaScript = behavior

A simple mental model:
- HTML says “what exists”
- CSS says “how it looks”
- JavaScript says “what it does”

---

## 6. What is a browser?

A browser is the program that reads the HTML, CSS, and JavaScript and displays the page.

The browser does the work of:
- reading the file
- building the page structure
- applying styles
- running scripts
- showing the final result to you

When you open a page, the browser is the interpreter.

---

## 7. What is a tag?

A tag is the basic syntax used in HTML.

It marks up content.

Examples:
- `<div>` starts a container
- `</div>` closes it
- `<p>` starts a paragraph
- `</p>` closes it

Tags are usually paired:
- opening tag: `<p>`
- closing tag: `</p>`

Some tags are self-closing, but this project mostly uses normal paired tags.

---

## 8. What is an element?

An element is a complete HTML unit.

Example:

```html
<div class="card">
  <h2>Title</h2>
  <p>Some text</p>
</div>
```

Here, the whole block is one element structure:
- outer `<div>` is the container
- `<h2>` is a heading inside it
- `<p>` is text inside it

---

## 9. What is an attribute?

An attribute gives extra information to an HTML element.

Example:

```html
<input id="myChamp" placeholder="e.g. Yasuo">
```

Here:
- `input` is the element
- `id="myChamp"` is an attribute
- `placeholder="e.g. Yasuo"` is another attribute

Attributes often provide:
- identification
- styling hooks
- behavior hooks

---

## 10. What is the difference between id and class?

These are two common attributes used in HTML.

### id
- should be unique
- used to identify one specific element

Example:

```html
<textarea id="editor"></textarea>
```

### class
- can be reused many times
- used to group elements that should share style or behavior

Example:

```html
<div class="card"></div>
<div class="card"></div>
```

In this project, IDs and classes are both important because JavaScript and CSS use them.

---

## 11. What is a container?

A container is an element that holds other elements.

The most common container is `<div>`.

Example:

```html
<div class="sidebar">
  <button>Load Matchup</button>
</div>
```

The sidebar div contains the button.

Containers are important because they organize the page into sections.

---

## 12. What is a button?

A button is an interactive element the user can click.

Example:

```html
<button>Sync to GitHub</button>
```

Buttons are commonly used for actions like:
- saving
- loading
- deleting
- submitting

---

## 13. What is an input?

An input lets the user type or choose a value.

Example:

```html
<input type="text" placeholder="Enter a champion">
```

It is useful for small pieces of data.

---

## 14. What is a textarea?

A textarea is a larger text field that supports multiple lines.

Example:

```html
<textarea></textarea>
```

This is the main note editor in the project.

---

## 15. What is a script tag?

A script tag loads JavaScript into the page.

Example:

```html
<script src="editor.js"></script>
```

This tells the browser:
- load the file named editor.js
- run its code in the page

Without script tags, the page would be static.

---

## 16. What is a link tag?

A link tag connects external files such as CSS.

Example:

```html
<link rel="stylesheet" href="style.css">
```

This says:
- load the stylesheet file called style.css
- apply its rules to the page

---

## 17. What is the difference between head and body?

This is one of the most important HTML concepts.

### head
The head contains metadata and setup information.
It is not usually visible to the user.

It may include:
- title
- meta tags
- linked stylesheets
- linked scripts

### body
The body contains the visible content of the page.
This is what the user sees.

Example:

```html
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello</h1>
  </body>
</html>
```

---

## 18. What is doctype?

Doctype is the first line of an HTML document.

Example:

```html
<!DOCTYPE html>
```

It tells the browser that the document is written in HTML5.

It does not show anything visually.

It helps the browser interpret the page correctly.

---

## 19. What is a function?

A function is a reusable block of code.

Example:

```javascript
function saveDraft() {
  console.log("Saving...");
}
```

The function has a name: `saveDraft`

It can be called later when needed.

In this project, functions help organize behaviors like loading matchups or syncing notes.

---

## 20. What is an event?

An event is something that happens in the browser.

Examples:
- click
- key press
- page load
- input change

JavaScript can listen for events and respond to them.

Example:

```javascript
button.addEventListener("click", doSomething);
```

This means: “when the button is clicked, run doSomething.”

---

## 21. What is localStorage?

localStorage is a browser feature that stores small pieces of data.

It is useful for saving things like:
- drafts
- preferences
- temporary app state

In this project, it is used for local note drafts.

Example:

```javascript
localStorage.setItem("draft", "hello");
```

This stores a value under a name.

---

## 22. How this connects to LoL-retrieve

Now that you know the web basics, you can look at this project with better context.

In LoL-retrieve:
- HTML creates the editor layout
- CSS styles the interface
- JavaScript handles the editor logic
- localStorage keeps drafts
- scripts connect the page to GitHub through a bridge

This makes the project easier to understand because you can now see the roles of each part.

---

## 23. What to remember

The most important ideas from this lesson are:
- HTML gives structure
- CSS gives style
- JavaScript gives behavior
- tags create elements
- attributes add extra information
- head contains setup information
- body contains visible content
- scripts run behavior
- localStorage stores browser data

---

### Bridge to the project
- Read [matchups.html](../matchups.html#L17-L30) side by side with this lesson and notice how the same concepts appear in the real page structure.
- Take another look at [matchups.html](../matchups.html#L110-L157) and then compare it with [style.css](../style.css#L54-L80) and [editor.js](../editor.js#L560-L578) to see how structure, style, and behavior fit together.

## 24. Practice question

Try to answer these in your own words:
- What is the difference between HTML and CSS?
- What does a script tag do?
- What is the difference between head and body?
- Why might a page need JavaScript?

If you can answer those, you are ready for the next lesson.
