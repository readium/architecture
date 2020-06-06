# Streamer API

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Related Issues:
  * [#116 Clarify and refine the streamer API on mobile platforms](https://github.com/readium/architecture/issues/116)
  * [#117 Which parsers should be implemented and how?](https://github.com/readium/architecture/issues/117)


## Summary

This proposal aims to specify the Streamer public API and showcase how a reading app might support additional formats. It ties together several concepts introduced in other proposals such as the [Composite Fetcher API](https://github.com/readium/architecture/blob/master/proposals/002-composite-fetcher-api.md), Publication Encapsulation and the Publication Helpers & Services.


## Motivation

We're trying to address the following needs and pain points for reading apps.

### Supported Formats

A reading app might want to:

* automatically handle all formats supported by Readium, including future ones,
* or limit itself to a subset of the supported formats;
* support additional custom formats.

### Publication Extensibility

A reading app should be able to customize which Publication Services are added to a `Publication` object by adding, removing or replacing services.

It should also be able to replace or decorate the root `Fetcher`, for example to add resource transformers or handle resources caching.

### Replacing Third-Party Dependencies

On some platforms, Readium needs to import third-party dependencies, for example to parse PDF or XML documents. When possible, these dependencies should not be hard-coded in the toolkit, because:

* it burdens the maintenance, in case we need to upgrade to a new version or use a different library
* it prevents reading apps from using a more up-to-date version of a dependency, or use a different library

Instead, generic interfaces should be declared in `r2-shared`, with a default implementation using the third-party dependencies chosen by Readium.

Using interfaces allows to write a single unit test suite shared between all third-party implementations, which is useful to perform benchmarking comparisons or ensure that migrating to a different library won't break the toolkit. [Here's an example comparing Minizip and ZIPFoundation for Swift](https://github.com/readium/r2-shared-swift/blob/6542b9194429c69aea68dc0d406ea39ccf64d8f9/r2-shared-swiftTests/Toolkit/ZIP/ZIPTests.swift#L166).

Typically, interfaces might be useful for PDF, XML, HTTP and archiving (ZIP, RAR, etc.) libraries.

### Customizing Parsers

While Readium ships with sane default parser settings, some degree of configuration might be offered to reading apps. These settings are format-specific and thus can't live in the Streamer API itself, but the Streamer should allow reading apps to set these settings one way or the other.


## Developer Guide

The Streamer is one of the main components of the Readium Architecture, whose responsibilities are to:

* parse packaged or exploded publications into a Readium Web Publication
* [compose the `Fetcher` tree](https://github.com/readium/architecture/blob/master/proposals/002-composite-fetcher-api.md#developer-guide) providing access to publication resources
* unlock content protection technologies

### Usage

#### Opening a Publication File

Opening a `Publication` is really simple with an instance of `Streamer`. 

```kotlin
file = File(path)
streamer = Streamer()
publication = streamer.open(file)
```

Your app will automatically support parsing new formats added in Readium. However, if you wish to limit the supported formats to a subset of what Readium offers, simply guard the call to `open()` by checking the value of `file.format` first.

```kotlin
supportedFormats = [Format.EPUB, Format.PDF]
if (!supportedFormats.contains(file.format)) {
    return
}
```

Alternatively, you can provide the parsers yourself and disable the default ones with `ignoresDefaultParsers`.

```kotlin
streamer = Streamer(
    parsers = [EPUBParser(), PDFParser()],
    ignoresDefaultParsers = true
)
```

#### Customizing Parsers

If a parser offers settings that you wish to override, you can create an instance yourself. It will automatically take precedence over the defaut parser provided by the Streamer.

```kotlin
streamer = Streamer(
    parsers = [EPUBParser(...)]
)
```

#### Customizing the Parsed Publication

You can customize the parsed `Publication` object by modifying:

* its `Manifest` object, to change its metadata or links
* the root `Fetcher`, to fine-tune access to resources
* the list of attached Publication Services

The Streamer accepts a number of callback functions which will be called just before creating the `Publication` object.

```kotlin
streamer = Streamer(
    onCreateFetcher = { file, manifest, fetcher ->
        // Minifies the HTML resources in an EPUB.
        if (file.format == Format.EPUB) {
            fetcher = TransformingFetcher(fetcher, minifyHTML)
        }

        return fetcher
    },

    onCreateServices = { file, manifest, services ->
        // Wraps the default PositionsService to cache its result in a
        // persistent storage, to improve performances.
        services.wrap(PositionsService::class) { oldFactory ->
            CachedPositionsService.createFactory(oldFactory)
        }

        // Sets a custom SearchService implementation for EPUB.
        is (file.format == Format.EPUB) {
            services.search = EPUBSearchService.create
        }
    }
)
```

#### Providing Different Implementations of Third–Party Services

The Streamer and its parsers depend on core features which might not be available natively on the platform, such as reading ZIP archives or parsing XML. In which case, Readium uses third-party libraries. To use a different version of a library than the one provided by Readium, or use a different library altogether, you can provide your own implementation to the Streamer.

```kotlin
streamer = Streamer(
    httpClient = CustomHTTPClient(),
    openPDF = { path, password -> CustomPDFDocument(path, password) }
)
```

If you just want to add HTTP headers or set up caching and networking policies for HTTP requests, you can instantiate the default HTTP client yourself. No need to create a custom implementation of `HTTPClient`.

#### Supporting Custom Formats

The Readium Architecture is opened to support additional publication formats.

1. [Register your new format and add a sniffer](https://github.com/readium/architecture/blob/master/proposals/001-format-api.md#supporting-a-custom-format). This step is optional but recommended to make your format a first-class citizen in the toolkit.
2. Implement a `PublicationParser` to parse the publication format into a `Publication` object. Then, provide an instance to the Streamer.

```swift
class CustomParser: PublicationParser {

    func parse(file: File, fetcher: Fetcher) -> PublicationBuilder? {
        if (file.format != Format.MyCustomFormat) {
            return null
        }

        return PublicationBuilder(
            manifest = parseManifest(file, delegate),
            fetcher = fetcher
            services = [CustomPositionsServiceFactory]
        )
    }

}

streamer = Streamer(
    parsers = [CustomParser()]
)
```

### Backward Compatibility and Migration

#### Mobile (Swift & Kotlin)

This new API won't break existing apps, because it's adding a new type `Streamer` wrapping existing parser classes into a cohesive unit. Reading apps will still be able to use indivual parsers directly. However, we should strongly recommend them to migrate to this new way of opening a `Publication`, which will simplify their integration and make sure they automatically benefit from new formats supported by Readium.


## Reference Guide (`r2-shared`)

*Note: Asynchronicity is represented with `Future` in this reference, but each platform should use the most idiomatic concurrency structure.*

### `File` Class

Represents a path on the file system.

Used to cache the `Format` to avoid computing it at different locations.

#### Constructors

* `File(path: String, mediaType: String? = null)`
  * Creates a `File` from a `path` and its known `mediaType`.
  * `path: String`
    * Absolute path to the file or directory.
  * `mediaType: String? = null`
    * If the file's media type is already known, providing it will improve performances.
* `File(path: String, format: Format)`
  * Creates a `File` from a `path` and an already resolved `format`.

#### Properties

* `path: String`
  * Absolute path on the file system.
* `name: String`
  * Last path component, or filename.
* (lazy) `format: Format?`
  * Sniffed format, if the path points to a file.
  * **Warning:** This should not be called from the UI thread.
* (lazy) `isDirectory: Boolean`
  * Whether the path points to a directory.
  * This can be used to open exploded publication archives.
  * **Warning:** This should not be called from the UI thread.

### `Publication.ServicesBuilder` Class

Builds a list of `Publication.Service` using `Publication.Service.Factory` instances.

Provides helpers to manipulate the list of services of a `Publication`.

This class holds a map between a key – computed from a service interface – and a factory instance for this service.

#### Constructors

* `Publication.ServicesBuilder(positions: ((Publication.Service.Context) -> PositionsService?)? = null, cover: ((Publication.Service.Context) -> CoverService?)? = null, ...)`
  * Creates a `ServicesBuilder` with a list of service factories.
  * There's one argument per standard Readium publication service.

#### Properties

Each publication service should define helpers on `Publication.ServicesBuilder` to set its factory.

* (writable) `coverServiceFactory: ((Publication.Service.Context) -> CoverService?)?`
* (writable) `positionsServiceFactory: ((Publication.Service.Context) -> PositionsService?)?`

#### Methods

* `build(context: Publication.Service.Context) -> List<Publication.Service>`
  * Builds the actual list of publication services to use in a `Publication`.
  * `context: Publication.Service.Context`
    * Context provided to the service factories.
* `set(serviceType: Publication.Service::class, factory: Publication.Service.Factory)`
  * Sets the publication service factory for the given service type.
* `remove(serviceType: Publication.Service::class)`
  * Removes any service factory associated with the given service type.
* `wrap(serviceType: Publication.Service::class, transform: (Publication.Service.Factory?) -> Publication.Service.Factory)`
  * Replaces the service factory associated with the given service type with the result of `transform`.
* `copy() -> Publication.ServicesBuilder`
  * Copy the services builder.
  * A `Publication` must copy its internal services builder and keep it private to prevent other components from modifying it.

### `WarningLogger` Interface

Interface to be implemented by third-party apps if they want to observe non-fatal warnings raised, for example, during the parsing of a `Publication`.

#### Methods

* `log(warning: Warning)`
  * Notifies that a warning occurred.

#### `Warning` Interface

Represents a non-fatal warning message which can be raised by a Readium library.

For example, while parsing a publication we might want to report authoring issues without failing the whole parsing.

##### Properties

* `tag: String`
  * Tag used to group similar warnings together
  * For example `json`, `metadata`, etc.
* `severity: Warning.SeverityLevel`
  * Indicates the severity level of this warning.
* `message: String`
  * Localized user-facing message describing the issue.

##### `Warning.SeverityLevel` Enum

Indicates how the user experience might be affected by a warning.

* `minor` – The user probably won't notice the issue.
* `moderate` – The user experience might be affected, but it shouldn't prevent the user from enjoying the publication.
* `major` – The user experience will most likely be disturbed, for example with rendering issues.


#### `ListWarningLogger` Class (implements `WarningLogger`)

Implementation of `WarningLogger` which accumulates the warnings in a list, to be used as a convenience by third-party apps.

## Reference Guide (`r2-streamer`)

### `PublicationBuilder` Class

Builds a `Publication` from its components.

A `Publication`'s construction is distributed over the Streamer and its parsers, so a builder is useful to pass the parts around.

#### Constructors

* `PublicationBuilder(manifest: Manifest, fetcher: Fetcher, servicesBuilder: Publication.ServicesBuilder)`
  * Each parameter is exposed as a mutable public property.

#### Methods

* `build() -> Publication`
  * Builds the `Publication` object from its parts.

### `PublicationParser` Interface

Parses a `Publication` from a file.

#### Methods

* `parse(file: File, fetcher: Fetcher, fallbackTitle: String = file.name, warnings: WarningLogger? = null) -> Future<PublicationBuilder?>`
  * Constructs a `PublicationBuilder` to build a `Publication` from a publication file.
  * Returns `null` if the file format is not supported by this parser, or throws a localized error if the parsing fails.
  * `file: File`
    * Path to the publication file.
  * `fetcher: Fetcher`
    * Initial leaf fetcher which should be used to read the publication's resources.
    * This can be used to:
      * support content protection technologies
      * parse exploded archives or in archiving formats unknown to the parser, e.g. RAR
    * If the file is not an archive, it will be reachable at the HREF `/publication.<file.format.fileExtension>`, e.g. with a PDF.
  * `fallbackTitle: String = file.name`
    * The `Publication`'s `title` is mandatory, but some formats might not have a way of declaring a title (e.g. CBZ). In which case, `fallbackTitle` will be used.
    * The default implementation uses the filename as the fallback title.
  * `warnings: WarningLogger? = null`
    * Logger used to broadcast non-fatal parsing warnings.
    * Can be used to report publication authoring mistakes, to warn users of potential rendering issues or help authors debug their publications.


### `Streamer` Class

Opens a `Publication` using a list of parsers.

#### Constructor

* `Streamer(/* see parameters below */)`
  * `parsers: List<PublicationParser> = []`
    * Parsers used to open a publication, in addition to the default parsers.
    * The provided parsers take precedence over the default parsers.
    * This can be used to provide custom parsers, or a different configuration for default parsers.
  * `ignoresDefaultParsers: Boolean = false`
    * When `true`, only parsers provided in `parsers` will be used.
    * Can be used if you want to support only a subset of Readium's parsers.
  * `httpClient: HTTPClient? = default`
    * HTTP client used to perform any HTTP requests.
    * The default implementation uses native APIs when available.
  * `openArchive: Archive.Factory? = default`
    * Opens an archive (e.g. ZIP, RAR), optionally protected by credentials.
    * The default implementation uses native APIs when available.
  * `openXML: XMLDocument.Factory? = default`
    * Parses an XML document into a DOM tree.
    * The default implementation uses native APIs when available.
  * `openPDF: PDFDocument.Factory? = default`
    * Parses a PDF document, optionally protected by password.
    * The default implementation uses native APIs when available.
  * `onCreateManifest: (File, Manifest) -> Manifest = { f, m -> m }`
    * Called before creating the `Publication`, to modify the parsed `Manifest` if desired.
  * `onCreateFetcher: (File, Manifest, Fetcher) -> Fetcher = { f, m, fetcher -> fetcher }`
    * Called before creating the `Publication`, to modify its root fetcher.
  * `onCreateServices: (File, Manifest, Publication.ServicesBuilder) -> Void = { f, m, sb -> }`
    * Called before creating the `Publication`, to modify its list of service factories.

The specification of `HTTPClient`, `Archive`, `XMLDocument` and `PDFDocument` is out of scope for this proposal.

#### Methods

* `open(file: File, fallbackTitle: String = file.name, warnings: WarningLogger? = null) -> Future<Publication?>`
  * Parses a `Publication` from the given `file`.
  * Returns `null` if the file was not recognized by any parser, or a `Streamer.Error` in case of failure.
  * `fallbackTitle: String = file.name`
    * The `Publication`'s `title` is mandatory, but some formats might not have a way of declaring a title (e.g. CBZ). In which case, `fallbackTitle` will be used.
    * The default implementation uses the filename as the fallback title.
  * `warnings: WarningLogger? = null`
    * Logger used to broadcast non-fatal parsing warnings.
    * Can be used to report publication authoring mistakes, to warn users of potential rendering issues or help authors debug their publications.

#### `Streamer.Error` Enum

* `ParsingFailed(Error)`
  * Returned when the parsing failed with the given underlying error.

### `PublicationParser` Implementations

These default parser implementations are provided by the Streamer out of the box. The following is not meant to be a full parsing specification for each format, only a set of guidelines.

#### `WebPubParser` Class

Parses a `Publication` from a Readium Web Publication or one of its profiles: Audiobook, DiViNa and LCPDF.

Both packages and manifests are supported by this parser.

#### `W3CWPUBParser` Class

Parses a `Publication` from a W3C Web Publication or one of its profiles, e.g. Audiobook.

[The W3C to RWPM mapping is documented here](https://github.com/readium/architecture/tree/master/other/W3C).

#### `EPUBParser` Class

Parses a `Publication` from an EPUB publication.

[The EPUB parser is already extensively documented](https://github.com/readium/architecture/tree/master/streamer/parser).

#### `PDFParser` Class

Parses a `Publication` from a PDF document.

[Reference: PDF 1.7 specification](https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf)

##### Reading Order

The reading order contains a single link pointing to the PDF document, with the HREF `/publication.pdf`.

##### Table of Contents

The Document Outline (i.e. section 12.3.3) can be used to create a table of contents. The HREF of each link should use a `page=` fragment identifier, following this template: `/publication.pdf#page=<pageNumber>`, where `pageNumber` starts from 1.

##### Cover

The cover should be generated by rendering the first page of the PDF document.

##### Metadata

(*See section "14.3 Metadata" of the PDF 1.7 specification*)

Metadata can be stored in a PDF document either with a *metadata stream* (1.4+) or with a *document info dictionary*. The metadata stream is the preferred method and therefore takes precedence, but the parser should be able to fallback on the document info dictionary.

###### Identifier

The `Publication`'s `identifier` should be computed from the PDF's *file identifier* (i.e. section 14.4), located in the *trailer dictionary*.

```
/ID[<491b7e3d57fa8ca81da62895cbdb22fe><1317e207f71ec2dcff49a219b869606d>]
```

It's a pair of two identifiers, the first one being permanent while the second one is generated for every change in the PDF document. It could be useful to preserve both identifiers, so the `Publication`'s `identifier` should be computed as `<id-created>;<id-modified>`.

As a fallback, the file's MD5 hash may be used for the `identifier`.

#### `ImageParser` Class

Parses an image–based `Publication` from an unstructured archive format containing bitmap files, such as CBZ or a simple ZIP. It can also work for a standalone bitmap file.

To be recognized by this parser, any of these conditions must be satisfied:

* the file has a CBZ media type
* the leaf fetcher contains only links with the given extensions: `acbf`, `gif`, `jpeg`, `jpg`, `png`, `tiff`, `tif`, `txt`, `webp`, and `xml` 
  * links starting with a `.` and `Thumbs.db` are ignored

##### Reading Order

The reading order is built by sorting the fetcher's links by their HREF. Only resources recognized as bitmap files are added to the reading order.

##### Table of Contents

If the links contain intermediate folders, their names are used to build a table of contents. However, folders which don't contain any bitmap descendants are ignored. Each table of content item points to the first bitmap resource listed in the folder.

##### Metadata

There's no standard way to embed metadata in a CBZ, but two formats seem to be used in the wild: [ComicRack](https://wiki.mobileread.com/wiki/ComicRack) and [ComicBookInfo](https://code.google.com/archive/p/comicbookinfo/). [EmbedComicMetadata](https://github.com/dickloraine/EmbedComicMetadata) is a plugin for Calibre handling different CBZ metadata formats.

[More information at MobileRead](https://wiki.mobileread.com/wiki/CBR_and_CBZ#Metadata).

The `Publication`'s `identifier` is generated as a MD5 hash of `file`, if it's not a directory.

#### `AudioParser` Class

Parses an audiobook `Publication` from an unstructured archive format containing audio files, such as ZAB (Zipped Audio Book) or a simple ZIP. It can also work for a standalone audio file.

To be recognized by this parser, any of these conditions must be satisfied:

* the file has a ZAB media type
* the leaf fetcher contains only links with the given extensions:
  * (audio) `aac`, `aiff`, `alac`, `flac`, `m4a`, `m4b`, `mp3`, `ogg`, `oga`, `mogg`, `opus`, `wav` or `webm`
  * (playlist) `asx`, `bio`, `m3u`, `m3u8`, `pla`, `pls`, `smil`, `txt`, `vlc`, `wpl`, `xspf` or `zpl`
  * links starting with a `.` and `Thumbs.db` are ignored

##### Reading Order

The reading order is built by sorting the fetcher's links by their HREF. Only resources recognized as audio files are added to the reading order.

##### Table of Contents

If the links contain intermediate folders, their names are used to build a table of contents. However, folders which don't contain any audio clip descendants are ignored. Each table of content item points to the first audio resource listed in the folder.

##### Metadata

There's no standard way to embed metadata in a ZAB, but there are a number of playlist formats which could be used. [M3U](https://en.wikipedia.org/wiki/M3U) seems to be the most popular. Individual audio format metadata could also be used, in particular for the reading order titles.

The `Publication`'s `identifier` is generated as a MD5 hash of `file`, if it's not a directory.


## Rationale and Alternatives

By adding the `Streamer` object, we aimed to provide an API that is simple to use while still allowing some flexibility.

An alternative that is currently in use in the mobile toolkits would be to provide a set of parsers and leave the responsibility to select and call the parser matching the publication file to reading apps. However, this strategy has downsides:

* Reading apps need to manually integrate parsers to support new formats.
* Content protection technologies and handling archiving/struture formats (e.g. ZIP, exploded directories) would burden either reading apps, or each parser implementation.


## Drawbacks and Limitations

Some parsers, such as `PDFParser`, might depend on heavy libraries which are directly linked into the toolkit. This situation is problematic for applications which are not interested in these formats, or would like to replace the dependency with another one, because it increases significantly the size of the app. 

We might want to offer sub-libraries for such heavy parsers, to keep the toolkit lightweight.


## Future Possibilities

Handling content protection technologies is a complex subject, which deserves its own proposal. Because the Streamer is the gateway to parsers and fetchers, it's a place of choice to add support for content protections.

The Streamer is also a good place to handle injection in publication resources, such as JavaScript/CSS injection in HTML resources. Promoting the concept of "injectable" as a first-class type to plug in the Streamer (and/or the Navigator) would be very useful for reading apps.
