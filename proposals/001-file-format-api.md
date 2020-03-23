# File and Format API

* Proposal: [A-001](001-file-format-api.md)
* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Status: **In Review**
* Related Issues:
  * [Model for the Publication's format/type (architecture/112)](https://github.com/readium/architecture/issues/112)


## Introduction

This proposal introduces a dedicated API to easily figure out a file format.

While a `Publication` is independent of any particular format, knowing the format of a publication file is necessary to:

* determine the publication parser to use,
* choose which kind of navigator to present – e.g. an audiobook doesn't need a paginated navigator,
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

## Proposed Solution

If a given profile of a file format has its own media type, it means that it is worth differenciating for reading apps. Therefore, **we declare one `Format` per media type**, instead of:

* grouping several similar formats under the same `Format` – e.g. webpub, audiobook and DiViNa manifests, or
* splitting a unique format into two sub-formats – e.g. EPUB reflowable and fixed-layout.

This proposal adds the following new types:

* [`MediaType`](#mediatype-class) offers parsing and comparison of media types.
* [`Format`](#format-class) represents a known file format, uniquely identified by a media type.
* [`Format.Sniffer`](#formatsniffer-function-type) is a function type used to implement the sniffing algorithm of each format.
* [`File`](#file-class) offers a convenient way to cache a format used by several Readium components.


### `MediaType` class

Comparing media types is more complicated than it looks, [since they can contain parameters](https://tools.ietf.org/html/rfc6838) such as `charset=utf-8`. We can't ignore them because some formats use parameters in their media type, for example `application/atom+xml;profile=opds-catalog` for an OPDS 1 catalog.

#### Constructor

* `MediaType(string: String)`
  * Creates a `MediaType` from its string representation.

#### Properties

* `string: String` (or `toString()` if more idiomatic).
  * The string representation of this media type.
* `type: String`
  * `application` in `application/epub+zip`
* `subtype: String`
  * `epub+zip` in `application/epub+zip`
* `parameters: Map<String, String>`
  * The parameters in the media type, such as `charset=utf-8`.

#### Helpers

More can be added as needed.

* `isManifest: Bool`
  * Returns whether this media type is contained by `AudiobookManifest`, `DiViNaManifest`, `Opds1Entry`, `Opds2Publication` or `WebPubManifest`.
  * Used to determine if the remote URL needs to be stored in the database, instead of the local downloaded path.
* `isOpds: Bool`
  * Returns whether this media type is contained by `Opds1`, `Opds1Entry`, `Opds2` or `Opds2Publication`.
  * Used to determine the type of remote catalogs.
* `isHtml: Bool`
  * Returns whether this media type is contained by `Html` or `Xhtml`.
  * Used to determine the type of remote catalogs.
* `isBitmap: Bool`
  * Returns whether this media type is a bitmap image, so excluding SVG and other vectorial formats. It must be contained by `Bmp`, `Gif`, `Jpeg`, `Png`, `Tiff` or `Webp`.
  * Used to determine if a RWPM is a DiViNa publication.

#### Methods

* `contains(mediaType: String) -> Bool`, `contains(mediaType: MediaType) -> Bool`
  * Returns whether the provided media type is included in this media type.
  * For example, `text/html` contains `text/html;charset=utf-8`.
  * `mediaType` must match the parameters in the `parameters` property, but extra parameters are ignored. 
  * Parameters order is ignored. 
  * Wildcards are supported, meaning that `image/*` contains `image/png` and `*/*` contains everything.
* `==` (equality)
  * Returns whether two media types are equal, checking the type, subtype and parameters.
  * Parameters order is ignored.

#### Constants

Static constants are provided in `MediaType` for well known media types. These are `MediaType` instances, not `String`.

Constant | Media Type
-------- | ----------
`Aac` | audio/aac
`Acsm` | application/vnd.adobe.adept+xml
`Aiff` | audio/aiff
`Audiobook` | application/audiobook+zip
`AudiobookManifest` | application/audiobook+json
`Avi` | video/x-msvideo
`Binary` | application/octet-stream
`Bmp` | image/bmp
`Cbz` | application/vnd.comicbook+zip
`Css` | text/css
`DiViNa` | application/divina+zip
`DiViNaManifest` | application/divina+json
`Epub` | application/epub+zip
`Gif` | image/gif
`Gz` | application/gzip
`JavaScript` | text/javascript
`Jpeg` | image/jpeg
`Html` | text/html
`Opds1` | application/atom+xml;profile=opds-catalog
`Opds1Entry` | application/atom+xml;type=entry;profile=opds-catalog
`Opds2` | application/opds+json
`Opds2Publication` | application/opds-publication+json
`Json` | application/json
`LcpProtectedAudiobook` | application/audiobook+lcp
`LcpProtectedPdf` | application/pdf+lcp
`LcpLicenseDocument` | application/vnd.readium.lcp.license.v1.0+json
`LcpStatusDocument` | application/vnd.readium.license.status.v1.0+json
`Mp3` | audio/mpeg
`Mpeg` | video/mpeg
`Ogg` | audio/ogg
`Ogv` | video/ogg
`Opus` | audio/opus
`Otf` | font/otf
`Pdf` | application/pdf
`Png` | image/png
`Svg` | image/svg+xml
`Text` | text/plain
`Tiff` | image/tiff
`Ttf` | font/ttf
`Wav` | audio/wav
`WebmAudio` | audio/webm
`WebmVideo` | video/webm
`Webp` | image/webp
`WebPub` | application/webpub+zip
`WebPubManifest` | application/webpub+json
`Woff` | font/woff
`Woff2` | font/woff2
`Xhtml` | application/xhtml+xml
`Xml` | application/xml
`Zip` | application/zip


### `Format` Class

Instead of using directly a media type, we use a `Format` data class to identify a file format for several reasons:

* A format such as CBZ can be identified by several media types.
* It's a convenient way to pair a media type and its name and file extension.

#### Constructor

Note: all of the constructor parameters are exposed as read-only public properties.

* `Format(mediaType: MediaType, name: String, fileExtension: String)`
  * `mediaType: MediaType`
    * The canonical media type that identifies the best (most officially) this format.
    * This will be stored in the reading app's database, for example.
  * `name: String`
    * A human readable name describing the format.
    * Can be presented to the user.
  * `fileExtension: String`
    * The default file extension to use for this format.

#### Helpers

* `isManifest`, `isOpds`, `isHtml`, `isBitmap`...
  * Aliases to `mediaType.isX`

#### Constants

* `defaultSniffers: List<Sniffer>`
  * The default sniffers provided by Readium 2 to guess a `Format`.
  * This list is writable, to allow reading apps to register additional sniffers globally, or remove sniffers.

Formats used by Readium are represented as static constants (singletons) on `Format`, for convenience.
Reading apps are welcome to extend the static constants with additional formats.

Constant | Name | Extension | Media Type
-------- | ---- | --------- | ----------
`Audiobook` | Audiobook | audiobook | application/audiobook+zip
`AudiobookManifest` | Audiobook | json | application/audiobook+json
`Cbz` | Comic Book Archive | cbz | application/vnd.comicbook+zip
`DiViNa` | Digital Visual Narratives | divina | application/divina+zip
`DiViNaManifest` | Digital Visual Narratives | json | application/divina+json
`Epub` | EPUB | epub | application/epub+zip
`Html` | HTML | html | text/html
`Opds1Feed` | OPDS | atom | application/atom+xml;profile=opds-catalog
`Opds1Entry` | OPDS | atom | application/atom+xml;type=entry;profile=opds-catalog
`Opds2Feed` | OPDS | json | application/opds+json
`Opds2Publication` | OPDS | json | application/opds-publication+json
`LcpProtectedAudiobook` | LCP Protected Audiobook | lcpa | application/audiobook+lcp
`LcpProtectedPdf` | LCP Protected PDF | lcpdf | application/pdf+lcp
`LcpLicense` | LCP License | lcpl | application/vnd.readium.lcp.license.v1.0+json
`Pdf` | PDF | pdf | application/pdf
`WebPub` | Web Publication | webpub | application/webpub+zip
`WebPubManifest` | Web Publication | json | application/webpub+json
`Zab` | Zipped Audio Book | zab | application/vnd.zab+zip

#### Methods

* `==` (equality)
  * Returns whether two formats have the same `mediaType`.
* (static) `guess(path: String, fileExtensions: List<String> = [], mediaTypes: List<String> = [], sniffers: List<Sniffer> = defaultSniffers) -> Format?`
  * Guess a format from a local file path.
  * `path` Absolute path to the file.
  * (optional) `fileExtensions`
    * File extension hints to be used by the sniffers.
    * We can provide several from different sources as fallbacks, e.g. from a local path and a download URL.
  * (optional) `mediaTypes`
    * Media type hints to be used by the sniffers.
    * We can provide several from different sources as fallbacks, e.g. from a `Link.href`, from a `Content-Type` HTTP header or from a database.
  * (optional) `sniffers`
    * List of content sniffers used to determine the format.
    * A reading app can support additional formats by giving `Format.defaultSniffers + CustomSniffer()`.
* (static) `guess(bytes: () -> ByteArray, fileExtensions: List<String> = [], mediaTypes: List<String> = [], sniffers: List<Sniffer> = defaultSniffers) -> Format?`
  * Guess a format from bytes, e.g. from an HTTP response.
  * `bytes`
    * Closure lazy loading the bytes.
    * Since the formats might be guessed from the provided file extensions or media types, we don't want to do eager loading.

#### Usage

##### Determining the format of a remote file

```swift
let feedLink: Link
let response = httpClient.get(feedLink.href)

let format = Format.guess(
    bytes: { response.body },
    // We can give several media types and file extensions, as fallbacks.
    fileExtensions: [feedLink.href.pathExtension],
    mediaTypes: [response.headers["Content-Type"], feedLink.type]
)
```


### `Format.Sniffer` Function Type

Each supported `Format` must have at least one matching `Format.Sniffer` implementation to be recognized. A reading app supporting a custom publication format should provide its own sniffer implementation.

Sniffing a format is done in two rounds, because we want to give an opportunity to all sniffers to return a `Format` quickly before inspecting the content itself:

1. **Light Sniffing** checks only the provided file extension or media type hints.
2. **Heavy Sniffing** reads the bytes to perform more advanced sniffing.

#### Definition

* `Format.Sniffer = (context: Format.SnifferContext, inspectingContent: Bool) -> Format?`
  * `context` holds the file metadata and cached content, which are shared among the sniffers.
  * `inspectingContent` triggers a heavy sniffing when true.

### `Format.SnifferContext` Interface

A companion type of `Format.Sniffer` holding the type hints (file extensions, media types) and providing an access to the file content.

Example of concrete implementations:

* `Format.FileSnifferContext` provides access to a local file.
* `Format.BytesSnifferContext` provides access to a bytes array.
* `Format.MetadataSnifferContext` provides only the media type and file extension hints.

#### Properties

* `mediaTypes: List<String>` Media type hints.
* `fileExtensions: List<String>` File extension hints.
* (lazy) `contentAsString: String?` Content as plain text.
* (lazy) `contentAsJson: JsonObject?` Content as a JSON object.
* (lazy) `contentAsXml: XmlDocument?` Content as an XML document.
* (lazy) `contentAsZip:  ZipArchive?` Content as a ZIP archive.

#### Methods

* `stream() -> Stream?`
  * Raw bytes stream of the content.
  * A byte stream can be useful when sniffers only need to read a few bytes at the beginning or the end of the file.
* `close()`
  * Closes any opened file handles.
* `hasFileExtension(fileExtension: String) -> Bool`
  * Returns whether this context has the given file extension.
  * This will check the `fileExtensions` array, ignoring case.
* `hasMediaType(mediaType: String) -> Bool`, `hasMediaType(mediaType: MediaType) -> Bool`
  * Returns whether this context has the given media type.
  * This will check the `mediaTypes` array, ignoring case.
  * `MediaType` will be used for the comparison, to properly process parameters.

#### Usage

##### Supporting a custom format

```swift
let AcsmFormat = Format(
    mediaType: MediaType("application/vnd.adobe.adept+xml"),
    name: "ACSM",
    fileExtension: "acsm"
)
    
func sniffAcsm(context: Format.SnifferContext, inspectingContent: Bool) -> Format? {
    // First round of sniffing which should be fast: we check only the reported file
    // extensions and media types.
    if context.hasMediaType("application/vnd.adobe.adept+xml") || context.hasFileExtension("acsm") {
        return AcsmFormat
    }

    // Second round of sniffing occurs when no format could be determined. In this case,
    // we'll inspect the content of the file.
    if inspectingContent && context.contentAsXML?.documentNode.tag == "fulfillmentToken" {
        return AcsmFormat
    }

    return nil
}

let format = Format.guess(path: acsmPath, sniffers: Format.defaultSniffers + [sniffAcsm])
// or
let file = File(path: acsmPath, formatSniffers: Format.defaultSniffers + [sniffAcsm])
```


### `File` Class

Represents a local file, potentially downloaded from a remote source, e.g. for webpub.

`File` is a convenient data holder to share information about a local file between components – mainly between the reading app and the streamer. Since sniffing a format can be a costly operation, `File` acts as a cache by lazy loading the format when requested.

#### Constructor

* `File(path: String, sourceUrl: String? = null, mediaTypes: List<String> = [], formatSniffers: List<Format.Sniffer> = Format.defaultSniffers)`
  * `path` Path to the local file on the file system.
  * (optional) `sourceUrl` can be provided if the file was downloaded.
    * The streamer will use it to resolve remote hrefs.
  * (optional) `mediaTypes` Media type hints if they are known, to be used by the sniffers.
    * If the file was downloaded, this can be the `Content-Type` HTTP header, for example.
    * If it's a known file, provide a media type stored in the database for a quick sniffing.
  * (optional) `formatSniffers` Sniffers used to guess the file format.

#### Properties

* `path: String` Path to the local file on the disk
* `sourceUrl: String?` URL to the remote file, if it was downloaded
* (lazy) `format: Format?` is computed by the sniffers

#### Methods

* `move(destinationPath: String) -> File?`
  * Moves the file to the given destination path.
  * Returns a new `File` instance to the destination if the move succeeded, with the same cached format.
  * This will be used after downloading a publication that is not a webpub to a temporary folder, to move it to the bookshelf folder.
  * If we don't offer that, the reading app will have to create a new `File` object to provide to the streamer, losing the costly computed properties such as `Format`.

#### Usage

##### Importing a new publication in the bookshelf from a local file

```swift
let file = File(path: localPath)
// The streamer will use `file.format` to know which parser to use.
let publication = streamer.open(file)
// The reading app can use `file.format` as well to store additional information about the file.
bookshelfRepository.add(href: file.path, mediaType: file.format.mediaType.string)
```
 
##### Importing a publication from a URL

This will move the downloaded file to the bookshelf folder if it's a publication, or only save the URL in the database if it's a remote manifest.

```swift
// The streamer always expect a local path for the parsing, it's the responsibility of the
// reading app to download it, even for webpubs.
let path = httpClient.download(url)
var file = File(path: path, sourceUrl: url)

// If the file is not a remote manifest, we want to move the downloaded file to the bookshelf folder.
if !file.format.isManifest {
    file = file.move(bookshelfPath + path.filenameWithoutExtension + file.format.fileExtension)
}

// If it's a remote manifest, the streamer will use `file.sourceUrl` to determine the base URL of the `Link.href`s.
let publication = streamer.open(file)

// In the case of a remote manifest, the reading app will only store the source URL, and download the
// manifest again every time the user wants to open the publication
bookshelfRepository.add(
    href: file.format.isManifest ? url : file.path,
    mediaType: file.format.mediaType.string
)
```

### HTTP Response Extension

It's useful to be able to guess a format from an HTTP response. Therefore, implementations should provide when possible an extension to the native HTTP response type.

* `HttpResponse.guessFormat(fileExtensions: List<String> = [], mediaTypes: List<String> = [], sniffers: List<Sniffer> = Format.defaultSniffers): Format?`
  * (optional) `fileExtensions`
    * Additional file extension hints to be used by the sniffers.
  * (optional) `mediaTypes`
    * Additional media type hints to be used by the sniffers.
  * (optional) `sniffers`
    * List of content sniffers used to determine the format.

This extension will create a `Format.SnifferContext` using these informations:

* `fileExtensions`, in order:
  * the suggested filename extension, part of the HTTP header `Content-Disposition`,
  * the URL extension,
  * additional provided file extensions.
* `mediaTypes`, in order:
  * the value of the `Content-Type` HTTP header,
  * additional provided `mediaTypes`, for example to use the value of `Link.type`.
* `bytes`:
  * the response's body


## Sniffing Strategy

It's important to have consistent results across platforms, so we need to use the same sniffing strategy per format. While using the media types and file extensions is a common strategy, a given implementation can use additional sniffing mechanisms when natively provided. For example, on iOS we can use the UTI detection mechanism to sniff a media type from a file.

The sniffers order is paramount, because some formats are subsets of other formats:

1. HTML
2. OPDS 1 Feed
3. OPDS 1 Entry
4. OPDS 2 Feed
5. OPDS 2 Publication
6. LCP License Document
7. Audiobook Manifest (Readium)
8. DiViNa Manifest
9. Web Publication Manifest (Readium)
10. LCP Protected Audiobook
11. LCP Protected PDF
12. Audiobook (Readium)
13. DiViNa
14. Web Publication (Readium)
15. EPUB
16. CBZ
17. ZAB (Zipped Audio Book)
18. PDF

### Audiobook (Readium)

* Light:
  * extension is `audiobook`
  * media type is `application/audiobook+zip`
* Heavy:
  * it's a ZIP archive with a `manifest.json` entry, parsed as an RWPM with `metadata.@type == http://schema.org/Audiobook`

### Audiobook Manifest (Readium)

* Light:
  * media type is `application/audiobook+json`
* Heavy:
  * it's a JSON file, parsed as an RWPM with `metadata.@type == http://schema.org/Audiobook`

### CBZ

* Light:
  * extension is `cbz`
  * media type is `application/vnd.comicbook+zip`, `application/x-cbz` or `application/x-cbr`
* Heavy ([reference](https://wiki.mobileread.com/wiki/CBR_and_CBZ)):
  * it's a ZIP archive containing only entries with the given extensions: [`acbf`](https://wiki.mobileread.com/wiki/ACBF), `gif`, `jpeg`, `jpg`,`png`, `tiff`, `tif`, `webp` or `xml`
  * entries starting with a `.` and `Thumbs.db` are ignored

### DiViNa

* Light:
  * extension is `divina`
  * media type is `application/divina+zip`
* Heavy:
  * it's a ZIP archive with a `manifest.json` entry parsed as an RWPM, with a reading order containing only bitmap images – checked using `MediaType.isBitmap` on each `Link.type`

### DiViNa Manifest

* Light:
  * media type is `application/divina+json`
* Heavy:
  * it's a JSON file parsed as an RWPM, with a reading order containing only bitmap images – checked using `MediaType.isBitmap` on each `Link.type`

### EPUB

* Light:
  * extension is `epub`
  * media type is `application/epub+zip`
* Heavy:
  * it's a ZIP archive with a `META-INF/container.xml` entry

### HTML

* Light:
  * extension is `htm`, `html`, `xht` or `xhtml`
  * media type is `text/html` or `application/xhtml+xml`, checked using `MediaType.isHtml`
* Heavy:
  * it's an XML document with a `<html>` root node

### OPDS 1 Feed

* Light:
  * media type is `application/atom+xml;profile=opds-catalog`
* Heavy:
  * it's an XML document with a `<feed>` root node

### OPDS 1 Entry

* Light:
  * media type is `application/atom+xml;type=entry;profile=opds-catalog`
* Heavy:
  * it's an XML document with a `<entry>` root node

### OPDS 2 Feed

* Light:
  * media type is `application/opds+json`
* Heavy:
  * it's a JSON file parsed as an RWPM with a `Link` with `self` rel and `application/opds+json` type

### OPDS 2 Publication

* Light:
  * media type is `application/opds-publication+json`
* Heavy:
  * it's a JSON file parsed as an RWPM with at least one `Link` with a rel *starting with* `http://opds-spec.org/acquisition` 

### LCP Protected Audiobook

* Light:
  * extension is `lcpa`
  * media type is `application/audiobook+lcp`
* Heavy:
  * it's a ZIP archive with both:
    * a `license.lcpl` entry
    * a `manifest.json` entry, parsed as an RWPM with `metadata.@type == http://schema.org/Audiobook`

### LCP Protected PDF

* Light:
  * extension is `lcpdf`
  * media type is `application/pdf+lcp`
* Heavy:
  * it's a ZIP archive with both:
    * a `license.lcpl` entry
    * a `manifest.json` entry, parsed as an RWPM with a reading order containing only `Link` with `application/pdf` type

### LCP License Document

* Light:
  * extension is `lcpl`
  * media type is `application/vnd.readium.lcp.license.v1.0+json`
* Heavy:
  * it's a JSON object containing the following root keys: `id`, `issued`, `provider` and `encryption`

### PDF

* Light:
  * extension is `pdf`
  * media type is `application/pdf`
* Heavy:
  * content starts with `%PDF`

### Web Publication (Readium)

* Light:
  * extension is `webpub`
  * media type is `application/webpub+zip`
* Heavy:
  * it's a ZIP archive with a `manifest.json` entry parsed as an RWPM

### Web Publication Manifest (Readium)

* Light:
  * media type is `application/webpub+json`
* Heavy:
  * it's a JSON file, parsed as an RWPM containing one `Link` with `self` rel and `application/webpub+json` type

### ZAB (Zipped Audio Book)

* Light:
  * extension is `zab`
* Heavy:
  * it's a ZIP archive containing only entries with the given extensions:
    * (audio) `aac`, `aiff`, `alac`, `flac`, `m4a`, `m4b`, `mp3`, `ogg`, `oga`, `mogg`, `opus`, `wav` or `webm`
    * (playlist) `asx`, `bio`, `m3u`, `m3u8`, `pla`, `pls`, `smil`, `vlc`, `wpl`, `xspf` or `zpl`
  * entries starting with a `.` and `Thumbs.db` are ignored
