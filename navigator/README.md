# Navigator

The navigator is a module that directly interacts with the streamer, either by:

* using the in-memory model produced by the streamer
* or by fetching in HTTP the JSON manifest through the shared model

The navigator is responsible for a number of things:

* it is responsible for providing access to the resources contained in the reading order of the publication
* it can also be responsible for navigating between resources (either by following the order or displaying anciliary resources)
* in some implementations, the navigator module may also be responsible for injecting CSS/JS in a resource

## Displaying Resources

To control the way a resource is displayed, most reading applications rely on either:

* one or more webviews (native apps)
* one or more `<iframe>` elements (Web apps)

That said, some publications may be handled differently, for instance a bitmap-only comics could also be displayed using:

* native APIs to manipulate bitmaps on a platform
* one or more `<canvas>` elements
* one or more `<img>` elements

Each implementation of the navigator module can support one or more methods, which means that we could potentially have specialized navigator modules for comics or audiobooks too.

### Spreads

If a publication contains fixed layout resources, the navigator module is also responsible for spreads (left page, right page, double pages).

This information is contained in the `properties` object of each link object:

```
{
  "href": "page1.jpg",
  "type": "image/jpeg",
  "properties": {"page": "left"}
}
```

There are also a number of other use cases where a navigator might handle multiple resources in the reading order at the same time:

* continuous scroll, where you can read an entire publication using vertical or horizontal scrolling
* pre-rendering, where the navigator module loads next/previous resources in order to speed things up

## Navigation

The navigator module can be either:

* directly responsible for the navigation between items in the reading order, by detecting when the user reaches the start/end of a resource and loading the next/previous resources
* or indirectly responsible, by injecting content in the resource or passing information to the pagination module

It can also implement special display modes for anciliary resources, for example:

* the ability to select an image and zoom in/out in a different viewport
* displaying footnotes/endnotes in a modal window
* triggering a different behavior when the user navigates to an out-of-spine resource

## Content Injection

In certain use cases, injecting JS/CSS might be necessary to support other modules, for instance:

* pagination
* locators
* media-overlay

For example, a Web-based app where both the streamer and the navigator modules are on the same host, could rely on an `<iframe>` to display resources and inject JS/CSS whenever the content of the `<iframe>` is updated.

## Default Profile

While implementations can adopt different strategies, adapting to the strengths of each platform, the following principles should be followed for a default implementation of the navigator module:

* prioritize the in-memory representation provided by the streamer over the JSON manifest for native implementations
* if the navigator relies on the JSON manifest, stick to the shared model instead of using a different one
* avoid fetching the JSON manifest over HTTP more than once, even if it is cached by an HTTP library
* prioritize the use of webviews over iframes for HTML/XHTML documents
* prioritize the use of native APIs to handle audio/video/images over a webview
* avoid injecting JS/CSS/HTML if another option is available