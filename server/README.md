# Publication Server

## Overview

A Publication Server is responsible for serving one or more publications over HTTPS which means at a minimum:

- a [Readium Web Publication Manifest](https://readium.org/webpub-manifest)
- all resources listed under `readingOrder` and `resources` in that manifest

This document identifies multiple levels of conformance for a Publication Server that we can use as reference points.

## Level 0

- Serves everything using static files
- The manifest and its resources <strong class="rfc">must</strong> be served over HTTPS
- All HTTPS responses <strong class="rfc">must</strong> include CORS headers to allow access from any domain to these resources

## Level 1

Publication Servers which implement level 1 support are dynamic apps that usually implement the [streamer architecture](../streamer).

- The manifest and its resources are served using dynamic routes
- They <strong class="rfc">must</strong> have an in-memory representation of the publications that they serve
- They <strong class="rfc">must</strong> be capable of parsing and streaming resources from packaged publications (EPUB, CBZ, audiobooks) and exposing them over HTTPS if needed
- They <strong class="rfc">should</strong> be capable of injecting CSS or JS in resources of a publication

## Level 2

- Ability to obfuscate resources and provide access control over the manifest and its resources
- Search within a publication or across all publications
- [Positions List API](../positions) per publication
- Dictionary/Index API per publication

## Storing and Accessing Publications

A Publication Server can store and access publications is many different ways:

- it could serve packaged publications from a directory on its file system
- access exploded publications from an object storage
- download packaged publications from a CDN and keep them in a LRU cache for a limited amount of time
- proxy resouces available through a different API

All implementations are free to select their preferred approach as long as they respect the requirements listed for the different levels of compliance.

## Caching

[A separate document dedicated to HTTP caching is available](caching.md), with recommendations regarding the use of HTTP headers for both the manifest and its resources.


<style>
.rfc {
    color: #d55;
    font-variant: small-caps;
    font-style: normal;
    font-weight: normal;
}
</style>