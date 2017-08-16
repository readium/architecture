# Locators

Locators are meant to provide a precise location in a publication in a format that can be shared outside of the publication.

There are many different use cases for locators:

* bookmarks
* notes and highlights
* current position in a publication
* human-readable (and shareable) reference to a fragment

Locators can also be divided into two different groups:

* locators that are tied to the structure of a resource, such as CFI or XPath
* and those that are not related to any particular resource

While locators that are tied to the structure of a resource provide a much more fine grained information, there are also more likely to break when the resource is updated.

That's one of the reason why Readium-2 recommends using a mix of different locators when implementing some of the use cases listed above.


## The Locator Object

Locators can be grouped together using a Locator Object.

A Locator Object must contain at least one locator.

A Locator Object may contain the following keys:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| href  | Contains the URI of the resource where the locator points to. | URI |
| locators  | Contains one or more locators . | Locators |
| text  | Contains a number of strings that can be useful to identify a locator.  | Locator Text Object |

This document defines the following list of locators:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| cfi  | Contains the right-most part of a [Canonical Fragment Identifier  (CFI)](http://www.idpf.org/epub/linking/cfi/epub-cfi.html).  | CFI |
| id  | Contains a specific id available in the resource.  | String |
| position  | Contains an position in the publication.  | Integer |
| progression  | Contains an overall progression (%) in the publication based on the reading order.  | Float between 0 and 1 |

This document also defines the following keys for the Locator Text Object:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| after  | Text after the locator.| String |
| before  | Text before the locator.  | String |
| highlight  | Text that corresponds to the locator.  | String |

*Example: Pointing to the first chapter of Pride and Prejudice*

```
{
  "href": "http://example.com/chapter1",
  "locators": [
    "position": 10,
    "progression": 0.01452
  ],
  "text": {
    "after": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."
  }
}
```

## Calculating Positions & Progression


There are a number of ways that positions can be calculated:

* for image or page based publications, each position can simply point to the resource (`href`) without any additional locator
* for other types of publications, the service should calculate that each position in a text-based publication contains 1024 _characters_ (not bytes). 1024 is arbitrary but matches what RMSDK uses.
