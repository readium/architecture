# Synchronized Media

This document introduces a new JSON based syntax for synchronizing media together.

## Listing documents


```json
"syncMedia": [
  {
    "href": "sync.json"
  },
  {
    "href": "sync2.json"
  }
]
```

## Model

The new syntax is based around a single JSON object called a Sync Media Object:

| Name | Description | Format |
| ---- | ----------- | ------ |
| `audioref` | Points to a media fragment in an audio resource. | URI |
| `children` | Array of Sync Media Objects. | Sync Media Objects |
| `description` | Text, audio or image description for the current Sync Media Object. | Object |
| `imgref` | Points to a media fragment in an image resource. | URI |
| `role`     | Array of roles relevant for the current Sync Media Object. | Array of roles |
| `text`  | Text equivalent for the current Sync Media Object. | String |
| `textref`  | Points to a media fragment in an HTML/XHTML resource. | URI |

Each Sync Media Object MUST contain:

- a `children` object containg at least one Sync Media Object
- and at one of the following elements: `audioref`, `imgref`, `text` or `textref`

## Roles

- <https://www.w3.org/TR/epub-ssv-11/>


## Fragments

- Audio: <https://www.w3.org/TR/media-frags/#naming-time>
- Images:
  - Rectangular regions: <https://www.w3.org/TR/media-frags/#naming-space>
  - Polygonal regions: <https://idpf.org/epub/renditions/region-nav/#sec-3.5.1>
- Text:
  - Fragment ID: `#identifier` 
  - Text fragments: <https://wicg.github.io/scroll-to-text-fragment/>		


## Examples

*Example 1: Simple Sync Media Object with text and audio synchronized together*

```json
{
  "textref": "chapter1.html#par1",
  "audioref": "chapter1.mp3#t=0,20"
}
```

*Example 2: Text equivalent of a speech bubble in a comic book*

```json
{
  "role": ["panel"],
  "imgref": "page10.jpg#xywh=percent:10,10,60,40",
  "description": {
    "text": "A cowboy is looking at the city as the sun sets into the horizon.",
    "audioref": "description.mp3t=0,5"
  },
  "children": [
    {
      "role": ["balloon"]
      "imgref": "page10.jpg#xywh=percent:10,10,20,20",
      "text": "This is a dialogue in a speech bubble."
    }
  ]
}
```


*Example 3: Chapter containing multiple Sync Media Objects*

```json
{
  "textref": "chapter1.html",
  "role": ["chapter"],
  "children": [
    {
      "textref": "chapter1.html#par1", 
      "audioref": "chapter1.mp3#t=0,20"
    },
    {
      "textref": "chapter1.html#par2", 
      "audioref": "chapter1.mp3#t=20,28"
    }
  ]
}
```

## TODO

- [ ] High level recommendations for reading systems and authoring
- [ ] Should we call this work "guided navigation"?
- [x] Additional fragments for images
- [x] Step by step reading mode
- [x] Support for Sync Media Objects with a single reference
- [x] Skippability
- [x] Escapability
- [x] EPUB styling

## Postponed

- [ ] Synthetic spread: [spec](https://idpf.org/epub/renditions/region-nav/#sec-3.5.2) and [example](https://idpf.org/epub/renditions/region-nav/#app-a.2)
- [ ] Descriptions ?