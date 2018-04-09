The development on each platform follows the same progression and semantic versioning.
This page lists the features expected for each revision of the development kit and demo apps. 


# V1 beta (semver 1.0.0-beta.1 etc.)

One can:

* modify most Readium CSS defined user settings (relies on Readium CSS alpha), including night mode (but not app UI), font selection (pre-defined font faces)
* open LCP protected ebooks (prod/1.0 profile)

R2-iOS V1 beta.1 was released on the Apple App Store on 06/04/2018. 

# V1 (semver 1.0.0-rc.1 etc. … finally: 1.0.0)
One can:

* modify all Readium CSS defined user settings (incl. DYS* related like letter/word/line spacing, relies on Readium CSS alpha), font selection (shipped dyslexic + font selector for system fonts)
read RTL written publications (arabic, hebrew; relies on Readium CSS alpha); the UI is still not localized
* read FXL publications / one page, with zooming (pitch)
* import publications from OPDS feeds (navigation and acquisition of free ebooks, OPDS 1 and 2, no authentication)
* manage bookmarks (using a “jump to page x” implementation that may be naive, glue milestone 1)

# semver 1.0.1 etc.

Fixes, improvements, new non-breaking features, etc.

# V2 (with its own apha / beta / rc progression)
One can:

* get his reading position (progression indicator) in the publication (relies on GlueJS’s locator.js milestone 3)
* get access to page lists and landmarks.
* read vertical written publications (chinese, japanese; relies on Readium CSS beta)
* manage customizable “themes” (relies on Readium CSS beta)
* get app UI follow content colour schemes (e.g. night mode)
* read FXL publications / 2 page spreads
* get access to popup/popin footnotes (relies on GlueJS’s touchhandling.js milestone 2)
* enjoy a11y navigation -> VoiceOver on iOS, TalkBack Android, JAWS / NVDA window, etc. screen readers on Desktop
* enjoy TTS with sentence highlight (independently of screen readers, contuous or word per word).
* search text in the publication (relies on GlueJS’s search.js, milestones 3)
* load Web Publications (using Readium WP Manifest as manifest format), from a URI (and an OPDS feed?)

# V3
One can:

* access dictionaries
* enjoy media overlays
* create content selections, manage annotations
* listen to audiobooks (prototype format, with a11y features like escapability)
* enjoy more dyslexia related features (from Luc Maumet’s study)
* read CBZ BD-Comics-Manga
* read EPUB4 BD-Comics-Manga (prototype format)
