# Publication Encapsulation

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Related Issues:
  * [#122 Splitting the Publication model](https://github.com/readium/architecture/issues/122)


## Summary

We can make the Readium toolkit simpler and safer to use by exposing a single encapsulated `Publication`, encompassing resources access and services.


## Motivation

For a given publication, we currently have several free-floating objects that a reading app needs to manipulate, such as `DRMLicense`, `Fetcher`, `Container` and `Publication`. This leads to [a lot of housekeeping](https://github.com/readium/r2-testapp-swift/blob/2f576170f8ff35ba16c8ffa7363b3eaa77ed5268/r2-testapp-swift/Library/LibraryService.swift) and fragile code in the reading apps.

By exposing a single `Publication` object as the entry-point for everything related to the publication, we can:

* Simplify the code in reading apps.
* Reduce the complexity of migrations caused by future changes in the toolkit.
* Improve features discoverability for Readium developers.


## Developer Guide

The `Publication` object is the entry-point for all the metadata and services related to a publication. You can use it to:

* Get the manifest metadata.
* Read the publication resources.
* Perform additional operations using [publication services](https://github.com/readium/architecture/pull/131), such as searching through the content.

### Creating a `Publication`

The `Publication` object is usually created by the Readium toolkit, either from:

* `r2-streamer`, when parsing a publication file, e.g. EPUB or PDF,
* `r2-opds`, when parsing an OPDS publication.

You are free to create a `Publication` manually to fit custom needs.

### Getting Manifest Metadata

`Publication` implements the `Manifest` interface, which provides access to a publication's metadata. You can use them, for example, to import a publication in the user's bookshelf or to browse its table of contents.

### Reading Publication Resources

The resources part of a publication are listed under the `readingOrder` and `resources` properties. Once you have a `Link` object targeting the resource, you can call `Publication::get()` to read it.

```swift
let link = publication.readingOrder.first
let content = publication.get(link).readAsString()
``` 

### Presenting the Publication

To present the publication, create a *navigator* with the `Publication` object. It contains everything the navigator needs to render the publication.

### Using Publication Services

While out of scope for this proposal, this example illustrates the feature-rich API we can get from an encapsulated `Publication` object.

Given a `SearchService` providing a `Publication::search()` helper, we can do:

```swift
publication.search("banana", options: .caseInsensitive) { results in
    navigator.go(to: results.first)
}
```

### Backward Compatibility and Migration

#### Mobile (Swift & Kotlin)

This proposal should be a non-breaking change, since it is merely additive.

* The `Container` will be deprecated, and forward requests to `Publication::get()`.


## Reference Guide

### `Manifest` Interface

Holds the metadata of a Readium publication, as described in the [Readium Web Publication Manifest](https://readium.org/webpub-manifest/).

This interface is implemented by both `Publication` and `JSONManifest`, to be able to [attach helpers](https://github.com/readium/architecture/pull/131) to both types by adding them to `Manifest` directly.

#### Properties

* `metadata: Metadata`
* `links: List<Link>`
* `readingOrder: List<Link>`
  * Identifies a list of resources in reading order for the publication.
* `resources: List<Link>`
  * Identifies resources that are necessary for rendering the publication.
* `tableOfContents: List<Link>`
  * Identifies the collection that contains a table of contents.
* `subcollections: Map<String, List<JSONCollection>>`
  * Subcollections indexed by their role – the JSON key used in the parent collection.

### `JSONCollection` Class

Represents a RWPM JSON collection, [as described in the specification](https://readium.org/webpub-manifest/#12-terminology).

#### Properties

* `metadata: Map<String, Any>`
* `links: List<Link>`
* `subcollections: Map<String, List<JSONCollection>>`
  * Subcollections indexed by their role – the JSON key used in the parent collection.

### `JSONManifest` Class (implements `Manifest`)

A manifest that can be parsed from and serialized to a [RWPM JSON](https://readium.org/webpub-manifest/).

The `readingOrder`, `resources` and `tableOfContents` properties may be implemented as helpers using `subcollections`.

```kotlin
val JSONManifest.readingOrder = subcollections["readingOrder"]?.firstOrNull?.links ?: []
```

#### Constructors

* `JSONManifest(json: JSONObject)`
  * Parses a manifest from its RWPM JSON representation.
* `JSONManifest(jsonString: String)`
  * Parses a manifest from its RWPM JSON string representation.
  * Convenience constructor delegating to `JSONManifest(json:)`.

#### Methods

* `toJSON() -> JSONObject`
  * Serializes the manifest to its RWPM JSON representation.

### `Publication` Class (implements `Manifest`)

The `Publication` shared model is the entry-point for all the metadata and services related to a Readium publication.

It is is constructed from a group of objects with clear responsibilities:

* `JSONManifest` which holds the publication metadata and handles the RWPM parsing/serialization.
* [`Fetcher`](https://github.com/readium/architecture/pull/132) which offers a read-only access to the resources.
* (*out of scope*) [`Publication.Service`](https://github.com/readium/architecture/pull/131) factories which extend the `Publication` with extra capabilities, e.g. position list, search, thumbnails generation, rights management, etc.

#### Constructors

* `Publication(manifest: JSONManifest, fetcher: Fetcher)`

#### Properties

* (private) `manifest: JSONManifest`
  * The underlying JSON manifest holding the metadata.
* (private) `fetcher: Fetcher`
  * The underlying fetcher used to read publication resources.
* `metadata`, `links`, `readingOrder`, `resources`, `tableOfContents` and `subcollections`
  * All these properties are delegated to the internal `manifest` property.
* `manifestJSON: JSONObject`
  * Returns the RWPM JSON representation of the publication manifest.
  * Delegates to `manifest.toJSON()`.

#### Methods

* `get(link: Link, parameters: Map<String, String> = {}) -> Resource`
  * Returns the resource targeted by the given link.
  * `parameters: Map<String, String> = {}`
    * Query parameters, used when the `Link::href` is templated.
    * The parameters are expected to be percent-decoded.
  * If the HREF is `manifest.json`, then the `manifestJSON` property is returned.
  * Otherwise, delegates to `fetcher.get()`.
    * The `link.href` property is searched for in the `links`, `readingOrder` and `resources` properties to find the matching manifest `Link`. This is to make sure that the `Link` given to the `Fetcher` contains all declared properties.
    * The properties are searched recursively following `Link::alternate`, then `Link::children`. But only after comparing all the links at the current level.
* `get(href: String, parameters: Map<String, String> = {}) -> Resource`
  * Returns the resource at the given HREF.
  * Equivalent to `get(Link(href: href), parameters)`.


## Rationale and Alternatives

What other designs have been considered, and why you chose this approach instead.

* Not having a separate `JSONManifest` object


## Drawbacks and Limitations

Why should we *not* do this? Is there any unresolved questions?


## Future Possibilities

* Managing DRM rights
