# Media Type

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Review PR: [#127](https://github.com/readium/architecture/pull/127)
* Related Issues:
  * [Model for the Publication's format/type (architecture/112)](https://github.com/readium/architecture/issues/112)
  * [Media types of Readium publications (architecture/121)](https://github.com/readium/architecture/issues/121)


## Summary

This proposal introduces a dedicated API to easily figure out a file format.

While a `Publication` is independent of any particular format, knowing the format of a publication
file is necessary to:

* determine the publication parser to use,
* group or search publications by file type in the user's bookshelf.

This API is not tied to `Publication`, so it can be used as a general purpose tool to guess a file
format, e.g. during HTTP requests or in the LCP library.


## Developer Guide

You can use the Media Type API every time you need to figure out the format of a file or bytes.

To use this API efficiently, you should:

* Never sniff a media type from the UI thread, since it might perform IO operations. A warning will
  be logged if you do.
* Provide file extension and media type hints when possible. If the sniffers manage to resolve a
  media type from these hints, then the content won't be read.


### Sniffing the Media Type of Raw Bytes

You can use directly `MediaType.of()` for sniffing raw bytes (e.g. the body of an HTTP response). It
will take a closure returning the bytes lazily.

```swift
let feedLink: Link
let response = httpClient.get(feedLink.href)

let mediaType = MediaType.of(
    bytes: { response.body },
    // You can give several file extension and media type hints, which will be sniffed in order.
    fileExtensions: [feedLink.href.pathExtension],
    mediaTypes: [response.headers["Content-Type"], feedLink.type]
)
```

In the case of an HTTP response, this can be simplified by using the `HTTPResponse.sniffMediaType()`
extension:

```swift
let feedLink: Link
let response = httpClient.get(feedLink.href)

let mediaType = response.sniffMediaType(mediaTypes: [feedLink.type])
```

### Sniffing the Media Type of a File

For local files, you can provide an absolute path to `MediaType.of()`. To improve sniffing speed,
you should also provide a media type hint if possible – for example if you previously stored it in a
database.

```swift
let dbBook = database.get(bookId)

let mediaType = MediaType.of(
    path: dbBook.path,
    mediaTypes: [dbBook.mediaType]
)
```

### Supporting a Custom Media Type

Reading apps are welcome to extend this API with their own media types. To declare a custom media
type, you need to:

1. Create a `MediaType` constant, optionally in the `MediaType.` namespace.
2. Create a sniffer function to recognize your media type from a `MediaType.SnifferContext`.
3. Then, either:
    1. add your sniffer to the `MediaType.sniffers` shared list to be used globally,
    2. or use your sniffer on a case-by-case basis, by passing it to the `sniffers` argument of
       `MediaType.of()`.

Here's an example with Adobe's ACSM media type.

```swift
// 1. Create the `MediaType` instance.
private let acsmMediaType = MediaType(
    "application/vnd.adobe.adept+xml",
    name: "Adobe Content Server Manager",
    fileExtension: "acsm"
)

extension MediaType {
    static var ACSM: MediaType { acsmMediaType }
}

// 2. Create the sniffer function.
func sniffACSM(context: MediaType.SnifferContext) -> MediaType? {
    if
        context.hasMediaType("application/vnd.adobe.adept+xml") ||
        context.hasFileExtension("acsm") ||
        context.contentAsXML?.documentElement?.localName == "fulfillmentToken"
    { 
        return MediaType.ACSM
    }

    return nil
}

// 3.1. Declare the sniffer globally.
MediaType.sniffers.add(sniffACSM)
let mediaType = MediaType.of(path: acsmPath)

// 3.2. Or use the sniffer on a case-by-case basis. 
let mediaType = MediaType.of(path: acsmPath, sniffers: MediaType.sniffers + [sniffACSM])
```

## Reference Guide

File formats are represented by `MediaType` instances, which can be used to get the file
extension, name and media type string.

However, some formats can be identified by several media type aliases, for example CBZ has for
canonical type `application/vnd.comicbook+zip` but has an historical alias `application/x-cbz`. In
this case, you should only store the canonical type in a database. You can resolve the canonical
version of a known media type using `mediaType.canonicalized`.

All Readium APIs already return canonical media types, so this is useful only if you
create your own `MediaType` from strings.

```swift
let fileExtension = MediaType("text/plain")?.canonicalized.fileExtension
```

Sniffers are functions with the type `MediaType.Sniffer` whose job is to resolve a `MediaType` from
bytes or metadata. Each supported `MediaType` must have at least one matching sniffer to be
recognized. Therefore, a reading app should provide its own sniffers to support custom publication
formats.


### `MediaType` class

Represents a document format, identified by a unique RFC 6838 media type.

`MediaType` handles:

* components parsing – eg. type, subtype and parameters,
* media types comparison.

Comparing media types is more complicated than it looks, [since they can contain
parameters](https://tools.ietf.org/html/rfc6838) such as `charset=utf-8`. We can't ignore them
because some formats use parameters in their media type, for example
`application/atom+xml;profile=opds-catalog` for an OPDS 1 catalog.

#### Constructor

* `MediaType(string: String, name: String? = null, fileExtension: String? = null)`
  * Creates a `MediaType` from its string representation and an optional name and file extension.

#### Properties

* `string: String` (or `toString()` if more idiomatic).
  * The string representation of this media type.
    * Type, subtype and parameter names are lowercased.
    * Parameter values keep their original case, except for the `charset` parameter, which is uppercased.
    * Parameters are ordered alphabetically.
    * No spaces between parameters.
* `name: String?`
  * A human readable name identifying the media type, which may be presented to the user.
* `fileExtension: String?`
  * The default file extension to use for this media type.
* `type: String`
  * The type component, e.g. `application` in `application/epub+zip`.
* `subtype: String`
  * The subtype component, e.g. `epub+zip` in `application/epub+zip`.
* `parameters: Map<String, String>`
  * The parameters in the media type, such as `charset=utf-8`.
* `structuredSyntaxSuffix: String?`
  * Structured syntax suffix, e.g. `+zip` in `application/epub+zip`
  * Gives a hint about the underlying structure of this media type.
  * i.e. https://tools.ietf.org/html/rfc6838#section-4.2.8
* `encoding: Encoding?`
  * Encoding as declared in the `charset` parameter, if there's any.
  * Uses the standard `Encoding` type provided by the platform, for convenience.
* `canonicalized: MediaType`
  * Returns the canonical version of the media type, if it is known.
  * This is useful to find the name and file extension of a known media type, or to get the
    canonical media type from an alias. For example, `application/x-cbz` is an alias of the
    canonical `application/vnd.comicbook+zip`.
  * Non-significant parameters are also discarded.
  * Equivalent to `MediaType.of(string) || this`.

#### Methods

* `contains(other: MediaType) -> Boolean`, `contains(other: String) -> Boolean`
  * Returns whether the provided `other` media type is included in this media type.
  * For example, `text/html` contains `text/html;charset=utf-8`.
  * `other` must match the parameters in the `parameters` property, but extra parameters are ignored. 
  * Parameters order is ignored. 
  * Wildcards are supported, meaning that `image/*` contains `image/png` and `*/*` contains everything.
* `matches(other: MediaType) -> Boolean`, `matches(other: String) -> Boolean`
  * Returns whether this media type and `other` are the same, ignoring parameters that are not in both media types.
  * For example, `text/html` matches `text/html;charset=utf-8`, but `text/html;charset=ascii`
    doesn't. This is basically like `contains`, but working in both directions.
* `==` (equality)
  * Returns whether two media types are equal, checking the type, subtype and parameters.
  * Parameters order is ignored.
* (static) `of(mediaTypes: List<String> = [], fileExtensions: List<String> = [], sniffers: List<Sniffer> = MediaType.sniffers) -> MediaType?`
  * Resolves a media type from file extension and media type hints, without checking the actual content.
  * (optional) `mediaTypes: List<String> = []`
    * Media type hints to be used by the sniffers.
    * We can provide several from different sources as fallbacks, e.g. from a `Link.type`, from a `Content-Type` HTTP header or from a database.
  * (optional) `fileExtensions: List<String> = []`
    * File extension hints to be used by the sniffers.
    * We can provide several from different sources as fallbacks, e.g. from a local path and a download URL.
  * (optional) `sniffers: List<Sniffer> = MediaType.sniffers`
    * List of content sniffers used to determine the media type.
    * A reading app can support additional media types by giving `MediaType.sniffers + [customSniffer]`.
* (static) `ofFile(file: String, mediaTypes: List<String> = [], fileExtensions: List<String> = [], sniffers: List<Sniffer> = MediaType.sniffers) -> MediaType?`
  * Resolves a media type from a local file path.
  * **Warning:** This API should never be called from the UI thread. A warning will be logged if it is.
  * `file: String`
    * Absolute path to the file.
* (static) `ofBytes(bytes: () -> ByteArray, mediaTypes: List<String> = [], fileExtensions: List<String> = [], sniffers: List<Sniffer> = MediaType.sniffers) -> MediaType?`
  * Resolves a media type from bytes, e.g. from an HTTP response.
  * **Warning:** This API should never be called from the UI thread. A warning will be logged if it is.
  * `bytes: () -> ByteArray`
    * Closure lazy-loading the bytes.
    * Since the media types might be guessed from the provided file extensions or media types, we don't want to do eager loading, hence the closure.

#### Helpers

Computed properties for convenience. More can be added as needed.

* `isZIP: Boolean`
  * Returns whether this media type is structured as a ZIP archive.
* `isJSON: Boolean`
  * Returns whether this media type is structured as a JSON file.
* `isOPDS: Boolean`
  * Returns whether this media type is contained by `OPDS1`, `OPDS1Entry`, `OPDS2`
    or `OPDS2Publication`.
  * Used to determine the type of remote catalogs.
* `isHTML: Boolean`
  * Returns whether this media type is contained by `HTML` or `XHTML`.
  * Used to determine the type of remote catalogs.
* `isBitmap: Boolean`
  * Returns whether this media type is a bitmap image, so excluding SVG and other vectorial formats.
    It must be contained by `BMP`, `GIF`, `JPEG`, `PNG`, `TIFF` or `WebP`.
  * Used to determine if a RWPM is a DiViNa publication.
* `isAudio: Boolean`
  * Returns whether this media type is of an audio clip.
  * Used to determine if a RWPM is an Audiobook publication.
* `isPublication: Boolean`
  * Returns whether this media type is of a publication file.

#### `Link` Helpers

* `mediaType: MediaType`
  * Media type of the linked resource.
  * Falls back on `application/octet-stream` if the type can't be determined.
  * Equivalent to `MediaType.of(link.type) ?? MediaType.binary`.

#### Constants

* (static, writable) `sniffers: List<Sniffer>`
  * The default sniffers provided by Readium 2 to resolve a `MediaType`.
  * This list is writable, to allow reading apps to register additional sniffers globally, or remove sniffers.

Static constants are provided in `MediaType` for well known media types. These are `MediaType`
instances, not `String`.

| Constant                   | Media Type                                           | Extension | Name                         |
|----------------------------|------------------------------------------------------|-----------|------------------------------|
| `AAC`                      | audio/aac                                            | aac       |                              |
| `ACSM`                     | application/vnd.adobe.adept+xml                      | acsm      | Adobe Content Server Message |
| `AIFF`                     | audio/aiff                                           | aiff      |                              |
| `AVI`                      | video/x-msvideo                                      | avi       |                              |
| `Binary`                   | application/octet-stream                             |           |                              |
| `BMP`                      | image/bmp                                            | bmp       |                              |
| `CBZ`                      | application/vnd.comicbook+zip                        | cbz       | Comic Book Archive           |
| `CSS`                      | text/css                                             | css       |                              |
| `DiViNa`                   | application/divina+zip                               | divina    | Digital Visual Narratives    |
| `DiViNaManifest`           | application/divina+json                              | json      | Digital Visual Narratives    |
| `EPUB`                     | application/epub+zip                                 | epub      | EPUB                         |
| `GIF`                      | image/gif                                            | gif       |                              |
| `GZ`                       | application/gzip                                     | gz        |                              |
| `JavaScript`               | text/javascript                                      | js        |                              |
| `JPEG`                     | image/jpeg                                           | jpeg      |                              |
| `HTML`                     | text/html                                            | html      |                              |
| `JSON`                     | application/json                                     | json      |                              |
| `LCPProtectedAudiobook`    | application/audiobook+lcp                            | lcpa      | LCP Protected Audiobook      |
| `LCPProtectedPDF`          | application/pdf+lcp                                  | lcpdf     | LCP Protected PDF            |
| `LCPLicenseDocument`       | application/vnd.readium.lcp.license.v1.0+json        | lcpl      | LCP License                  |
| `LCPStatusDocument`        | application/vnd.readium.license.status.v1.0+json     |           |                              |
| `LPF`                      | application/lpf+zip                                  | lpf       |                              |
| `MP3`                      | audio/mpeg                                           | mp3       |                              |
| `MPEG`                     | video/mpeg                                           | mpeg      |                              |
| `NCX`                      | application/x-dtbncx+xml                             | ncx       |                              |
| `Ogg`                      | audio/ogg                                            | oga       |                              |
| `Ogv`                      | video/ogg                                            | ogv       |                              |
| `Opus`                     | audio/opus                                           | opus      |                              |
| `OPDS1`                    | application/atom+xml;profile=opds-catalog            |           |                              |
| `OPDS1Entry`               | application/atom+xml;type=entry;profile=opds-catalog |           |                              |
| `OPDS2`                    | application/opds+json                                |           |                              |
| `OPDS2Publication`         | application/opds-publication+json                    |           |                              |
| `OPDSAuthentication`       | application/opds-authentication+json                 |           |                              |
| `OTF`                      | font/otf                                             | otf       |                              |
| `PDF`                      | application/pdf                                      | pdf       | PDF                          |
| `PNG`                      | image/png                                            | png       |                              |
| `ReadiumAudiobook`         | application/audiobook+zip                            | audiobook | Readium Audiobook            |
| `ReadiumAudiobookManifest` | application/audiobook+json                           | json      | Readium Audiobook            |
| `ReadiumWebPub`            | application/webpub+zip                               | webpub    | Readium Web Publication      |
| `ReadiumWebPubManifest`    | application/webpub+json                              | json      | Readium Web Publication      |
| `SMIL`                     | application/smil+xml                                 | smil      |                              |
| `SVG`                      | image/svg+xml                                        | svg       |                              |
| `Text`                     | text/plain                                           | txt       |                              |
| `TIFF`                     | image/tiff                                           | tiff      |                              |
| `TTF`                      | font/ttf                                             | ttf       |                              |
| `W3CWPUBManifest`          | (*non-existent*) application/x.readium.w3c.wpub+json | json      | Web Publication              |
| `WAV`                      | audio/wav                                            | wav       |                              |
| `WebMAudio`                | audio/webm                                           | webm      |                              |
| `WebMVideo`                | video/webm                                           | webm      |                              |
| `WebP`                     | image/webp                                           | webp      |                              |
| `WOFF`                     | font/woff                                            | woff      |                              |
| `WOFF2`                    | font/woff2                                           | woff2     |                              |
| `XHTML`                    | application/xhtml+xml                                | xhtml     |                              |
| `XML`                      | application/xml                                      | xml       |                              |
| `ZAB`                      | (*non-existent*) application/x.readium.zab+zip       | zab       | Zipped Audio Book            |
| `ZIP`                      | application/zip                                      | zip       |                              |

### `MediaType.Sniffer` Function Type

Determines if the provided content matches a known media type.

#### Definition

* `MediaType.Sniffer = (context: MediaType.SnifferContext) -> MediaType?`
  * `context` holds the file metadata and cached content, which are shared among the sniffers.

### `MediaType.SnifferContext` Interface

A companion type of `MediaType.Sniffer` holding the type hints (file extensions, types) and providing an access to the file content.

Examples of concrete implementations:

* `MediaType.FileSnifferContext` to sniff a local file.
* `MediaType.BytesSnifferContext` to sniff a bytes array.
* `MediaType.MetadataSnifferContext` to sniff only the media type and file extension hints.

#### Properties

* (private) `mediaTypes: List<String>`
  * Media type hints.
* (private) `fileExtensions: List<String>`
  * File extension hints.
* `encoding: Encoding?`
  * Finds the first `Encoding` declared in the media types' `charset` parameter.
  * Uses the standard `Encoding` type provided by the platform, for convenience.
* (lazy) `contentAsString: String?`
  * Content as plain text.
  * If needed, extract the `charset` parameter from the media type hints to figure out an encoding. Otherwise, fallback on UTF-8.
* (lazy) `contentAsXML: XMLDocument?`
  * Content as an XML document.
* (lazy) `contentAsArchive:  Archive?`
  * Content as an archive (e.g. ZIP or exploded directory).
* (lazy) `contentAsJSON: JSONObject?`
  * Content as a JSON object.
* (lazy) `contentAsRWPM: Publication?`
  * Publication parsed from the content.

#### Methods

* `hasFileExtension(fileExtensions: String...) -> Boolean`
  * Returns whether this context has any of the given file extensions, ignoring case.
  * This will check the `fileExtensions` array.
* `hasMediaType(mediaTypes: String...) -> Boolean`, `hasMediaType(mediaTypes: MediaType...) -> Boolean`
  * Returns whether this context has any of the given media type, ignoring case and extra parameters.
  * This will check the `mediaTypes` array, using `MediaType` to handle the comparison.
* `stream() -> Stream?`
  * Raw bytes stream of the content.
  * A byte stream can be useful when sniffers only need to read a few bytes at the beginning of the file.
* `readFileSignature(length: Int, encoding: Encoding = UTF-8) -> String?`
  * Reads the file signature, aka magic number, at the beginning of the content, up to `length` bytes.
  * See https://en.wikipedia.org/wiki/List_of_file_signatures
* `close()`
  * Closes any opened file handles.

### HTTP Response Extension

It's useful to be able to resolve a format from an HTTP response. Therefore, implementations should
provide when possible an extension to the native HTTP response type.

* `HTTPResponse.sniffMediaType(mediaTypes: List<String> = [], fileExtensions: List<String> = [], sniffers: List<Sniffer> = MediaType.sniffers): MediaType?`
  * (optional) `mediaTypes`
    * Additional media type hints to be used by the sniffers.
  * (optional) `fileExtensions`
    * Additional file extension hints to be used by the sniffers.
  * (optional) `sniffers`
    * List of content sniffers used to determine the format.

This extension will create a `MediaType.BytesSnifferContext` using these informations:

* `mediaTypes`, in order:
  * the value of the `Content-Type` HTTP header,
  * additional provided `mediaTypes`, for example to use the value of `Link.type`.
* `fileExtensions`, in order:
  * the suggested filename extension, part of the HTTP header `Content-Disposition`,
  * the URL extension,
  * additional provided file extensions.
* `bytes`: the response's body


### Sniffing Strategy

It's important to have consistent results across platforms, so we need to use the same sniffing
strategy.

Sniffing a format is done in two rounds, because we want to give an opportunity to all sniffers to
return a `MediaType` quickly before inspecting the content itself:

1. **Light Sniffing** checks only the provided file extension or media type hints.
2. **Heavy Sniffing** reads the bytes to perform more advanced sniffing.

To do that, `MediaType.of()` will iterate over all the sniffers twice, first with a
`MediaType.SnifferContext` containing only extensions and media types, and the second time with a
context containing the content, if available.

#### Default Sniffers

Sniffers can encapsulate the detection of several media types to factorize similar detection logic.
For example, the following sniffers were identified. The sniffers order is important, because some
formats are subsets of others.

1. HTML
2. OPDS 1
3. OPDS 2
4. LCP License Document
5. Bitmap (BMP, GIF, JPEG, PNG, TIFF and WebP)
6. Readium Web Publication (WebPub, Audiobook, DiViNa, RWPM, LCPA and LCPDF)
7. W3C Web Publication
8. EPUB
9. LPF
10. Free-form ZIP (CBZ and ZAB)
11. PDF

In the case of bitmap formats, the default Readium sniffers don't perform any heavy sniffing,
because we only need to detect these formats using file extensions in ZIP entries or media types in
a manifest. If needed, a reading app could add additional sniffers doing heavy sniffing of bitmap
files.

#### Media Types

##### Audiobook (Readium)

* Light:
  * extension is `audiobook`
  * media type is `application/audiobook+zip`
* Heavy:
  * it's a ZIP archive with a `manifest.json` entry, parsed as an RWPM with either:
    * `metadata.@type == http://schema.org/Audiobook`, or
    * a reading order containing only `Link` with an audio type, checked with `MediaType::isAudio`

##### Audiobook Manifest (Readium)

* Light:
  * media type is `application/audiobook+json`
* Heavy:
  * it's a JSON file, parsed as an RWPM with either:
    * `metadata.@type == http://schema.org/Audiobook`, or
    * a reading order containing only `Link` with an audio type, checked with `MediaType::isAudio`

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

##### OPDS Authentication Document

* Light:
  * media type is `application/opds-authentication+json` or `application/vnd.opds.authentication.v1.0+json`
* Heavy:
  * it's a JSON file containing the following root keys: `id`, `title` and `authentication`

##### LCP Protected Audiobook

* Light:
  * extension is `lcpa`
  * media type is `application/audiobook+lcp`
* Heavy:
  * it's a ZIP archive with both:
    * a `license.lcpl` entry
    * a `manifest.json` entry, parsed as an RWPM with either:
      * `metadata.@type == http://schema.org/Audiobook`, or
      * a reading order containing only `Link` with an audio type, checked with `MediaType::isAudio`

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

