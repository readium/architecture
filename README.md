# Readium-2

A repo for storing documents and discussing Readium-2.

Readium-2 is the new major project of the Readium Foundation. It defines a set of native software modules dedicated to digital reading apps, optimized for different targets:  

* iOS devices (iPad and iPhones)
* Android devices (smartphones and tablets)
* Windows PCs
* Linux computers / servers
* MacOS computers

Modules are written in different programming languages, with a common model and a articulated in a common architecture. This is different from the initial Readium SDK approach where a quite monolythic software package is written in C++ and called from native apps written in e.g. Objective-C or Java.  

Thsi flexible framework can be used for standalone apps, server apps and Web Apps. 

## Keeping track

There are multiple ways to keep track of the on-going activity and participate:

* discussions on [the issue tracker](https://github.com/readium/readium-2/issues)
* action items and epics on [the project board](https://github.com/readium/readium-2/projects/1)
* weekly calls with [our archive of meeting notes and recordings](https://drive.google.com/drive/folders/0BzaNaBNAB6FjbzR5NWFVWVo2dDg?hl=en)
* multiple channels on the [Slack team for Readium](https://readium.slack.com) ([#readium-2](https://readium.slack.com/messages/readium-2/), [#r2-swift](https://readium.slack.com/messages/r2-swift/) and [#r2-java](https://readium.slack.com/messages/r2-java/))


## Readium-2 architecture

All Readium-2 implementations (mobile, desktop or Web app) are split in two main modules, which use HTTP for exchanging data, may therefore be running on different systems, and may be written in different languages. 

One module contains a parser dedicated to a certain type of publication (EPUB or CBZ today), generates a Web Publication Manifest and exposes every resource of the publication via an HTTP server; we call it a "streamer", as it exposes the individual resources of the publication. 

Another module processes the Web Publication Manifest, renders the publication (usually on screen) and handles user navigation; we call it a "navigator". 

![Readium-2 architecture](images/readium-2-archi-2.png)


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

### Hosted By Readium

* [r2-streamer-go](https://github.com/readium/r2-streamer-go) -  Go version of the streamer
* [r2-streamer-swift](https://github.com/readium/r2-streamer-swift) - Swift version of the streamer
* [r2-streamer-java](https://github.com/readium/r2-streamer-java) - Java version of the streamer

### External

* [Readium Desktop](https://github.com/edrlab/readium-desktop) - A Readium-2 based app written for desktop using Electron (EDRLab)
* [r2-streamer-js](https://github.com/edrlab/r2-streamer-js) - Typescript version of the streamer (EDRLab)
* [r2-navigator-swift](https://github.com/edrlab/r2-navigator-swift) - Swift based navigator with its demo app (EDRLab)
* [NYPLNavigator-iOS](https://github.com/NYPL-Simplified/NYPLNavigator-iOS) - An iOS navigator written in Swift (NYPL)
* [webpub-viewer](https://github.com/NYPL-Simplified/webpub-viewer) - An iframe-based navigator, written in TypeScript (NYPL)

## Readium-2 Enabled Projects

* [epub.js](https://github.com/futurepress/epub.js/) - Support for the streamer is in development as part of the v0.3 release (Future Press)

## Prototypes

* [webpub-viewer](https://github.com/HadrienGardeur/webpub-viewer) - An `iframe` based navigator, written in JS (Hadrien Gardeur)
* [comics-viewer](https://github.com/HadrienGardeur/comics-viewer) - An `img` based navigator for comics, written in JS (Hadrien Gardeur)
* [audiobook-player](https://github.com/HadrienGardeur/audiobook-player) - An `audio` based navigator for audiobooks, written in JS (Hadrien Gardeur)
