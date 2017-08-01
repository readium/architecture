# Search

Keyword search is one of the most common features in reading apps, and one of the missing piece of Readium-1.

The Readium-2 architecture has a lot of room for extensibility, for instance through the ability for the streamer to expose additional APIs. The search module is built with that principle in mind, and can easily be deployed either inside an app or as an external service on a server.

## URI Template

The search service is exposed in `links` in the Web Publication Manifest using a link object with:

* its `rel` set to search
* a URI template that contains `{?query}`

```
"links": [
  {
    "href": "/search{?query}",
    "rel": "search",
    "templated": true
  }
]
```

## Response Document

### Search Context

Most reading applications return a number of context elements in their UI for search, such as:

* highlighted text that was matched by the search module
* text before and after the match
* position in the publication (page number or %)
* name of the chapter/section where the match was found

No matter what the response document format is, this module highly recommends including these information.

### HTML

A search module can return an HTML document as a response to a search query, but should make its best attempt to link back to resources that are part of the publication.

### JSON

> Syntax TBD, but the core idea is that we'll respond with locators. 
> 
> `numberOfItems`, `currentPage` and `itemsPerPage` are aligned with OPDS 2.0.


```
{
  "query": "Laurent",
  "numberOfItems": 256,
  "currentPage": 1,
  "itemsPerPage": 10,
  "results":
  [
    {
       "href": "chapter1.html",
       "text": {
         "highlight": "Laurentides",
         "before": "Lors de ses vacances dans les ",
         "after": "il a décidé de réecrire Readium SDK",
       }
       "locators": {
         "cfi": "...",
         "position": 147,
         "progression": 0.1267
       }
    }
  ]
}
```

## Handling Search

Keyword search is potentially very complex and advanced implementations of a search module may have to deal with:

* tokenizers
* token & character filters
* analyzers
* stemming
* stop words

This search module does not require any specific implementation but recommends at least the following things:

* support for the [Unicode Text Segmentation algorithm](http://unicode.org/reports/tr29/)
* language specific features such as stemming and stop words should rely on the value of `language` element specified by the publication

## Questions

* Reading apps usually display search results asynchronously instead of waiting for the search to complete. Is this something that we'd like to cover in the search module?
* Do we need support for anything more complex than keyword search?
* Can we extend this design to a dictionary or index module?
