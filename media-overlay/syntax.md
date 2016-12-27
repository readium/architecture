# Media Overlay Syntax

This document introduces a new JSON based syntax for media overlays based on a simplified model.

## Body

```json
{
  "textref": "chapter1.html#body"
  "role": ["chapter"],
  "children": []
}
```

## Sequence

```json
{
  "textref": "chapter1.html#sec1"
  "role": ["section"],
  "children": []
}
```

## Parallel

```json
{
  "textref": "chapter1.html#par1"
  "audioref": "chapter1.mp3#t=0,20"
}
```
