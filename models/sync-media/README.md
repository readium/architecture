# Synchronized Media

This is a WIP, based on current discussions between De Marque and EDRLab.

## Synchronized Media Document

[A separate document dedicated to the syntax](syntax.md) is available on this repo.

## Listing documents

### Collection-based

*Note: Should we make the media type optional?*

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

### Linked and chained

```json
"links": [
  {
    "href": "sync.json",
    "type": "application/vnd.readium.sync-media+json"
  }
]
```

```json
{
  "links": [
    {
      "rel": "next",
      "href": "sync2.json"
    }
  ],
  "syncMedia": [
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
  ]
}
```

## TODO

- [ ] Skippability
- [ ] Escapability
- [ ] EPUB styling