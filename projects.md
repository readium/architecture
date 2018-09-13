# Projects

## iOS / Swift

For an overview of how Readium-2 on iOS works, we highly recommend taking a look at the [iOS Test App](https://github.com/readium/r2-testapp-swift).

The Test App integrates the following modules (all written in Swift) into a single iOS application:

* [Shared Model](https://github.com/readium/r2-shared-swift)
* [Streamer](https://github.com/readium/r2-streamer-swift)
* [Navigator](https://github.com/readium/r2-navigator-swift)
* [OPDS Parser](https://github.com/readium/readium-opds-swift)

The iOS Test App can also be downloaded from the [AppStore as R2 Reader](https://itunes.apple.com/us/app/r2-reader/id1363963230).

## Android

The Android implementation is still catching up with iOS in early 2018, but has now reached a stage where it can be built and tested by any developer.

For an overview of how Readium-2 on Android works, we highly recommend taking a look at the [Android Test App](https://github.com/readium/r2-testapp-kotlin).

The Test App integrates the following modules (all written in Kotlin) into a single Android application:

* [Shared Model](https://github.com/readium/r2-shared-kotlin)
* [Streamer](https://github.com/readium/r2-streamer-kotlin)
* [Navigator](https://github.com/readium/r2-navigator-kotlin)
* [OPDS Parser](https://github.com/readium/r2-opds-kotlin)

The Android Test App can also be downloaded from the [Play Store as R2 Reader](https://play.google.com/store/apps/details?id=org.readium.r2reader&hl=en_US).

## JavaScript

EDRLab is actively working on a production app called [Readium Desktop](https://github.com/edrlab/readium-desktop) built on top of a [Typescript-based implementation of the streamer](https://github.com/edrlab/r2-streamer-js).

There are also two projects implementing a JS-based navigator:

* [webpub-viewer](https://github.com/NYPL-Simplified/webpub-viewer) - An iframe-based navigator, written in TypeScript (NYPL)
* [epub.js](https://github.com/futurepress/epub.js/) - Support for the streamer is in development as part of the v0.3 release (Future Press)

## Go

The first implementation of a streamer was written in Go, mostly for server-side deployment.

This project is active and [hosted on this organization](https://github.com/readium/r2-streamer-go).


## Prototypes

* [webpub-viewer](https://github.com/HadrienGardeur/webpub-viewer) - An `iframe` based navigator, written in JS (Hadrien Gardeur)
* [comics-viewer](https://github.com/HadrienGardeur/comics-viewer) - An `img` based navigator for comics, written in JS (Hadrien Gardeur)
* [audiobook-player](https://github.com/HadrienGardeur/audiobook-player) - An `audio` based navigator for audiobooks, written in JS (Hadrien Gardeur)
