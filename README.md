# Readium-2

A repo for storing documents and discussing Readium-2.

There are multiple ways to keep track of the on-going activity and participate:

* discussions on [the issue tracker](https://github.com/readium/readium-2/issues)
* action items and epics on [the project board](https://github.com/readium/readium-2/projects/1)
* weekly calls with [our archive of meeting notes and recordings](https://drive.google.com/drive/folders/0BzaNaBNAB6FjbzR5NWFVWVo2dDg?hl=en)
* multiple channels on the [Slack team for Readium](https://readium.slack.com) ([#readium-2](https://readium.slack.com/messages/readium-2/), [#r2-swift](https://readium.slack.com/messages/r2-swift/) and [#r2-java](https://readium.slack.com/messages/r2-java/))


## Modules

### Main Modules

* [Streamer](/streamer)
* [Navigator](/navigator)
* [Web Publication Manifest](https://github.com/readium/webpub-manifest)
* [Readium CSS](https://github.com/readium/readium-css)
* [Locators](/locators)


### Services

* [Location Resolver](/locators/resolver.md)
* [Media Overlay](/media-overlay)
* [Positions List](/positions)
* [Search](/search)

## Active Projects

### iOS / Swift

For an overview of how Readium-2 on iOS works, we highly recommend taking a look at the [iOS Test App](https://github.com/readium/r2-testapp-swift).

The Test App integrates the following modules into a single iOS application:

* [Shared Model](https://github.com/readium/r2-shared-swift)
* [Streamer](https://github.com/readium/r2-streamer-swift)
* [Navigator](https://github.com/readium/r2-navigator-swift)

This app is currently tested on TestFlight by a first batch of alpha testers.

### Android

On Android, things are going to be changing a lot until the end of the year (2017).

The only active project is a [Java implementation of the streamer](https://github.com/readium/r2-streamer-java).

The current plan is to port all iOS modules to Kotlin in Q4 2017.

### JavaScript

EDRLab is actively working on a production app called [Readium Desktop](https://github.com/edrlab/readium-desktop) built on top of a [Typescript-based implementation of the streamer](https://github.com/edrlab/r2-streamer-js).

There are also two projects implementing a JS-based navigator:

* [webpub-viewer](https://github.com/NYPL-Simplified/webpub-viewer) - An iframe-based navigator, written in TypeScript (NYPL)
* [epub.js](https://github.com/futurepress/epub.js/) - Support for the streamer is in development as part of the v0.3 release (Future Press)

### Go

The first implementation of a streamer was written in Go, mostly for server-side deployment.

This project is active and [hosted on this organization](https://github.com/readium/r2-streamer-go).


## Prototypes

* [webpub-viewer](https://github.com/HadrienGardeur/webpub-viewer) - An `iframe` based navigator, written in JS (Hadrien Gardeur)
* [comics-viewer](https://github.com/HadrienGardeur/comics-viewer) - An `img` based navigator for comics, written in JS (Hadrien Gardeur)
* [audiobook-player](https://github.com/HadrienGardeur/audiobook-player) - An `audio` based navigator for audiobooks, written in JS (Hadrien Gardeur)
