# Synchronized Media Syntax

This document introduces a new JSON based syntax for synchronizing media together.

## Model

The new syntax is based around a single JSON object called a Sync Media Object:

| Name | Description | Format |
| ---- | ----------- | ------ |
| `alt` | Text alternative for the current Sync Media Object. | URI |
| `audioref` | Points to a media fragment in an audio resource. | URI |
| `children` | Array of Sync Media Objects. | Sync Media Objects |
| `imgref` | Points to a media fragment in an image resource. | URI |
| `role`     | Array of roles relevant for the current Sync Media Object. | Array of roles |
| `text`  | Text equivalent for the current Sync Media Object. | String |
| `textref`  | Points to a media fragment in an HTML/XHTML resource. | URI |

Each Sync Media Object MUST contain:

- a `children` object containg at least one Sync Media Object
- or at least two of the following elements: `audioref`, `imgref`, `text` or `textref`

## Roles

- <https://www.w3.org/TR/epub-ssv-11/>



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
  "alt": "A cowboy is looking at the city as the sun sets into the horizon."
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