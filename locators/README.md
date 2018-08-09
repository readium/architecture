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
| href  | The href of the resource the locator points at. | string, required |
| created  | The datetime of creation of the locator. | datetime, required |
| title  | The title of the chapter or section which is more relevant in the context of this locator.| URI, required |
| locations  | One or more alternative expressions of the location. | Locations, required  |
| text  |  Textual context of the locator.  | Locator Text Object |

A Locations Object contains differents ways to express a location inside a resource:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| id  |  A specific fragment id in the resource.  | String |
| cfi  |  The right-most part of a [Canonical Fragment Identifier (CFI)](http://www.idpf.org/epub/linking/cfi/epub-cfi.html).  | String |
| cssSelector  |  A css selector in the resource.  | String |
| xpath  |  An xpath in the resource.  | String |
| progression  | A percentage of progression in the resource.  | Double between 0 and 1 |
| position  | An index in the resource.  | Integer, 1+ |

A Locations object must contain at least one location key.

### About the notion of position 

A "position" is similar to a page in a printed book. It will be used by the reading system to generate a page list (if such page list is absent from the EPUB file) and allows multiple readers (e.g. students) to move to the same position in the ebook, using segments of 1024 _characters_ (not bytes); 1024 is arbitrary but matches what RMSDK is using. 

A segment (i.e the interval between two adjacent positions) does not cross the boundaries of a resource, therefore the size of the last segment of a resource may be less than 1024 characters; a practical advantage being that chapters usually correspond to resources: the start of a chapter is therefore usually aligned with a "position".  

Users are manipulating positions in the overall publication, but we are storing positions in a resource. To map a position in a resource to a position in the publication, please read [this page](locator-api.md).

## The Locator Text Object

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
    "progression": 0.13401
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
    "progression": 0.507379
  },
  "text": {
    "before": "In this quiet way, "
    "highlight": "the first fortnight of her visit."
    "after": " soon passed away."
  }
}
```
