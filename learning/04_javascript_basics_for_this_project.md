# Lesson 4: JavaScript Basics for This Project

This lesson introduces the JavaScript ideas that matter most in this app.

The goal is to make the code feel less mysterious. Instead of seeing JavaScript as a big block of symbols, you will learn the small pieces that make it work.

One important clarification: this project uses regular browser JavaScript, not a framework like React or Vue. That means the concepts here are the core browser concepts that power the whole page.

### What to look for in the real file
Open [editor.js](../editor.js) and look for functions, event listeners, and DOM access. Those are the main patterns you will see repeated throughout the app.

---

## 1. What JavaScript does in this project

JavaScript is what makes the page behave like an application.

In this project, JavaScript is responsible for things like:
- reading and writing the editor content
- reacting to button clicks
- loading matchup data
- saving local drafts
- syncing content to GitHub
- updating the UI dynamically

So while HTML gives the page structure and CSS gives it style, JavaScript gives it behavior.

---

## 2. What is a variable?

A variable is a named container for data.

Example:

```javascript
let message = "hello";
```

This stores the text "hello" in a variable called message.

You can use that variable later:

```javascript
console.log(message);
```

In this project, variables are used to track things like:
- the current matchup
- the current GitHub SHA
- the list of champions
- the current editor text

---

## 3. What is a function?

A function is a reusable block of code.

Example:

```javascript
function greet() {
  console.log("Hello");
}
```

You can run it later by calling the function:

```javascript
greet();
```

Functions are important because they let the code be organized into named tasks.

In this project, functions often represent things like:
- loading a matchup
- saving a draft
- detecting links
- syncing to GitHub

---

## 4. What is a parameter?

A parameter is a value that a function can receive when it is called.

Example:

```javascript
function greet(name) {
  console.log("Hello " + name);
}
```

Then you can call it like this:

```javascript
greet("Alex");
```

This makes functions more flexible.

---

## 5. What is a return value?

A function can return a value when it finishes.

Example:

```javascript
function add(a, b) {
  return a + b;
}
```

If you call it:

```javascript
let result = add(2, 3);
```

Then result becomes 5.

In this project, some helper functions return values such as:
- a normalized champion name
- a slug for a link
- the extracted URLs from text

---

## 6. What is an object?

An object stores related data as key-value pairs.

Example:

```javascript
let user = {
  name: "Alex",
  age: 25
};
```

You access the values like this:

```javascript
console.log(user.name);
```

Objects are useful when you want to group related information together.

In this project, JavaScript objects may represent things like:
- a champion entry
- the active matchup state
- API response information

---

## 7. What is an array?

An array is a list of values.

Example:

```javascript
let numbers = [1, 2, 3, 4];
```

You can access items by index:

```javascript
console.log(numbers[0]);
```

Arrays are used throughout this project for things like:
- lists of champions
- lists of detected links
- lists of saved matchups

---

## 8. What is a conditional?

A conditional is a decision point in code.

Example:

```javascript
if (isReady) {
  console.log("Ready");
}
```

This means: if the condition is true, run the block.

Conditionals are used when the app needs to decide between different behaviors.

Example:
- if there is a local draft, show it
- if no draft exists, show a blank editor
- if the token is invalid, show an error

---

## 9. What is an event listener?

An event listener waits for something to happen and then runs code.

Example:

```javascript
document.getElementById("editor").addEventListener("input", handleTyping);
```

This means:
- find the editor element
- watch for input events
- run handleTyping when the user types

This is one of the most important ideas in this project because the app reacts constantly to user actions.

---

## 10. What is the DOM?

The DOM stands for Document Object Model.

It is the browser’s internal representation of the HTML page.

You can think of it as a tree of elements.

JavaScript can read and change this tree.

Example:

```javascript
let editor = document.getElementById("editor");
```

This finds the HTML element with the id editor.

Then JavaScript can change its content or style.

---

## 11. What does document.getElementById do?

This is one of the most common DOM methods.

It searches the page for an element with a given id.

Example:

```javascript
let button = document.getElementById("syncBtn");
```

Once the element is found, JavaScript can do things with it.

For example, change its text:

```javascript
button.textContent = "Saving...";
```

---

## 12. What is innerText or textContent?

These properties let JavaScript change the visible text of an element.

Example:

```javascript
status.textContent = "Status: Ready";
```

This updates the displayed label in the UI.

---

## 13. What is localStorage in JavaScript?

localStorage is the browser storage API.

You can save and retrieve values like this:

```javascript
localStorage.setItem("draft", "some text");
let saved = localStorage.getItem("draft");
```

This is very important in this app because it stores local drafts.

It allows the app to remember the user’s work even if the page is refreshed.

---

## 14. What is JSON?

JSON is a format for storing structured data as text.

Example:

```javascript
let data = ["A", "B", "C"];
let jsonText = JSON.stringify(data);
```

This converts the array into a string.

To read it back:

```javascript
let parsed = JSON.parse(jsonText);
```

This is useful when storing arrays or objects in localStorage, because localStorage only stores strings.

---

## 15. How these ideas appear in this project

In LoL-retrieve, JavaScript is used to:
- find the editor textarea
- detect when the user types
- save the draft locally
- update the sidebar or UI state
- extract links from the note content
- communicate with the bridge layer for GitHub sync

So the JavaScript in this project is not abstract. It is the engine of the app.

---

## 16. A useful mental model

A good way to think about this code is:

- HTML gives the page its structure
- CSS gives it appearance
- JavaScript gives it action

When you read the JavaScript, ask:
- What is this function trying to do?
- What element is it changing?
- What user action triggers it?
- What data is being stored or read?

---

## 17. What to remember

The major ideas from this lesson are:
- variables store information
- functions organize actions
- conditionals decide what happens
- events trigger behavior
- the DOM lets JavaScript interact with the page
- localStorage preserves data in the browser
- JSON helps store structured data as text

---

## 18. Practice question

Try to explain these in your own words:
- What is a function?
- What does an event listener do?
- What is the DOM?
- Why is localStorage useful in this app?

If you can answer those, you are ready for the next lesson.
