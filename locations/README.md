# Positions List

While reading a publication, users may need to reference or access a specific position in a book.

While some formats have an implicit (image based publications) or an optional explicit option (EPUB 3.x) to express such references, clients need references even for publication formats that do not provide anything.

The goal of this service is to provide such references, no matter what the initial publication format contains.


## Manifest

The list is a service exposed in the manifest using a Link Object. 

It can be identified by its media-type (`application/vnd.readium.position-list+json`) and its relationship (`http://readium.org/position-list`).


```json
{
  "href": "https://example.com/list{?position}",
  "type": "application/vnd.readium.position-list+json",
  "rel": "http://readium.org/position-list",
  "templated": true
}
```

## Querying the Service

A streamer will usually be responsible for handling that service and can decide whether the list is computed in realtime or in advance.

There are two different ways that the service itself can be queried. A client may request the full list of positions for the publication by sending a simple GET request:

```
GET https://example.com/list

{
  "total": 156,
  "positions": [
    {
      "href": "http://example.com/chapter2",
      "locators": [
        "cfi": "/4[body01]",
        "position": 27,
        "progression": 0.07289
      ]
    }
  ]
}
```

In addition to the full list, the service can also return the reference to a single position using the `position` query parameter included in the URI template.

```
GET https://example.com/list?posiiton=27

{
  "href": "http://example.com/chapter2",
  "locators": [
    "cfi": "/4[body01]",
    "position": 27,
    "progression": 0.07289
  ]
}
```

If the service can't locate the position requested by a client, it returns a 404 status code.

## Syntax

The synthetic page list service returns a document with one or more references. Each reference is a JSON object containing the following keys:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| href  | Contains a link to a resource listed in the spine of the publication.  | URI |
| page  | Page number associated to a specific locator.  | Integer |
| locators  | Contains one or more locators.  | Locator Object |

The Locator Object contains one or more locators, [as defined in the Locators document](/locators).

## Navigator

In order to facilitate the support of position references in full apps, navigators should provide an easy way to obtain:

* the total number of positions in a publication
* the current position currently being displayed
* the number of positions for a specific resource along with the start position for that resource


