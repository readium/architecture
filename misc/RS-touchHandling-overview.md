# Touch Handling – Reading System Overview

Editors: Jiminy

This document aims at referencing important APIs, describing how other Reading Systems perform and their known issues, and listing automagic features authors may be expecting in a Reading App.

## Important APIs

- Page Lifecycle ([link](https://javascript.info/onload-ondomcontentloaded)):
    - `DOMContentLoaded` especially important;
    - `readystatechange` can be important too.
- Event Interface:
    - `preventDefault()` ([link](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)) should be sufficient in most cases;
    - `stopPropagation()` ([link](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation));
    - `stopImmediatePropagation()` ([link](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopImmediatePropagation)).
- window.location ([link](https://developer.mozilla.org/en-US/docs/Web/API/Window/location)):
    - you sometimes have to use it to get around some Reading Systems’ handling (e.g. links);
    - internal and external links should not be handled the same way in such a case.
- Web Storage ([link](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)):
    - not just about `sessionStorage` (needs to be defined in the EPUB context as it differs from the web in some Reading Apps) and `localStorage`;
    - `storageEvent` ([link](https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent)) may also be important to retrieve items which may have changed in the tryptic view;
    - quotas and eviction criteria: [MDN Link](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria) + [Goodle Dev Link](https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/offline-for-pwa);
    - security: origin should be scoped to the publication, not the Reading App itself;
    - indexedDB API ([link](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)) a natural extension.
- Audio + video APIs ([link](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Video_and_audio_APIs)):
    - `epub:trigger` but much much better and web-compatible;
    - important for custom controls.
- `getBoundingClientRects` ([link](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)):
    - when tapping an element, you may sometimes get wrong data; 
    - my understanding is that it is because there is a huge delay after the content has been loaded and rendered.
- `<canvas>` element ([link](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)):
    - example with touch events ([link](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events));
    - some RSs disable JS but forget about `canvas`, so it becomes a complication for authors when trying to manage the fallback.
- Layout changes:
    - Readium 1 already manages it;
    - not just about removing/appending contents, also about `<details>` ([link](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)).
- Selection API ([link](https://developer.mozilla.org/en-US/docs/Web/API/Selection_API))
- Navigator Interface ([link](https://developer.mozilla.org/en-US/docs/Web/API/Navigator)):
    - sometimes you can’t get around scripting issues without RS sniffing because implementations differ too much and there is no other way to make something work;
    - a lot of RSs don’t implement the `navigator.epubReadingSystem` object;
    - however, when the RS doesn’t implement this object, it may customize the `navigator.userAgent` because its developers deemed critical the Reading System can be identified;
    - after some reasearch, I would anticipate nasty edge cases if the app supports scripting but can’t be identified in any way (`navigator.userAgent` or `navigator.epubReadingSystem`), and touchHandling diverges from the reference RSs (e.g. iBooks).

## Reading Systems which support scripting 

### iBooks

This is probably the highest standard as `click` + `preventDefault()` will work as expected by authors, and touchHandling will never hijack authors’ scripts, even in reflow, on both mobile and desktop. It is important to note that they’ve patched `addEventListener` so that they can warn on interactive books ([link](https://gist.github.com/dvschultz/9caba7f9058596451744#file-cfi-js-L17)), and use capture instead of bubble on `click` ([link](https://gist.github.com/dvschultz/9caba7f9058596451744#file-cfi-js-L1834)).

It is also worth noting they had to build a `touch` to `click` polyfill (no public link), probably because a lot of books only use touch events (including the ones using the “ibooks.js” library Apple provides).

When it comes to form elements, they disable `contenteditable`, text `input`s and `textarea`s ([link](https://gist.github.com/dvschultz/3a3c4836458aceca744d#file-bkcontentcleanup-L18)). It is working fine for all other form elements (`button`, non-text `input`s, `option`, `select`, `label`, etc.)

Finally, the `storageEvent` (Web Storage API) never fires, I guess because each doc is not in a tab/window but in the same one. This means items which have been set or whose value has changed won’t necessarily be updated throughout the publication. For instance, if you set an item on users’ action in “chapter1.xhtml”, authors won’t necessarily be able to listen to the change and retrieve it in “chapter2.xhtml”. 

Web Storage is however working fine when contents aren’t already loaded (and you don’t need the `storageEvent`).

### Kobo

We’re focusing on the iOS and Android apps, whose touchHandling vary significantly.

Kobo explicitely states in its guidelines that both `touchend` and `click` events should be used ([link](https://github.com/kobolabs/epub-spec#javascript-support)), which is a best practice anyway ([link](https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/)). `preventDefault()` will work as expected by authors.

One issue worth noting is that links (`<a>`) can sometimes collide with tap zones (previous/next page), and authors have to programmatically handle it (using `window.location`) to get the expected result (following the link’s `href` instead of navigating to the previous or next resource).

### Readium 1

It’s really hard to rely on event propagation for some elements, the most noteworthy one being link (`<a>`). And this can become an issue for polyfills (pop-up footnotes) or libraries (displaying contents of another file e.g. glossary entry in a modal in the current document so that users don’t have to navigate throughout the publication). Now, the default for links would be the graceful degradation (simply following the link’s `href` if scripting is not supported).

As a consequence, authors may end up changing the `<a>` element to another one e.g. `<span>` during runtime (but they then have to manage keyboard and focus programmatically), or adding one `eventListener` for each `<a>` element in the document, which can create performance issues if there is a lot.

However, event propagation works fine for some other elements e.g. `table`, `form` (for which you’ll use a `change` eventListener), etc.

In a lot of Readium-based apps, it’s worth noting that `stopPropagation()` and (even) `stopImmediatePropagation()` are not always sufficient, and the User Interface will show up anyway – something authors consider bad UX. They will then resolve to `return` so that it doesn’t happen.

### Misc

#### Counter-example

The worst offender is probably Overdrive (Media Console) on Android, for which you must use `touchstart` because they completely changed how touch works e.g. links will be activated on a long press – and authors have absolutely no way to prevent the (invasive) UI from showing up, it indeed shows up as soon as you tap the screen.

#### Common issues

The biggest issue, by far, is that a lot of Reading Systems tend to break `preventDefault()`, `stopPropagation()` and `stopImmediatePropagation()`. It is not expected by authors that only `return` will prevent the UI from showing up on a user’s action, and can occasionally shock authors with a web-design or -dev background. Maybe the `touch-action` CSS property ([link](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)), and `pointer-events` CSS property([link](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events)) are worth taking into account when designing touchHandling, as they may well be used to get around the RS’ events in the future.

Another common issue is that authors very often use `click` events only. When the Reading System uses `mouseup` or `touchend`, and doesn’t account for authors’ `click` events, authors will simply state the Reading System doesn’t support JS properly – I’ve never ever seen an author’s script using `mouseup` for instance, the default for desktop being `click`. `touchend` should be fine for touch, and we could reasonably put the burden on authors there – friendly reminder that mobile devices are not necessarily touch-only and it’s been bad practice to assume so since 2013, cf. [this Moz Hacks article](https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/).

The `visibilitychange` event of the Page Visibility API ([link](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)) doesn’t work in any Reading System, which shouldn’t be a surprise but differs, once again, from the web. It is worth mentioning but priority is very low since it doesn’t raise any interoperability issue.

For accessibility reasons, keyboard events shouldn’t probably be overridden, which can happen in some Reading Apps e.g. space bar will turn pages in iBooks instead of the default behaviour (changing the `checked` state) for checkboxes or radio buttons.

If enabled, text inputs should not not disable the virtual keyboard, but there is a nasty Android bug to take into account: the virtual keyboard will change the viewport ([link](https://stackoverflow.com/questions/8883163/css-media-query-soft-keyboard-breaks-css-orientation-rules-alternative-solut)).

Finally, we have to acknowledge that Android and (older versions of) iOS differ on `click` (300ms delay), which could also explain why touchHandling may work as expected in iOS apps, but not in the Android version of those same apps. 

#### Identifying an app

One of the best practices in the “EPUB 3 best practices” book is to always check for `navigator.epubReadingSystem`. In practice, it doesn’t stand the test of time and authors can’t do that for practical reasons. Indeed, there are too many apps which support scripting but don’t implement this object. Moreover, this best practice is not feature proof (EPUB 3 → web-ish).

Unfortunately, if you want to support a lot of apps, there is no other way than sniffing the Reading System in some cases. It is worth nothing that a significant number of apps that don’t implement the `navigator.epubReadingSystem` object tend to customize the `navigator.userAgent` so that they can be identified.

## Reading Systems which don’t support scripting

### Play Books

Files being pre-processed, and scripting disabled, touchHandling is not worth researching. Form elements won’t even work as expected by authors.

For the record, each page seems to be represented as an XML fragment, which would imply it is a new DOM.

### MS Edge

MS Edge puts content into sandboxed `iframe`s, and don’t re-enable forms nor scripts. Consequently, touchHandling is designed around those limitations in mind and even checkboxes, etc. will fail, although displayed.

### Misc

When scripting and forms are explicitely disabled – as opposed to not supported at all –, Reading Systems never handle those elements properly.

Examples: 

- forms are disabled but inputs, checkboxes, etc. are displayed, and those elements aren’t interactive as they should be by default (w/o scripting), a situation which can confuse the user;
- scripting is disabled but the `canvas` element makes its way to the Render Tree, problem is you can’t do anything with it;
- scripting is disabled the quick and dirty way, and should they slip through the cracks, authors’ scripts may completely break the Reading App’s – and yes, such a case really exists.

## Reading Systems which provide and/or impose features related to scripting

### iBooks

Apple provides authors with an “iBooks.js” library so that they can easily implement interactive features into fixed-layout publications by adding classes to the markup ([link](https://help.apple.com/itc/booksassetguide/#/itc013b02e4a)).

This library provides key interactions: 

- drag and drop; 
- touch to initiate audio;
- touch to create a new element;
- touch to change the state of an element.

Authors may occasionally try to use it in other Reading Systems, although none actually supports it (to my knowledge).

### Kindle

Kindle provides authors with interactive features (pop-up magnification, panel by panel navigation), leveraging private scripts Kindle apps and devices embed ([link](https://kindlegen.s3.amazonaws.com/AmazonKindlePublishingGuidelines.pdf), starting at section 10, page 39).

Those features are consequently managed by authors in the markup, as is the case for the “ibooks.js” library.

## What authors probably expect (automagic features)

- Pop-up footnotes (`epub:type`)
- Tables + images zoom (separate web view)
- Handling of page numbers (`epub:type`)
- Scroll handling of overflowing elements:
    - `touchdrag` should not fire page turn;
    - `wheel` event ([link](https://developer.mozilla.org/en-US/docs/Web/Events/wheel)) should be managed on desktop – it doesn’t work in (at least some versions of) iBooks; 
    - `-webkit-overflow-scrolling` ([link](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-overflow-scrolling)) could be a complication since authors will expect momentum-based scrolling for the given element.