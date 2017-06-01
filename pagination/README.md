# Page List

While reading a publication, users may need to reference or access a specific location in a book.

While some formats have an implicit (image based publications) or an optional explicit option (EPUB 3.x) to express such references, clients need references even for publication formats that do not provide anything.

The goal of this service is to provide such references, no matter what the initial publication format contains.


## Manifest

Synthetic pagination is a service exposed in the manifest using a Link Object. 

It can be identified by its media-type (`application/vnd.readium.page-list+json`) and its relationship (`http://readium.org/r2/page-list`).


```json
{
  "href": "https://example.com/page-list{?page}",
  "type": "application/vnd.readium.page-list+json",
  "rel": "http://readium.org/r2/page-list",
  "templated": true
}
```

## Querying the Service

A streamer will usually be responsible for handling that service and can decide whether the page list is computed in realtime or in advance.

There are two different ways that the service itself can be queried. A client may request the full list of pages for the publication by sending a simple GET request:

```
GET https://example.com/page-list

{
  "total": 156,
  "pages": [
    {
      "page": 1,
      "href": "http://example.com/chapter1",
      "locators": [
        "cfi": "/4[body01]"
      ]
    }
  ]
}
```

In addition to the full list, the service can also return the reference to a single page using the `page` query parameters included in the URI template.

```
GET https://example.com/page-list?page=1

{
  "href": "http://example.com/chapter1",
  "locators": [
    "cfi": "/4[body01]"
  ]
}
```

If the service can't locate the page requested by a client, it returns a 404 status code.

## Syntax

The synthetic page list service returns a document with one or more references. Each reference is a JSON object containing the following keys:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| href  | Contains a link to a resource listed in the spine of the publication.  | URI |
| page  | Page number associated to a specific locator.  | Integer |
| locators  | Contains one or more locators.  | Locator Object |

The Locator Object is shared across a number of different Readium-2 services, including search. While it's full definition is still TBD it currently supports the following keys:

| Key  | Definition | Format |
| ---- | ---------- | ------ | 
| cfi  | Contains the right-most part of a [Canonical Fragment Identifier  (CFI)](http://www.idpf.org/epub/linking/cfi/epub-cfi.html).  | CFI |
| id  | Contains a specific id available in the resource.  | String |

If a single page is requested, the service returns a single reference using both `href` and `locators`.

If the full list is requested, the service returns an array of references in `pages` along with a total number of pages in `total`.

## Navigator

In order to facilitate the support of page references in full apps, navigators should provide an easy way to obtain:

* the total number of pages in a publication
* the current page reference being displayed
* the number of pages for a specific resource along with the start page for that resource

## Calculating Page References

> This part is still a WIP, waiting on confirmation from Ric.

There are a number of ways that page references can be calculated:

* for image or page based publications, each page reference can simply point to the resource (`href`) without any additional locator
* for publications that contain page references, the service should attempt to resolve them and provide additional locators for them
* for publications that do not contain any explicit or implicit page references, the service should calculate that each page in a text-based publication contains 1024 characters


