# Synchronized Media Syntax

This document introduces a new JSON based syntax for synchronizing media together.

## Model

The new syntax is based around a single JSON object called a Sync Media Object:

| Name | Description | Format |
| ---- | ----------- | ------ |
| `audioref` | Points to a media fragment in an audio resource. | URI |
| `children` | Array of media overlay nodes. | Sync Media Objects |
| `imgref` | Points to a media fragment in an image resource. | URI |
| `role`     | Array of roles relevant for the current node. | Array of roles |
| `text`  | Text equivalent for the current Sync Media Object. | String |
| `textref`  | Points to a fragment id in an HTML/XHTML resource. | URI |
| `videoref`  | Points to a media fragment in an video resource. | URI |

Each Sync Media Object MUST contain:

- a `children` object containg at least one Sync Media Object
- or at least two of the following elements: `audioref`, `text`, `textref` or `videoref`

## Roles

…

## Examples

*Example 1: Simple Sync Media Object with text and audio synchronized together*

```json
{
  "textref": "chapter1.html#par1",
  "audioref": "chapter1.mp3#t=0,20"
}
```

*Example 1: Text equivalent of a speech bubble in an image*

```json
{
  "role": ["speech-bubble"]
  "imgref": "page10.jpg#xywh=percent:10,10,20,20",
  "text": "This is a dialogue in a speech bubble."
}
```


*Example 1: Chapter containing multiple Sync Media Objects*

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