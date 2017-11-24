## Readium2 DRM interface

Overview of the elements

```
public struct Drm {
    /// Parsed during light parsing.
    public let brand: Brand
    public let scheme: Scheme
    /// The below properties will be filled when passed back to the specific DRM handling module.
    public var profile: String?
    public var license: DrmLicense?
}

/// Interface 
public protocol DrmLicense {
    func decipher(_ data: Data) throws -> Data?
    func areRightsValid() -> Bool
    func register()
    func renew(endDate: Date)
    func `return`()
    // ...
}

public typealias PubParsingCallback = (Drm?) throws -> Void
```

* Streamer identify the DRM type during the lightParsing (lightparsing is the preliminary parsing round where the possibly encrypted resources are not treated.)
* Streamer returns a `Publication` and `Drm` objects partially filled (Brand and Scheme only for `Drm`) and a `PubParsingCallback`.
* Testapp add this partially parsed `Publication` to the Streamer.WebServer. (Cover image is now accessible for library display.)

   -- The above is done when adding book / opening the app --
      -- Below will be done when a book is being opened --

* Testapp needs to call the `PubParsingCallback` before opening the book, but some of the concerned resources (MO, NavDoc, NCX..) could be encrypted, hence it needs beforehand to resolve the `Drm` object.
* If the publication is DRM protected, Testapp switch on the `Drm.brand`, and call the corresponding DRMModule to resolve the missing DrmLicense/profile properties. (For the extensive details see this [page](https://github.com/readium/readium-2/tree/master/other/lcp)).
* ReadiumLcp (DRMModule for LCP) provides static utility methods to generate a `LcpLicense` (comforming to the `DrmLicense` protocol) out of a passphrase and the certificat revocation list, and get the profile.
* Testapp now call back the `PubParsingCallback` providing the `Drm`object fully filled. The remaining files are parsed, and the already existing Publication object is filled with the new informations.
* The `Publication` object is then passed to the Navigator for displaying it.

#### Big Picture
Navigator will find the URL of resources in the `Publication`, will request the Streamer.WebServer for it, Streamer.WebServer will ask the Streamer.Fetcher to get it, if the resource link indicates its encrypted, the fetcher will use the `Drm.DrmLicense.decrypt()`.

 
