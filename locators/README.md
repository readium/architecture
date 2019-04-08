# Locators

Locators are meant to provide a precise location in a publication in a format that can be stored and shared.

There are many different use cases for locators:

* getting back to the last position in a publication
* bookmarks
* highlights & annotations
* search results
* human-readable (and shareable) reference in a publication

Each locator must contain a reference to a resource in a publication (`href` and `type`).

It may also contain:

* a title (`title`)
* one or more locations in a resource (`locations`)
* one or more text references, if the resource is a document (`text`)

## The Locator Object

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| href  | The URI of the resource that the Locator Object points to. | URI | Yes |
| type  | The media type of the resource that the Locator Object points to. | Media Type | Yes |
| title  | The title of the chapter or section which is more relevant in the context of this locator.| String | No |
| locations  | One or more alternative expressions of the location. | [Location Object](#the-location-object) | No |
| text  |  Textual context of the locator.  | [Locator Text Object](#the-locator-text-object) | No |

## The Location Object

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| fragment  |  Contains one or more fragment in the resource referenced by the Locator Object.  | String | No |
| progression  | Progression in the resource expressed as a percentage.  | Float between 0 and 1 | No |
| position  | An index in the publication.  | Integer where the value is > 1 | No |


## The Locator Text Object

A Locator Text Object contains multiple text fragments, useful to give a context to the Locator or for highlights.

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| after  | The text after the locator.| String | No |
| before  | The text before the locator.  | String | No |
| highlight  | The text at the locator.  | String | No |


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

In addition to these specifications, this document defines two additional media fragments:

| Name | Scope | Definition | Example |
| ---- | ----- | ---------- | ------- |
| CSS Selector | HTML or XHTML | Contains a CSS Selector as defined in [Selectors Level 3](https://www.w3.org/TR/selectors-3/).| `css(.content:nth-child(2))` |
| Partial CFI | XHTML, strictly in EPUB documents | Contains the right-most part of a Canonical Fragment Identifier as defined in [EPUB Canonical Fragment Identifiers 1.1](http://www.idpf.org/epub/linking/cfi/epub-cfi.html).| `partialcfi(/10[para05]/3:10)` |

## Positions 

A "position" is similar to a page in a printed book. It will be used by the reading system to generate a list and allows multiple readers (e.g. students) to move to the same position in the ebook, using segments of 1024 characters (not bytes); 1024 is arbitrary but matches what Adobe's RMSDK is using. 

A segment (i.e the interval between two adjacent positions) does not cross the boundaries of a resource, therefore the size of the last segment of a resource may be less than 1024 characters; a practical advantage being that chapters usually correspond to resources: the start of a chapter is therefore usually aligned with a "position".  

Users are manipulating positions in the overall publication, but we are storing positions in a resource. To map a position in a resource to a position in the publication, please read [this page](locator-api.md).


## Examples


*Example 1: Pointing to the start of Pride and Prejudice*

```
{
  "href": "http://example.com/chapter1",
  "type": "text/html",
  "title": "Chapter 1",
  "locations": {
    "position": 4,
    "progression": 0.03401
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
    "fragment": "t=389.84",
    "progression": 0.507379
  }
}
```

*Example 3: Pointing to the fifth page in a PDF*

```
{
  "href": "http://example.com/document",
  "type": "application/pdf",
  "title": "Page 5",
  "locations": {
    "fragment": "page=5",
    "progression": 0.12703
  }
}
```


# Appendix A - JSON Schema

A reference JSON Schema is available under version control at: [https://github.com/readium/architecture/tree/master/schema/locator.schema.json](https://github.com/readium/architecture/tree/master/schema/locator.schema.json)