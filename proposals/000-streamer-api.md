# Streamer API

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Related Issues:
  * [#116 Clarify and refine the streamer API on mobile platforms](https://github.com/readium/architecture/issues/116)
  * [#117 Which parsers should be implemented and how?](https://github.com/readium/architecture/issues/117)


## Summary

This proposal aims to specify the Streamer public API and how a reading app might support additional formats. It ties together the various proposals made on the `Publication` extensibility.


## Motivation

We're trying to address the following needs and pain points for reading apps.

### Supported Formats

A reading app might want to:

* automatically handle all formats supported by Readium, including future ones,
* or limits itself to a subset of the supported formats;
* support additional custom formats.

### Publication Extensibility

A reading app should be able to customize which Publication Services are added to a `Publication` object, by either removing, replacing or wrapping them, or by adding custom services.

It should also be able to replace or decorate the root `Fetcher`, for example to add resource transformers or handle resources caching.

### Replacing Third-Party Dependencies

On some platforms, Readium needs to import third-party dependencies, for example to parse PDF or XML documents. When possible, these dependencies should not be hard-coded in the toolkit, because:

* it burdens the maintenance, in case we need to upgrade to a new version or use a different library
* it prevents reading apps from using a more up-to-date version of a dependency, or a different one which might address specific issues

Instead, generic interfaces should be declared in `r2-shared`, with a default implementation using the third-party dependencies chosen by Readium. Ideally, such third-party implementations should be isolated in their own sub-packages to avoid increasing the size of the app with unused libraries.

Using interfaces allows to write a single unit test suite shared between all third-party dependencies, which is useful to perform benchmarking comparisons or ensure that migrating to a different library won't break the toolkit. [Here's an example comparing Minizip and ZIPFoundation for Swift](https://github.com/readium/r2-shared-swift/blob/6542b9194429c69aea68dc0d406ea39ccf64d8f9/r2-shared-swiftTests/Toolkit/ZIP/ZIPTests.swift#L166).

Typically, interfaces might be useful for PDF, XML, HTTP and archiving (ZIP, RAR, etc.) libraries.

### Customizing Parsers

While Readium ships with sane default parser settings, some degree of configuration might be offered for reading apps. These settings are format-specific and thus can't live in the Streamer API itself, but the Streamer should allow an entry-point for such custom parser settings.


## Developer Guide

The Streamer is one of the main components of the Readium Architecture, whose responsibilities are to:

* parse packaged or exploded publications into a Readium Web Publication
* compose the `Fetcher` tree providing access to publication resources
* unlock content protection technologies

### Usage

#### Opening a Publication File

Opening a `Publication` is really simple with an instance of `Streamer`. 

```kotlin
val file = File(path)
val streamer = Streamer()
val publication = streamer.open(file)
```

Your app will automatically support parsing new formats added in Readium. However, if you wish to limit the supported formats to a subset of what Readium offers, simply guard the call to `open()` by checking the value of `file.format` first.

```kotlin
val supportedFormats = [Format.EPUB, Format.PDF]
if (!supportedFormats.contains(file.format)) {
    return
}
```

Alternatively, you can provide the parsers yourself and disable the default ones with `ignoresDefaultParsers`.

```kotlin
val streamer = Streamer(
    parsers = [EPUBParser(), PDFParser()],
    ignoresDefaultParsers = true
)
```

#### Customizing Parsers

If a parser offers settings that you wish to override, you can create an instance yourself. It will automatically take precedence over the defaut parser provided by the Streamer.

```kotlin
val streamer = Streamer(
    parsers = [EPUBParser(...)]
)
```

#### Providing Different Implementations of Third–Party Services

The Streamer and its parsers depend on core features which might not be available natively on the platform, such as ZIP access or XML parsing. In which case, Readium uses third-party libraries. You can provide your own implementation of such features, for example to use a different version of a library than the one provided by Readium, or use a different library altogether. To achieve that, implement the relevant interfaces from `r2-shared`, and pass your implementation to the Streamer.

```kotlin
val streamer = Streamer(
    httpClient = CustomHTTPClient(),
    openPDF = { path, password -> CustomPDFDocument(path, password) }
)
```

In the case of the HTTP client, you can also use the default implementation from Readium with custom settings. It can be useful to set HTTP headers, handle access control or set up caching and networking policies.

#### Customizing the Fetcher or Publication Services

```kotlin
val streamer = Streamer(
    onCreateManifest = { file, manifest ->
        manifest
    },

    onCreateServices = { file, manifest, services ->
        services.replace(PositionsService::class) { oldFactory ->
            CachedPositionsService.createFactory(oldFactory)
        }

        services.remove(CoverService::class)

        is (file.format == Format.EPUB) {
            services.add(EPUBSearchServiceFactory)
        }
    },

    onCreateFetcher = { file, manifest, fetcher ->
        if (file.format == Format.EPUB) {
            fetcher = TransformingFetcher(fetcher, minifyHTML)
        }

        return CachingFetcher(fetcher)
    }
)
```

#### Supporting Custom Formats

The Readium Architecture is opened to support additional publication formats.

##### Register Your Format

This step is optional but recommended to give a first-class access to your format.

[Register your new format to the `Format.Sniffer`](https://github.com/readium/architecture/blob/master/proposals/001-format-api.md#supporting-a-custom-format).

```kotlin
private val CustomFormat = Format(...)

class CustomParser : Publication.Parser {

    fun parse(file: File, fetcher: Fetcher): Future<Publication.Builder?> {
        if (file.format != CustomFormat) {
            return null
        }

        return Publication.Builder(
            manifest = parseManifest(file, delegate),
            fetcher = fetcher
            services = [CustomPositionsServiceFactory]
        )
    }

}

val streamer = Streamer(
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

* `File(path: String, mediaType: String? = null, formatSniffers: List<Format.Sniffer> = Format.sniffers)`
  * Creates a `File` from a `path` and its known `mediaType`.
  * `path: String`
    * Absolute path to the file or directory.
  * `mediaType: String? = null`
    * If the file's media type is already known, providing it will improve performances.
  * `formatSniffers: List<Format.Sniffer> = Format.sniffers`
    * List of format sniffers used to resolve the file's format.
* `File(path: String, format: Format)`
  * Creates a `File` from a `path` and an already resolved `format`.

#### Properties

* `path: String`
  * Absolute path on the file system.
* (lazy) `format: Format?`
  * Sniffed format, if the path points to a file.
* `isDirectory: Boolean`
  * Whether the path points to a directory.
  * This can be used to open exploded publication archives.

### `Publication` Additions

#### `Publication.Builder` Class

Builds a `Publication` from its component.

A `Publication`'s construction is distributed over the streamer and its parsers, so we need a builder to pass the parts around.

##### Constructors

* `Publication.Builder(manifest: Publication.Manifest, fetcher: Fetcher, servicesBuilder: Publication.ServicesBuilder)`
  * Each parameter is exposed as a mutable public property.

##### Methods

* `build() -> Publication`
  * Builds the `Publication` object from its parts.


#### `Publication.ServicesBuilder` Class

Builds a list of `Publication.Service` using `Publication.Service.Factory` instances.

Provides helpers to manipulate the list of services of a `Publication`.

##### Constructors

* `Publication.ServicesBuilder(serviceFactories: List<Publication.Service.Factory>)`
  * Creates a `ServicesBuilder` with a list of service factories.

##### Methods

* `build(context: Publication.Service.Context) -> List<Publication.Service>`
  * Builds the actual list of publication services to use in a `Publication`.
  * `context: Publication.Service.Context`
    * Context to give to the service factories.
* `add(serviceFactory: Publication.Service.Factory)`
  * Adds a new publication service factory to the builder.
  * The factory will be inserted at the beginning of the internal list of factories, to make sure it takes precedence over any existing one.
* `remove(service: Publication.Service::class)`
  * Removes any service factory producing the given kind of `service`.
* `replace(service: Publication.Service::class, transform: (Publication.Service.Factory?) -> Publication.Service.Factory)`
  * Replace the first existing service factory producing the given kind of `service` by the result of `transform`.
  * This can be used to replace an existing service, or to wrap it.
* `copy() -> Publication.ServicesBuilder`
  * Copy the services builder.
  * A `Publication` must copy its internal services builder and keep it private to avoid other components modifying it.

#### `Publication.Parser` Interface

Parses a `Publication` from its file representation.

##### Methods

* `parse(file: File, fetcher: Fetcher? = null, warnings: WarningLogger<Publication.Warning>? = null) -> Future<Publication.Builder?>`
  * Constructs a `Publication.Builder` to build a `Publication` from its file representation.
  * Returns `null` if the file format is not supported by this parser, or a `Publication.Parser.Error`.
  * `file: File`
    * Path to the publication file on the file system.
  * `fetcher: Fetcher? = null`
    * Initial leaf fetcher which should be used to read the publication's resources, when provided.
    * This can be used to:
      * support content protection technologies
      * optimize known archive format opening, to avoid having each parser open a new handle to the archive, e.g. ZIP
      * parse exploded archives or in archiving format unknown to the parser, e.g. RAR
  * `warnings: WarningLogger<Publication.Warning>? = null`
    * Logger used to broadcast non-fatal parsing warnings.
    * Can be used to report publication authoring mistakes, to warn users of potential rendering issue or help authors debug their publications.

##### `Publication.Parser.Error` Enum

* `Unavailable`
  * Returned when the file is not reachable, either because it doesn't exist or reading it is forbidden.
* `Corrupted`
  * Returned when the file can't be parsed as the claimed format, preventing from building a `Publication`.


## Reference Guide (`r2-streamer`)

The Streamer provides parsers for known publication formats and support content protection technologies.

### `Streamer` Class

Opens a `Publication` using a list of parsers.

This is the entry-point to the Streamer component.

#### Constructor

* `Streamer(/* see parameters below */)`
  * `parsers: List<Publication.Parser> = []`
    * Parsers to use to open a publication, in addition of the default parsers.
    * The provided parsers take precedence over the default parsers.
    * This can be used to provide custom parsers, or a different configuration of default parsers.
  * `ignoresDefaultParsers: Boolean = false`
    * When `true`, only the parsers provided in `parsers` will be used.
    * Can be used if you want to support only a subset of Readium's parsers.
  * `httpClient: HTTPClient? = default`
    * HTTP client used to perform any HTTP requests.
    * The default implementation uses native APIs when available.
  * `openArchive: Archive.Factory? = default`
    * Opens an archive (e.g. ZIP, RAR), optionally protected by credentials.
    * The default implementation uses native APIs when available.
  * `openXML: XMLDocument.Factory? = default`
    * Parses an XML document into a DOM.
    * The default implementation uses native APIs when available.
  * `openPDF: PDFDocument.Factory? = default`
    * Parses a PDF document, optionally protected by password.
    * The default implementation uses native APIs when available.
  * `onCreateManifest: (File, Manifest) -> Manifest = { m -> m }`
    * Called before creating the `Publication`, to modify the parsed `Manifest` if desired.
  * `onCreateFetcher: (File, Manifest, Fetcher) -> Fetcher = { f -> f }`
    * Called before creating the `Publication`, to modify its root fetcher.
  * `onCreateServices: (File, Manifest, Publication.ServicesBuilder) -> Void = {}`
    * Called before creating the `Publication`, to modify its list of service factories.

The specification of `HTTPClient`, `Archive`, `XMLDocument` and `PDFDocument` is out of scope for this proposal.

#### Methods

* `open(file: File, warnings: WarningLogger<Publication.Warning>? = null) -> Future<Publication?>`
  * Parses a `Publication` from the given `file`.
  * Returns `null` if the file was not recognized by any parser, or a `Streamer.Error` in case of failure.
  * `warnings: WarningLogger<Publication.Warning>? = null`
    * Logger used to broadcast non-fatal parsing warnings.
    * Can be used to report publication authoring mistakes, to warn users of potential rendering issue or help authors debug their publications.

#### `Streamer.Error` Enum

* `ParsingFailed(Error)`
  * Returned when the parsing failed with the given underlying error.

### `Publication.Parser` Implementations

#### `EPUBParser` Class

Parses a `Publication` from an EPUB publication.

[The EPUB parser is already extensively documented](https://github.com/readium/architecture/tree/master/streamer/parser).

#### `PDFParser` Class

Parses a `Publication` from a PDF document.

#### `WebPubParser` Class

Parses a `Publication` from a Readium Web Publication or one of its profiles: Audiobook, DiViNa and LCPDF.

Both packages and manifests are supported by this parser.

#### `W3CWPUBParser` Class

Parses a `Publication` from a W3C Web Publication or one of its profiles, e.g. Audiobook.

[The W3C to RWPM mapping is documented here](https://github.com/readium/architecture/tree/master/other/W3C).

#### `ImageArchiveParser` Class

Parses an image–based `Publication` from an unstructured archive format containing bitmap files, such as CBZ or a simple ZIP.

To be recognized by this parser, the archive must either:

* have a CBZ media type
* contain only entries with the given extensions: `acbf`, `gif`, `jpeg`, `jpg`, `png`, `tiff`, `tif`, `txt`, `webp`, and `xml` 
  * entries starting with a `.` and `Thumbs.db` are ignored

##### Reading Order

The reading order is built by sorting the entries by their filename, following folders recursively. Only entries recognized as bitmap files are added to the reading order.

##### Table of Contents

If the archive contains folders, their names are used to build a table of contents. However, folders which don't contain any bitmap descendants are ignored. Each link points to the first bitmap file listed in the folder.

##### Metadata

There's no standard way to embed metadata in a CBZ, but two formats seem to be used in the wild: [ComicRack](https://wiki.mobileread.com/wiki/ComicRack) and [ComicBookInfo](https://code.google.com/archive/p/comicbookinfo/). [EmbedComicMetadata](https://github.com/dickloraine/EmbedComicMetadata) is a plugin for Calibre handling different CBZ metadata formats.

[More information at MobileRead](https://wiki.mobileread.com/wiki/CBR_and_CBZ#Metadata).

#### `AudioArchiveParser` Class

Parses an audiobook `Publication` from an unstructured archive format containing audio files, such as ZAB (Zipped Audio Book) or a simple ZIP.

To be recognized by this parser, the archive must either:

* have a ZAB media type
* contain only entries with the given extensions:
  * (audio) `aac`, `aiff`, `alac`, `flac`, `m4a`, `m4b`, `mp3`, `ogg`, `oga`, `mogg`, `opus`, `wav` or `webm`
  * (playlist) `asx`, `bio`, `m3u`, `m3u8`, `pla`, `pls`, `smil`, `txt`, `vlc`, `wpl`, `xspf` or `zpl`
  * entries starting with a `.` and `Thumbs.db` are ignored

##### Reading Order

The reading order is built by sorting the entries by their filename, following folders recursively. Only entries recognized as audio files are added to the reading order.

##### Table of Contents

If the archive contains folders, their names are used to build a table of contents. However, folders which don't contain any audio clip descendants are ignored. Each link points to the first audio file listed in the folder.

##### Metadata

There's no standard way to embed metadata in a ZAB, but there are a number of playlist formats which could be used. [M3U](https://en.wikipedia.org/wiki/M3U) seems to be the most popular. Individual audio format metadata could also be used, in particular for the reading order titles.

## Rationale and Alternatives

What other designs have been considered, and why you chose this approach instead.


## Drawbacks and Limitations

Why should we *not* do this? Are there any unresolved questions?


## Future Possibilities

Content Protection

Injection should be a module with two sides: a resource-transformer side, and a webview native injection side
