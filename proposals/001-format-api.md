# Format API

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Review PR: [#127](https://github.com/readium/architecture/pull/127)
* Related Issues:
  * [Model for the Publication's format/type (architecture/112)](https://github.com/readium/architecture/issues/112)
  * [Media types of Readium publications (architecture/121)](https://github.com/readium/architecture/issues/121)


## Summary

This proposal introduces a dedicated API to easily figure out a file format.

While a `Publication` is independent of any particular format, knowing the format of a publication file is necessary to:

* determine the publication parser to use,
* group or search publications by file type in the user's bookshelf.

This API is not tied to `Publication`, so it can be used as a general purpose tool to guess a file format, e.g. during HTTP requests or in the LCP library.


## Motivation

* The way we handle formats is currently not unified across platforms.
* We don't have a documented strategy to determine the format of a file, which might cause differences across implementations.
* We are only using the media type and file extensions to determine the format, which is not enough in some cases, e.g. ZIP archives without extension.
* It's currently not easy for a reading app to support a custom publication format in Readium.
* Formats supported by Readium are currently exposed as enums with different cases on each platform, which is confusing.

```swift
// Swift
enum Publication.Format {
    /// Formats natively supported by Readium.
    case cbz, epub, pdf, webpub
    /// Default value when the format is not specified.
    case unknown
}
```

```kotlin
// Kotlin
enum class Publication.TYPE {
    EPUB, CBZ, FXL, WEBPUB, AUDIO, DiViNa
}
```


## Developer Guide

You can use the Format API every time you need to figure out the format of a file or bytes.

To use this API efficiently, you should:

* Never sniff a format from the UI thread, since it might perform IO operations. An assertion will check this.
* Provide file extension and media type hints when possible. If the sniffers manage to resolve a format from these hints, then the content won't be read.


### Sniffing the Format of Raw Bytes

You can use directly `Format.of()` for sniffing raw bytes (e.g. the body of an HTTP response). It will take a closure lazily returning the bytes.

```swift
let feedLink: Link
let response = httpClient.get(feedLink.href)

let format = Format.of(
    bytes: { response.body },
    // You can give several file extension and media type hints, which will be sniffed in order.
    fileExtensions: [feedLink.href.pathExtension],
    mediaTypes: [response.headers["Content-Type"], feedLink.type]
)
```

In the case of an HTTP response, this can be simplified by using the `HTTPResponse.format()` extension:

```swift
let feedLink: Link
let response = httpClient.get(feedLink.href)

let format = response.format(mediaTypes: [feedLink.type])
```

### Sniffing the Format of a File

For local files, you can provide an absolute path to `Format.of()`. To improve sniffing speed, you should also provide a media type hint if possible – for example if you previously stored it in a database.

```swift
let dbBook = database.get(bookId)

let format = Format.of(
    path: dbBook.path,
    mediaTypes: [dbBook.mediaType]
)
```

### Supporting a Custom Format

Reading apps are welcome to extend this API with their own formats. To declare a custom format, you need to:

1. Create a `Format` constant instance, optionally in the `Format.` namespace.
2. Create a sniffer function to recognize your format from a `Format.SnifferContext`.
3. Then, either:
    1. add your sniffer to the `Format.sniffers` shared list to be used globally,
    2. or use your sniffer on a case-by-case basis, by passing it to the `sniffers` argument of `Format.of()`.

Here's an example with Adobe's ACSM format.

```swift
// 1. Create the `Format` instance.
private let acsmFormat = Format(
    mediaType: MediaType("application/vnd.adobe.adept+xml"),
    name: "Adobe Content Server Manager",
    fileExtension: "acsm"
)

extension Format {
    static var ACSM: Format { acsmFormat }
}

// 2. Create the sniffer function.
func sniffACSM(context: Format.SnifferContext) -> Format? {
    if context.hasMediaType("application/vnd.adobe.adept+xml")
      || context.hasFileExtension("acsm")
      || context.contentAsXML?.documentElement?.localName == "fulfillmentToken"
    { 
        return Format.ACSM
    }

    return nil
}

// 3.1. Declare the sniffer globally.
Format.sniffers.add(sniffACSM)
let format = Format.of(path: acsmPath)

// 3.2. Or use the sniffer on a case-by-case basis. 
let format = Format.of(path: acsmPath, sniffers: Format.sniffers + [sniffACSM])
```

### Backward Compatibility and Migration

#### Swift

`Publication.format` and `Publication.formatVersion` will be deprecated, with a warning recommending to use `Format.of()` instead. They will still work as before so it's not a breaking change.

#### Kotlin

`Publication.type` and `Publication.version` will be deprecated, with a warning recommending to use `Format.of()` instead. They will still work as before so it's not a breaking change.


## Reference Guide

Instead of using directly a media type, we use a `Format` struct to identify a file format, for several reasons:

* A format such as CBZ can be identified by several media types.
* It's a convenient way to pair a media type and its name and file extension.

**We declare one `Format` per media type**, because if a given profile of a file format has its own media type, it means that it is worth differenciating for reading apps. However, if a recognized format doesn't have any unique media type (e.g. W3C WPUB), you can create one to use internally with Readium components, starting with the prefix `application/x.readium.`.

Resolving a `Format` from content or metadata is the job of the sniffers, which are functions with the type `Format.Sniffer`. Each supported `Format` must have at least one matching sniffer to be recognized. Therefore, a reading app should provide its own sniffers to support custom publication formats.


Here's an overview of the Format API:

* [`MediaType`](#mediatype-class) offers parsing and comparison of media types.
* [`Format`](#format-class) represents a known file format, uniquely identified by a media type.
* [`Format.Sniffer`](#formatsniffer-function-type) is a function type used to implement the sniffing algorithm of each format.


### `MediaType` class

Represents a string media type.

`MediaType` handles:

* components parsing – eg. type, subtype and parameters,
* media types comparison.

Comparing media types is more complicated than it looks, [since they can contain parameters](https://tools.ietf.org/html/rfc6838) such as `charset=utf-8`. We can't ignore them because some formats use parameters in their media type, for example `application/atom+xml;profile=opds-catalog` for an OPDS 1 catalog.

#### Constructor

* `MediaType(string: String)`
  * Creates a `MediaType` from its string representation.

#### Properties

* `string: String` (or `toString()` if more idiomatic).
  * The string representation of this media type.
* `type: String`
  * The type component, e.g. `application` in `application/epub+zip`.
* `subtype: String`
  * The subtype component, e.g. `epub+zip` in `application/epub+zip`.
* `parameters: Map<String, String>`
  * The parameters in the media type, such as `charset=utf-8`.

#### Methods

* `contains(mediaType: String) -> Boolean`, `contains(mediaType: MediaType) -> Boolean`
  * Returns whether the provided media type is included in this media type.
  * For example, `text/html` contains `text/html;charset=utf-8`.
  * `mediaType` must match the parameters in the `parameters` property, but extra parameters are ignored. 
  * Parameters order is ignored. 
  * Wildcards are supported, meaning that `image/*` contains `image/png` and `*/*` contains everything.
* `==` (equality)
  * Returns whether two media types are equal, checking the type, subtype and parameters.
  * Parameters order is ignored.

#### Helpers

Computed properties for convenience. More can be added as needed.

* `isOPDS: Boolean`
  * Returns whether this media type is contained by `OPDS1`, `OPDS1Entry`, `OPDS2` or `OPDS2Publication`.
  * Used to determine the type of remote catalogs.
* `isHTML: Boolean`
  * Returns whether this media type is contained by `HTML` or `XHTML`.
  * Used to determine the type of remote catalogs.
* `isBitmap: Boolean`
  * Returns whether this media type is a bitmap image, so excluding SVG and other vectorial formats. It must be contained by `BMP`, `GIF`, `JPEG`, `PNG`, `TIFF` or `WebP`.
  * Used to determine if a RWPM is a DiViNa publication.

#### Constants

Static constants are provided in `MediaType` for well known media types. These are `MediaType` instances, not `String`.

Constant | Media Type
-------- | ----------
`AAC` | audio/aac
`ACSM` | application/vnd.adobe.adept+xml
`AIFF` | audio/aiff
`Audiobook` | application/audiobook+zip
`AudiobookManifest` | application/audiobook+json
`AVI` | video/x-msvideo
`Binary` | application/octet-stream
`BMP` | image/bmp
`CBZ` | application/vnd.comicbook+zip
`CSS` | text/css
`DiViNa` | application/divina+zip
`DiViNaManifest` | application/divina+json
`EPUB` | application/epub+zip
`GIF` | image/gif
`GZ` | application/gzip
`JavaScript` | text/javascript
`JPEG` | image/jpeg
`HTML` | text/html
`OPDS1` | application/atom+xml;profile=opds-catalog
`OPDS1Entry` | application/atom+xml;type=entry;profile=opds-catalog
`OPDS2` | application/opds+json
`OPDS2Publication` | application/opds-publication+json
`JSON` | application/json
`LCPProtectedAudiobook` | application/audiobook+lcp
`LCPProtectedPDF` | application/pdf+lcp
`LCPLicenseDocument` | application/vnd.readium.lcp.license.v1.0+json
`LCPStatusDocument` | application/vnd.readium.license.status.v1.0+json
`LPF` | application/lpf+zip
`MP3` | audio/mpeg
`MPEG` | video/mpeg
`Ogg` | audio/ogg
`Ogv` | video/ogg
`Opus` | audio/opus
`OTF` | font/otf
`PDF` | application/pdf
`PNG` | image/png
`SVG` | image/svg+xml
`Text` | text/plain
`TIFF` | image/tiff
`TTF` | font/ttf
`W3CWPUBManifest` | (*non-existent*) application/x.readium.w3c.wpub+json
`WAV` | audio/wav
`WebMAudio` | audio/webm
`WebMVideo` | video/webm
`WebP` | image/webp
`WebPub` | application/webpub+zip
`WebPubManifest` | application/webpub+json
`WOFF` | font/woff
`WOFF2` | font/woff2
`XHTML` | application/xhtml+xml
`XML` | application/xml
`ZAB` | (*non-existent*) application/x.readium.zab+zip
`ZIP` | application/zip


### `Format` Class

Represents a known file format, uniquely identified by a media type.

#### Constructors

*Note: all of the constructor parameters are exposed as read-only public properties.*

* `Format(mediaType: MediaType, name: String, fileExtension: String)`
  * `mediaType: MediaType`
    * The canonical media type that identifies the best (most officially) this format.
    * This might be stored in the reading app's database when importing a publication.
  * `name: String`
    * A human readable name identifying the format, which might be presented to the user.
  * `fileExtension: String`
    * The default file extension to use for this format.

#### Methods

* `==` (equality)
  * Returns whether two formats have the same `mediaType`.
* (static) `of(fileExtensions: List<String> = [], mediaTypes: List<String> = [], sniffers: List<Sniffer> = Format.sniffers) -> Format?`
  * Resolves a format from file extension and media type hints, without checking the actual content.
  * **Warning:** This API should never be called from the UI thread. An assertion will check this.
  * (optional) `fileExtensions: List<String> = []`
    * File extension hints to be used by the sniffers.
    * We can provide several from different sources as fallbacks, e.g. from a local path and a download URL.
  * (optional) `mediaTypes: List<String> = []`
    * Media type hints to be used by the sniffers.
    * We can provide several from different sources as fallbacks, e.g. from a `Link.type`, from a `Content-Type` HTTP header or from a database.
  * (optional) `sniffers: List<Sniffer> = Format.sniffers`
    * List of content sniffers used to determine the format.
    * A reading app can support additional formats by giving `Format.sniffers + [customSniffer]`.
* (static) `of(path: String, fileExtensions: List<String> = [], mediaTypes: List<String> = [], sniffers: List<Sniffer> = Format.sniffers) -> Format?`
  * Resolves a format from a local file path.
  * **Warning:** This API should never be called from the UI thread. An assertion will check this.
  * `path: String`
    * Absolute path to the file.
* (static) `of(bytes: () -> ByteArray, fileExtensions: List<String> = [], mediaTypes: List<String> = [], sniffers: List<Sniffer> = Format.sniffers) -> Format?`
  * Resolves a format from bytes, e.g. from an HTTP response.
  * **Warning:** This API should never be called from the UI thread. An assertion will check this.
  * `bytes: () -> ByteArray`
    * Closure lazy-loading the bytes.
    * Since the formats might be guessed from the provided file extensions or media types, we don't want to do eager loading, hence the closure.

#### Constants

* (static, writable) `sniffers: List<Sniffer>`
  * The default sniffers provided by Readium 2 to resolve a `Format`.
  * This list is writable, to allow reading apps to register additional sniffers globally, or remove sniffers.

Formats used by Readium are represented as static constants (singletons) on `Format`, for convenience.
Reading apps are welcome to extend the static constants with additional formats.

Constant | Name | Extension | Media Type
-------- | ---- | --------- | ----------
`Audiobook` | Audiobook | audiobook | application/audiobook+zip
`AudiobookManifest` | Audiobook | json | application/audiobook+json
`BMP` | BMP | bmp | image/bmp
`CBZ` | Comic Book Archive | cbz | application/vnd.comicbook+zip
`DiViNa` | Digital Visual Narratives | divina | application/divina+zip
`DiViNaManifest` | Digital Visual Narratives | json | application/divina+json
`EPUB` | EPUB | epub | application/epub+zip
`GIF` | GIF | gif | image/gif
`HTML` | HTML | html | text/html
`JPEG` | JPEG | jpg | image/jpeg
`OPDS1Feed` | OPDS | atom | application/atom+xml;profile=opds-catalog
`OPDS1Entry` | OPDS | atom | application/atom+xml;type=entry;profile=opds-catalog
`OPDS2Feed` | OPDS | json | application/opds+json
`OPDS2Publication` | OPDS | json | application/opds-publication+json
`LCPProtectedAudiobook` | LCP Protected Audiobook | lcpa | application/audiobook+lcp
`LCPProtectedPDF` | LCP Protected PDF | lcpdf | application/pdf+lcp
`LCPLicense` | LCP License | lcpl | application/vnd.readium.lcp.license.v1.0+json
`LPF` | Lightweight Packaging Format | lpf | application/lpf+zip
`PDF` | PDF | pdf | application/pdf
`PNG` | PNG | png | image/png
`TIFF` | TIFF | tiff | image/tiff
`W3CWPUBManifest` | Web Publication | json | (*non-existent*) application/x.readium.w3c.wpub+json
`WebP` | WebP | webp | image/webp
`WebPub` | Web Publication | webpub | application/webpub+zip
`WebPubManifest` | Web Publication | json | application/webpub+json
`ZAB` | Zipped Audio Book | zab | (*non-existent*) application/x.readium.zab+zip

### `Format.Sniffer` Function Type

Determines if the provided content matches a known format.

#### Definition

* `Format.Sniffer = (context: Format.SnifferContext) -> Format?`
  * `context` holds the file metadata and cached content, which are shared among the sniffers.

### `Format.SnifferContext` Interface

A companion type of `Format.Sniffer` holding the type hints (file extensions, media types) and providing an access to the file content.

Examples of concrete implementations:

* `Format.FileSnifferContext` to sniff a local file.
* `Format.BytesSnifferContext` to sniff a bytes array.
* `Format.MetadataSnifferContext` to sniff only the media type and file extension hints.

#### Properties

* (private) `mediaTypes: List<String>`
  * Media type hints.
* (private) `fileExtensions: List<String>`
  * File extension hints.
* (lazy) `contentAsString: String?`
  * Content as plain text.
  * If needed, extract the `charset` parameter from the media type hints to figure out an encoding. Otherwise, fallback on UTF-8.
* (lazy) `contentAsJSON: JSONObject?`
  * Content as a JSON object.
* (lazy) `contentAsXML: XMLDocument?`
  * Content as an XML document.
* (lazy) `contentAsZIP:  ZIPArchive?`
  * Content as a ZIP archive.

#### Methods

* `stream() -> Stream?`
  * Raw bytes stream of the content.
  * A byte stream can be useful when sniffers only need to read a few bytes at the beginning of the file.
* `close()`
  * Closes any opened file handles.
* `hasFileExtension(fileExtension: String) -> Boolean`
  * Returns whether this context has the given file extension, ignoring case.
  * This will check the `fileExtensions` array.
* `hasMediaType(mediaType: String) -> Boolean`, `hasMediaType(mediaType: MediaType) -> Boolean`
  * Returns whether this context has the given media type, ignoring case and extra parameters.
  * This will check the `mediaTypes` array, using `MediaType` to handle the comparison.

### HTTP Response Extension

It's useful to be able to resolve a format from an HTTP response. Therefore, implementations should provide when possible an extension to the native HTTP response type.

* `HTTPResponse.format(fileExtensions: List<String> = [], mediaTypes: List<String> = [], sniffers: List<Sniffer> = Format.sniffers): Format?`
  * (optional) `fileExtensions`
    * Additional file extension hints to be used by the sniffers.
  * (optional) `mediaTypes`
    * Additional media type hints to be used by the sniffers.
  * (optional) `sniffers`
    * List of content sniffers used to determine the format.

This extension will create a `Format.BytesSnifferContext` using these informations:

* `fileExtensions`, in order:
  * the suggested filename extension, part of the HTTP header `Content-Disposition`,
  * the URL extension,
  * additional provided file extensions.
* `mediaTypes`, in order:
  * the value of the `Content-Type` HTTP header,
  * additional provided `mediaTypes`, for example to use the value of `Link.type`.
* `bytes`: the response's body


### Sniffing Strategy

It's important to have consistent results across platforms, so we need to use the same sniffing strategy per format. While using the media types and file extensions is a common strategy, a given implementation can use additional sniffing mechanisms when natively provided. For example, on iOS we can use the UTI detection mechanism to sniff a media type from a file.

#### Sniffing Rounds

Sniffing a format is done in two rounds, because we want to give an opportunity to all sniffers to return a `Format` quickly before inspecting the content itself:

1. **Light Sniffing** checks only the provided file extension or media type hints.
2. **Heavy Sniffing** reads the bytes to perform more advanced sniffing.

To do that, `Format.of()` will iterate over all the sniffers twice, first with a `Format.SnifferContext` containing only extensions and media types, and the second time with a context containing the content, if available.

#### Default Sniffers

Sniffers can encapsulate the detection of several formats to factorize similar detection logic. For example, the following sniffers were identified. The sniffers order is crucial, because some formats are subsets of other formats.

1. HTML
2. OPDS 1
3. OPDS 2
4. LCP License Document
5. Bitmap (BMP, GIF, JPEG, PNG, TIFF and WebP)
6. Readium Web Publication (WebPub, Audiobook, DiViNa, RWPM, LCPA and LCPDF)
7. W3C Web Publication
8. EPUB
9. LPF
10. ZIP (CBZ and ZAB)
11. PDF

In the case of bitmap formats, the default Readium sniffers don't perform any heavy sniffing, because we only need to detect these formats using extensions in ZIP entries or media types in a manifest.

#### Formats

##### Audiobook (Readium)

* Light:
  * extension is `audiobook`
  * media type is `application/audiobook+zip`
* Heavy:
  * it's a ZIP archive with a `manifest.json` entry, parsed as an RWPM with `metadata.@type == http://schema.org/Audiobook`

##### Audiobook Manifest (Readium)

* Light:
  * media type is `application/audiobook+json`
* Heavy:
  * it's a JSON file, parsed as an RWPM with `metadata.@type == http://schema.org/Audiobook`

##### BMP

* Light:
  * extension is `bmp` or `dib`
  * media type is `image/bmp` or `image/x-bmp`

##### CBZ

* Light:
  * extension is `cbz`
  * media type is `application/vnd.comicbook+zip`, `application/x-cbz` or `application/x-cbr`
* Heavy ([reference](https://wiki.mobileread.com/wiki/CBR_and_CBZ)):
  * it's a ZIP archive containing only entries with the given extensions: [`acbf`](https://wiki.mobileread.com/wiki/ACBF), `gif`, `jpeg`, `jpg`, `png`, `tiff`, `tif`, `webp` or `xml`
  * entries starting with a `.` and `Thumbs.db` are ignored

##### DiViNa

* Light:
  * extension is `divina`
  * media type is `application/divina+zip`
* Heavy:
  * it's a ZIP archive with a `manifest.json` entry parsed as an RWPM, with a reading order containing only bitmap images – checked using `MediaType.isBitmap` on each `Link.type`

##### DiViNa Manifest

* Light:
  * media type is `application/divina+json`
* Heavy:
  * it's a JSON file parsed as an RWPM, with a reading order containing only bitmap images – checked using `MediaType.isBitmap` on each `Link.type`

##### EPUB

* Light:
  * extension is `epub`
  * media type is `application/epub+zip`
* Heavy ([reference](https://www.w3.org/publishing/epub3/epub-ocf.html#sec-zip-container-mime)):
  * it's a ZIP archive with a `mimetype` entry containing strictly `application/epub+zip`, encoded in US-ASCII

##### GIF

* Light:
  * extension is `gif`
  * media type is `image/gif`

##### HTML

* Light:
  * extension is `htm`, `html`, `xht` or `xhtml`
  * media type is `text/html` or `application/xhtml+xml`, checked using `MediaType.isHTML`
* Heavy:
  * it's an XML document with an `<html>` root node

##### JPEG

* Light:
  * extension is `jpg`, `jpeg`, `jpe`, `jif`, `jfif` or `jfi`
  * media type is `image/jpeg`

##### OPDS 1 Feed

* Light:
  * media type is `application/atom+xml;profile=opds-catalog`
* Heavy:
  * it's an XML document with a `<feed>` root node with the XML namespace `http://www.w3.org/2005/Atom`

##### OPDS 1 Entry

* Light:
  * media type is `application/atom+xml;type=entry;profile=opds-catalog`
* Heavy:
  * it's an XML document with an `<entry>` root node with the XML namespace `http://www.w3.org/2005/Atom`

##### OPDS 2 Feed

* Light:
  * media type is `application/opds+json`
* Heavy:
  * it's a JSON file parsed as an RWPM with a `Link` with `self` rel and `application/opds+json` type

##### OPDS 2 Publication

* Light:
  * media type is `application/opds-publication+json`
* Heavy:
  * it's a JSON file parsed as an RWPM with at least one `Link` with a rel *starting with* `http://opds-spec.org/acquisition` 

##### LCP Protected Audiobook

* Light:
  * extension is `lcpa`
  * media type is `application/audiobook+lcp`
* Heavy:
  * it's a ZIP archive with both:
    * a `license.lcpl` entry
    * a `manifest.json` entry, parsed as an RWPM with `metadata.@type == http://schema.org/Audiobook`

##### LCP Protected PDF

* Light:
  * extension is `lcpdf`
  * media type is `application/pdf+lcp`
* Heavy:
  * it's a ZIP archive with both:
    * a `license.lcpl` entry
    * a `manifest.json` entry, parsed as an RWPM with a reading order containing only `Link` with `application/pdf` type

##### LCP License Document

* Light:
  * extension is `lcpl`
  * media type is `application/vnd.readium.lcp.license.v1.0+json`
* Heavy:
  * it's a JSON object containing the following root keys: `id`, `issued`, `provider` and `encryption`

##### LPF (Lightweight Packaging Format)

* Light:
  * extension is `lpf`
  * media type is `application/lpf+zip`
* Heavy ([reference 1](https://www.w3.org/TR/lpf/), [reference 2](https://www.w3.org/TR/pub-manifest/#manifest-context)):
  * it's a ZIP archive with either:
    * a `publication.json` entry, containing at least `https://www.w3.org/ns/pub-context` in the `@context` string/array property
    * an `index.html` entry

##### PDF

* Light:
  * extension is `pdf`
  * media type is `application/pdf`
* Heavy ([reference](https://www.loc.gov/preservation/digital/formats/fdd/fdd000123.shtml)):
  * content starts with `%PDF-`

##### PNG

* Light:
  * extension is `png`
  * media type is `image/png`

##### Web Publication (Readium)

* Light:
  * extension is `webpub`
  * media type is `application/webpub+zip`
* Heavy:
  * it's a ZIP archive with a `manifest.json` entry parsed as an RWPM

##### Web Publication Manifest (Readium)

* Light:
  * media type is `application/webpub+json`
* Heavy:
  * it's a JSON file, parsed as an RWPM containing one `Link` with `self` rel and `application/webpub+json` type

##### Web Publication Manifest (W3C)

* Heavy ([reference](https://www.w3.org/TR/wpub/#manifest-context)):
  * it's a JSON file, containing at least `https://www.w3.org/ns/wp-context` in the `@context` string/array property 

##### TIFF

* Light:
  * extension is `tiff` or `tif`
  * media type is `image/tiff` or `image/tiff-fx`

##### WebP

* Light:
  * extension is `webp`
  * media type is `image/webp`

##### ZAB (Zipped Audio Book)

* Light:
  * extension is `zab`
* Heavy:
  * it's a ZIP archive containing only entries with the given extensions:
    * (audio) `aac`, `aiff`, `alac`, `flac`, `m4a`, `m4b`, `mp3`, `ogg`, `oga`, `mogg`, `opus`, `wav` or `webm`
    * (playlist) `asx`, `bio`, `m3u`, `m3u8`, `pla`, `pls`, `smil`, `vlc`, `wpl`, `xspf` or `zpl`
  * entries starting with a `.` and `Thumbs.db` are ignored