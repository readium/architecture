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
| href  | Contains the URI of the resource the locator points at. | URI, required |
| locations  | Contains one or more location. | Locations, required  |
| text  | Contains a number of strings that can be useful to identify a locator.  | Locator Text Object |

A Locations Object contains differents ways to express a location inside a resource:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| id  | Contains a specific id in the resource.  | String |
| cfi  | Contains the right-most part of a [Canonical Fragment Identifier  (CFI)](http://www.idpf.org/epub/linking/cfi/epub-cfi.html).  | CFI |
| css  | Contains a css selector.  | String |
| progression  | Contains a percentage of progression in the resource.  | Decimal between 0 and 1 |
| position  | Contains the index of a segment in the resource.  | Integer |

A Locations object must contain at least one location key.

A Locator Text Object contains different types of text fragments, useful to give a context to the Locator:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| after  | Text after the locator.| String |
| before  | Text before the locator.  | String |
| highlight  | Text at the locator.  | String |

*Example: Pointing to the start of Pride and Prejudice*

```
{
  "href": "http://example.com/chapter1",
  "locations": {
    "position": 1,
    "progression": 0.0000
  },
  "text": {
    "after": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."
  }
}
```

## Calculating the current Progression & Position in a resource

For image based and pre-paginated publications, each Locator simply points to the resource (`href`) without any additional expression of a location or progression.

For other types of publications:

* to calculate the current progression, the service should simply divide the current scroll position in the rendered resource (in pixels) by the total height of the resource (in pixels). 
* to calculate the current position, the service should consider that each segment of the resource contains 1024 _characters_ (not bytes); 1024 is arbitrary but matches what RMSDK is using. Therefore the current position corresponds to the current character offset divided by 1024, + one (for getting 1 based positions). 

Note: 

* A segment (i.e the interval between two adjacent positions) does not cross the boundaries of a resource, therefore the size of the last segment of a resource may be less than 1024 characters; an advantage of resource based segments (beside the simplicity of calculation of the current segment) being that chapters usually correspond to resources, therefore the start of a chapter usually corresponds to a new segment. 

