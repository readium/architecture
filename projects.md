# Projects

## iOS

For an overview of how Readium on iOS works, we highly recommend taking a look at the [iOS Test App](https://github.com/readium/r2-testapp-swift).

The Test App integrates the following modules (all written in Swift) into a single iOS application:

* [Shared Model](https://github.com/readium/r2-shared-swift)
* [Streamer](https://github.com/readium/r2-streamer-swift)
* [Navigator](https://github.com/readium/r2-navigator-swift)
* [OPDS Parser](https://github.com/readium/readium-opds-swift)

The iOS Test App can also be downloaded from the [AppStore as R2 Reader](https://itunes.apple.com/us/app/r2-reader/id1363963230).

While this project is dedicated to iOS for now, it is expected to support macOS as well in the future.

## Android & Chrome OS

For an overview of how Readium on Android works, we highly recommend taking a look at the [Android Test App](https://github.com/readium/r2-testapp-kotlin).

The Test App integrates the following modules (all written in Kotlin) into a single Android application:

* [Shared Model](https://github.com/readium/r2-shared-kotlin)
* [Streamer](https://github.com/readium/r2-streamer-kotlin)
* [Navigator](https://github.com/readium/r2-navigator-kotlin)
* [OPDS Parser](https://github.com/readium/r2-opds-kotlin)

The Android Test App can also be downloaded from the [Play Store as R2 Reader](https://play.google.com/store/apps/details?id=org.readium.r2reader&hl=en_US).

## Web

Readium Web is in the process of being gradually moved to Readium repos.

Currently, the following repos are available on Github:

* [Shared Model](https://github.com/evidentpoint/r2-webpub-model-js)
* [Navigator](https://github.com/evidentpoint/r2-navigator-web)

Unlike our other projects, Readium Web does not necessarily require running a [streamer](streamer/).
Publications can be served unpackaged using static assets and the Readium Web Publication Manifest or through a streamer hosted on a server such as the [Node.js](https://github.com/readium/r2-streamer-js) or [Go](https://github.com/readium/r2-streamer-go) projects.

## Desktop

Readium Desktop is built on top of Node.js and Electron.

For an overview of how Readium on Desktop works, we highly recommend taking a look at the [Desktop Test App](https://github.com/readium/r2-testapp-js).

The Test App integrates the following modules (all written in TypeScript) into a single Electron application:

* [Shared Model](https://github.com/readium/r2-shared-kotlin)
* [Streamer](https://github.com/readium/r2-streamer-js)
* [Navigator](https://github.com/readium/r2-shared-js)

## Go

The first implementation of a streamer was written in Go, mostly for server-side deployment.

It is primarily meant to be used as a back-end for Web apps built on top of Readium Web.

This project is active and [hosted on this organization](https://github.com/readium/r2-streamer-go).

## Prototypes

* [webpub-viewer](https://github.com/HadrienGardeur/webpub-viewer) - An `iframe` based navigator, written in JS (Hadrien Gardeur)
* [comics-viewer](https://github.com/HadrienGardeur/comics-viewer) - An `img` based navigator for comics, written in JS (Hadrien Gardeur)
* [audiobook-player](https://github.com/HadrienGardeur/audiobook-player) - An `audio` based navigator for audiobooks, written in JS (Hadrien Gardeur)

## Contributing

If you'd like to contribute to these projects, make sure that you take a look at [our dedicated page](https://readium.org/development/contributing/).
