# Composite Fetcher API

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Related Issues:
  * [Revamping the Content Filter architecture (architecture/103)](https://github.com/readium/architecture/issues/103)
  * [Clarify and refine the streamer API on mobile platforms (architecture/116)](https://github.com/readium/architecture/issues/116)
  * [Making the ContentFilter API public (r2-streamer-kotlin/92)](https://github.com/readium/r2-streamer-kotlin/issues/92)


## Introduction

The `Fetcher` component provides access to a publication's resource. Therefore, it's a place of choice to offer extensibility for reading apps.

The goal of this proposal is to make the fetcher more flexible using a [composite design pattern](https://en.wikipedia.org/wiki/Composite_pattern).

We will introduce several `Fetcher` implementations to answer different needs, including a `TransformingFetcher` allowing reading apps to transform resources.


## Motivation

With a composite pattern, we can decorate the fetcher to add cross-cutting concerns, such as:

* transforming resources (formerly known as `ContentFilter`),
* routing requests (`href`) to different sources,
* caching remote resources for offline access,
* logging

This will also lead to smaller, more focused implementations that are easier to unit test.

A fetcher can be adapted on-the-fly and temporarily by a component to fit its needs, by wrapping the fetcher tree in another `Fetcher`.

* The navigator could wrap a publication's fetcher in a `TransformingFetcher` to inject the CSS and JavaScript resources needed for rendering.
* A reading app could decorate the fetcher with a `CachingFetcher` to control how the remote resources are cached on the local storage.


## Proposed Solution

* [`Fetcher` and `Resource` Interfaces](#fetcher-and-resource-interfaces)
* [Examples of `Fetcher` Trees](#examples-of-fetcher-trees)
* Leaf Fetchers
  * [`FileFetcher`](#filefetcher-class)
  * [`HTTPFetcher`](#httpfetcher-class)
  * [`ZIPFetcher`](#zipfetcher-class)
  * [`ProxyFetcher`](#proxyfetcher-class)
* Composite Fetchers
  * [`RoutingFetcher`](#routingfetcher-class)
  * [`TransformingFetcher`](#transformingfetcher-class)
  * [`CachingFetcher`](#cachingfetcher-class)

The following `Fetcher` implementations are here only to draft use cases, so they should be implemented only when actually needed.

### `Fetcher` and `Resource` Interfaces

The core of this proposal is simply changing `Fetcher` from being a class to an interface.

#### `Fetcher` Interface

##### Methods

* `get(link: Link): Resource`
  * Returns the `Resource` at the given `Link.href`.
    * Since we can't know if a `Resource` exists before actually fetching it in some cases (e.g. HTTP), `get()` never fails. Therefore, errors are handled at the `Resource` level.
  * `link: Link`
    * We're expecting a `Link` because a `Fetcher` might use its properties, e.g. to transform resources.
* `close()`
  * Closes any opened file handles, remove temporary files, etc.

#### `Resource` Interface

We introduced `Resource` to handle lazy loading and optimize accesses to several properties (`length`, `bytes`, etc.).

Every failable API should return either the value, or a `Resource.Error` enum with the following cases:

* `NotFound` equivalent to a 404 HTTP error
* `Forbidden` equivalent to a 403 HTTP error
* `Other(Error)` equivalent to a 500 HTTP error

##### Properties

* `link: Link`
  * The link from which the resource was retrieved
  * It might be modified by the `Resource` to include additional metadata, e.g. the `Content-Type` HTTP header.
  * Link extensibility can be used to add additional metadata, for example:
    * A `ZIPFetcher` might add a `compressedLength` which could then be used by the position list factory [to address this issue](https://github.com/readium/architecture/issues/123).
    * Something equivalent to the `Cache-Control` HTTP header could be used to customize the behavior of a parent `CachingFetcher` for a given resource.
* (lazy) `length: Result<Long, ResourceError>`
  * Data length from metadata if available, or calculated from reading the bytes otherwise.
  * We must treat this value as a hint, as it might not reflect the actual bytes length.

##### Methods

* `read(range: Range<Long>? = null): Result<ByteArray, ResourceError>`
  * Reads the bytes at the given `range`.
  * When `range` is `null`, the whole content is returned.
  * Out-of-range indexes are clamped to the available length automatically.
* `readAsString(encoding: Encoding? = null): Result<String, ResourceError>`
  * Reads the full content as a `String`.
  * `encoding: Encoding? = null`
    * Encoding used to decode the bytes.
    * If `null`, then it is parsed from the `charset` parameter of `link.type` and falls back on UTF-8.
* `close()`
  * Closes any opened file handles.

##### Implementations

* `NullResource(link: Link)`
  * Creates a `Resource` returning a `null` content.
* `StringResource(link: Link, string: String)`
  * Creates a `Resource` serving a string.
* `BytesResource(link: Link, bytes: ByteArray)`
  * Creates a `Resource` serving an array of bytes.


### Examples of `Fetcher` Trees

The fetcher tree created by the publication parsers can be adapted to fit the needs of different formats.

#### CBZ and ZAB (Zipped Audio Book) Formats

These formats are very simple, we just need to access the ZIP entries.

<img src="assets/002-zip.svg">

#### Audiobook Manifest

The resources of a remote audiobook are accessed through HTTP requests, using an `HTTPFetcher`. However, we can implement an offline cache by wrapping the fetcher in a `CachingFetcher`.

<img src="assets/002-audiobook.svg">

#### LCP Protected Package (Audiobook, LCPDF, etc.)

The resources of a publication protected with LCP need to be decrypted. For that, We're using a `DecryptionTransformer` through a `TransformingFetcher`. Any remote resources declared in the manifest are fetched using an `HTTPFetcher`.

<img src="assets/002-lcp.svg">

#### EPUB Format

The EPUB fetcher is one of the most complex:
* An `HTTPFetcher` is used for remote resources access.
* The resources are transformed at two different levels:
  * in the *streamer*, to decrypt the content and deobfuscate fonts,
  * in the *navigator*, to inject the CSS and JavaScript necessary for rendering.

<img src="assets/002-epub.svg">


### Leaf Fetchers

A leaf fetcher is an implementation of `Fetcher` handling the actual low-level bytes access. It doesn't delegates to any other `Fetcher`.

#### `FileFetcher` Class

Provides access to resources on the local file system.

* `FileFetcher(paths: [String: String])`
  * `paths: [String: String]`
    * Map of reachable local paths, indexed by the exposed `href`.
    * Sub-paths are reachable as well, to be able to access a whole directory.
* `FileFetcher(href: String, path: String)`
  * Alias to `FileFetcher(paths: [href: path])`

#### `HTTPFetcher` Class

Provides access to resources served by an HTTP server.

* `HTTPFetcher(client: HTTPClient = R2HTTPClient())`
  * `client: HTTPClient`
    * HTTP service that will perform the requests.
    * Interface to be determined, it's another subject...
    * Readium should provide a default implementation using the native HTTP APIs.

#### `ZIPFetcher` Class

Provides access to entries of a ZIP archive. `ZIPFetcher` is responsible for the archive handle lifecycle, and should close it when `Fetcher.close()` is called.

* `ZIPFetcher(path: String, password: String? = null)`
  * `path: String`
    * Local path to the ZIP archive on the file system.
  * `password: String?`
    * Password used to unlock the ZIP archive if it's protected.
    * An `IncorrectPassword` error should be returned when trying to open a protected ZIP file, if the provided password is wrong.

#### `ProxyFetcher` Class

Delegates the creation of a `Resource` to a closure.

* `ProxyFetcher(closure: (Link) -> Resource)`
  * Creates a `ProxyFetcher` that will call `closure` when asked for a resource.
* `ProxyFetcher(closure: (Link) -> String)`
  * Convenient way to create a `Resource` from a string.

### Composite Fetchers

A composite fetcher is delegating requests to internal fetchers.

Warning: Make sure to forward the `Fetcher.close()` calls to child fetchers.

#### `RoutingFetcher` Class

Routes requests to child fetchers, depending on a provided predicate. This can be used for example to serve a publication containing both local and remote resources, and more generally to concatenate different content sources.

* `RoutingFetcher(routes: List<RoutingFetcher.Route>)`
  * Creates a `RoutingFetcher` from a list of routes, which will be tested in the given order.
* `RoutingFetcher(local: Fetcher, remote: Fetcher)`
  * Will route requests to `local` if the `Link.href` starts with `/`, otherwise to `remote`.

##### `RoutingFetcher.Route` Class

Holds a child fetcher and the predicate used to determine if it can answer a request.
Both the `fetcher` and `accepts` properties are public.

`RoutingFetcher.Route(fetcher: Fetcher, accepts: (Link) -> Bool)`


#### `TransformingFetcher` Class

Transforms the resources' content of a child fetcher using a `ResourceTransformer` (formerly `ContentFilter`).

* `TransformingFetcher(fetcher: Fetcher, transformer: ResourceTransformer)`
  * Creates a `TransformingFetcher` from a child `fetcher` and a `transformer`.
* `TransformingFetcher(fetcher: Fetcher, transformers: Collection<ResourceTransformer>)`
  * Equivalent to `TransformingFetcher(fetcher, ResourceTransformerChain(transformers))`

##### `ResourceTransformer` Interface

Implements the transformation of a `Resource`. It can be used, for example, to:

* decrypt,
* deobfuscate,
* inject CSS or JavaScript,
* correct content – e.g. adding a missing `dir="rtl"` in an HTML document,
* pre-process – e.g. before indexing a publication's content.

This interface is not nested under `TransformingFetcher` because it could be used in other contexts.

###### Properties

* `priority: Int`
  * Priority in a collection of transformers.
  * The higher the number, the earlier the `ResourceTransformer` will be executed in the chain.
  * Components offering the reading app to add custom transformers should provide a set of priority constants, e.g. `Navigator.ResourceTransformers.Priority.Injection = 42`.

###### Methods

* `transform(resource: Resource) -> Resource`
  * Performs the transformation of the given `resource`.
  * If the transformation doesn't apply, simply return `resource` unchanged.

##### `ResourceTransformerChain` Class (implements `ResourceTransformer`)

Holds a collection of `ResourceTransformer` and applies transformations in the order of their `priority`.

`ResourceTransformerChain` is itself a `ResourceTransformer`, so we can have nested chains.

* `ResourceTransformerChain(transformers: Collection<ResourceTransformers>, priority: Int = 0)`
  * Creates a `ResourceTransformerChain` from an unordered collection of `ResourceTransformer`.

#### `CachingFetcher` Class

Caches resources of a child fetcher on the disk, for example for offline access.

API still to be determined.


## Rationale and Alternatives

What other designs have been considered, and why you chose this approach instead.


## Drawbacks and Limitations

The fetcher is an optional component in Readium architecture. Which means that other components such as the navigator could bypass the features introduced by the fetcher layer, e.g. caching, injection, etc.

This might be fine in some cases, such as an HTML WebPub, but the navigator implementations provided by Readium should use the fetcher as much as possible.

To alleviate this issue on mobile platforms, a `PublicationServer` component could:

1. Serve the `Publication` through HTTP.
2. Produce a copy of the `Publication` for the navigator, adapting the absolute manifest links to be served by the `PublicationServer`.
   * By serving remote resources, the `PublicationServer` would then act as a proxy to the remote servers and allow injection to happen.
3. (Optionally) Transform the resources to map the remote links in the content itself.

A particularly tricky situation is to intercept the external links in a web view. Usually, web views will trigger the request internally. If the web view doesn't offer a native interception mechanism, we probably need to transform the resource itself to convert links. Or we can own this shortcoming and document it.


## Future Possibilities
(*if relevant*)

Think about what the natural extension and evolution of your proposal would be. This is also a good place to "dump ideas", if they are out of scope for the proposal but otherwise related.
