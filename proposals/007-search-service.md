# Search Service

* Authors: [Mickaël Menu](https://github.com/mickael-menu)
* Review PR: [#158](https://github.com/readium/architecture/pull/158)


## Summary

Introduction of a new [publication service](https://readium.org/architecture/proposals/004-publication-helpers-services.html) providing a way to search an excerpt through the content of a publication.


## Motivation

Being able to search through a publication's content is a useful feature, often expected by end users. We can offer a unified API for the wide variety of publication formats supported by Readium to make it easy for reading apps to implement such feature.

To ensure interoperability, this new Search Service will use the [Locator model](https://readium.org/architecture/models/locators/). This means that a mobile or desktop app could – with the same code – display a search interface for a remote Web Publication, if the Publication Server implements the proper Search Web Service.

Search can be implemented in many different ways, so being able to switch implementations without touching the UX layer would be valuable. For example, a reading app might want to use a [full-text search](https://en.wikipedia.org/wiki/Full-text_search) database to improve search performance and search across multiple publications in the user bookshelf.


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

One of the usual ways to present the results is as a scrollable list of occurrences. You can use `next()` to implement the *infinite scroll* pattern by loading the next page of results when the user reaches the end of the scroll view.

After reaching the end of the publication, any subsequent call to `next()` will return `null`.

#### Number of Items per Page

You don't have any control over the number of items returned in a page. This depends on the implementation of the Search Service used. For example, a full-text search might return a constant number of locators per page, while a plain crawling search could return one page per publication resource. 

### Terminating a Search

The Search Service might keep some resources allocated for your search query, such as a cursor. To make sure they are recovered when the user is done with the search, do not forget to call `close()` on the search iterator.

```typescript
searchIterator.close()
```

### Search Options

Depending on the search algorithm, the Search Service might be able to offer options to customize how results are found. Query `publication.searchOptions` to know which options are available for the publication.

When searching for a query, you can customize some of the supported search options.

```typescript
let searchIterator = publication.search("recette kiwi", options: SearchOptions(
  caseSensitive: false,
  language: "fr",
])
```

Each option has an associated value – such as a boolean – to determine its action. The options in `publication.searchOptions` will have the default values for the service. If you omit an option from the search query, its default value will be used.

You should adapt the user interface according to the available search options and their default value.

```typescript
diacriticCheckbox.visible =
  publication.searchOptions.diacriticSensitive ?: false
```

### Backward Compatibility and Migration

#### Mobile Toolkits

This new proposal does not impact any existing API. The Kotlin toolkit already provides a search feature implemented with [mark.js](https://markjs.io/), but its code is entirely in the test app, so out of scope for R2 modules. Reading apps are free to keep the implementation using mark.js and ignore the new Search Service.


## Reference Guide

### Types and APIs

#### `SearchService` Interface (implements `Publication.Service`)

##### Properties

* `options: SearchOptions`
  * Default value for the search options of this service.
  * If an option does not have a value, it is not supported by the service.

##### Methods

* (async) `search(query: String, options: SearchOptions? = null) -> SearchIterator`
  * Starts a new search through the publication content, with the given `query`.
  * If an option is null when calling `search()`, its value is assumed to be the default one.
  * Returns a `SearchIterator` used to crawl through the results, or an error if the search could not be handled.

##### `Publication` Helpers

* `isSearchable: Boolean = findService(SearchService::class) != null`
  * Indicates whether the content of this publication can be searched.
* `searchOptions: SearchOptions = findService(SearchService::class)?.options ?: SearchOptions()`
  * All search options available for this service.
* `search(query: String, options: SearchOptions? = null) -> SearchIterator = findService(SearchService::class).search(query, options)`
  * Starts a new search through the publication content, with the given `query`.

#### `SearchOptions` Class

Holds the available search options and their current values.

##### Properties

* `caseSensitive: Boolean?` (JSON: `case-sensitive`)
  * Whether the search will differentiate between capital and lower-case letters.
* `diacriticSensitive: Boolean?` (JSON: `diacritic-sensitive`)
  * Whether the search will differentiate between letters with accents or not. 
* `wholeWord: Boolean?` (JSON: `whole-word`)
  * Whether the query terms will match full words and not parts of a word.
* `exact: Boolean?` (JSON: `exact`)
  * Matches results exactly as stated in the query terms, taking into account stop words, order and spelling.
* `language: String?` (JSON: `language`)
  * BCP 47 language code overriding the publication's language.
* `regularExpression: Boolean?` (JSON: `regex`)
  * The search string is treated as a regular expression.
  * The particular flavor of regex depends on the service.
* `otherOptions: Map<String, String>`
    * Map of custom options implemented by a Search Service which are not officially recognized by Readium.

Custom options can be declared by a Search Service in `otherOptions`. Such extensions should use a [reverse domain name notation](https://en.wikipedia.org/wiki/Reverse_domain_name_notation) (e.g. `com.company.x`) as JSON key to avoid conflicts.

#### `SearchIterator` Interface

Iterates through search results.

##### Properties

* `resultCount: Int?`
  * Number of matches for this search.
  * This property is optional because depending on the search algorithm, it may not be possible to know the result count until reaching the end of the publication.
  * The count might be updated after each call to `next()`.

##### Methods

* (async) `next() -> LocatorCollection?`
  * Retrieves the next page of results.
  * Returns `null` when reaching the end of the publication, or an error in case of failure.
* `close()`
  * Closes any resources allocated for the search query, such as a cursor.
  * To be called when the user dismisses the search.

#### `LocatorCollection` Object

Represents a sequential list of `Locator` objects. For example, a search result or a list of positions.

##### Properties

* `metadata`
  * `title: LocalizedTitle?` – A user-facing title representing this collection of locators.
  * `numberOfItems: Int?` – Indicates the total number of locators in the collection.
  * `otherMetadata: [String: Any]` – Additional metadata for extensions, as a JSON dictionary.
* `links: [Link]`
  * List of links relevant to this collection.
* `locators: [Locator]`
  * List of locators belonging to this collection.

### Default Implementations

Example implementations which should be provided by the Readium toolkits.

#### `StringSearchService`

A rather naive implementation iterating over each resource of the publication and searching into the sanitized text content.

#### `WebSearchService`

A facade to the JSON Web Service described in the following section.

### Web Service

#### `search` Route

* HREF: `/~readium/search{?query}`
  * `query` is the percent-encoded text query to search.
* relation: `search`
* type: `application/vnd.readium.locators+json`

##### `OPTIONS` Response

When using the `OPTIONS` HTTP method, without any query parameters, the server returns the supported search options as a JSON object.

```
OPTIONS https://publication-server.com/search
```

```json
{
    "options": {
        "case-sensitive": false,
        "diacritic-sensitive": false,
        "com.company.regex-type": "perl"
    }
}
```

##### `GET` Response

The `GET` HTTP method is used to perform the search. It expects the `query` parameter as well as one additional parameter per custom option, for example:

```
GET https://publication-server.com/search?query=orange&case-sensitive=1&com.company.regex-type=icu
```

A valid Search Web Service **must** support integer representations for boolean query options.

| Status Code | Description                       | Format                                                                    |
|-------------|-----------------------------------|---------------------------------------------------------------------------|
| `200`       | Returns the first page of results | `LocatorCollection` object                                                |
| `400`       | Invalid search query or options   | [Problem Details object](https://tools.ietf.org/html/rfc7807#section-3.1) |

###### `LocatorCollection` Object

In `metadata` a feed MAY contain the following elements:

| Key             | Definition                                                   | Format           |
|-----------------|--------------------------------------------------------------|------------------|
| `numberOfItems` | Indicates the total number of results for this search        | Integer          |
| `title`         | A user-facing title representing this collection of locators | Localized String |

In `links` the following relations MAY be used:

| Relation | Definition                                                                                | Reference                                                    |
|----------|-------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| `self`   | Refers to the current page of results                                                     | [RFC4287](https://www.iana.org/go/rfc4287)                   |
| `next`   | Refers to the next page of results, if the end of the publication is not already reached. | [HTML](http://www.w3.org/TR/html5/links.html#link-type-next) |

```json
{
  "metadata": {
    "title": "Searching <riddle> in Alice in Wonderlands - Page 1",
    "numberOfItems": 42
  },
  "links": [
    {"rel": "self", "href": "/978-1503222687/search?query=riddle", "type": "application/vnd.readium.locators+json"},
    {"rel": "next", "href": "/978-1503222687/search?query=riddle&page=2", "type": "application/vnd.readium.locators+json"}
  ],
  "locators": [
    {
      "href": "/978-1503222687/chap7.html",
      "type": "application/xhtml+xml",
      "title": "Chapter 1",
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
      "title": "Chapter 1",
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

#### Title

Providing a `title` for locators is useful to group search results in the user interface. A common choice is to use the table of contents' title where the occurrence is located.

#### Text Context

A valid `Locator` object returned by a Search Service **must** have at least a `text` context. With long enough `before` and `after` snippets (> 30 characters), a Navigator is able to locate the search occurrence in most cases.

The `text` is also used in the search user interface to display additional context to the user. As such, it should be sanitized by:

* removing any markups (e.g. HTML)
* collapsing whitespaces into a single space
  * newlines may be kept

#### Progression

The `progression` and `totalProgression` locations are not mandatory, but a very useful addition to display in the user interface.

#### Text Fragment

A [text fragment](https://wicg.github.io/scroll-to-text-fragment/) such as `:~:text=in%20asking-,riddles` may be provided to improve interoperability in a web browser context.


## Rationale and Alternatives

### EPUB: Crawling the Web Views

A potential alternative currently implemented in the Kotlin test app is to crawl through each resource with Web View and using mark.js to locate search results.

On the plus side, this solution ensures accurate results and "free" highlighting thanks to mark.js. Unfortunately this is very resource intensive and slow, and may loose the current navigator location.

### Using Navigator-Specific Search APIs

Some rendering SDKs (e.g. Web Views, PDF viewers, etc.) provide native search APIs which might offer more accurate search results.

There are a few drawbacks when using such APIs:

* They generally operate at a resource level instead of on the whole publication.
* It is often not possible to accumulate search results in the background to be presented in the user interface.
* They might mess up the current navigator location.
* We cannot switch the Navigator implementation while retaining the same search features.

However, in some cases (e.g. PDF) it might be still be beneficial to use them. In which case, we could wrap the native API into its own `SearchService` which would only be usable with a `Publication` loaded in a Navigator. 


## Drawbacks and Limitations

The main potential issue is with locators containing only a text context with reflowable publications, which is the case with the default `StringSearchService` implementation and probably FTS-based solutions. We cannot guarantee accurate locations compared to using CFI or DOM ranges. It might fail in very specific publications.

However, I feel like this drawback is outweighed by the ease of implementation of text-only locations and the fact that they are less fragile. In practice, I did not notice any positioning errors during early implementation. Other solutions like [Hypothesis](https://hypothes.is/) have been using text-based locations for a while with success.


## Future Possibilities

### Full-text search

An implementation based on a [full-text search](https://en.wikipedia.org/wiki/Full-text_search) database would be an exciting solution for reading apps, since it offers near-instant results, cross-bookshelf search and advanced features like stemming.

SQLite ships with an FTS extension making it easy to implement on most platforms without too much overhead.

## Implementation Notes

While implementing the basic `StringSearchService` on mobile toolkits, I identified three important pieces:

* The base `StringSearchService` itself, which:
    * implements an iterator to crawl through the resources of the publication,
    * delegates the text extraction and the actual search algorithm to the other two pieces,
    * creates `Locator` collections from ranges of occurrences.
* `ResourceContentExtractor` is a component which extracts and sanitizes the text of a resource. 
  * There is one implementation per media type, since the extraction requires to remove markups (e.g. HTML), understand binary formats (e.g. PDF) or even transform the resource (speech recognition for audio resources).
  * The `StringSearchService` is provided with a factory which will create a new `ResourceContentExtractor` for each resource, according to the media type declared in its Link object.
* The search algorithm which finds ranges of query occurrences in the sanitized text.
  * It can be implemented in multiple ways offering different search options, therefore it's useful to not hard-code it in the base `StringSearchService`.
  * For example, the Kotlin toolkit offers two search algorithms:
      * `ICU` (API 24) using the [International Components for Unicode](https://developer.android.com/reference/kotlin/android/icu/text/SearchIterator) library to offer language-aware search and case/diacritic sensitivity options.
      * `Naive` (fallback) which performs a simple exact search with no options.

