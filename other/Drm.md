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
    func currentStatus() -> String
    func lastUpdate() -> Date
    func issued() -> Date
    func provider() -> URL
    func rightsEnd() -> Date?
    func potentialRightsEnd() -> Date?
    func rightsStart() -> Date?
    func rightsPrints() -> Int?
    func rightsCopies() -> Int?
}

public typealias PubParsingCallback = (Drm?) throws -> Void
```

#### A) When a book is added to the app / When the app is opened (no publication caching yet)

1. The `Streamer.parser(pathToPublication)` is called on resource X.
Output: `((Publication, Container), PubParsingCallback())`. Note that `Container` contains a `Drm` object if some DRM has been detected in the publication.
Why? Not all the resources can be parsed at this point.
Some of the resource are possibly heavy, encrypted or both. 
2. The `(Publication, Container)` is passed to the `Streamer.Server` with a endpoint parameter.
This is done in order to make the resources available from the server.

#### B) When a book is going to be opened (we will use LCPLicense as an example, but it's a subclass of DrmLicense)

1. If the `Container.Drm` is not nil, signifying that the `Streamer.Parser` A)1. call detected a protected publication, a switch is done on the `Drm.brand` and the apporpriate code block is called.
2. The module ReadiumLCP(-Swift) methods are used in order to fill the missing elements of `Drm` (this is a implementation specific, but for more details see [page](https://github.com/readium/readium-2/tree/master/other/lcp)).
3. Testapp now call back the `PubParsingCallback` providing it with the `Drm` object (fully filled). The remaining files are parsed, and the already existing `Publication` object is filled with the new informations.
* The `Publication` object is then passed to the `Navigator` for displaying it. Resources URL are found in the `Publication`'s `Spine`/`Resources`. These resource are served by the `Streamer.WebServer` (we added it A)2.). The Streamer.WebServer uses the Streamer.Fetcher to get the resources on disk. If the resources are encrypted, the fetcher use `Drm.DrmLicense.decipher()`, hence the need to resolve the Drm beforehand.

### LcpLicense (specific LCP implementation of DrmLicense)

The LcpLicense object, which comforms to DrmLicense, contains helper functions and two important properties: LicenseDocument and StatusDocument.
They are both the representation of the License Document and the Status Document. Each of these object contains helper methods (e.g. `getHint()`, `dateOfLastUpdate()` fot the LicenseDocument). They also publicly expose their properties.

#### Big Picture
Navigator will find the URL of resources in the `Publication`, will request the Streamer.WebServer for it, Streamer.WebServer will ask the Streamer.Fetcher to get it, if the resource link indicates its encrypted, the fetcher will use the `Drm.DrmLicense.decrypt()`.


#### Complementary informations

ReadiumLCP uses R2LCPClient(readium2-lcp-swift), a Swift wrapper, around an Obj-c++ wrapper, around the Readium2-lcp-client C++ lib.

ReadiumLCP provide a local SQLite database.
 
