# Content Iterator

* Author: [Mickaël Menu](https://github.com/mickael-menu)
* Review PR: [#177](https://github.com/readium/architecture/pull/177)

## Summary

A new Publication Service to iterate through a publication's content extracted as semantic elements.


## Motivation

The Content Iterator service provides a building block for many high-level features requiring access to the raw content of a publication, such as:

* Text to speech
* Accessibility readers
* Basic search
* Full-text search indexing
* Image or audio indexes

Today, implementing such features is complex because you need to:

1. (maybe) Find a starting location in one of the reading order resources.
2. Iterate through the reading order, opening and closing resources when needed.
3. Extracting the textual or media content from the raw resource, which is different for every supported media type.

The Content Iterator handles all that in a media type agnostic way.

## Developer Guide

### Iterating the content of a publication

First, check if a `Publication` can be iterated using `publication.isContentIterable`.

Then, you can request a `ContentIterator` from the publication:

```typescript
let iterator = publication.contentIteratorFrom(locator)
if (iterator) {
    ...
}
```

The starting `Locator` is optional. When missing, the iteration will start from the very beginning of the publication.


Once you have a valid `ContentIterator` instance, you can crawl through the publication content in both directions, using `previous` or `next`.

```typescript
var content: Content?
while (content = iterator.next()) {
    ...
}

iterator.close()
```

These APIs will return the `Content` elements in the reading order until it reaches the end (or the beginning for `previous`) of the publication. In which case, any additional calls will return `null`.

:warning: Don't forget to `close` the iterator when you are done, to discard opened resources.

### Extracting the data from `Content` elements

The `Content` elements are value objects containing:

* a `Locator` targeting the piece of content
* the associated `Data`

There are several types of `Data` which can be returned by the iterator. Depending on your use case, you might want to filter on the type of data to get only what you need.

#### Media data

Media data are returned when a resource embeds another media resource in the reading flow. They hold a publication `Link` to the embedded resource.

Two kind of media data are currently supported:

* `Audio` for audio clips.
* `Image` for embedded images.
    * It also holds an optional `description` string for accessibility purposes.

#### Text data

The `Text` data is used for the text elements inlined in the publication resources. Each text element matches a semantic item represented as a `TextStyle` in the data object:

* `heading(level: Int)` for text headings, with an associated level
* `body` for a basic body paragraph
* `caption` for a caption associated to an image
* `footnote` for footnotes at the end of the resource
* `quote` for a blockquote
* `listItem` for a single list item

Each `Text` data is split in one or more spans containing the text content, a `Locator` and the language. 

## Reference Guide

### Types and APIs

#### `ContentIterationService` Interface (implements `PublicationService`)

Provides `ContentIterator` instances to crawl the content of a `Publication`.

##### Methods

* `iteratorFrom(start: Locator?) -> ContentIterator?`
    * Creates a `ContentIterator` starting from the given location.
    * Returns `null` if no iterator can be created, for example because no resources are iterable.

##### `Publication` Helpers

* `isContentIterable: Boolean = findService(ContentIterationService::class) != null`
    * Returns whether this `Publication` can be iterated on.
* `contentIteratorFrom(start: Locator?) -> ContentIterator? = findService(ContentIterationService::class)?.iteratorFrom(start)`
    * Creates a `ContentIterator` starting from the given location.

#### `ContentIterator` Interface

Iterates over `Content` elements.

This interface does not depend on `Publication`.

##### Methods

* `previous() -> Content?`
    * Returns the previous `Content` element in the iterator, or `null` when reaching the beginning.
* `next() -> Content?`
    * Returns the next `Content` element in the iterator, or `null` when reaching the end.
* `close()`
    * Closes and discard resources held by this iterator.

#### `Content` Class

Represents a single semantic content element.

##### Properties

* `locator: Locator`
    * Locator targeting this element in the `Publication`.
* `data: Content.Data`
    * Data associated with this element.

#### `Content.Data` Interface

A marker interface for a `Content` associated data.

#### `Content.Data.Text` Class (implements `Content.Data`)

Holds a textual element's spans and style.

##### Properties

* `style: TextStyle`
    * Semantic style for this element.
* `spans: [TextSpan]`
    * List of text spans in this element.

#### `TextStyle` Enum

Semantic style for a text element.

* `heading(level: Int)` for text headings, with an associated level
* `body` for a basic body paragraph
* `caption` for a caption associated to an image
* `footnote` for footnotes at the end of the resource
* `quote` for a blockquote
* `listItem` for a single list item

#### `TextSpan`

A span is a ranged text in a parent text element holding attributes.

##### Properties

* `locator: Locator`
    * Locator targeting the text span in the resource.
* `language: Language?`
    * BCP-47 language code.
* `text: String`
    * Actual text content.

### Default implementations

#### `PublicationContentIterator` Class (implements `ContentIterator`)

A composite `ContentIterator` which iterates through a whole `Publication` and delegates the iteration inside a given resource to media type-specific iterators.

##### Constructors

* `PublicationContentIterator(publication: Publication, start: Locator?, resourceContentIteratorFactories: [ResourceContentIteratorFactory])`
    * `publication` – The `Publication` which will be iterated through.
    * `start` – Starting `Locator` in the publication.
    * `resourceContentIteratorFactories` – List of `ResourceContentIteratorFactory` which will be used to create the iterator for each resource. The factories are tried in order until there's a match.

##### Function types

* `ResourceContentIteratorFactory = (resource: Resource, locator: Locator) -> ContentIterator?`
    * Creates a `ContentIterator` instance for the given `resource`, starting from `locator`.
    * Returns `null` if the resource media type is not supported.

#### `DefaultContentIterationService` Class (implements `ContentIterationService`)

This `ContentIterationService` takes a list of `ResourceContentIteratorFactory` and returns instances of `PublicationContentIterator`.

#### `HTMLResourceContentIterator` Class (implements `ContentIterator`)

A `ContentIterator` which can crawl through an HTML resource.


## Drawbacks and Limitations

### List or Tree?

Many media types represent their content as a tree (e.g. HTML DOM), while the proposed service iterates through a flat list of elements.

A flat list is much easier to manipulate, especially when starting from a mid-resource location. Besides, the features that would use this building block are mostly interested in getting the content flatten in the reading flow direction rather than a tree. However, we do loose information from the original content that might be useful in other use cases. There is a tension here that is difficult to resolve.

One particular element that would benefit from a tree structure is a list of items. We could add a new `TextStyle` supporting some local tree nodes for this.

## Future Possibilities

### Extending `HTMLResourceContentIterator`

HTML content can be quite complex and an app might want to filter out some DOM elements in the iteration. This could be implemented as an extension point in `HTMLResourceContentIterator`.

