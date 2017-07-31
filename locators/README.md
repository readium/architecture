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


## List of Locators

This document defined the following list of locators for the Readium-2 project:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| cfi  | Contains the right-most part of a [Canonical Fragment Identifier  (CFI)](http://www.idpf.org/epub/linking/cfi/epub-cfi.html).  | CFI |
| id  | Contains a specific id available in the resource.  | String |
| position  | Contains an position in the publication.  | Integer |
| progression  | Contains an overall progression (%) in the publication based on the reading order.  | Float between 0 and 1 |

## Calculating Positions

> This part is still a WIP, waiting on confirmation from Ric.

There are a number of ways that positions can be calculated:

* for image or page based publications, each position can simply point to the resource (`href`) without any additional locator
* for other types of publications, the service should calculate that each position in a text-based publication contains 1024 characters
