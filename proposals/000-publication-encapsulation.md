# Publication Encapsulation

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Related Issues:
  * [#122 Splitting the Publication model](https://github.com/readium/architecture/issues/122)


## Summary

We can make the Readium toolkit simpler and safer to use by exposing a single encapsulated `Publication`, encompassing resources access and services.


## Motivation

For a given publication, we currently have several free-floating objects that a reading app needs to manipulate, such as `DRMLicense`, `Fetcher`/`Container` and `Publication`. This leads to [a lot of housekeeping](https://github.com/readium/r2-testapp-swift/blob/2f576170f8ff35ba16c8ffa7363b3eaa77ed5268/r2-testapp-swift/Library/LibraryService.swift) and fragile code in reading apps.

By exposing a single `Publication` object as the entry-point for everything related to the publication, we can:

* Simplify the code in reading apps.
* Reduce the complexity of migrations caused by future evolutions of the toolkit.
* Improve features discoverability for Readium developers.


## Developer Guide

The `Publication` object is the entry-point for all metadata and services related to a publication. You can use it to:

* Get the manifest metadata.
* Read publication resources.
* Perform advanced queries or operations using [Publication Services](https://github.com/readium/architecture/pull/131), such as searching through the content.

### Obtaining a `Publication`

The `Publication` object is usually created by the Readium toolkit, either from:

* `r2-streamer`, when parsing a publication file, e.g. EPUB or PDF
* `r2-opds`, when parsing an OPDS publication

You are free to create a `Publication` manually to fit custom needs.

### Getting Manifest Metadata

`Publication` implements the `Publication.Manifest` interface, which provides access to a publication's metadata. You can use them, for example, to import a publication in the user's bookshelf or to browse its table of contents.

```javascript
database.addPublication({
  "title": publication.metadata.title,
  "authors": publication.metadata.authors
    .map(author => author.name).join(", ")
})
```

### Reading Publication Resources

Once you have a `Link` object targeting a resource, you can call `Publication::get()` to read it.

```javascript
let coverLink = publication.linkWithRel("cover")
if (coverLink) {
  let coverBytes = publication.get(coverLink).read()
}
``` 

### Presenting the Publication

To present the publication, create a *navigator* with the `Publication` object. It contains everything the navigator needs to render the publication.

### Using Publication Services

While out of scope for this proposal, this example illustrates the feature-rich API we can get from an encapsulated `Publication` object.

Given a `SearchService` providing a `Publication::search()` helper, we can do:

```javascript
let results = await publication.search("banana")
navigator.goTo(results[0])
```

### Backward Compatibility and Migration

#### Mobile (Swift & Kotlin)

This proposal should be a non-breaking change, since it is merely additive.

* `Container` will be deprecated, and forward requests to `Publication::get()`.


## Reference Guide

### `Publication.Manifest` Interface

Holds the metadata of a Readium publication, as described in the [Readium Web Publication Manifest](https://readium.org/webpub-manifest/).

#### Properties

* `metadata: Publication.Metadata`
  * Out of scope, [see this JSON schema](https://readium.org/webpub-manifest/schema/metadata.schema.json).
* `links: List<Link>`
  * Out of scope, [see this JSON schema](https://readium.org/webpub-manifest/schema/link.schema.json).
* `subcollections: Map<String, List<Collection>>`
  * Subcollections indexed by their role.
  * Out of scope, [see this JSON schema](https://readium.org/webpub-manifest/schema/subcollection.schema.json).
* `readingOrder: List<Link>`
  * Identifies a list of resources in reading order for the publication.
* `resources: List<Link>`
  * Identifies resources that are necessary for rendering the publication.
* `tableOfContents: List<Link>`
  * Identifies the collection that contains a table of contents.

The `readingOrder`, `resources` and `tableOfContents` properties may be implemented as computed properties using `subcollections`.

```swift
var readingOrder: [Link] {
    subcollections["readingOrder"]?.firstOrNull?.links ?? []
}
```

#### Methods

* `toJSON() -> String`
  * Serializes the manifest to its [RWPM JSON](https://readium.org/webpub-manifest/) string representation.

### `Publication` Class (implements `Publication.Manifest`)

The `Publication` shared model is the entry-point for all the metadata and services related to a Readium publication.

It is constructed from a group of objects with clear responsibilities:

* `Publication.Manifest` which holds the metadata parsed from the source publication file/manifest.
* [`Fetcher`](https://github.com/readium/architecture/pull/132) which offers a read-only access to resources.
* [`Publication.Service`](https://github.com/readium/architecture/pull/131) objects which extend the `Publication` with features such as position list, search, thumbnails generation, rights management, etc.

#### Constructors

* `Publication(manifest: Publication.Manifest, fetcher: Fetcher? = null, serviceFactories: List<Publication.Service.Factory> = [])`
  * `manifest: Publication.Manifest`
    * The manifest holding the publication metadata extracted from the publication file.
    * It will be used to construct the publication services and to implement the `Publication.Manifest` interface by delegation.
  * `fetcher: Fetcher? = null`
    * The underlying fetcher used to read publication resources.
  * `serviceFactories: List<Publication.Service.Factory> = []`
    * Optional list of service factories used to create the instances of `Publication.Service` attached to this `Publication`.

#### Methods

* `get(link: Link, parameters: Map<String, String> = {}) -> Resource`
  * Returns the resource targeted by the given link.
  * `parameters: Map<String, String> = {}`
    * Parameters used when `link` is templated.
    * The parameters must not be percent-encoded.
  * Delegates to `fetcher.get()`.
    * The `link.href` property is searched for in the `links`, `readingOrder` and `resources` properties to find the matching manifest `Link`. This is to make sure that the `Link` given to the `Fetcher` contains all properties declared in the manifest.
    * The properties are searched recursively following `Link::alternate`, then `Link::children`. But only after comparing all the links at the current level.
* `get(url: String) -> Resource`
  * Returns the resource at the given URL.
  * Equivalent to `get(Link(href: hrefFromURL(url)), queryParametersOf(url))`.

### `JSONManifest` Class (implements `Publication.Manifest`)

A manifest which can be parsed from a [RWPM JSON](https://readium.org/webpub-manifest/).

#### Constructors

* `JSONManifest(json: JSONObject)`
  * Parses a manifest from its RWPM JSON representation.
* `JSONManifest(jsonString: String)`
  * Parses an object from its RWPM JSON string representation.
  * Convenience constructor delegating to `JSONManifest(json:)`.
