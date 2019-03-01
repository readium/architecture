# Readium2 DRM


## R2Shared DRM interfaces

The shared DRM interfaces need to be implemented by DRM modules (eg. ReadiumLCP) to be compatible with Readium 2. They provide features used by the streamer, fetcher and navigator to handle contents decryption and rights consumption when possible.

DRMs can be very different beasts, so those interfaces are not meant to be generic for all DRM behaviors (eg. loan return). The goal is only to provide generic features that are used inside Readium's projects directly.

If there's a need for other generic DRM features, it can be implemented as a set of adapters to the DRM modules in the client app, to cater to the interface's needs and capabilities.


### DRM object

An object giving info about the DRM encrypting a publication. This object is partially filled by the streamer, and can be completed by a DRM module, before being sent back to the streamer in order to allow the fetcher to be able to decypher content later on.

- `brand: Brand` The DRM brand, filled by the streamer
- `scheme: String` The encryption scheme to check that resources are properly encrypted.
- `license: DRMLicense?` This is filled by a DRM module, to provide contents decryption and additional DRM behaviors.

### DRMLicense

Shared DRM behavior for a particular license/publication.

- `encryptionProfile: String?` (used by the streamer)
- `decipher(Data) -> Data?` (used by the streamer) Deciphers the given encrypted data to be displayed in the reader.

- `canCopy: Bool` (used by the navigator) Returns whether the user can copy extracts from the publication.
- `copy(text: String) -> String?` (used by the navigator) Processes the given text to be copied by the user. For example, you can save how much characters were copied to limit the overall quantity. Returns the (potentially modified) text to put in the user clipboard, or nil if the user is not allowed to copy it.


## How to use

### A) When a book is added to the app / When the app is opened (no publication caching yet)

1. The `Streamer.parser(pathToPublication)` is called on resource X.
Output: `((Publication, Container), PubParsingCallback())`. Note that `Container` contains a `DRM` object if some DRM has been detected in the publication.
Why? Not all the resources can be parsed at this point.
Some of the resource are possibly heavy, encrypted or both. 
2. The `(Publication, Container)` is passed to the `Streamer.Server` with a endpoint parameter.
This is done in order to make the resources available from the server.

### B) When a book is going to be opened (we will use LCPLicense as an example, but it's a subclass of DRMLicense)

If the `Container.drm` is not nil, it means that the `Streamer.Parser` detected a protected publication. The DRMLicense is initialized by the DRM module matching the `DRM.brand` [(eg. for LCP)](https://github.com/readium/readium-2/tree/master/other/lcp).

The Test-app now calls back the `PubParsingCallback`, with the filled `DRM` object. The remaining files are parsed, and the already existing `Publication` object is filled with the new informations.
* The `Publication` object is then passed to the `Navigator` to display it. Resources URL are found in the `Publication`'s `Spine`/`Resources`. These resource are served by the `Streamer.WebServer` (we added it A)2.). The Streamer.WebServer uses the Streamer.Fetcher to get the resources on disk. If the resources are encrypted, the fetcher use `Drm.DrmLicense.decipher()`, hence the need to resolve the Drm beforehand.


### Big Picture
Navigator will find the URL of resources in the `Publication`, will request the Streamer.WebServer for it, Streamer.WebServer will ask the Streamer.Fetcher to get it, if the resource link indicates its encrypted, the fetcher will use the `Drm.DrmLicense.decrypt()`.

