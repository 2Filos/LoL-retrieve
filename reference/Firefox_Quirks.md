# Firefox Quirks

## 1. Local HTML Favicons (`file:///`)
Firefox restricts loading favicons from relative local paths or local files due to strict origin policies.
* **Workaround**: Use a secure HTTPS URL for the icon (e.g., hosted on a public server) or convert the icon to a Base64 Data URI and embed it directly into the `<link>` tag.
* For step-by-step instructions, see [bookmark_and_favicon_instructions.md](file:///c:/Users/User/Documents/App%20Browser/bookmark_and_favicon_instructions.md).

## 2. Opening Local File URLs (`file:///`) from standard web pages
Browsers block links pointing to `file:///` URLs on regular pages for security.
* **Workaround**: Create a browser bookmark pointing to the file URL. Since bookmark clicks are native user-initiated actions, the browser permits navigation.
* Refer to [bookmark_and_favicon_instructions.md](file:///c:/Users/User/Documents/App%20Browser/bookmark_and_favicon_instructions.md) for bookmark configuration instructions.

