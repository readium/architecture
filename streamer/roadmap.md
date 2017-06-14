# Streamer Roadmap

This document is based on the current consensus between implementers of what the core set of features and priorities should be.

## Feature Complete Requirements

* Opens either zipped or unzipped packages
* Streams the contents via HTTP server
  * [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest)
  * all resources in `spine`/`resources`
* Can fully parse EPUB 2.x/3.x into the manifest/model
  * full support for metadata
  * clear distinction between `spine`/`resources`
  * new expression of the `properties` attribute as a Properties Object
  * support for both NCX and navigation documents
* De-obfuscate fonts (both IDPF and Adobe algorithms)
  * covers basic support for encrypted content (encryption.xml + new property)

## Revision 1

* Media Overlays
  * per publication
  * per resource
* Encrypted content
  * access model for encrypted content
  * support for LCP
  * link to LCP license
  * API to interact with license
  * ability to defer parsing of table of contents and media overlays
* Optimize HTTP usage
  * cache strategy
  * preloading/prerendering
  * GZip support


## Revision 2

* Search
  * basic keyword search across the entire publication
  * returns at least one or two locators
* Synthetic Page List
* Optimized support for decryption (range)


## TBD

* Locator resolver
* Dictionaries/Index
* Multiple renditions
* EDUPUB
* Audiobooks
* Comics
* PDF
