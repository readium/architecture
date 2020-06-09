# Publication Helpers and Services

* Authors: [Hadrien Gardeur](https://github.com/HadrienGardeur), [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Related Issues:
  * [#119 Adding helpers to the Publication](https://github.com/readium/architecture/issues/119)


## Summary

Our goal is to improve extensibility and customizability of the `Publication` type for reading apps. To achieve that, this proposal introduces two structured ways to extend a `Publication` with additional features: *helpers* and *services*.


## Motivation

### Computed Metadata

Readium components need to make decisions based on the metadata available in the `Publication`, which sometimes involves computing additional data. For example, it wouldn't make sense to show the font size setting for a full fixed-layout EPUB publication, so a `Publication::allReadingOrderIsFixedLayout` helper is useful.

These computed metadata are not part of [the core models specification](https://readium.org/webpub-manifest/), so they should be added as extensions. Reading apps should be able to inject additional helpers to address custom needs.

[RWPM extensions](https://readium.org/webpub-manifest/#8-extensibility) are already [implemented as helpers](https://github.com/readium/r2-shared-kotlin/blob/100914de22bbb8a8a95b7a718fffd32830d89396/r2-shared/src/main/java/org/readium/r2/shared/publication/presentation/Properties.kt) in the mobile toolkits, by converting JSON values to type-safe data structures.

### Swappable Implementations

For more complex and opiniated APIs, it would be useful to allow reading apps to swap Readium default implementations with their own. For example, calculating the [list of positions](https://github.com/readium/architecture/tree/master/models/locators/positions) can be done in [many different ways](https://github.com/readium/architecture/issues/123), and depends on the publication format.

By using a set of specified interfaces as contracts, we can have different Readium components use these services without caring for the concrete implementation.


## Developer Guide

The `Publication` shared models support extensibility through two structured ways: *helpers* and *services*.

* **Helpers are *internal* extensions**. They have a single implementation which is statically defined in the shared models.
* **Services are *external* extensions**. Other Readium components provide implementations, which are swappable and injected dynamically into the `Publication` object

### Publication Helpers

A *helper* extends the shared models by computing additional metadata when requested, such as:

  * `Presentation::layoutOf(Link)` returns the EPUB layout of a resource based on both publication and resource-level properties.
  * `List<Link>::allAreAudio` returns whether the collection of links contains only audio resources. When applied on `readingOrder`, it can be used to determine if the publication can be treated as an audiobook.

They are simple syntactic constructs, using the capabilities of each language, for example:

```swift
// Swift
extension Array where Element == Link {

    var allAreAudio: Bool {
        allSatisfy { $0.mediaType?.isAudio == true }
    }

}
```

```kotlin
// Kotlin
val List<Link>.allAreAudio: Boolean get() = all {
    it.mediaType?.isAudio ?: false
}
```

```javascript
// JavaScript
LinkArray.prototype.allAreAudio() = function() {
  return this.every(link => link.mediaType.isAudio())
};
```

#### Memoization

A *helper* could perform an expensive computation that might be called repeatedly. In which case, you can improve performances by storing the lazy-loaded result in a cache using `Publication::cache()`. Caching is only available for helpers on the `Publication` type, not for other models.

```swift
extension Publication {

    // https://github.com/kobolabs/epub-spec#image-based-fxl-reader
    var isImageBasedFXL: Bool {
        cache("isImageBasedFXL") {
            // Perform heavy computation...
        }
    }

}
```

### Publication Services

A *service* is a contract between Readium components, defined as an interface with swappable implementations stored in the `Publication` object, such as:

* [`Positions`](https://github.com/readium/architecture/tree/master/models/locators/positions) which splits a publication to provide a list of sequential locations.
* `Search` which provides a way to search a publication's content.

While the known service interfaces are defined in `r2-shared`, their implementations are usually provided by other components, such as `r2-streamer` or the reading app itself.

Publication services are a point of customizability for reading apps, because you can swap a default implementation with your own, or decorate it to add cross-cutting concerns. A reading app can also add custom service interfaces for internal needs.

#### Getting a Service Instance

The `Publication` object holds a list of service instances, ordered by the factories given during construction. To get an instance of a service, you can use `Publication::findService<S>()`, which will return the first service implementing the interface `S`. 
However, you rarely need to access directly a service instance, since a service interface usually also defines helpers on `Publication` for convenience.

For example, the `PositionsService` declares the helper property `Publication::positions` to directly access the list of positions.

#### Consuming a Service on the Web

Some publication services expose a web version of their API, to be consumed for example by a JavaScript app or a remote client. In which case, you can retrieve the WS routes from `Publication::links`, using the WS custom media types or link relations. Then, the response can be fetched using `Publication::get()`, optionally exposed through an HTTP server.

If the web service takes parameters, then its `Link` object will be templated.

The media types, formats and parameters depend on the specification of each publication service.

```javascript
let searchLink = publication.links.find(link => (link.type == "application/vnd.readium.search+json"))
// searchLink == Link(
//   href: "/~readium/search{?text}",
//   type: "application/vnd.readium.search+json",
//   templated: true
// )

if (searchLink) {
  // `results` is a JSON collection of Locator objects.
  let results = await publication.get(searchLink, {"text": ""}).readAsString()
}
```

#### Creating a New Service

To create your own service, you must declare:

* An interface inheriting from `Publication.Service`.
* At least one factory per concrete implementation of your service, with the type signature `Publication.Service.Factory`.

You should also provide *helpers* on `Publication` for a more convenient access to your service API, with fallbacks if no instances of your service is attached to the `Publication`.

Here's an example for `PositionsService`:

```kotlin
// The service contract.
interface PositionsService : Publication.Service {
    
    val positions: List<Locator>
    
}

// Defines a convenient `publication.positions` helper with a fallback value.
val Publication.positions: List<Locator> get() {
    val service = findService<PositionsService>()
    return service?.positions ?: emptyList()
}


// A concrete implementation of the service.
class EPUBPositionsService(val readingOrder: List<Link>, val fetcher: Fetcher) : PositionsService {
    
    override val positions: List<Locator> by lazy {
        // Lazily computes the position list...
    }
    
    companion object {
        
        // The service factory.
        fun create(context: Publication.Service.Context): EPUBPositionsService {
            return EPUBPositionsService(context.manifest.readingOrder, context.fetcher)
        }
        
    }
}

val publication = Publication(manifest, fetcher, serviceFactories = listOf(
    (EPUBPositionsService)::create
))
```

### Backward Compatibility and Migration

#### Mobile (Swift and Kotlin)

If you were providing your own implementation of the `PositionListFactory`, you will have to adapt it to use `PositionsService` instead.

The `Publication` models are not yet immutable in the Swift toolkit, which is required for this proposal to work properly. Since reading apps usually don't create or modify a `Publication`, this should have a minimal impact.


## Reference Guide

Helpers and services rely on the fact that a `Publication` is immutable. If that was not the case, then the cached lazy-loaded values could become invalid.

### Publication Helpers

If a helper performs an expensive task, a warning should be logged if it is called from the UI thread. This is typically the case for helpers accessing resources from the `Fetcher`.

#### `Publication` Additions

##### Methods

* `cache<T>(key: String? = null, variant: String? = null, compute: () -> T?) -> T?`
  * Executes the given computation and caches its result for next calls.
  * `key: String? = null`
    * Unique key identifying the cached value.
    * (Depends on the language) If `null`, the function name of the caller will be used as the key, for convenience.
  * `variant: String? = null`
    * A variant used to cache different values for the same caller. For example, it can be the parameters given to the computation.
  * Returns the cached value or the result of `compute()`.
  * [A proof-of-concept Swift implementation is described in this issue.](https://github.com/readium/architecture/issues/119#issuecomment-601302065)

### Publication Services

#### `Publication.Service` Interface

Base interface to be inherited by all publication services.

##### Properties

* (optional) `links: List<Link>`
  * Links which will be added to `Publication::links`.
  * It can be used to expose a web API for the service, through `Publication::get()`.
  * To disambiguate the `href` with a publication's local resources, you **should** use the prefix `/~readium/`.
  * A custom media type or rel should be used to identify the service.
  * You can use a templated URI to accept query parameters.
  * e.g. `Link(href: "/~readium/search{?text}", type: "application/vnd.readium.search+json", templated: true)`

##### Methods

* (optional) `get(link: Link) -> Resource?`
  * Called by `Publication::get()` for each request. A service can return a `Resource` to:
    * respond to a request to its web API declared in `links`,
    * serve additional resources on behalf of the publication,
    * replace a publication resource by its own version.
  * Returns the `Resource` containing the response, or `null` if the service doesn't recognize this request.
* (optional) `close()`
  * Closes any opened file handles, removes temporary files, etc.
  * This is called by `Publication::close()`.

##### Copy and Factory

Since a service might cache values computed from the current manifest and fetcher, we can't reuse its instance when copying the `Publication` object. To circumvent this issue, the `Publication` is given service factories, which will be forwarded to its copies. During the construction of a `Publication` object, the provided factories are used to create the service instances.

```kotlin
typealias Publication.Service.Factory = (Publication.Service.Context) -> Publication.Service?

class Publication.Service.Context {
    val manifest: Manifest,
    val fetcher: Fetcher
}
```

A `Publication.Service.Context` is used instead of passing directly the arguments, to be able to add more parameters later on without modifying all the existing service factories.

#### `Publication` Additions

##### Methods

* `findService<T: Publication.Service>(): T?`
  * Returns the first publication service implementing the interface `T`.


## Rationale and Alternatives

Two alternatives to extend `Publication` were considered: composition and inheritance.

### Decorating `Publication`

This doesn't require any change in the Readium toolkit. With this technique, the reading app creates a new type that will embed and proxy the `Publication` object, while adding more features.

While this solution is easy to implement, it doesn't allow customizing the behavior of Readium since other components are expecting a `Publication` object. 

### Subclassing `Publication`

We could allow the reading app to provide its own `Publication` subclass to the parsers. In this case, the reading app could override:

* `Publication::get()` to serve custom resources and web services,
* the default services exposed by Readium, for example `Publication::positions` 

Subclassing `Publication` might look more straightforward, but it could transform `Publication` into a bulky [god object](https://en.wikipedia.org/wiki/God_object). The solution introduced in this proposal has the advantage of offering a clear structure to encapsulate different services, and the possibility of swapping service implementations easily – e.g. the positions are computed differently for each publication format.


## Drawbacks and Limitations

* This proposal requires the `Publication` shared models to be immutable to work properly. Otherwise, we might end up with invalid lazy-cached values. While this is a limitation, having immutable models is generally considered safer.
* The publication helpers are added directly on the shared model types, which means that they are always available. This is convenient, but also means that we can have a `Publication` with irrelevant helpers. For example, `Properties.price` is always accessible, but only makes sense for an OPDS publication.
* The caching feature is exposed publicly in `Publication`, which means that reading apps could store arbitrary values in the `Publication` cache. While this could be abused, this could also be seen as a useful feature to have.


## Future Possibilities

Specifying new publication services and helpers should become a natural part of future proposals related to the `Publication` models.

### Transforming a Web Service into a Native Publication Service

We could encounter web publications served by a remote HTTP Streamer providing web services, such as a [positions list](https://github.com/readium/architecture/tree/master/models/locators/positions#manifest). In which case, a native toolkit might provide a "reverse" `HTTPPositionsService` implementation which will fetch the positions from the web service and convert them to in-memory `Locator` models.

### Persisting Cache

The caching solution introduced in this proposal to cache expensive computed helpers is only stored in memory. However, it could be useful to have a cache that is persisted across sessions, to avoid recomputing the values every time we open the publication. This persisted cache would also be useful for publication services.

Here are a few examples of values which could be useful to persist across sessions:

* the positions list, when it's expensive to compute (e.g. LCPDF)
* the duration of audio files in an audiobook, when they are not provided in the manifest
* thumbnails generated from resources

### Future Helpers?

* [Can I extract images for all resources](https://github.com/kobolabs/epub-spec#image-based-fxl-reader) in `readingOrder` from a full FXL publication?
* Is it a multi-lingual publication where [all or most resources have an equivalent in another language](https://readium.org/webpub-manifest/extensions/divina#3-alternate-resources) and if so, which languages are available?
* Which formats/bitrates/resolutions are available for an image-based/audio/video publication?

### Future Services?

* `SearchService` to search through a publication's content.
* `RightsService` to manage the rights consumption and loans.
* `ThumbnailsService` to generate and cache thumbnails for each resource/page in an EPUB FXL or DiViNa.
* `SynchronizedNarrationService` to convert SMIL resources to the W3C Synchronized Narration document.
* `ReferenceService` to generate an index or glossary, or something akin to [Amazon X-Ray for Kindle](https://kdp.amazon.com/en_US/help/topic/G202187230).
* `ReflowService` to generate a reflowable view of fixed resources such as EPUB FXL or PDF.
* `UpdateService` to update a publication file from a remote server.
* `PackageService` to download and package a web publication to the file system.


## Appendix A: Services Provided by Readium

### `PositionsService`

Provides a list of discrete locations in the publication, no matter what the original format is.

This service is described in more details [in this specification](https://github.com/readium/architecture/tree/master/models/locators/positions). 

#### Properties

* (lazy) `positionsByReadingOrder: List<List<Locator>>`
  * List of all the positions in the publication, grouped by the resource reading order index.
* (lazy) `positions: List<Locator>`
  * List of all the positions in the publication.
  * Automatically derived from `positionsByReadingOrder`, if not implemented.

#### `Publication` Helpers

* `positionsByReadingOrder: List<Locator> = findService<PositionsService>()?.positionsByReadingOrder ?: []`
* `positions: List<Locator> = findService<PositionsService>()?.positions ?: []`

#### Web Service

`PositionsService` exposes the positions list as a web service.

It provides a default implementation to avoid rewriting the JSON conversion for all concrete implementations of `PositionsService`.

```kotlin
private const val positionsLink = Link(
    href = "/~readium/positions",
    type = "application/vnd.readium.position-list+json"
)

interface PositionsService : Publication.Service {

    /* List of all the positions in the publication as Locator objects. */
    val positions: List<Locator>

    /* List of all the positions in the publication, grouped by the resource reading order index. */
    val positionsByReadingOrder: List<List<Locator>>

    override val links: List<Link>
        get() = listOf(positionsLink)

    override fun get(link: Link): Resource? {
        if (link.href != positionsLink.href) {
            return null
        }

        val json = JSONObject().apply {
            put("total", positions.size)
            put("positions", positions.map { it.toJSON() })
        }
        return BytesResource(positionsLink, json.toString())
    }

}
```

### `CoverService`

Provides an easy access to a bitmap version of the publication cover.

While at first glance, getting the cover could be seen as a helper, the implementation actually depends on the publication format:

* Some might allow vector images or even HTML pages, in which case they need to be converted to bitmaps.
* Others require to render the cover from a specific file format, e.g. PDF.

Furthermore, a reading app might want to use a custom strategy to choose the cover image, for example by:

* iterating through the `images` collection for a publication parsed from an OPDS 2 feed
* generating a bitmap from scratch using the publication's title
* using a cover selected by the user

#### Properties

* `cover: Bitmap?`
  * Returns the publication cover as a bitmap at its maximum size.
  * If the cover is not in a bitmap format (e.g. SVG), the display's size is used.

#### Methods

* `coverFitting(maxSize: Size) -> Bitmap?`
  * Returns the publication cover as a bitmap, scaled down to fit the given `maxSize`.
  * If the cover is not in a bitmap format (e.g. SVG), it is exported as a bitmap filling `maxSize`.
  * The cover **should not** be cached in memory for next calls.

#### `Publication` Helpers

* `cover: Bitmap? = findService<CoverService>()?.cover`
* `coverFitting(maxSize: Size) -> Bitmap? = findService<CoverService>()?.coverFitting(maxSize)`

#### Web Service

If the cover selected by the `CoverService` is not already part of `Publication::links` with a `cover` relation, then the `CoverService` should add it to `CoverService::links` and serve the bitmap in `CoverService::get()` at the maximum available size. If the source format is a vector image, it will be fitted to the device's screen size.

## Appendix B: Helpers Provided by Readium

This is an overview of the helpers implemented natively by the Readium toolkit.

### `Publication` Helpers

* `baseURL: URL?`
  * The URL where this publication is served, computed from the `Link` with `self` relation.
  * Used to resolve relative HREFs.
  * e.g. `https://provider.com/pub1293/manifest.json` gives `https://provider.com/pub1293/`
* `jsonManifest: String`
  * Returns the RWPM JSON representation for this `Publication`'s manifest, as a string.
* `linkWithHREF(String) -> Link?`
  * Finds the first link with the given HREF in the publication's links.
  * Searches through (in order) `readingOrder`, `resources` and `links`, following recursively `alternates` and `children`.
    * If there's no match, try again after removing any query parameter and anchor from the given `href`.
* `linkWithRel(String) -> Link?`
  * Finds the first link with the given relation in the publication's links.
  * Delegates internally to `Manifest::linkWithRel()`.
* `linksWithRel(String) -> List<Link>`
  * Finds all the links with the given relation in the publication's links.
  * Delegates internally to `Manifest::linksWithRel()`.

#### EPUB

* `pageList: List<Link>`
  * Provides navigation to positions in the Publication content that correspond to the locations of page boundaries present in a print source being represented by this EPUB Publication.
  * Equivalent to `subcollections["page-list"]?.first?.links ?: []`.
* `landmarks: List<Link>`
  * Identifies fundamental structural components of the publication in order to enable Reading Systems to provide the User efficient access to them.
  * Equivalent to `subcollections["landmarks"]?.first?.links ?: []`.
* `listOfAudioClips: List<Link>`
  * A listing of audio clips included in the publication.
  * Equivalent to `subcollections["loa"]?.flatten() ?: []`.
* `listOfIllustrations: List<Link>`
  * A listing of illustrations included in the publication.
  * Equivalent to `subcollections["loi"]?.flatten() ?: []`.
* `listOfTables: List<Link>`
  * A listing of tables included in the publication.
  * Equivalent to `subcollections["lot"]?.flatten() ?: []`.
* `listOfVideoClips: List<Link>`
  * A listing of video clips included in the publication.
  * Equivalent to `subcollections["lov"]?.flatten() ?: []`.

#### OPDS

* `images: List<Link>`
  * Visual representations for a publication.
  * Equivalent to `subcollections["images"]?.flatten() ?: []`.

### `Manifest` Helpers

* `linkWithRel(String) -> Link?`
  * Finds the first link with the given relation in the manifest's links.
  * Searches through (in order) `readingOrder`, `resources` and `links`.
* `linksWithRel(String) -> List<Link>`
  * Finds all the links with the given relation in the manifest's links.
  * Searches through (in order) `readingOrder`, `resources` and `links`.

### `Metadata` Helpers

#### Presentation

* `effectiveReadingProgression: ReadingProgression`
  * Computes a `ReadingProgression` when the value of `Metadata::readingProgression` is set to `auto`, using the publication language.
  * [See this issue for more details.](https://github.com/readium/architecture/issues/113)
* `presentation: Presentation`
  * Returns the `Presentation` object for this metadata.

### `Link` Helpers

* `toURL(baseURL: URL) -> URL?`
  * Computes an absolute URL to the link, relative to the given `baseURL`.
  * If the link's `href` is already absolute, the `baseURL` is ignored.
* `templateParameters: List<String>`
  * List of URI template parameter keys, if the `Link` is templated.
* `expandTemplate(parameters: Map<String, String>) -> Link`
  * Expands the `Link`'s HREF by replacing URI template variables by the given parameters.
  * See [RFC 6570](https://tools.ietf.org/html/rfc6570) on URI template.

### `List<Link>` Helpers

* `firstWithRel(String) -> Link?`
  * Finds the first link with the given relation.
* `filterByRel(String) -> List<Link>`
  * Finds all the links with the given relation.
* `firstWithHREF(String) -> Link?`
  * Finds the first link matching the given HREF.
* `indexOfFirstWithHREF(String) -> Int?`
  * Finds the index of the first link matching the given HREF.
* `firstWithMediaType(MediaType) -> Link?`
  * Finds the first link matching the given media type.
* `filterByMediaType(MediaType) -> List<Link>`
  * Finds all the links matching the given media type.
* `filterByMediaTypes(List<MediaType>) -> List<Link>`
  * Finds all the links matching any of the given media types.
* `allAreBitmap: Boolean`
  * Returns whether all the resources in the collection are bitmaps.
* `allAreAudio: Boolean`
  * Returns whether all the resources in the collection are audio clips.
* `allAreVideo: Boolean`
  * Returns whether all the resources in the collection are video clips.
* `allAreHTML: Boolean`
  * Returns whether all the resources in the collection are HTML documents.
* `allMatchMediaType(MediaType) -> Boolean`
  * Returns whether all the resources in the collection are matching the given media type.
* `allMatchMediaTypes(List<MediaType>) -> Boolean`
  * Returns whether all the resources in the collection are matching any of the given media types.

### `Properties` Helpers

#### Presentation

* `clipped: Boolean?`
  * Specifies whether or not the parts of a linked resource that flow out of the viewport are clipped.
* `fit: Presentation.Fit?`
  * Suggested method for constraining a resource inside the viewport.
* `orientation: Presentation.Orientation?`
  * Suggested orientation for the device when displaying the linked resource.
* `overflow: Presentation.Overflow?`
  * Suggested method for handling overflow while displaying the linked resource.
* `page: Presentation.Page?`
  * Indicates how the linked resource should be displayed in a reading environment that displays synthetic spreads.
* `spread: Presentation.Spread?`
  * Indicates the condition to be met for the linked resource to be rendered within a synthetic spread.

#### Encryption

* `encryption: Encryption?`
  * Indicates that a resource is encrypted/obfuscated and provides relevant information for decryption.

#### EPUB

* `contains: Set<String>`
  * Identifies content contained in the linked resource, that cannot be strictly identified using a media type.
* `layout: EPUBLayout?`
  * Hints how the layout of the resource should be presented.

#### OPDS

* `numberOfItems: Int?`
  * Provides a hint about the expected number of items returned.
* `price: Price?`
  * The price of a publication is tied to its acquisition link.
* `indirectAcquisitions: List<Acquisition>`
  * Indirect acquisition provides a hint for the expected media type that will be acquired after additional steps.
* `holds: Holds?`
  * Library-specific features when a specific book is unavailable but provides a hold list.
* `copies: Copies?`
  * Library-specific feature that contains information about the copies that a library has acquired.
* `availability: Availability?`
  * Indicates the availability of a given resource.

### `Presentation` Helpers

#### EPUB

* `layoutOf(Link) -> EPUBLayout`
  * Returns the EPUB layout of a resource based on both publication and resource-level properties.
  * By order of precedence: `link.properties.layout`, `presentation.layout` and `EPUBLayout.Reflowable` as a fallback.
