[![Readium Logo](https://readium.org/assets/logos/readium-logo.png)](https://readium.org)

# Readium Architecture

All Readium implementations (mobile, desktop or Web) are split in two main modules, which use the [Readium Web Publication Manifest](https://readium.org/webpub-manifest/) and HTTP for exchanging data.

The "[streamer](streamer)" is responsible for parsing publications and exposing them using both an in-memory model and HTTP.

The "[navigator](navigator)" is meant to navigate in the resources of a publication and can adopt very different strategy based on the nature of the publication (ebooks, audiobooks and comics).

These modules are not necessarily meant to be deployed on the same device or written in the same language, which lets developers select the best implementation based on their requirements.

![Readium-2 architecture](images/readium-2-archi-2.png)

## Components

### Models

* [Web Publication Manifest](https://github.com/readium/webpub-manifest)
* [Locators](locators)

### Main Modules

* [Streamer](streamer)
* [Navigator](navigator)
* [Readium CSS](https://github.com/readium/readium-css)


### Services

* [Location Resolver](locators/resolver.md)
* [Media Overlay](media-overlay)
* [Positions List](positions)
* [Search](search)

## Projects

[See all active projects](projects) based on the Readium Architecture.

## Keeping Track

There are multiple ways to keep track of the on-going activity and participate:

* discussions on [the issue tracker](https://github.com/readium/architecture/issues)
* weekly calls with [our archive of meeting notes and recordings](https://drive.google.com/drive/folders/0BzaNaBNAB6FjbzR5NWFVWVo2dDg?hl=en)
* multiple channels on the [Slack team for Readium](https://readium.slack.com) ([#architecture](https://readium.slack.com/messages/architecture/), [#r2-swift](https://readium.slack.com/messages/r2-swift/) and [#r2-kotlin](https://readium.slack.com/messages/r2-kotlin/))
