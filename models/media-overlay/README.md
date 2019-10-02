# Media Overlay

The media overlay module is in charge of implementing support for the [new media overlay syntax](syntax.md) introduced by Readium-2.

This module is not responsible for converting SMIL to the new JSON based syntax, this is entirely handled by [the streamer module](../streamer/README.md).

## Syntax

Readium-2 introduces a simplified model for media overlays and a dedicated web service entirely handled by the streamer module.

To learn more about the syntax, [a separate document is available on this repo](syntax.md).

## Detecting Media Overlays

There are two different ways that a media overlay module can detect the presence of media overlays in a publication.

### Media Overlay Service

Publications that contain at least one resource with a media overlay will advertise this information using a media overlay link object in `links`:

```json
"links": [
  {
    "href": "/media-overlay{?href}",
    "rel": "http://readium.org/media-overlay",
    "type": "application/vnd.readium.mo+json",
    "templated": true
  }
]
```

The media overlay service is expressed as a URI template that will:

* return a media overlay document for the whole publication if no path is specified
* return a media overlay document for a specific resource if a path is specified

### Resource-level Media Overlays

At a resource-level, the presence of a media overlay can also be detected by looking at the `properties` object of each link object in `spine` or `resources`:

```json
"spine": [
  {
    "href": "chapter1.html",
    "type": "text/html",
    "properties": {
      "media-overlay": "/media-overlay?href=chapter1.html"
    }
  }
]
```

If the media overlay follows the path provided by `media-overlay`, it should receive a media overlay document that specifically applies to the current resource.

## Style Information

A publication can also contain specific instructions regarding the class names that should be used to style media overlays.

This information will show up in `metadata` of the Web Publication Manifest:

```json
"metadata": {
  "title": "Moby-Dick",
  "author": "Herman Melville",
  "media-overlay": {
    "active-class": "-epub-media-overlay-active",
    "playback-active-class": "-epub-media-overlay-playing"
  }
}
```

## Some links

Technical information on the [implementation of Media Overlays in the Readium SDK](https://docs.google.com/document/d/1_4tsFq_4Xr-jVbqY3brkVXAL3_UJLQiZWl47SH-I0bM/)

Notes from D.Weck about the [implementation of Media Overlays in the Readium SDK](https://docs.google.com/document/d/1rMiBSaH65Io3RW21NYgSBdqsETA5-BCREJ4LJ_nRt-w/).
