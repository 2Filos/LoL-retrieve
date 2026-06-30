# LoL-retrieve: Matchup Text Editor

A lightweight, local, browser-based text editor designed to manage and synchronize League of Legends (or other) matchup text files directly with a GitHub repository.

## Project Structure

*   [matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html) - The browser-based text editor user interface.
*   [bridge.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js) - A Tampermonkey userscript that acts as a CORS proxy to bypass browser restrictions on the `file:///` protocol.
*   [config.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/config.js) (ignored by git) - Contains GitHub repository credentials and Personal Access Token (PAT).
*   [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) - Folder containing detailed guides for the different parts of the system.

## Quick Start

1.  **Configuration**: Create a [config.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/config.js) file containing your GitHub token and target repository (see [documentation/github_setup.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/github_setup.md)).
2.  **Tampermonkey**: Install the [bridge.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js) script in your Tampermonkey extension (see [documentation/tampermonkey_bridge.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/tampermonkey_bridge.md)).
3.  **Run**: Double-click or open [matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html) in your browser, and start editing.

---

For detailed documentation, please refer to the [GEMINI.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/GEMINI.md) file and the [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) folder.
