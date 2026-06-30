# Lesson 3: CSS for Layout and Style

This lesson explains the role of CSS in this project.

The main idea is simple: HTML gives the page structure, and CSS gives it shape, spacing, colors, and layout.

A common beginner mistake is to think CSS is only about decoration. In reality, it is also about structure and usability. The layout, spacing, and button styling all affect how easy the app is to use.

### What to look for in the real file
Open [style.css](../style.css) and look for selectors that target things like the main layout, the sidebar, the editor card, and the buttons. Those are the areas where the page becomes a usable interface instead of just a plain document.

---

## 1. What CSS is

CSS stands for Cascading Style Sheets.

It controls how the page looks.

Without CSS, the page would still be readable, but it would look plain and unstructured.

CSS is responsible for things like:
- colors
- spacing
- borders
- fonts
- alignment
- layout
- responsive design

---

## 2. How CSS connects to HTML

CSS usually connects to HTML in one of two ways:

1. through a linked stylesheet
2. through inline styles

In this project, the main CSS is loaded from a file named style.css.

That file is linked from the HTML page through a link tag:

```html
<link rel="stylesheet" href="style.css">
```

This tells the browser to apply the styles from that file to the page.

---

## 3. What a CSS rule looks like

A CSS rule has three main parts:

```css
selector {
  property: value;
}
```

Example:

```css
body {
  background: #111;
}
```

This means:
- `body` is the selector
- `background` is the property
- `#111` is the value

The browser reads this and changes the page accordingly.

---

## 4. Selectors

A selector tells CSS which HTML element or elements to style.

### Element selector

```css
body {
  font-family: sans-serif;
}
```

This targets the body element.

### Class selector

```css
.card {
  background: white;
}
```

This targets all elements with class="card".

### ID selector

```css
#editor {
  height: 300px;
}
```

This targets the single element with id="editor".

---

## 5. What classes and IDs mean in this project

In this app, HTML elements are given classes and IDs so that CSS can target them.

Examples from the project include:
- `card`
- `sidebar`
- `editor-card`
- `status-badge`
- `editor`

These names are not random. They act like labels for the browser and for the JavaScript code.

---

## 6. The layout idea: containers and sections

A big part of CSS is layout.

The page is built from containers that hold other content.

In this project, the CSS helps arrange the page into sections such as:
- header
- sidebar
- editor area
- action buttons
- warning banners

The HTML provides the structure, and CSS says where each section goes.

---

## 7. Display: flex and grid

Two very important CSS layout tools are flexbox and grid.

### Flexbox

Flexbox is used when you want to place items in a row or column and control spacing easily.

Example:

```css
.editor-actions {
  display: flex;
  gap: 10px;
}
```

This makes the children inside the container line up in a flexible row.

### Grid

Grid is used when you want a more structured two-dimensional layout.

You might use it for larger page sections with rows and columns.

The main idea is:
- `display: flex` is good for simple alignment
- `display: grid` is good for more complex layouts

---

## 8. Spacing: padding and margin

CSS uses spacing to create visual breathing room.

### Padding
Padding is inside an element.

Example:

```css
.card {
  padding: 16px;
}
```

This adds space inside the card.

### Margin
Margin is outside an element.

Example:

```css
.card {
  margin: 12px;
}
```

This adds space around the card.

These properties are extremely common in UI design.

---

## 9. Colors and backgrounds

CSS can change visual appearance using colors.

Example:

```css
body {
  background: #111;
  color: #f5f5f5;
}
```

This says:
- the page background is dark
- the text color is light

Many visual themes in this project are created with color rules like these.

---

## 10. Borders and shadows

CSS can also create borders and shadows.

Example:

```css
.card {
  border: 1px solid #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
```

This makes the card feel more like a real UI panel.

---

## 11. Text styling

CSS controls the appearance of text.

Examples:
- font family
- font size
- font weight
- line height
- text alignment

Example:

```css
h1 {
  font-size: 24px;
  font-weight: 700;
}
```

This makes headings look stronger and more intentional.

---

## 12. Responsive design and media queries

Responsive design means the layout adapts to different screen sizes.

A common CSS tool for this is the media query.

Example:

```css
@media (max-width: 800px) {
  .main-layout {
    display: block;
  }
}
```

This says:
- when the screen becomes small enough
- change the layout so it fits better

This is important because the app should still be usable on smaller screens.

---

## 13. What the CSS in this project is doing

In this project, the stylesheet is not just decorative.

It helps define:
- the overall app theme
- the structure of the main layout
- the difference between cards, panels, and buttons
- the styling of the editor area
- the responsive behavior on smaller screens

So CSS is not just visual flair. It is part of the user experience.

---

## 14. A useful way to read CSS

When reading CSS, do not try to memorize every rule.

Instead, ask:
- What selector is this targeting?
- What HTML element or class is it styling?
- What visual effect does it create?
- Why would that be useful for the app?

This makes CSS much less intimidating.

---

## 15. What to remember

The key ideas from this lesson are:
- CSS controls appearance
- selectors target HTML elements
- classes and IDs are used to label pieces of the page
- layout is built with containers and spacing
- flexbox and grid help position content
- media queries make the page responsive

---

## 16. Practice question

Try to explain these in your own words:
- What is the difference between HTML and CSS?
- What does a class selector do?
- What is the difference between padding and margin?
- Why might a media query be useful?

If you can answer those, you are ready for the next lesson.
