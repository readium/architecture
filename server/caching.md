# Best Practices for HTTP Caching

Publication Servers are responsible for providing the manifest, resources and APIs through HTTPS.

To optimize the user experience, each implementation should rely on HTTP caching.

For anyone unfamiliar with caching in HTTP, we highly recommend reading [Mark Nottingham](https://www.mnot.net/cache_docs/) or [Iliya Grigorik](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching) introductions to HTTP caching.


## Caching the Manifest

While the in-memory model and the subsequent manifest are most of the time fairly static resources, there are a number of use cases where they can change over time:

* if a publication is encrypted, the server might not be initially able to parse table of contents and media overlay, these will only be added to the manifest once the publication can be decrypted
* specific APIs could also impact either the resources or the links listed in the manifest

For these reasons, it's best to revalidate with the server the freshness of a manifest using an `ETag`.

We recommend each implementation to do the following:

* calculate a hash of the manifest and use it as an `ETag`
* avoid using `Cache-Control`, `Last-Modified` or `Expires`
* make sure that the server replies with a `304 Not Modified` if the `ETag` matches the one provided by the client in the `If-None-Match` header

## Caching Publication Resources

Publication resources (listed in `readingOrder` or `resources`) served by the server are unlikely to change and should be cached more heavily than the manifest.

Having fonts, CSS or JS in cache can have a very positive impact on rendering time for HTML in a browser or a webview.

We recommend each implementation to do the following:

* use strictly `Cache-Control` to avoid any further requests between the client and the server once a resource is cached
* `Cache-Control` should contain a `public` directive
* it is up to each implementation to decide how the `max-age` directive should be set, but this best practice document recommends caching resources for at least 24H or more

## Caching APIs

Each API exposed by the server is potentially unique and there's no generic rule that can be applied.

That said, we can use the two examples above to provide some guidelines:

* if freshness is important, using an `ETag` is the optimal solution but keep in mind that there's a cost to it (calculating the `ETag` and processing the request)
* if a resource is unlikely to change or freshness is not an absolute requirement, `Cache-Control` provides a very flexible mechanism that can be tweaked using the various directives available
