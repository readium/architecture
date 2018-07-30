# Locators

Locators are meant to provide a precise location in a publication in a format that can be shared outside of the publication.

There are many different use cases for locators:

* get back to the last position in a publication when opening it
* bookmarks
* annotations
* search results
* current chapter localization
* human-readable (and shareable) reference to a fragment

Each locator consist of one or more locations.

Locations can be divided into two different groups:

* locations that are tied to the structure of a resource, such as CFI or XPath.
* and locations that are not related to any particular resource structure.

While locations that are tied to the structure of a resource provide a much more fine grained information, there are also more likely to break if the resource is updated.

That's one of the reason why Readium-2 recommends using a mix of different locations when implementing some of the use cases listed above.

## The Locator Object

A Locator Object contains the following keys:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| publicationId  | The identifier of the publication the locator is relative to. | string, required |
| spineIndex  | The index of the spine item the locator points at. | integer, required |
| created  | The datetime of creation of the locator. | datetime, required |
| title  | The title of the chapter or section which is more relevant in the context of this locator.| URI, required |
| locations  | One or more alternative expressions of the location. | Locations, required  |
| text  |  Textual context of the locator.  | Locator Text Object |

A Locations Object contains differents ways to express a location inside a resource:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| id  |  A specific fragment id in the resource.  | String |
| cfi  |  The right-most part of a [Canonical Fragment Identifier  (CFI)](http://www.idpf.org/epub/linking/cfi/epub-cfi.html).  | CFI |
| css  |  A css selector.  | String |
| progression  | A percentage of progression in the resource.  | Double between 0 and 1 |
| position  | The index of a segment in the resource.  | Integer |

A Locations object must contain at least one location key.

A Locator Text Object contains different types of text fragments, useful to give a context to the Locator:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| after  | The text after the locator.| String |
| before  | The text before the locator.  | String |
| highlight  | The text at the locator.  | String |


## The Locator JSON object

THe only differences btw the in-memory object and the serialized JSON object exposed by a streamer are that the spineIndex is mapped to the spine item href; the publicationId is not mapped (it is inferred).

*Example: Pointing to the start of Pride and Prejudice*

```
{
  "href": "http://example.com/chapter1",
  "title": "Chapter 1",
  "locations": {
    "position": 1,
    "progression": 1.3401
  },
  "text": {
    "after": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."
  }
}
```

*Example: Pointing somewhere in the middle of Pride and Prejudice*

```
{
  "href": "http://example.com/chapter30",
  "title": "Chapter 30",
  "locations": {
    "position": 4,
    "progression": 50.7379
  },
  "text": {
    "before": "In this quiet way, "
    "highlight": "the first fortnight of her visit."
    "after": " soon passed away."
  }
}
```
