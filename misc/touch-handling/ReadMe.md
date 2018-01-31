# Touch Handling Test Case

This folder contains interactive EPUB3 files you can test to make sure touch handling runs authors’ scripts as expected and doesn’t intercept their events.

## List of test files

1. DOMStorageControl.epub
2. touchHandling.epub

## Tests

### Control for the DOM Storage API

Ideally, `DOMStorageControl.epub` should be tested first. It was designed to serve as a control for the DOM Storage API.

There are indeed [security considerations](http://www.idpf.org/epub/301/spec/epub-contentdocs.html#sec-scripted-content-security) to take into account, especially:

> If a Reading System allows persistent data to be stored, that data should be treated as sensitive. Scripts may save persistent data through cookies and DOM storage, but Reading Systems may block such attempts. Reading Systems that do allow data to be stored must ensure that it is not made available to other unrelated documents (e.g., ones that could have been spoofed). In particular, checking for a matching document identifier (or similar metadata) is not a valid method to control access to persistent data.

To make sure scripts can’t access items set in another document, do the following:

1. set an item;
2. get all items:
   - if you get only the `rth-control-item` in the console, further tests are needed in `touchHandling.epub`;
   - if you get any other item, it means all publications currently share the same origin, and this needs to be fixed.

The set item, with a `rth-control-` prefix, shouldn’t be retrievable from `touchHandling.epub`.

Check the [related WHATWG issue](https://github.com/whatwg/html/issues/3099) for further details.

### Form elements

This test is relying on the default events for form elements (`input`, `select`, `textarea`, etc.). 

The app’s events shouldn’t be triggered on any of those elements.

### Contenteditable

This test contains a `contenteditable` element, which should more or less behave as a `textarea`.

### Scripted form element

This test contains a scripted `select` element. Quotes in the text below should update when another entry is selected – tip: Selecting Japanse (`ja`) will make the change clearly visible.

### Audio controls with div

This test contains custom audio controls using `div` elements.

The progression of the track should be displayed in the form of a black bar.

### Audio controls with buttons

This test contains custom audio controls using `button` elements.

The progression of the track should be displayed in the form of a black bar.

### Links

This test contains 3 links with different behaviors:

1. normal link, which should take the user to the previous test;
2. scripted link, which should display a hidden element below the second paragraph;
3. scripted link, which is using `window.location` to send the user to the next test.

### DOM Storage

This test allows implementers to test the DOM Storage API, and make sure they don’t have any security issue to deal with.

#### sessionStorage

You can set and get an item in `sessionStorage`.

The item should not be retrievable once the EPUB file has been closed and you re-open it.

#### localStorage

You can set, get and change an item in `localStorage`.

The item should be retrievable once the EPUB file has been closed and you re-open it.

You can also clear `localStorage`.

If the DOM Storage has been cleared, the item should not be retrievable once the EPUB file has been closed and you re-open it.

### Retrieve DOM Storage

This test runs an `eventListener` which should log the `localStorage` item changed in the previous test. If there is no log, it means the [`storageEvent`](https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent) doesn’t work.

You can get items in `sessionStorage` and `localStorage`.

Both items set in the previous file should be retrievable if the file hasn’t been closed and re-opened.

If you can get any other item for `localStorage`, especially the one set in the `DOMStorageControl.epub` file (`rth-control-item`), it means the origin for publications is the app’s and it raises a security issue which should be fixed urgently.

### Layout Change

This test will append contents, triggering a layout change, when clicking the button.

This can impact pagination e.g. contents are clipped because it didn’t trigger a reflow.

### Details

This test contains a `<detail>` element, which will display additional contents. It is like the previous test, only is this element part of HTML5 and authors don’t even have to script it.

### Canvas

This is a simple `canvas` test:

1. the interaction should start when the document is visible in the viewport, not before;
2. the interaction should be reset when clicking on the `canvas` element.