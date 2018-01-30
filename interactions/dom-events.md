# DOM events

## Background

A reading system must inject scripts (i.e. Javascript) into "content documents" (e.g. publication's HTML files) in order to insert functionality that enables it to perform various tasks, such as:

* text selections / annotations,
* hyperlink / navigation handling,
* pagination of reflowable documents,
* touch gestures / finger drag and swipe for page "turns",
* interception of keyboard events / keystrokes for command shortcuts,
* synthetic speech playback for focused text,
* capturing scroll positions to monitor the reading location,
* detecting document dimensions changes (width, height) to refresh pagination,
* etc.

A reading system must therefore leverage the HTML DOM event model to receive notifications when the user interacts with documents, and in some cases to intercept events in order to cancel their original intended behaviour (which allows the reading system to trigger its own actions).

## Key Javascript functions

1) `domTarget.addEventListener()`  
https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
2) `event.preventDefault()`  
https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
2) `event.stopPropagation()` / `event.stopImmediatePropagation()`  
https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation

The third parameter of the `addEventListener()` function (`useCapture`) is of particular importance, as it provides the ability for a reading system to intercept events at a specific point as they flow in the DOM tree (the "capture" phase runs first from top to bottom, then "bubbling" occurs from deep in the tree towards its root). This gives the reading system a chance to execute actions with a higher degree of precedence (relative to the targeted document's own scripted or declarative behaviours), or even to completely override default behaviours (see the `preventDefault()` and `stopPropagation()` functions).

## Usage example, (hyper)linking

Typically, a reading system injects scripts into content documents in order to "hook" into the initial processing phase, as soon as the DOM tree is ready to be programmatically interacted with:

```javascript
window.addEventListener("DOMContentLoaded", () => {
    console.log("EVENT: DOMContentLoaded");
});
```

Note that the `window.onload()` event occurs later:

```javascript
window.addEventListener("load", () => {
    console.log("EVENT: window load");
});
```

As soon as the document instance is ready, we can ; for example ; register a listener for the `click` event, which will be raised when the user activates hyperlinks (irrespective of the method used to trigger the link: keyboard, mouse, touch, etc.):

```javascript
window.document.addEventListener("click", (ev) => {
    console.log("EVENT: click (bubbling)");
});
```

We can set the `useCapture` parameter to `true`, so that we receive the notification first (i.e. in the "capture" phase of the DOM event flow, which takes place before the "bubbling" phase):

```javascript
window.document.addEventListener("click", (ev) => {
    console.log("EVENT: click (capture)");
}, true);
```

Note: although the `click` event originates from a link HTML tag (`<a href="..."> ... </a>`) deep in the DOM tree, the event is detectable at the root level, first during the "capture" phase, and last during the "bubbling" phase (assuming the event propagation is not interrupted by another listener along the way). In most cases we can therefore reliably listen for events at the DOM document level. Alternatively, we could attach separate `click` event listeners to all existing hyperlinks in the HTML document, but this would be much less efficient.

Ok, so now we can invoke `preventDefault()` on the received event to stop the browser engine activating the hyperlink in the normal way (at which point we can trigger the desired alternative reading system action):

```javascript
window.document.addEventListener("click", (ev) => {
    console.log("EVENT: click (capture)");

    // naive way of checking that the event actually originates from a hyperlink!
    // (the user can "click" other things)
    let href = ev.target.href;
    if (!href) {
        // if not a link, let the browser engine handle this event
        return;
    }

    ev.preventDefault();
    DO_SOMETHING_ELSE(href);
}, true);
```

The `DO_SOMETHING_ELSE()` function is platform-specific. For instance, an Electron-based reading system could forward the link activation event into its own IPC (Inter Process Communication) subsystem, and the `href` destination (e.g. `<a href="./main/chapter2.html#section3.6"> click me </a>`) would typically be handled by some application logic in the main process, responsible for loading a new content document, updating the reading system's internal state (e.g. "I'm on page 40 out of 120 pages in this chapter"), prefetch + prerender adjacent spine items, etc. It is also at that point that the application can determine how to open an external web page (e.g. `https://external-website.org/index.html#anchor`), thereby bypassing the default navigation method of the content frame (`webview` or `iframe`).

Known edge-case: there are some EPUB3 publications that "misuse" `window.location=xxx` to redirect towards other content documents (i.e. programmatic navigation). As there is no declarative link expression in the DOM to discover, the reading system is simply unable to intercept this change of context using traditional methods. Thankfully, some application platforms ; such as Electron ; offer APIs that allow the reading system to be notified when these navigation events occur (and to subsequently retake control over the linking mechanism).

## Touch, pointer events

Following the basic principles outlined in the previous section, we can install event handlers for `touchstart` and `touchend` to reconstruct gestures (e.g. discrimate "tap" / "click", "long press", "drag", "swipe"), and act upon their detection (e.g. "turn page" vs. "popup menu").

iOS:  
https://github.com/readium/r2-streamer-swift/blob/master/R2Streamer/touchHandling.js

Android:  
https://github.com/readium/r2-testapp-kotlin/blob/master/r2-testapp/src/main/assets/ReadiumCSS/touchHandling.js

Note that the "Pointer events" unified API should also be considered on some platforms (e.g. Windows hybrid laptop / tablet), where users are likely to interact with content using a variety of input methods (e.g. touch, mouse, pen):

https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

The primary problem to solve is that the reading system's own user interface (aka the application "chrome") can often overlap with the rectangular area designated for documents (i.e. the content viewport).

Typically on mobile devices, screen real estate is precious, and providing an immersive reading experience is paramount. As a consequence, the content viewport is stretched to occupy the entire available display area. Touch-sensitive regions may be laid on either sides of the document so that the user can invoke previous/next "page turn" commands by tapping on them. The center region can be dedicated to opening-up menus. When these active regions are not fully transparent, there can be oclusion issues. When the content beneath the regions is interactive (e.g. hyperlinks, input forms, canvas drawing, buttons, video controls, etc.), there is an obvious conflict over whether content or "chrome" should take precedence.

There are essentially 2 options to address this problem:

1) The reading system can analyse the content rendered inside the visible part of the viewport, in order to determine which areas (i.e. set of bounding boxes) should have a higher priority. Based on that, the application can veto its own interactive "chrome" when superimposition occurs (i.e. passthrough exceptions, to let user input reach into the content, uninterfered with).
2) The reading system can hook into the DOM tree event system to monitor interactive behaviour (i.e. collect information about keyboard, mouse, etc. activity), and to subsequently determine whether or not the application "chrome" should be enabled.

On face value, the latter seems easier to implement, and is probably a more robust solution. Here is a concrete example: the user taps/clicks into a text input HTML element, which happens to be overlaid by the transparent "left page flip" region. Using the aforementioned `addEventListener()` strategy, the reading system can determine that the keyboard focus will be purposefully moved into the text input control, and that the "tap" event should therefore *not* be interpreted as a user instruction to "turn the page".

## Keyboard

So, as a direct follow-up to the above section: once keyboard focused is trapped inside the text field, keystroke events should obviously not be interpreted as application keyboard shortcuts.

Generally-speaking, the heuristics to filter out particular events seem to fall into two distinct categories:

1) subjective assessement about whether or not DOM events are destined for internal consumption by the content document itself (e.g. discover that the event source is a form element, by checking its element name),
2) systematic detection of events that are marked as "consumed" by deeper elements in the DOM tree (e.g. pressing the "enter" / "return" key inside a text area results in a line break, whereas this may trigger a form submission when keyboard focus is located inside a single-line text field).

See `defaultPrevented`:  
https://developer.mozilla.org/en-US/docs/Web/API/Event/defaultPrevented

## Readium "1"

The "shared js" module is used by all Readium apps (interception of declarative hyperlinks):

https://github.com/readium/readium-shared-js/blob/develop/js/views/internal_links_support.js#L149

https://github.com/readium/readium-shared-js/blob/develop/js/views/iframe_loader.js#L40

The "cloud / web reader" and the "Chrome app" both implement a strategy to forward keystroke events (originating from the iframes that host content document) into the application domain, so that they can be interpreted as keyboard shortcuts:

https://github.com/readium/readium-js-viewer/wiki/Keyboard

https://github.com/readium/readium-js-viewer/blob/develop/src/js/EpubReader.js#L1271

https://github.com/readium/readium-js-viewer/blob/develop/src/js/Keyboard.js#L268

Generalities:

https://github.com/readium/readium-shared-js/wiki/ContentModifications


