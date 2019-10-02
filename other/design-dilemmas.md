# Navigator Design Dilemmas

## 1. Pagination

While pagination is something that is not necessarily part of the navigator proper, some strategy is needed for breaking up reflowable documents into pages. In many cases, the navigator will be responsible for injecting content into documents in order to handle pagination.

The first approach, and the approach used in Readium 1.x, is [CSS columns](https://www.w3.org/TR/css3-multicol/). Tried and true, CSS columns have shown themselves to be flexible and are well-supported in a large number of browsers and browser engines.

The second approach is to use `overflow: paged-x` as defined in [CSS GCPM](https://www.w3.org/TR/2011/WD-css3-gcpm-20111129/). Going this route means relying on a mechanism that is immature and not well-supported, but it does seem to perform much better than CSS columns.

### NYPL's Approach

Our strategy is to use CSS columns for our web reader. We want to support a large number of browsers and `paged-x` would seem to rule out too many of them. The main advantage of `paged-x`—performance—is also less of an issue on laptops and desktops where many people will be using the web reader. For mobile though, our plan is to use `paged-x` as it appears to work well on both Android and iOS. The performance boost is also a major advantage on mobile platforms.

### EP's Approach
We recommend using CSS columns for a web reader. But we also use CSS columns in our mobile reader as it requires consistent rendering of pagination. We've seen reflowable books that have rich & heavy use of media/scripting/layouts and we assume that there will be issues with that and the current state of `paged-x`. This assumption is derived from the fact that there have been issues in the past with CSS columns and there's a chance that we'll have to revisit and tackle similar issues when the browser implementations of `paged-x` get put through their paces.
 We'll take the conservative route and consider switching when `paged-x` gets closer to maturity. We can't yet maintain two pagination strategies so we have to go for one or the other. All in all we do acknowledge and look forward to the proposed capabilities of CSS GCPM, including the performance benefits of `paged-x`.

## 2. Manifests and Metadata

Readium 2 assumes the presence of some sort of streamer that is responsible for reading resources out of an EPUB, decrypting them if necessary, and passing them on to the rest of the application. The navigator can fetch these resources via HTTP or by accessing an in-memory model. It is assumed that the streamer will be capable of producing a JSON-based [web publication manifest](https://www.w3.org/TR/pwp/#manifest) that provides a convenient way of accessing all metadata within a book.

### NYPL's Approach

Speaking strictly personally (as Winnie), I am not so sure how we'll be handling this just yet on mobile. Given that we'll have one streamer implementation per platform, I am not sure if the JSON manifest approach benefits us on mobile. Our goal, no matter how we get there, will be to have a precise and type-safe representation of the metadata described in whatever the host language happens to be (e.g. Swift, Java, Kotlin, et cetera) and in terms of whatever the application happens to support. As such, we may prefer to go directly from the XML in the EPUB to our end representation without going through some sort of intermediate manifest.

(This position may represent ignorance on my part! I'd love to hear more about the rationale of using a publication manifest on mobile given that, ultimately, we will need to be able to represent all data within the EPUB that the reader needs to handle anyway.)

That said, on the web, we are already using the JSON manifest! We are currently computing these ahead of time which greatly simplifies our TypeScript code that has to handle such data.

#### EP's Approach
We really like the idea of using the HTTP interface and JSON manifest for the web side of the navigator as it all feels "native". We see the streamer fitting the role of a web service, decoupled from the navigator/paginator/etc like in a web app or client.

We can also include the streamer as part of our web app's backend and use the flexibility of both the in-memory representation and JSON output to do things that we couldn't do as easily before with Readium 1. For example we had to build something in-house that could understand EPUBs on the backend, to do things like search indexing and ahead of time processing of the resources and manifest data. It's been a challenge to maintain all of that and it would be great if that could all be replaced with a standard implementation like the streamer provides.

## 3. CSS and JavaScript Injection

There is typically a requirement to modify the content of a book by injecting CSS and JavaScript. This is necessary for changing styling, adding handlers to elements, implementing touch detection, et cetera.

There are two approaches to this. The first, and the one that is typically used, is to have the navigator perform the injection after the page is loaded. The second is to have the streamer (or something that sits between the streamer and the web view) insert references to CSS and JavaScript directly into the HTML before it hits the web view.

### NYPL's Approach

Our plan is to inject CSS and JavaScript into pages after they have been loaded as is the case with most existing implementations. We do not see much advantage to doing this ahead of time at the expense of deserializing and re-serializing possible malformed HTML. There is also the fact that some JavaScript will need to be injected or invoked after the page has been loaded anyway due to runtime-selectable styling options, highlighting, et cetera.

### EP's Approach

We would like to see both of these options be available. We'll want to use a well defined "framework" for injecting css/javascript after the page is loaded. This is what we'll go for when dealing with dynamic behaviours which will be most of the time. For the more static cases it would be nice if injection is streamlined, and for this the other approach will be appealing. Another use case for that is when something like web content security gets in the way or there's a timing, latency or race condition issue and things get messy with dynamic injection. That gets simplified if it's all injected before it hits the webview.

## 4. Iframes

Iframes get their own section because how we use (or don't use) them changes our whole approach.

The single-iframe approach is central to Readium 1.x. Essentially the way Readium works is that the reading system exists within a web page and that web page exists throughout the duration of the reading experience. Within the web page is an iframe containing the content of the book. The outer frame containing the reading system is responsible for replacing the content inside the iframe when crossing resource boundaries, injecting CSS and JavaScript as appropriate, et cetera.

A variant of this approach is to use multiple iframes. Here, the outer frame containing the reading system juggles a number of iframes to implement things such as infinite scrolling (where each iframe contains a single resource). I am not aware of this approach being used in any in-production reader implementation.

Conversely, at least on mobile, it is possible to scrap the use of iframes altogether. This approach moves the reading system into native code and limits the web view to handling a single resource at a time. When the time comes to move to a new resource, the web view simply loads the new resource and the reading system injects CSS and JavaScript as appropriate.

### NYPL's Approach

On the web, we are currently using the single-iframe approach. For content that is meant to be paginated, this approach is simple, provides some isolation between the reading system and the content, and is sufficient given our present willingness to accept a lack of infinite scrolling functionality, fancy transitions across resource boundaries, et cetera. We see mobile as the primary platform for the vast majority of our readers and are therefore more concerned about core issues like accessibility for the web reader than we are about arguably optional features like infinite scrolling.

On mobile, our situation is completely different. Our plan is to not use iframes at all, have a given web view only be responsible for one resource at a time, and to keep as much of the implementation at the native level as possible. Our goal is to have a slick and responsive implementation that includes features like preloading adjacent resources, having smooth physics-based interaction for moving between pages, and eventually doing more advanced things like allowing the user to pull the view out and see several pages at once. A single-iframe approach that attempts to manage the content from within the web view itself only gets in the way.

### EP's Approach

We use the single iframe approach. But we have internal proof of concepts that use multiple iframes to achieve similar effects like how NYPL mentioned with multiple webviews. Our main product is web/javascript only and we would like to have the nice things that NYPL's mobile approach has, but implemented with multiple iframes instead of webviews. It would be nice if the navigator could work with an abstract form of iframe/webview.

## 5. Page Transitions

In Readium 1.x, page transitions, albeit lacking any sort of animation, are handled within the web view itself. The outer frame containing the reading system adjusts the x-offset for the inner frame as appropriate, loads other resources as needed, et cetera.

By using multiple iframes, more advanced transitions are possible. For example, as previously mentioned, the use of multiple iframes enables the implementation of features like infinite scrolling. Multiple iframes could also, possibly, be used for animating transitions across resource boundaries when in a paged reading mode (although this may well be more trouble than it's worth).

On mobile, it is ideal to be able to swipe between pages in a way that feels native to the platform. There are two ways to make this happen.

The first way to do this is to have a single web view responsible for showing all resources. Whether the web view contains an iframe that loads additional resources or whether the host application instructs the web view itself to load additional resources is irrelevant: The point is that there is still only one web view. Swiping between pages with the usual physics-based behavior can then be made possible by rasterizing the current page when a swipe begins, displaying the image in place of the web view, instructing the web view to load the adjacent page or resource as appropriate, and then relocating the web view to the left or right of the rasterized image so it can be swiped in as the user directs. In implementation terms, this usually looks like a scroll view containing a web view and one or more image views that are shuffled around as appropriate in a carefully orchestrated juggling act.

The second approach is to use one web view per resource. Instead of rasterizing pages, you simply always show web views. Swiping left or right within a resource would move within the current web view, and then, upon attempting to swipe past the end of the current resource, the scroll view containing the web views would begin to reveal the adjacent web view. Once again you have a juggling act, this time involving (at least) three web views instead of one plus a set of images.

### NYPL's Approach

On the web, we currently use the single-iframe approach as previously discussed. Fancy transitions are not, at least currently, a priority for us on this platform and thus we are not currently planning on doing anything else.

On mobile, our current application uses the first approach described above where a single web view is juggled about with images that are created on the fly. Our plan, however, is to move to an approach that uses multiple web views simultaneously such that the user always sees live pages. We believe this approach is of comparable complexity, yet it should make it easier to preload adjacent resources and will look much better for content that contains animations or video. We do not anticipate any problems, at least on iOS, when it comes to handling the nesting of scroll views that occurs with placing scrollable web views within a context that itself can scroll. If any issues will surface due to having multiple `WKWebKit` instances or similar remains unknown.

### EP's Approach

We were limited by the Readium 1 architecture when attempting to evolve our experiments to a working implementation. Some of our efforts got into Dmitry's prefetching pull request. But for the whole idea to work we tried a different approach by packaging up an instance of Readium with it showing only one spine document in a single iframe. Once we had that we took multiple instances of these iframes showing further spine documents with some new layer juggling around these "Readium + Spine" iframes. In hindsight we were trying to develop a new Navigator for Readium 1.

We can't rasterize iframes on the web yet so we would have to take an approach where the page transition leads you to the live view of the iframes.

## 6. Audio, Images, and Video

On mobile, the option exists of displaying images and playing audio and video outside of a web view. For example, the user could tap an image and see it in a native image gallery that supports pitch-zoom, a standard share sheet, saving to the user's photo library (DRM permitting), swiping through other images in the current resource, et cetera.

### NYPL's Approach

Our goal is to handle as much of this natively as possible. For example, we are considering adding handlers to image tags such that they will open said images in a native gallery when tapped.

### EP's Approach
(Pending)

## 7. Fixed Layout

### 🔥😭🔥
(EP can expand on this)

## 8. Click and Tap Detection

There are two main approaches for handling the detection of clicks and taps on links and other interactive elements.

The first approach is to do the handling within the web view by allowing events to bubble up through the DOM. In this approach, links are ornamented with handlers that invoke `stopPropagation`. This may also be the case for other types of elements (e.g. images that tell the host app to display themselves in a gallery view). If an event reaches some handler at the root of the document, that handler can then inspect the event and determine how to react appropriately (e.g. by toggling the display of buttons in the reader chrome, advancing to the next page, et cetera).

The second approach is to do click or tap detection in some sort of parent view. This parent might be a containing iframe or it might be a view or gesture handler placed over the top of a web view in native code. Upon receiving a tap, this layer would inspect the content to determine if a link lies at that location. If it does, it would activate the the link. If not, the tap would be treated as an attempt to turn the page or similar.

### NYPL's Approach

Personally speaking (as Winnie), and with a great deal of excited gesticulation at that, I believe the first approach is the only approach that can work properly. EPUBs can contain all sorts of interactive elements and it is standard practice for those elements to call `stopPropagation` on events they receive so that the reading system does not misinterpret them. (If you load a book that does not do this into iBooks, you can see how tapping an interactive element will also cause the application itself to interpret the tap as a page turn or similar—or at least that used to be the case.) Attempting to handle gestures before they have a chance to generate events that bubble up through the DOM breaks these forms of interaction. As such, while it would be nice to be able to handle gestures intended to affect the application at the application level, I believe the only choice, at least if one wants to do things correctly, is to let the content have at them first.

### EP's Approach

(Pending)
