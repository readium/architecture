# Publication Helpers and Services

* Authors: [Hadrien Gardeur](https://github.com/HadrienGardeur), [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Related Issues:
  * [#119 Adding helpers to the Publication](https://github.com/readium/architecture/issues/119)


## Summary

Our goal is to improve extensibility and customizability of the `Publication` type for reading apps. To achieve that, this proposal introduces two structured ways to extend a `Publication` with additional features: *helpers* and *services*.


## Motivation

### Computed Metadata

Readium components need to make decisions based on the metadata available in the `Publication`, which sometimes involves computing additional data. For example, it wouldn't make sense to show the font size setting for a full fixed-layout EPUB publication, so a `Publication.allReadingOrderIsFixedLayout` helper is useful.

These computed metadata are not part of [the core models specification](https://readium.org/webpub-manifest/), so they should be added as extensions and reading apps should be able to inject additional helpers to address custom needs and publication formats.

[RWPM extensions](https://readium.org/webpub-manifest/#8-extensibility) are already [implemented as helpers](https://github.com/readium/r2-shared-kotlin/blob/100914de22bbb8a8a95b7a718fffd32830d89396/r2-shared/src/main/java/org/readium/r2/shared/publication/presentation/Properties.kt) in the mobile toolkits, by converting JSON values to type-safe data structures.

### Swappable Implementations

For more complex and opiniated APIs, it would be useful to allow reading apps to swap Readium default implementations with their own. For example, calculating the [list of positions](https://github.com/readium/architecture/tree/master/models/locators/positions) can be done in [many different ways](https://github.com/readium/architecture/issues/123), and is format specific.

By using a set of specified interfaces as contracts, we can have different Readium components use these services without caring for the concrete implementation.


## Developer Guide

The `Publication` shared models support extensibility through two structured ways: *helpers* and *services*.

* **Helpers are *internal* extensions**. They have a single implementation which is statically defined in the shared model types.
* **Services are *external* extensions**. Other Readium components are providing their implementations, which are swappable and injected dynamically into the `Publication` object

### Publication Helpers

A *helper* extends the shared models by computing additional metadata when requested, such as:

  * `Presentation.layoutOf(Link)` returns the EPUB layout of a resource based on both publication and resource-level properties.
  * `Publication.cover` returns the publication cover as a bitmap.

They are simple syntactic constructs, using the capabilities of each language, for example:

```swift
// Swift
extension Publication {
    var cover: UIImage { }
}
```

```kotlin
// Kotlin
val Publication.cover: Bitmap
    get() { }
```

```javascript
// JavaScript
Publication.prototype.getCover = function() { };
```

#### Memoization

A *helper* could perform an expensive computation that might be called repeatedly. In which case, you can improve performances by storing the lazy-loaded result in a cache. `Publication` and `Metadata` are implementing the `LazyCaching` interface which allows to cache lazy-loaded values.

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

Publication services are a point of customizability for reading apps, because you can swap a default implementation with your own, or decorate it to add cross-cutting concerns. A reading app can also add new services for internal needs.

#### Getting a Service Instance

The `Publication` object is holding a dictionary of services, indexed by a string key. To get an instance of a service, you can use `Publication.serviceForKey(String)`. 
However, you rarely need to access directly a service instance, since a service usually defines helpers on `Publication` for convenience.

For example, the `PositionsService` declares the helper `Publication.positions: [Locator]` to directly access the list of positions.

#### Creating a New Service

To create your own service, you must declare:

* A string key that will be used to locate your service in the `Publication`, as an URI.
* An interface inheriting from `Publication.Service`.
* At least one factory per concrete implementation of your service, with the type signature: `(Manifest, Fetcher) -> Publication.Service?`.

You should also provide *helpers* on `Publication` for a more convenient access to your service API, with fallbacks if no instances of your service is attached to the `Publication`.

Here's a Kotlin example for `PositionsService`:

```kotlin
// The key used to locate the service in the `Publication`.
const val PositionsServiceKey = "http://readium.org/position-list"

// The service contract.
interface PositionsService : Publication.Service {
    
    val positions: List<Locator>
    
}

// Defines a convenient `publication.positions` helper with a fallback value.
val Publication.positions: List<Locator> get() {
    val service = serviceForKey(PositionsServiceKey) as? PositionsService
    return service?.positions ?: emptyList()
}


// A concrete implementation of the service.
class EPUBPositionsService(val readingOrder: List<Link>, val fetcher: Fetcher) : PositionsService {
    
    override val positions: List<Locator> by lazy {
        // Lazily computes the positions list...
    }
    
    companion Factory {
        
        // The service factory.
        fun create(manifest: Manifest, fetcher: Fetcher): EPUBPositionsService {
            return EPUBPositionsService(manifest.readingOrder, fetcher)
        }
        
    }
}

val publication = Publication(manifest, fetcher, serviceFactories = mapOf(
    PositionsServiceKey to EPUBPositionsService.Factory::create
))
```

### Backward Compatibility and Migration

#### Mobile (Swift and Kotlin)

If you were providing your own implementation of the `PositionListFactory`, you will have to adapt it to use `PositionsService` instead.

The `Publication` models are not yet immutable in the Swift toolkit, which is required for this proposal to work properly. Since reading apps usually don't create or modify a `Publication`, this should have a minimal impact.


## Reference Guide

Helpers and services rely on the fact that a `Publication` is immutable. If that was not the case, then the cached lazy-loaded values could become invalid.

### Publication Helpers

If a helper performs an expensive task, an assertion is added to check that it is not called from the UI thread. This is typically the case for helpers accessing resources from the `Fetcher`.

#### `LazyCaching` Interface

Offers a cache for lazy-loaded values.

This interface is implemented by `Publication` and `Metadata`, to cache the computation of expensive helpers. [A proof-of-concept implementation is described in this issue.](https://github.com/readium/architecture/issues/119#issuecomment-601302065)

##### Methods

* `cache<T>(key: String? = null, variant: String? = null, compute: () -> T?) -> T?`
  * Executes the given computation and caches its result for next calls.
  * `key: String? = null`
    * Unique key identifying the cached value.
    * If `null`, the function name of the caller will be used as the key, for convenience.
  * `variant: String? = null`
    * A variant used to cache different values for the same caller. For example, it can be the parameters given to the computation.
  * Returns the cached value or the result of `compute()`.

### Publication Services

Every publication service must extend the `Publication.Service` interface.

#### Copy and Factory

Since a service might cache values computed from the current manifest and fetcher, we can't reuse its instance when copying the `Publication` object. To circumvent this issue, the `Publication` is storing service factories, that will be given to the copies. The factory is used to create the service lazily when first queried.

The factory type signature is:

```kotlin
typealias Publication.Service.Factory = (Manifest, Fetcher) -> Publication.Service?
```

#### Web Service

To expose a web version of the service, reachable through `Publication.get()`, a service must:

* Add the web service routes in its `links` property.
* Answer the requests in its `get()` method.

#### `Publication` Class Additions

##### Constructor

* `Publication(manifest: JSONManifest, fetcher: Fetcher, serviceFactories: Map<String, Publication.Service.Factory>)`
  * This constructor will:
    1. create each service from its factory, passing the given `manifest` and `fetcher`,
    2. compute a new `JSONManifest` by appending the services' `links` to `manifest.links`,
    3. store `serviceFactories` to be used when calling `Publication.copy()`.

##### Methods

* `serviceForKey(key: String) -> Publication.Service?`
  * Returns the instance of the service with the given key, if there's one associated with the `Publication`.
* `copyWith(changes: (&Manifest, &Fetcher, &Map<String, Publication.Service.Factory>) -> Void) -> Publication`
  * Returns a copy of the publication, with the values passed by reference modified.
* `copyWithServices(factories: Map<String, Publication.Service.Factory>) -> Publication`
  * Returns a copy of the publication, with the given additional services.
  * `factories: Map<String, Publication.Service.Factory>`
    * Additional services for the copy. In case of conflict, this will override the services of the copied `Publication`.

#### `Publication.Service` Interface

Base interface to be inherited by all publication services.

##### Properties

* (optional) `links: List<Link>`
  * Routes to add to `Publication.links` to expose a web version of the service through `Publication.get()`.
  * To disambiguate the `href` with a local publication's resources, you **should** use the prefix `/.readium/`.
  * The `Link.rel` attribute should be used to identify the service.
  * You can use a templated URI to accept query parameters.
  * e.g. `Link(href: "/.readium/search{?text}", type: "application/json", rel: "search")`

##### Methods

* (optional) `get(link: Link, parameters: Map<String, String>) -> Resource?`
  * Called by `Publication.get()` for each request. A service can return a `Resource` to:
    * respond to a request to its web service declared in `links`,
    * serve additional resources to the client,
    * replace a publication resource by its own version
  * `link: Link`
    * The requested link.
  * `parameters: Map<String, String>`
    * The query parameters, e.g. `text` in `/.readium/search{?text}`.
  * Returns the `Resource` containing the response, or `null` if the service doesn't recognize this request.
* (optional) `close()`
  * Closes any opened file handles, removes temporary files, etc.
  * This is called by `Publication.close()`.


## Rationale and Alternatives

Two alternatives to extend `Publication` were considered.

### Decorating `Publication`

This doesn't require any change in the Readium toolkit. With this technique, the reading app creates a new type that will embed and proxy the `Publication` object, while adding more features.

While this solution is easy to implement, it doesn't allow customizing the behavior of Readium since other components are expecting a `Publication` object. 

### Subclassing `Publication`

We could allow the reading app to provide its own `Publication` subclass to the parsers. In this case, the reading app could override:

* `Publication.get()` to serve custom resources and web services,
* the default services exposed by Readium, for example `Publication.positions` 

Subclassing `Publication` might look more straightforward, but it would lead to a bulky [god object](https://en.wikipedia.org/wiki/God_object) for `Publication`. The solution introduced in this proposal has the advantage of being able to swap service implementations easily – e.g. the positions are computed differently for each publication format.


## Drawbacks and Limitations

This proposal requires the `Publication` shared models to be immutable to work properly. Otherwise, we might end up with invalid lazy-cached values. While this is a limitation, having immutable models is generally considered safer.

The publication helpers are added directly on the shared model types, which means that they are always available. This is convenient, but also means that we can have a `Publication` with irrelevant helpers. For example, `Properties.price` is always accessible, but makes sense only for an OPDS publication.


## Appendix A: Services Provided by Readium

### `PositionsService`

The goal of this service is to provide a list of discrete locations in the publication, no matter what the original format is. It is described in more details [in this specification](https://github.com/readium/architecture/tree/master/models/locators/positions). 

#### Properties

* (lazy) `positions: List<Locator>`
  * List of all the positions in the publication as `Locator` objects.
* (lazy) `positionsByReadingOrder: List<List<Locator>>`
  * List of all the positions in the publication, grouped by the resource reading order index.

#### Web Service

`PositionsService` exposes the positions list as a web service.

It provides a default implementation to avoid rewriting the JSON conversion for all concrete implementations of `PositionsService`.

```kotlin
private const val positionsLink = Link(
    href = "/.readium/positions",
    type = "application/vnd.readium.position-list+json",
    rel = "http://readium.org/position-list"
)

interface PositionsService : Publication.Service {

    /* List of all the positions in the publication as [Locator] objects. */
    val positions: List<Locator>

    /* List of all the positions in the publication, grouped by the resource reading order index. */
    val positionsByReadingOrder: List<List<Locator>>

    override val links: List<Link>
        get() = listOf(positionsLink)

    override fun get(link: Link, parameters: Map<String, String>): Resource? {
        if (link.href != positionsLink.href) {
            return null
        }

        val json = JSONObject().apply {
            put("total", positions.size)
            put("positions", positions.map { it.toJSON() })
        }
        return StringResource(positionsLink, json.toString())
    }

}
```

## Appendix B: Helpers Provided by Readium

This is an overview of the helpers implemented natively by the Readium toolkit.

If a helper is tagged with *background only*, it means that it is an expensive computation that should not be called from the UI thread. An assertion will crash the reading app in debug mode, and a warning will be logged in release mode if the app attempts to call the helper from the UI thread.

### `Publication` Helpers

#### Cover

* (background only) `cover: Bitmap?`
  * The publication cover as a native bitmap type.
  * The cover is not cached and is retrieved every time.

#### Reading Order

* `anyReadingOrder(key: String? = null, predicate: (Link) -> Boolean) -> Boolean`
  * Returns whether *any* of the `Link` in the reading order matches the given predicate.
  * If a unique `key` is provided, the result is cached to improve performances for next calls.
* `allReadingOrder(key: String? = null, predicate: (Link) -> Boolean) -> Boolean`
  * Returns whether *all* the `Link` in the reading order match the given predicate.
  * If a unique `key` is provided, the result is cached to improve performances for next calls.
* `allReadingOrderIsHTML: Boolean`
  * Returns whether all the resources in the reading order are HTML documents.
  * Delegates to `allReadingOrder()`, using `MediaType.isHTML` on `Link.type`.
* `allReadingOrderIsBitmap: Boolean`
  * Returns whether all the resources in the reading order are bitmaps.
  * Delegates to `allReadingOrder()`, using `MediaType.isBitmap` on `Link.type`.
* `allReadingOrderIsAudio: Boolean`
  * Returns whether all the resources in the reading order are audio clips.
  * Delegates to `allReadingOrder()`, using `MediaType.isAudio` on `Link.type`.
* `allReadingOrderIsVideo: Boolean`
  * Returns whether all the resources in the reading order are video clips.
  * Delegates to `allReadingOrder()`, using `MediaType.isVideo` on `Link.type`.

#### URLs

* `baseURL: URL?`
  * The URL where this publication is served, computed from the `Link` with `self` rel.
* `urlTo(link: Link) -> URL?`
  * Computes an absolute URL to the given `Link`, using `baseURL`.
  * If `Link.href` is already an absolute URL, returns it.

#### Links

* `linkMatching(predicate: (Link) -> Boolean) -> Link?`
  * Finds the first `Link` matching the given `predicate` in the publication's `readingOrder`, `resources`, and `links` properties (in order).
  * The search is done recursively, following `Link.alternate`.
* `linkWithRel(rel: String) -> Link?`
  * Finds the first `Link` with the given `rel`.
  * Delegates to `linkMatching()`.
* `linkWithHREF(href: String) -> Link?`
  * Finds the first `Link` with the given `href`.
  * Delegates to `linkMatching()`.
* `resourceWithHREF(href: String) -> Link?`
  * Finds the first servable `Link` with the given `href`, by searching in `readingOrder` and `resources` properties (in order).
  * The search is done recursively, following `Link.alternate`.

#### Child Collections

* `collectionsWithRole(role: String) -> List<PublicationCollection>`
  * Returns the child collections with the given `role`.

#### EPUB

* `pageList: List<Link>`
  * Provides navigation to positions in the Publication content that correspond to the locations of page boundaries present in a print source being represented by this EPUB Publication.
  * Equivalent to `collectionsWithRole("page-list")?.first?.links ?: []`.
* `landmarks: List<Link>`
  * Identifies fundamental structural components of the publication in order to enable Reading Systems to provide the User efficient access to them.
  * Equivalent to `collectionsWithRole("landmarks")?.first?.links ?: []`.
* `listOfAudioClips: List<Link>`
  * A listing of audio clips included in the publication.
  * Equivalent to `collectionsWithRole("loa")?.first?.links ?: []`.
* `listOfIllustrations: List<Link>`
  * A listing of illustrations included in the publication.
  * Equivalent to `collectionsWithRole("loi")?.first?.links ?: []`.
* `listOfTables: List<Link>`
  * A listing of tables included in the publication.
  * Equivalent to `collectionsWithRole("lot")?.first?.links ?: []`.
* `listOfVideoClips: List<Link>`
  * A listing of video clips included in the publication.
  * Equivalent to `collectionsWithRole("lov")?.first?.links ?: []`.

#### OPDS

* `images: List<Link>`
  * Visual representations for a publication.
  * Equivalent to `collectionsWithRole("images")?.first?.links ?: []`.

### `Metadata` Helpers

#### Presentation

* `effectiveReadingProgression: ReadingProgression`
  * Computes a `ReadingProgression` when the value of `Metadata.readingProgression` is set to `auto`, using the publication language.
  * [See this issue for more details.](https://github.com/readium/architecture/issues/113)
* `presentation: Presentation`
  * Returns the `Presentation` object for this metadata.
  * Parsed from `otherMetadata["presentation"]`.

### `Properties` Helpers

#### Presentation

* `clipped: Boolean?`
  * Specifies whether or not the parts of a linked resource that flow out of the viewport are clipped.
  * Parsed from `otherProperties["clipped"]`.
* `fit: Presentation.Fit?`
  * Suggested method for constraining a resource inside the viewport.
  * Parsed from `otherProperties["fit"]`.
* `orientation: Presentation.Orientation?`
  * Suggested orientation for the device when displaying the linked resource.
  * Parsed from `otherProperties["orientation"]`.
* `overflow: Presentation.Overflow?`
  * Suggested method for handling overflow while displaying the linked resource.
  * Parsed from `otherProperties["overflow"]`.
* `page: Presentation.Page?`
  * Indicates how the linked resource should be displayed in a reading environment that displays synthetic spreads.
  * Parsed from `otherProperties["page"]`.
* `spread: Presentation.Spread?`
  * Indicates the condition to be met for the linked resource to be rendered within a synthetic spread.
  * Parsed from `otherProperties["spread"]`.

#### Encryption

* `encryption: Encryption?`
  * Indicates that a resource is encrypted/obfuscated and provides relevant information for decryption.
  * Parsed from `otherProperties["encrypted"]`.

#### EPUB

* `contains: Set<String>`
  * Identifies content contained in the linked resource, that cannot be strictly identified using a media type.
  * Parsed from `otherProperties["contains"]`.
* `layout: EPUBLayout?`
  * Hints how the layout of the resource should be presented.
  * Parsed from `otherProperties["layout"]`.

#### OPDS

* `numberOfItems: Int?`
  * Provides a hint about the expected number of items returned.
  * Parsed from `otherProperties["numberOfItems"]`.
* `price: Price?`
  * The price of a publication is tied to its acquisition link.
  * Parsed from `otherProperties["price"]`.
* `indirectAcquisitions: List<Acquisition>`
  * Indirect acquisition provides a hint for the expected media type that will be acquired after additional steps.
  * Parsed from `otherProperties["indirectAcquisition"]`.
* `holds: Holds?`
  * Library-specific features when a specific book is unavailable but provides a hold list.
  * Parsed from `otherProperties["holds"]`.
* `copies: Copies?`
  * Library-specific feature that contains information about the copies that a library has acquired.
  * Parsed from `otherProperties["copies"]`.
* `availability: Availability?`
  * Indicates the availability of a given resource.
  * Parsed from `otherProperties["availability"]`.

### `Presentation` Helpers

#### EPUB

* `layoutOf(Link) -> EPUBLayout`
  * Returns the EPUB layout of a resource based on both publication and resource-level properties.
  * By order of precedence: `link.properties.layout`, `presentation.layout` and `EPUBLayout.Reflowable` as a fallback.


## Future Possibilities

Specifying new publication services and helpers should become a natural part of future proposals related to the `Publication` models.

Regarding the `PositionsService`, we could encounter a remote WebPub providing a positions list [as a web service](https://github.com/readium/architecture/tree/master/models/locators/positions#manifest). For this case, we might offer a reverse `RemotePositionsService` implementation that will fetch the positions list from the web service and convert it to in-memory `Locator` models.

Other helpers and services mentioned could be worth implementing:

* Helpers:
  * [Can I extract images for all resources](https://github.com/kobolabs/epub-spec#image-based-fxl-reader) in `readingOrder` from a full FXL publication?
  * Is it a multi-lingual publication where [all or most resources have an equivalent in another language](https://readium.org/webpub-manifest/extensions/divina#3-alternate-resources) and if so, which languages are available?
  * Which formats/bitrates/resolutions are available for an image-based/audio/video publication?
* Services:
  * `SearchService` to search through a publication's content.
  * `RightsService` to manage the rights consumption and loans.
  * `ThumbnailsService` to generate and cache thumbnails for each resource/page in an EPUB FXL or DiViNa.
  * `SynchronizedNarrationService` to convert SMIL resources to the W3C Synchronized Narration document.
  * `ReferenceService` to generate an index or glossary, or something akin to [Amazon X-Ray for Kindle](https://kdp.amazon.com/en_US/help/topic/G202187230).
  * `ReflowService` to generate a reflowable view of fixed resources such as EPUB FXL or PDF.
