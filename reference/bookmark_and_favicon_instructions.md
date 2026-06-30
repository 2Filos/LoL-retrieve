# Instructions for AI: Setting Favicons & Bookmarks for Local HTML Files

This document provides step-by-step instructions and technical context on how to configure a custom favicon and set up a file-based browser bookmark for a local HTML page. You can feed this entire document to another AI to replicate the exact setup.

---

## 1. Setting a Custom Favicon for Local HTML Files in Firefox

### The Challenge (Firefox Quirk)
When opening a local HTML file directly from your disk (using the `file:///` protocol), modern browsers (especially Firefox) impose strict security boundaries.
* Relative paths like `<link rel="icon" href="favicon.ico">` or `<link rel="icon" href="./images/icon.png">` will often fail to load as a tab icon if the browser restricts local directory access.
* Local absolute paths (e.g., `file:///C:/path/to/favicon.ico`) are blocked by default for security reasons.

### The Solutions

#### Method A: Using a Public HTTPS URL (Recommended / Used in VS-MULTI)
Firefox allows a `file:///` page to fetch and display favicons hosted on secure HTTPS public URLs. 

Add the following `<link>` tag inside the `<head>` of the HTML file:

```html
<link rel="icon" 
      href="https://external-preview.redd.it/cI-jnDO5fH2eGT-Id68L-0XyXGypFuKJJ6E5LU3r1Wc.jpg?auto=webp&s=a7ca39677084b498403806a655465c81d9ef6085" 
      type="image/x-icon">
```

> [!NOTE]
> The URL above is the exact VS emblem icon used in the `VS-MULTI` and `VS` pages. You can replace the `href` value with any other public HTTPS image URL.

#### Method B: Self-Contained Base64 Data URI (Best for Offline Use)
To make the HTML file 100% self-contained and work without an internet connection, convert the image file into a Base64 string and embed it directly into the HTML tag.

Add this tag to the `<head>`:

```html
<link rel="icon" 
      href="data:image/x-icon;base64,INSERT_BASE64_STRING_HERE" 
      type="image/x-icon">
```

**How to generate the Base64 string:**
* **Online**: Use any "image to base64" online converter.
* **PowerShell**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("path/to/your/icon.ico"))
  ```
* **Python**:
  ```python
  import base64
  with open("icon.ico", "rb") as image_file:
      print(base64.b64encode(image_file.read()).decode('utf-8'))
  ```

---

## 2. Creating a Local File Bookmark (Similar to MULTI)

### Why a Bookmark is Necessary
Modern web browsers enforce strict sandbox policies. If you are browsing a standard website (e.g., `https://example.com`), you **cannot** click a link pointing to a local file (`file:///C:/...`) — the browser will block the navigation.

However, a **bookmark** is a user-initiated browser action. The browser trusts the bookmark bar and allows it to open local `file:///` URLs directly.

### Step-by-Step Setup Guide

1. **Locate the Local HTML File**:
   Find the absolute path of your HTML file on your drive (e.g., `C:\Users\User\Documents\MyFolder\index.html`).

2. **Convert it to a File URL**:
   Format the path according to URL rules:
   * Replace backslashes `\` with forward slashes `/`.
   * Prepend `file:///` (note the 3 slashes).
   * Replace spaces with `%20`.
   
   *Example*:
   `C:\Users\User\Documents\App Browser\SPOILER_favicon VS-MULTI.html`
   becomes:
   `file:///C:/Users/User/Documents/App%20Browser/SPOILER_favicon%20VS-MULTI.html`

3. **Create the Bookmark**:
   * **In Firefox or Chrome**:
     1. Right-click your bookmarks bar and select **Add Bookmark** (Firefox) or **Add Page** (Chrome).
     2. Set the **Name** to whatever you want (e.g., "VS Multi").
     3. In the **URL / Location** input box, paste the formatted `file:///` URL.
     4. Click **Save** / **Add**.

4. **Testing**:
   Click the bookmark from any page. It should immediately open the local HTML file in your current browser tab or window.
