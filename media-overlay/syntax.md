# Media Overlay Syntax

This document introduces a new JSON based syntax for media overlays based on a simplified model.

## Model

The new syntax is based around a single JSON object called a media overlay node.

A node has the following elements:

| Name       | Description |
| ---        | ---         |
| `role`     | Array of roles relevant for the current node. |
| `textref`  | URI to a fragment id in an HTML/XHTML resource. |
| `audioref` | URI to a media fragment in an audio resource. |
| `children` | Array of media overlay nodes. |

## Sequence

A sequence node MUST contain a `children` element.

It MAY also contain both a `textref` and one or more roles, but MUST NOT contain an `audioref` element.

When converting between EPUB 3.x media overlays and this new syntax, a `body` element can be treated exactly like a sequence.


```json
{
  "textref": "chapter1.html#sec1",
  "role": ["section"],
  "children": []
}
```

## Parallel

A parallel node MUST contain both a `textref` and an `audioref` element.

It MUST NOT contain any `role` or `children`.

```json
{
  "textref": "chapter1.html#par1",
  "audioref": "chapter1.mp3#t=0,20"
}
```

## Media Overlay Document

A media overlay document is meant to provide one or more media overlay nodes for a publication or a given resource in a publication.

It contains a single `media-overlay` element at the top of the document that contains an array of media overlay nodes:


```json
{
  "media-overlay": [
    {
      "textref": "chapter1.html",
      "role": ["chapter"],
      "children": [
        {"textref": "chapter1.html#par1", "audioref": "chapter1.mp3#t=0,20"}
        {"textref": "chapter1.html#par2", "audioref": "chapter1.mp3#t=20,28"}
      ]
    }
  ]
}
```
