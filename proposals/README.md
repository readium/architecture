# REP – Readium Evolution Proposals

Many changes, such as bug fixes, internal refactorings and documentation improvements, can be implemented and reviewed via the usual GitHub tools: issues and pull requests.

However, we ask that any change impacting the public API be put through a bit of design process and produce a consensus among the Readium community.

The REP (Readium Evolution Proposals) process is intended to provide a public space for discussing new features entering the Readium toolkit, so that all stakeholders can be confident about the direction the toolkit is following. It also serves as an archive and reference for existing (or soon to be) features.

## Approved Proposals

### [001 – Media Type](001-media-type.md)

This proposal introduces a dedicated API to easily figure out a file format.

While a `Publication` is independent of any particular format, knowing the format of a publication file is necessary to:

* determine the publication parser to use,
* group or search publications by file type in the user's bookshelf.

This API is not tied to `Publication`, so it can be used as a general purpose tool to guess a file format, e.g. during HTTP requests or in the LCP library.

### [002 – Composite Fetcher API](002-composite-fetcher-api.md)

The goal of this proposal is to make the fetcher more flexible using a [composite design pattern](https://en.wikipedia.org/wiki/Composite_pattern). We will introduce several `Fetcher` implementations to answer different needs, such as resource transformation and caching.

### [003 – Publication Encapsulation](003-publication-encapsulation.md)

We can make the Readium toolkit simpler and safer to use by exposing a single encapsulated `Publication`, encompassing resources access and services.

### [004 – Publication Helpers and Services](004-publication-helpers-services.md)

Our goal is to improve extensibility and customizability of the `Publication` type for reading apps. To achieve that, this proposal introduces two structured ways to extend a `Publication` with additional features: *helpers* and *services*.

* **Helpers are *internal* extensions**. They have a single implementation which is statically defined in the shared models.
* **Services are *external* extensions**. Other Readium components provide implementations, which are swappable and injected dynamically into the `Publication` object

### [005 – Streamer API](005-streamer-api.md)

This proposal aims to specify the Streamer public API and showcase how a reading app might support additional formats. It ties together several concepts introduced in other proposals such as the [Composite Fetcher API](002-composite-fetcher-api.md), [Publication Encapsulation](003-publication-encapsulation.md) and the [Publication Helpers & Services](004-publication-helpers-services.md).

### [006 – Content Protection](006-content-protection.md)

Offers a way to support more content protection technologies in Readium 2.

* Simplify use of DRMs in reading apps.
* Be able to support other DRMs than LCP, without modifying the toolkit itself.
* Handle decryption/transformation of publication resources.
* Consume user rights in a DRM-agnostic way, e.g. copy or print.

### [007 – Search Service](007-search-service.md)

Being able to search through a publication's content is a useful feature, often expected by end users. We can offer a unified API for the wide variety of publication formats supported by Readium to make it easy for reading apps to implement such feature.

Search can be implemented in many different ways, so being able to switch implementations without touching the UX layer would be valuable. For example, a reading app might want to use a [full-text search](https://en.wikipedia.org/wiki/Full-text_search) database to improve search performance and search across multiple publications in the user bookshelf.

### [008 – Decorator API](008-decorator-api.md)

This proposal introduces a new Navigator API to draw decorations on top of publications, in a media type agnostic way. This new API is a building block for a variety of features which need to draw user interface elements (decorations) over a publication's content, such as:

* highlighting a text selection
* displaying search results
* underlining spoken text with speech synthesis
* annotating a piece of content with an icon or button
* drawing side marks in the margin

