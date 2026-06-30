# Lesson 7: CORS and the Bridge

This lesson explains one of the most important concepts in this project: why the app needs a bridge to talk to GitHub.

The short version is that browsers have security rules that block some kinds of network requests, and this project uses a special workaround to get around that.

This is one of the most important lessons because it explains why the app is shaped the way it is. The bridge is not an optional extra. It is the mechanism that makes remote communication possible in this restricted browser setup.

### What to look for in the real file
Open [api.js](../api.js) and [bridge.js](../bridge.js). The key idea is that the page sends a request, the bridge handles the privileged part, and the response comes back through a message channel.

---

## 1. Why this matters

The app is a browser-based tool, but it needs to reach GitHub.

That sounds simple, but browsers enforce security restrictions that make direct requests from a local HTML page more complicated than they would be in a normal app.

This project solves that problem by using a bridge layer.

---

## 2. What is the same-origin policy?

Browsers enforce a rule called the same-origin policy.

This rule says that a page from one origin should not freely read data from another origin.

An origin is basically the combination of:
- protocol
- domain
- port

Example:
- a page loaded from file:// is different from a page loaded from api.github.com

Because of that difference, the browser may block requests.

---

## 3. What is CORS?

CORS stands for Cross-Origin Resource Sharing.

It is a browser mechanism that allows a server to explicitly allow certain cross-origin requests.

In other words, CORS is the official permission system for cross-origin communication.

If a server does not allow the request, the browser blocks it.

---

## 4. Why this is a problem for this project

This project is opened locally from a file URL.

That makes the browser environment more restricted than a normal hosted web app.

Because of that, direct network requests to GitHub may be blocked or behave differently than expected.

So the app cannot always rely on normal browser fetch behavior alone.

---

## 5. What is the bridge?

The bridge is a special userscript layer.

It runs in a more privileged context and can perform requests that the main page cannot do directly.

In this project, the bridge acts as a middle layer between:
- the app page
- the GitHub API

It receives a request from the page, performs the network request, and sends the result back.

---

## 6. Why a userscript is used

A userscript is a script that runs inside the browser with extra privileges.

In this project, the userscript is used because it can interact with the browser environment in a way that the normal page context cannot.

That is why the app uses the bridge instead of trying to do everything directly from the page.

---

## 7. What is a CustomEvent?

A CustomEvent is a browser event that the page can create and listen for.

It is a way for different parts of the app to communicate.

In this project, the page and the bridge exchange messages using events.

This makes the connection structured and controlled.

---

## 8. How the bridge flow works

A simplified flow looks like this:

1. the page creates a request
2. it dispatches a message to the bridge
3. the bridge receives the message
4. the bridge performs the network request
5. the bridge sends the result back to the page
6. the page handles the response and updates the UI

This is a very important mental model for the project.

---

## 9. Why this layer exists even though it seems complicated

The bridge exists because the project is intentionally built in a local, browser-based, and security-restricted environment.

It is not just a random extra layer.

It is the solution to the browser security problem.

Without it, the app would not be able to reliably communicate with GitHub in the same way.

---

## 10. What to remember

The main ideas from this lesson are:
- browsers enforce security rules
- the same-origin policy limits cross-origin requests
- CORS is the permission system for those requests
- this project needs a bridge because direct requests are restricted in its environment
- the bridge communicates through events and acts as a middle layer

---

## 11. Practice question

Try to explain these in your own words:
- What is the same-origin policy?
- Why does this project need a bridge?
- What is a CustomEvent doing here?
- Why is the bridge considered a workaround rather than the main app logic?

If you can answer those, you are ready for the next lesson.
