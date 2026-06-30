# Course Plan: Learn LoL-retrieve Step by Step

This file is the master plan for building a gradual, beginner-friendly course around this project.

The approach is simple:
- do not build the whole course at once
- first plan the course structure carefully
- then create one lesson or module at a time
- each module should be small, clear, and testable

The goal is to turn this project into a real learning course that helps a beginner understand the web basics, the project structure, and the app behavior in a calm, progressive way.

---

## Course Philosophy

This course should be:
- beginner-friendly
- practical
- project-based
- structured in small steps
- focused on understanding, not memorization

Each lesson should answer one question clearly:
- What is this concept?
- Why does it matter here?
- How does it show up in this project?

---

## Course Structure Proposal

The course will be organized into modules and each module will eventually become one or more markdown lessons in the learning folder.

### Module 1: Web Foundations
Goal: teach the basic vocabulary of web pages.

Topics:
- what HTML is
- what CSS is
- what JavaScript is
- what a browser does
- what tags, attributes, elements, and classes are
- what a script tag does

Planned output:
- a lesson file in learning/ about basic web building blocks

### Module 2: Reading the Project Structure
Goal: help the learner understand the project as a system.

Topics:
- what the main files are for
- what matchups.html contains
- how the styles and scripts are connected
- how the app is organized into UI, logic, and bridge layers

Planned output:
- a lesson file in learning/ about project structure and file roles

### Module 3: HTML in This Project
Goal: explain the actual page structure of matchups.html.

Topics:
- doctype
- html, head, body
- header
- sidebar
- editor card
- textarea
- buttons
- inputs
- script tags

Planned output:
- a lesson file in learning/ focused on matchups.html structure

### Module 4: CSS in This Project
Goal: explain how the page is styled.

Topics:
- selectors
- classes and IDs
- layout basics
- spacing and colors
- responsive behavior
- how CSS changes the page visually

Planned output:
- a lesson file in learning/ focused on style.css concepts

### Module 5: JavaScript Basics for This Project
Goal: teach the JavaScript concepts that matter in this app.

Topics:
- variables
- functions
- events
- DOM access
- simple conditionals
- arrays and objects
- localStorage

Planned output:
- a lesson file in learning/ focused on JavaScript concepts used by the project

### Module 6: The Editor Flow
Goal: explain how the main app behavior works.

Topics:
- loading a matchup
- typing into the editor
- saving drafts locally
- updating the UI
- detecting links

Planned output:
- a lesson file in learning/ focused on editor behavior

### Module 7: GitHub Sync and Data Flow
Goal: explain how the app saves and syncs notes.

Topics:
- why sync is needed
- what GitHub API is being used for
- what SHA means
- why Base64 is used
- what happens when the user clicks sync

Planned output:
- a lesson file in learning/ focused on sync flow

### Module 8: CORS and the Bridge
Goal: explain the browser security issue and why the bridge exists.

Topics:
- same-origin policy
- CORS
- why direct requests fail in this setup
- how the Tampermonkey bridge works
- how events pass messages between contexts

Planned output:
- a lesson file in learning/ focused on the bridge and security model

### Module 9: Putting It All Together
Goal: show the full story of the app end to end.

Topics:
- the user opens the page
- the editor loads
- drafts are saved locally
- the user syncs to GitHub
- the bridge handles the network request
- the app updates its state

Planned output:
- a final lesson or walkthrough connecting all modules

---

## Lesson Creation Sequence

The course should be built in this order:

1. Create the course plan file
2. Create Module 1 lesson
3. Create Module 2 lesson
4. Create Module 3 lesson
5. Create Module 4 lesson
6. Create Module 5 lesson
7. Create Module 6 lesson
8. Create Module 7 lesson
9. Create Module 8 lesson
10. Create Module 9 lesson

This keeps the work incremental and lets us improve each lesson before moving on.

---

## Content Standards for Each Lesson

Each lesson should include:
- a clear title
- a short purpose statement
- a simple explanation of the concept
- a connection to this project
- a small example or analogy
- a short “what to remember” summary

Each lesson should avoid trying to explain too much at once.

---

## First Deliverable

The first deliverable will be Module 1: Web Foundations.

That lesson will be created first in the learning folder and will serve as the foundation for the rest of the course.

---

## Next Step

The next step is to create the first lesson file in the learning folder and keep it focused on the most essential web concepts before moving on to the project-specific material.
