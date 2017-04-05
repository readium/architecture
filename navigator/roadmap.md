# Navigator Roadmap

This document is based on the current consensus between implementers of what the core set of features and priorities should be.

## Feature Complete Requirements

* Navigation between spine items (from the first to the last)
* Rendering resources (scroll AND paged)
* Support for vertical-writing, RTL/LTR reading directions
* Navigate directly to a resource (`spine` or `resources`)
* Support hyperlinking between resources
* Ability to inject CSS and/or JS into resources (XHTML & HTML)
* Calculate current location, go to a saved location


## Revision 1

* Full fixed layout support
  * Multiple spreads
  * Rendition properties (orientation, page position)
* Media Overlays
* Preloading, Prerendering
* Locators
  * Character level precision
  * Multiple locators (including CFI)
  * Calculate a locator based on a DOM range
  * Go to a specific locator


## TBD

* Footnote & endnotes
* Syncing locators
* Native support for images, audio& video (not in a webview)
* epubReadingSystem Object
* Progression in a publication (page or % based)
*  Annotations & Highlights
*  TTS
*  Default stylesheet, rules for applying styles
*  Event flow model
