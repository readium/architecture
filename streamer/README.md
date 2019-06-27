# Streamer

The Streamer is one of the main modules of the Readium Architecture.

The Streamer is usually divided into two different parts:

- [parser](#parser)
- [fetcher](#fetcher)

Every implementation should attempt to make each of these parts as independent as possible, to make sure that they can also be reused for other use cases.

## Parser

* access packaged or exploded publications
* [parses EPUB 2.x and 3.x](parser/metadata.md)

## Fetcher

* gets the content of a publication's resource
* deobfuscates & decrypt resources
* injects CSS or JS in HTML resources
* injects user settings (CSS custom properties) in HTML resources

## Manifest & Resources

Every Streamer implementation has its own in-memory representation of a publication.

In addition to this model, all Streamers provide an access to:

* a [Readium Web Publication Manifest](https://readium.org/webpub-manifest)
* the resources of the publication

While most Streamers are also [Publication Servers](../server) that rely on HTTPS, each implementation is free to use a different approach to serve the resources of a publication.
