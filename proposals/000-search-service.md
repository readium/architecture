# Search Service

* Authors: [Mickaël Menu](https://github.com/mickael-menu)


## Summary

Introduction of a new [publication service](https://readium.org/architecture/proposals/004-publication-helpers-services.html) providing a way to search an excerpt through the content of a publication.


## Motivation

Being able to search through a publication's content is a useful feature, often expected by end users. We can offer a unified API for the wide variety of publication formats supported by Readium to make it easy for reading apps to implement such feature.

To ensure interoperability, this new Search Service will use the [Locator model](https://readium.org/architecture/models/locators/). This means that a mobile or desktop app could – with the same code – display a search interface for a remote Web Publication, if the Publication Server implements the proper Search Web Service.

Besides, search can be implemented in many different ways, so being able to switch implementations without touching the UX layer would be valuable. For example, a reading app might want to use a [full-text search](https://en.wikipedia.org/wiki/Full-text_search) database to improve search performance and search across multiple publications in the user bookshelf.


## Developer Guide

### Searching Through the Content

To begin a search interaction, call `Publication::search()` with a text query. It returns a **search iterator** which can be used to crawl through `Locator` occurrences, with `next()`.

```typescript
let searchIterator: SearchIterator = await publication.search("orange")

let page1: LocatorCollection = await searchIterator.next()
navigator.go(page1.locators[0])
```

The search iterator may also provide the total number of occurrences with `resultCount`. This property is optional because it might not be available with all search algorithms.

```typescript
"Found ${searchIterator.resultCount} occurrences"
```

### Crawling Through Paginated Results

A plain search can be an expensive operation. To keep the resource usage under control, the search results are paginated thanks to the **search iterator**. You can move forward in the pages with the `next()` function, which returns a `LocatorCollection` object.

One of the usual ways to present the results is as a scrollable list of occurrences. You can use `next()` to implement the *infinite scroll* pattern by loading the next page of results when the user reaches the end of the list.

After reaching the end of the publication, any subsequent call to `next()` will return `null`.

#### Number of Items per Page

You don't have any control over the number of items returned in a page. This depends on the implementation of the Search Service used. For example, a full-text search might return a constant number of locators per page, while a plain crawling search might return one full page per publication resource. 

### Terminating a Search

The Search Service might keep some resources allocated for your search query, such as a cursor. To make sure they are recovered when the user is done with the search, do not forget to call `close()` on the search iterator.

```typescript
searchIterator.close()
```

### Search Options

Depending on the search algorithm, the Search Service might be able to offer options to customize how results are found. Query `publication.searchOptions` to know which options are available for the publication.

When searching for a query, you can customize some of the supported search options.

```typescript
let searchIterator = publication.search("kiwi recipe", options: [
  SearchService.Option.CaseSensitive(true),
  SearchService.Option.CloseVariants(false),
])
```

Each option has an associated value – such as a boolean – to determine its action. The options in `publication.searchOptions` will have the default values for the service. If you omit an option from the search query, its default value will be used.

You should adapt the user interface according to the available search options and their default value.

```typescript
diacriticCheckbox.visible =
  publication.searchOptions.has(SearchService.Option.DiacriticSensitive)
```

### Backward Compatibility and Migration

#### Mobile Toolkits

This new proposal does not impact any existing API. The Kotlin Toolkit already provides a search feature implemented with [mark.js](https://markjs.io/), but its code is entirely in the test app, so out of scope for R2 modules. Reading apps are free to keep the implementation using mark.js and ignore the Search Service.


## Reference Guide

### `SearchService` Interface

#### Properties

* `options: Set<SearchService.Option>`
  * All search options available for this service.
  * Also holds the default value for these options, which can be useful to setup the views in the search interface. If an option is missing when calling `search()`, its value is assumed to be the default one.

#### Methods

* (async) `search(query: String, options: Set<SearchService.Option> = []) -> SearchIterator`
  * Starts a new search through the publication content, with the given `query`.
  * Returns a `SearchIterator` used to crawl through the results, or an error if the search could not be handled.

#### `Publication` Helpers

* `searchOptions: Set<SearchService.Option> = findService(SearchService::class)?.options ?: []`
  * All search options available for this service.
* `isSearchable: Boolean = findService(SearchService::class) != null`
  * Indicates whether the content of this publication can be searched.
* `search(query: String, options: Set<SearchService.Option> = []) -> SearchIterator = findService(SearchService::class).search(query, options)`
  * Starts a new search through the publication content, with the given `query`.

#### `SearchService.Option` Enum

Search options which can be implemented by a Search Service.

* `CaseSensitive(boolean)` - `case-sensitive`
  * Whether the search will differentiate between capital and lower-case letters.
* `DiacriticSensitive(boolean)` - `diacritic-sensitive`
  * Whether the search will differentiate between letters with accents or not. 
* `WholeWord(boolean)` - `whole-word`
  * Whether the query terms will match full words and not parts of a word.
* `CloseVariants(boolean)` - `close-variants`
  * Matches results similar but not identical to the query, such as reordered or words with a related stem.
  * For example, "banana split" would match "I love banana split" but also "splitting all the bananas".
  * When *close variants* are enabled, surround terms with double quotes for an exact match.
* `Fuzzy(boolean)` - `fuzzy`
  * Matches results with [typos or similar spelling](https://en.wikipedia.org/wiki/Approximate_string_matching).
* `Custom(string)` - `<string>`
    * A custom option implemented by a Search Service which is not officially recognized by Readium.

Custom options can be declared by a Search Service in `searchOptions`. Such extensions should use a [reverse domain name notation](https://en.wikipedia.org/wiki/Reverse_domain_name_notation) as key to avoid conflicts, e.g. `com.company.x`.

### `SearchIterator` Interface

Iterates through search results.

#### Properties

* `resultCount: Int?`
  * Number of matches for this search.
  * This property is optional because depending on the search algorithm, it may not be possible to know the result count until reaching the end of the publication.

#### Methods

* (async) `next() -> LocatorCollection?`
  * Retrieves the next page of results.
  * Returns `null` when reaching the end of the publication, or an error in case of failure.
* `close()`
  * Closes any resources allocated for the search query, such as a cursor.
  * To be called when the user dismisses the search.

### `LocatorCollection` Object

Represents a sequential list of `Locator` objects. For example, a search result or a list of positions.

#### Properties

* `metadata: LocatorCollection.Metadata`
  * Holds the metadata of a `LocatorCollection`.
  * Properties:
      * `title: LocalizedTitle?` – A user-facing title representing this collection of locators.
      * `numberOfItems: Int?` – Indicates the total number of locators in the collection.
      * `otherMetadata: [String: Any]` – Additional metadata for extensions, as a JSON dictionary.
* `links: [Link]`
  * List of links relevant to this collection.
  * For example, a link with `next` relation indicates how to get the next page of results.
* `locators: [Locator]`
  * List of locators belonging to this collection.

### Web Service

#### `search/options` Route

Returns the list of supported search options.

* href: `/~readium/search/options`
* type: `application/vnd.readium.search.options+json`

```json
{
  "supportedOptions": ["case-sensitive", "diacritic-sensitive", "close-variants"]
}
```

#### `search` Route

* href: `/~readium/search{?query,options}`
  * `query` is the percent-encoded text query to search.
  * `options` is a comma-separated list of search options to enable for this query.
    * When missing, it defaults to an empty options set.
    * For example, `options=case-sensitive,close-variants`.
* type: `application/vnd.readium.locators+json`

##### Response

Status Code | Description | Format
----------- | ----------- | ------
`200` | Returns the first page of results. | Locators Collection object
`400` | Invalid search query or options. | [Problem Details object](https://tools.ietf.org/html/rfc7807#section-3.1)

###### Locators Collection Object

In `metadata` a feed MAY contain the following elements:

Key | Definition | Format
--- | ---------- | ------
`numberOfItems` | Indicates the total number of results for this search. | Integer

In `links` the following relations MAY be used:

Relation | Definition | Reference
-------- | ---------- | ---------
`self` | Refers to the current page of results | [RFC4287](https://www.iana.org/go/rfc4287)
`next` | Refers to the next page of results, if the end of the publication is not already reached. | [HTML](http://www.w3.org/TR/html5/links.html#link-type-next)

```json
{
  "metadata": {
    "title": "Searching <riddle> in Alice in Wonderlands - Page 1",
    "numberOfItems": 3
  },
  "links": [
    {"rel": "self", "href": "/978-1503222687/search?query=apple", "type": "application/vnd.readium.locators+json"},
    {"rel": "next", "href": "/978-1503222687/search?query=apple&page=2", "type": "application/vnd.readium.locators+json"}
  ],
  "locators": [
    {
      "href": "/978-1503222687/chap7.html",
      "type": "application/xhtml+xml",
      "locations": {
        "fragments": [
          ":~:text=riddle,-yet%3F'"
        ],
        "progression": 0.43
      },
      "text": {
        "before": "'Have you guessed the ",
        "highlight": "riddle",
        "after": " yet?' the Hatter said, turning to Alice again."
      }
    },
    {
      "href": "/978-1503222687/chap7.html",
      "type": "application/xhtml+xml",
      "locations": {
        "fragments": [
          ":~:text=in%20asking-,riddles"
        ],
        "progression": 0.47
      },
      "text": {
        "before": "I'm glad they've begun asking ",
        "highlight": "riddles",
        "after": ".--I believe I can guess that,"
      }
    }
  ]
}
```

### Populating the `Locator` Objects


## Rationale and Alternatives

What other designs have been considered, and why you chose this approach instead.


## Drawbacks and Limitations

Why should we *not* do this? Are there any unresolved questions?


## Future Possibilities

Making it more reactive

FTS through a ContentIteratorService

## Implementation Notes
(*after implementing the feature on a platform*)

Any implementer can submit an amendment PR to offer insights for other platforms.
