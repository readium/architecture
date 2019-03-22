# Publication Server

## Overview

A Publication Server is responsible for serving one or more publications over HTTPS which means at a minimum:

- a [Readium Web Publication Manifest](https://readium.org/webpub-manifest)
- all resources listed under `readingOrder` and `resources` in that manifest

## Level 0

- Serves everything using static files
- The manifest and its resources <strong class="rfc">must</strong> be served over HTTPS
- All HTTPS responses <strong class="rfc">must</strong> include CORS headers to allow access from any domain to these resources

## Level 1

Publication Servers which implement level 1 support are dynamic apps that implement the [streamer](../streamer) architecture.

- The manifest and its resources are served using dynamic routes
- They <strong class="rfc">must</strong> have an in-memory representation of the publications that they serve
- They <strong class="rfc">must</strong> be capable of parsing and streaming resources from packaged publications (EPUB, CBZ, audiobooks) and exposing them over HTTPS if needed
- They <strong class="rfc">should</strong> be capable of injecting CSS or JS in resources of a publication

## Level 2

- Ability to obfuscate resources and provide access control
- Search within a publication or across all publications
- Position List API per publication
- Dictionary/Index API per publication