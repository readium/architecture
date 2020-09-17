# Locators

Locators are meant to provide a precise location in a publication in a format that can be stored and shared.

There are many different use cases for locators:

* reporting and saving the current progression
* bookmarks
* highlights & annotations
* search results
* human-readable (as-in shareable) references
* jumping to a location
* enhancing a table of contents

Each locator <strong class="rfc">must</strong> contain a reference to a resource in a publication (`href` and `type`).
`href` <strong class="rfc">must not</strong> point to the fragment of a resource.

It <strong class="rfc">may</strong> also contain:

* a title (`title`)
* one or more locations in a resource (grouped together in `locations`)
* one or more text references, if the resource is a document (`text`)

## The `locator` Object

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| `href`  | The URI of the resource that the Locator Object points to. | URI | Yes |
| `type`  | The media type of the resource that the Locator Object points to. | Media Type | Yes |
| `title`  | The title of the chapter or section which is more relevant in the context of this locator.| String | No |
| `locations`  | One or more alternative expressions of the location. | [Location Object](#the-location-object) | No |
| `text`  |  Textual context of the locator.  | [Text Object](#the-text-object) | No |

## The `location` Object

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| `fragments` |  Contains one or more fragment in the resource referenced by the Locator Object.  | Array of strings | No |
| `progression`  | Progression in the resource expressed as a percentage.  | Float between 0 and 1 | No |
| `position`  | An index in the publication.  | Integer where the value is > 1 | No |
| `totalProgression` | Progression in the publication expressed as a percentage.  | Float between 0 and 1 | No |

Additional locations <strong class="rfc">may</strong> also be included in this object, using an extension officially registered on this repository or a URI.

The following extensions are currently registered:

| Name  |  Description |
| ----- | ------------ |
| [HTML Extension](extensions/html.md) | Additional locations for HTML/XHTML documents. |

## The `text` Object

A Locator Text Object contains multiple text fragments, useful to give a context to the Locator or for highlights.

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| `after` | The text after the locator.| String | No |
| `before` | The text before the locator.  | String | No |
| `highlight` | The text at the locator.  | String | No |


## Fragments

Given the flexible nature of the Readium Web Publication Manifest, we need the ability to provide locations into all sorts of resources (text, audio, video, images).

Fragments are flexible enough to achieve that goal. They also provide a natural extension point for our locator model since any media-type can define its own fragment identifiers.

They're by nature media-specific and should always be understood in the context of the resource that the locator points to (by looking at `href` and `type`).

For this purpose, this document identifies the following specifications along with their scope:

| Specification | Scope | Examples |
| ------------- | ----- | ------- |
| [HTML](https://html.spec.whatwg.org/) | HTML or XHTML | `id` |
| [Media Fragment URI 1.0](https://www.w3.org/TR/media-frags/) | Audio, Video and Images | `t=67`, `xywh=160,120,320,240`|
| [PDF](http://tools.ietf.org/rfc/rfc3778) | PDF | `page=12`, `viewrect=50,50,640,480`|


## Examples


*Example 1: Pointing to the start of Pride and Prejudice*

```
{
  "href": "http://example.com/chapter1",
  "type": "text/html",
  "title": "Chapter 1",
  "locations": {
    "position": 4,
    "progression": 0.03401,
    "totalProgression": 0.01349
  },
  "text": {
    "after": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."
  }
}
```

*Example 2: Pointing somewhere in the middle of an audiobook*

```
{
  "href": "http://example.com/track6",
  "type": "audio/ogg",
  "title": "Chapter 5",
  "locations": {
    "fragments": ["t=389.84"],
    "progression": 0.607379,
    "totalProgression": 0.50678
  }
}
```

*Example 3: Pointing to a rectangle in a page of a PDF*

```
{
  "href": "http://example.com/document",
  "type": "application/pdf",
  "title": "Page 5",
  "locations": {
    "fragments": ["page=5", "viewrect=50,50,640,480"],
    "progression": 0.12703,
    "totalProgression": 0.12703
  }
}
```

## Best Practices

In addition to defining the Locator model, the Readium community also strongly recommend all implementations to follow a number of best practices:

* [Best practices for locators per format](best-practices/format.md)
* Best practices for calculating locations


# Appendix A - JSON Schema

A reference JSON Schema is available under version control at: [https://github.com/readium/architecture/tree/master/schema/locator.schema.json](https://github.com/readium/architecture/tree/master/schema/locator.schema.json)
