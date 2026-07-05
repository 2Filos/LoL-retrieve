# Postponed UI Fixes

## Scrollbar & Vertical Width
The custom scrollbar styling and variable height assignments for the local drafts and saved matchups area have been **postponed** for the following reasons:

1. **Browser/Environment Isolation**: The `::-webkit-scrollbar` standard CSS pseudoclasses behave unpredictably when running from local `file:///` URLs under a Tampermonkey script environment. Often, standard webkit styles are ignored or overridden by browser-level default security protocols unless explicitly enabled via flags or completely custom UI components.
2. **Container Restraints**: The variable `--saved-matchups-height` was intended to control the `max-height` of the `saved-panel` `.drafts-list`. However, due to the parent flex/grid architecture in `.main-layout` and `.sidebar`, overriding the height vertically pushes into or is clipped by the overall container viewport (`100vh` or fixed grid heights). 
3. **Future Work**: Instead of hacking CSS variables inline, a broader architectural redesign of the sidebar layout (perhaps using CSS Grid with fractional units `1fr` for the scrollable areas) is needed to properly accommodate variable vertical height without breaking Mockup A's compact layout.

We will revisit this when overhauling the sidebar grid mechanics.
