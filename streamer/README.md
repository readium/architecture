# Streamer

The streamer is one of the main modules of the Readium Architecture.

The streamer is usually divided into three different parts:

- [parser](#parser)
- [fetcher](#fetcher)
- [server](#server)

Every implementation should attempt to make each of these parts as independent as possible, to make sure that they can also be reused for other use cases.

## Parser

* access packaged or exploded publications
* parses EPUB 2.x and 3.x
  * metadata
  * spine & manifest
  * table of contents (NCX, Navigation Document)
  * media overlays
  * encrypted resources

## Fetcher

* gets the content of a publication's resource
* deobfuscates & decrypt resources
* injects CSS or JS in HTML resources
* injects user settings (CSS custom properties) in HTML resources

## Server

* outputs a [Readium Web Publication Manifest](https://readium.org/webpub-manifest)
* serves the publication's resources
* provides a number of APIs to interact with the publication

