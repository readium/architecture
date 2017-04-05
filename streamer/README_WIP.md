# Readium-2 Streamer

The streamer is one of the main modules of the Readium-2 project.

The streamer is usually divided into four different parts:

- in-memory models
- [parser](parser/)
- fetcher
- [server](server/)

Each implementation should attempt to make each of these parts as independent as possible, to make sure that they can also be reused for other use cases.

## Parser

* access packaged or exploded publications
* parse EPUB 2.x and 3.x

## Fetcher

* get the content of a publication's resource
* deobfuscate & decrypt resources

## Server

* output a [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest)
* serve the publication's resources
* provide a number of APIs to interact with the publication

