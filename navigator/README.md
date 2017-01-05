# Architecture for the Navigator Module

The navigator is a module that directly interacts with the streamer, either by:

* using the in-memory model produced by the streamer
* or by fetching in HTTP the JSON manifest

The navigator is responsible for a number of things:

* it is responsible for displaying the resources contained in the spine of the publication
* it can also be responsible for navigating between resources (either by following the spine or displaying anciliary resources)
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

### Handling Fixed Layout Publications

If a publication contains fixed layout resources, the navigator module is also responsible for spreads (left page, right page, double pages).

This information is contained in the `properties` object of each link object:

```
{
  "href": "page1.jpg", 
  "type": "image/jpeg", 
  "properties": {"page": "left"}
}
```
