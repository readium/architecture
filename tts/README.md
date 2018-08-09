# Text-To-Speech (TTS) "read aloud", synthetic voicing

## General Principles

### Inclusive Design

This is primarily an accessibility feature, but it can benefit mainstream users too. For example, instead of listening to actual "audio books" (which are created with fixed pre-recorded files / human narration), users can listen to (textual) digital publications in situations where eye-based reading is not possible ; such as when driving a car ; using modern high-quality realistic synthetic speech voices (depending on availability: can be female or male, with a choice of languages / accents, and control over prosody, intonation, pitch, speech rate, etc.).

### Out of Scope: Talking User Interface

Here we are in the specific context of a reading system app for digital publications, so "read aloud" refers to enabling speech for ebook *contents* (publication HTML documents), which is not to be confounded with "self-voicing" user interfaces that offer an alternative to system-level screen readers (e.g. Apple iOS/MacOS VoiceOver, Windows Narrator, JAWS, NVDA, etc.).

### Synchronized Rendering and Interaction

System-level screen readers use Text-To-Speech engines to create an auditory experience that represents the contents displayed on the screen as a whole, and ensures that aurally-rendered textual information is synchronized / emphasized on the screen in real time (i.e. scrolled into view, and highlighted / outlined). Screen readers also handle user interaction so that the experience is not only linear, but also based on arbitrary user-driven navigation (e.g. keyboard focus, or location of pointing device).

The same design pattern applies to "read aloud" functionality built directly into a reading system app, even if limited to the *content* of digital publications (i.e. excluding the application "chrome" / user interface).

### Open Web Platform vs. "native" code

Because the textual content to be read aloud by the TTS engine is expressed using HTML markup, and because the visual emphasis of text (highlight / outline) is ultimately performed at the DOM level (CSS styling), at least some logic must be implemented in cross-platform Javascript ("glue JS" https://github.com/readium/r2-glue-js).

In fact, most of the "read aloud" logic could arguably be performed within the scripted runtime of the web browser engine (webview component), thereby limiting the responsibility of platform-specific code (iOS, Android, etc.) to handling the bi-directional communication with global application-level controls / state, such as start/stop commands, and progress events (e.g. continuous timed playback of auditory utterances, signaling of word boundaries inside sentences, etc.).

It could also be argued ; assuming that the target web browser / webview component supports the "Web Speech" Javascript API ; that the reliance on a platform-native TTS engine is unnecessary, as the Web API delegates actual "speech synthesis" tasks to the underlying native framework anyway, thereby ensuring compability with voices available in the operating system, as well as good performance in terms of memory consumption and processing speed.

The other advantage of implementing "read aloud" entirely in JavaScript (i.e. without invoking a system-specific TTS engine via application/platform code) is that sophisticated functionality such as word-level highlighting (during a sentence-level utterance, for example) can be achieved without any costly back-and-forth event-based communication between the distinct runtimes of the webview component and the enclosing native app.

## Prior Art

### Readium "1"

The EPUB3 Media Overlays engine of Readium "1" supports TTS as an alternative to pre-recorded audio files, in the sense that any missing `audio` element in the SMIL (i.e. just a `text` reference in a `par` time container) triggers a fallback to synthetic speech. The implementation uses Web Speech API, or alternatively delegates to platform-native TTS engines (via a basic interface for start/stop commands, and begin/end events).

There is also a prototype implementation of word-level aural-visual synchronization, which requires parsing text utterances ("tokenization") in order to build a map between word boundary events emitted by the underlying TTS engine, and ranges of DOM text. This code was written a long time ago, and at that time the Web Speech API in various web browsers was not behaving as expected during testing (even with Google Chrome which had its own advanced proprietary API).

https://github.com/readium/readium-shared-js/blob/develop/js/views/media_overlay_player.js#L924

### Benetech / Bookshare, "BeneSpeak"

This implementation is used in production by Benetech's own fork of Readium (based on a very old revision), and works only in Google Chrome (no support for the cross-platform Web Speech API):

https://github.com/benetech/readium

The Readium "1" implementation was inspired by the "BeneSpeak" utility:

https://github.com/benetech/BeneSpeak/blob/master/speech.js

### Firefox reader mode "narrator"

Word-level highlighting inside each paragraph-level utterance (note the DOM tree walker implementations to "tokenize" the document into palatable utterances, and to map word boundary events):

https://dxr.mozilla.org/mozilla-central/source/toolkit/components/narrate/Narrator.jsm

Also see:

https://support.mozilla.org/en-US/kb/firefox-reader-view-clutter-free-web-pages

### (Proprietary) BookCreator

Note the TTS voice choice menu, auto page turn switch, speed selector, etc.

https://bookcreator.com/2018/04/read-books-come-book-creator-chrome/

## Technical Breakdown

(DRAFT)

Major Javascript implementation blocks:

* HTML document parser that extracts high-level textual structures such as paragraph or sentence "fragments", to be fed as individual utterances to the synthetic speech engine. This may or may not be dependent on language / script (probably is to some degree, to be determined exactly)
* State machine that tracks current utterance (e.g. paragraph) and allows navigating previous / next in the sequence of available textual "fragments".
* Playback engine that starts a TTS utterance and detects its end (i.e. listens to the appropriate event), also that is capable of interrupting the current TTS utterance (stop command), resume playback, increase the speech rate, configure voice options (prosody), etc.
* Visual emphasis manager that highlights / outlines / underlines (using CSS styling) active textual fragments and optionally the word boundaries within the current TTS utterance.
* Interaction handler that deals with user keyboard / pointing device / touch input, so as to ensure synchronization of the auditory output (e.g. user touches / clicks on word / sentence / paragraph => playback starts at referenced location).

## Next Step

See Readium 2 call notes from June 27 https://docs.google.com/document/d/18bYgFsqvLlZ51jaZe9qs9eCepLfuZ0kqxJqibapWZ9Q/edit

The next step that eKitabu and @kevinmainairungu in particular are working on is to essentially re-write BeneSpeak.js using the Web Speech API instead of Chrome.TTS.

For testing purposes, we will start with a simple XHTML file from 1 chapter of one of the Kenyan early grade reading storybooks we are working on. See for example: https://github.com/eKitabu/UNICEF-eKitabu-Kenya-Pilot-Digital-Accessible-Textbook/tree/master/samples

Web Speech API is here:
https://w3c.github.io/speech-api/speechapi.html

SAPI 5 Kiswahili voice on Windows: 441 Swahili (Kenya)
https://msdn.microsoft.com/en-us/library/hh362866(v=office.14).aspx
