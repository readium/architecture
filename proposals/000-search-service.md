# Search Service

* Authors: [Mickaël Menu](https://github.com/mickael-menu)


## Summary

Introduction of a new [publication service](https://readium.org/architecture/proposals/004-publication-helpers-services.html) providing a way to search an excerpt through the content of a publication.


## Motivation

Being able to search through a publication's content is a useful feature, often expected by end users. We can offer a unified API for the wide variety of publication formats supported by Readium to make it easy for reading apps to implement such feature.

To ensure interoperability, this new Search Service will use the [Locator model](https://readium.org/architecture/models/locators/) with standardized fragments. This means that a mobile or desktop Navigator could – with the same code – display a search interface for a remote Web Publication, if the Publication Server is taking advantage of the web services powered by publication services.

Besides, search can be implemented in many different ways, so it would be useful to be able to switch implementations without touching the UX layer. For example, a reading app might want to use a full-text search database to improve search performance and allow to search across publications in the bookshelf.


## Developer Guide

### Searching Through the Content

To begin a search interaction, call `Publication::search()` with a text query. It returns a **search iterator** that you can use to crawl through `Locator` occurrences, with `next()`.

```typescript
let searchIterator: SearchIterator = await publication.search("orange")

let locators: [Locator] = await searchIterator.next()
navigator.go(locators[0])
```

The search iterator may also provide the total number of occurrences with `resultCount`. This property is optional because depending on the search algorithm, it may not be possible to know the result count until reaching the end of the publication.

```typescript
resultsLabel.text = "Found ${searchIterator.resultCount} occurrences"
```

### Crawling Through Paginated Results

A plain search can be an expensive operation. To keep the resource usage under control, the search results are paginated thanks to the search iterator. You can move forward in the pages with the `next()` function, which returns a list of `Locator`.

One of the best way to present the results is as a scrollable list of occurrences. You can use `next()` to implement the *infinite scroll* pattern by loading the next page of results when the user reaches the end of the list.

The search iterator will continue returning pages until it reaches the end of the publication, in which case any subsequent call to `next()` will return `null`.


#### Result Count Per Page

You don't have any control over the number of items returned in a page. This depends on the implementation of the Search Service used. For example, a full-text search might return a constant number of locators per page, while a plain crawling search might return one full page per reading order resource. 

Therefore, a page might be returned empty, but it doesn't mean you reached the end of the publication. You can continue calling `next()` until it returns `null`.


### Terminating a Search

The Search Service might keep some resources allocated for your search query, such as a cursor. To make sure they are recovered when the user is done with the search, don't forget to call `close()` on the search iterator.

```javascript
searchIterator.close()
```

### Search Options

By default, the search is case and diacritic insensitive, but looks for an *exact match*. Meaning that searching for "Banana split" will find "I love banana split" but not "split the banana". A given Search Service might offer advanced search options depending on its capabilities.

```javascript
let searchIterator = publication.search("kiwi recipe", options: [
  SearchService.Options.CaseSensitive,
  SearchService.Options.CloseVariants
])
```

You should adapt the user interface according to the available search options. To find out which options is available with the Search Service, use `supportedSearchOptions`.

```javascript
diacriticCheckbox.visible =
  publication.supportedSearchOptions.contains(SearchService.Options.DiacriticSensitive)
```

### Backward Compatibility and Migration
(*if relevant*)

Explain how this proposal will impact existing reading apps, compared to new Readium users.

* Which types will be deprecated, and with which warning and alias.
* Which migration steps must developers follow, and what changes will be needed in their codebase.

If possible, add one section per platform. Other maintainers are welcome to complete this section upon review, by commenting on the review PR.


## Reference Guide

### `SearchService` Interface

#### Properties

* `supportedOptions: Set<SearchService.Options>`
  * Advanced search options available with this Search Service.

#### Methods

* (async) `search(query: String, options: Set<SearchService.Options> = []) -> SearchIterator`
  * Starts a new search through the publication content, with the given `query`.
  * Returns a `SearchIterator` used to crawl through the results, or an error if the search couldn't be processed.

#### `Publication` Helpers

* `supportedSearchOptions: Set<SearchService.Options> = findService(SearchService::class)?.supportedOptions ?: []`
  * Advanced search options available with this Search Service.
* `isSearchable: Boolean = findService(SearchService::class) != null || links.firstWithRel("search", mediaType: MediaType.readiumSearch) != null`
  * Indicates whether the content of this publication can be searched.
  * Checks the presence of a Search Service, or a `search` link with the `application/vnd.readium.locators+json` media type.
* `search(query: String, options: Set<SearchService.Options>) -> SearchIterator = findService(SearchService::class)!.search(query, options)`
  * Starts a new search through the publication content, with the given `query`.
  * Delegates to the Search Service, or use the WS from the `search` link if there's any.
  * Calling `search()` if `isSearchable` returns `false` is an error and an exception will be thrown.

#### `SearchService.Options` Enum

Advanced search options which can be implemented by a Search Service.

* `CaseSensitive` - `case-sensitive`
  * Matches the exact case used in the query.
* `DiacriticSensitive` - `diacritic-sensitive`
  * Matches the exact accents used in the query.
* `Fuzzy` - `fuzzy`
  * Matches results with [typos or similar spelling](https://en.wikipedia.org/wiki/Approximate_string_matching).
* `CloseVariants` - `close-variants`
  * Matches results similar but not identical to the query, such as reordered or words with a related stem.
  * For example, "banana split" would match "I love banana split" but also "splitting all the bananas".
  * When *close variants* are enabled, surround terms with double quotes for an exact match.
* `ExclusionOperator` - `exclusion-operator` (requires `CloseVariants`)
  * Ignores results containing any term prefixed with `-`.
  * For example, "virus -computer".
* `PrefixOperator` - `prefix-operator` (requires `CloseVariants`)
  * Matches results starting with the terms suffixed with `*`.
  * For example, "eat* pasta".
* `BooleanOperators` - `boolean-operators` (requires `CloseVariants`)
  * Refines queries with `OR` and `AND` operators, optionally grouped with parentheses.
  * For example, "(Marvel OR DC) comic"

Additional options can be declared by a Search Service in `supportedSearchOptions`. Such extensions should use an URI as key to avoid conflicts.

### `SearchIterator` Interface

#### Properties

* `resultCount: Int?`
  * Number of matches for this search.
  * This property is optional because depending on the search algorithm, it may not be possible to know the result count until reaching the end of the publication.

#### Methods

* (async) `next() -> [Locator]?`
  * Retrieves the next page of results.
  * Returns `null` when reaching the end of the publication, or an error in case of failure.
* `close()`
  * Closes any resources allocated for the search query, such as a cursor.
  * To be called when the user dismisses the search.

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
