# Content Protection

* Authors: [Mickaël Menu](https://github.com/mickael-menu)


## Summary

Offers a way to support more content protection technologies in Readium 2.


## Motivation

DRMs and other protection technologies can be vastly different, therefore we don't want to make a generic system fitting the needs of every arbitrary DRM. Instead, we should only focus on the features that are actually used in Readium components, such as resource decryption and rights consumption.

We want to:

* Simplify use of DRMs in reading apps.
* Be able to support other DRMs than LCP, without modifying the toolkit itself.
* Handle decryption/transformation of publication resources.
* Consume user rights in a DRM-agnostic way, e.g. copy or print.

Peripheral features should be handled by reading apps themselves, which control the supported DRMs, for example:

* Displaying license/rights informations.
* Returning or renewing loans.


## Developer Guide

A Content Protection can be different things:

* Format-specific protections, such as [PDF permissions](https://developer.apple.com/documentation/pdfkit/pdfdocument/read_operations/permission_properties) or ZIP passwords.
* A DRM technology.
* Access restriction on resources, e.g. by requiring a Bearer Token in HTTP requests.
* Content obfuscation.

### Unlocking a Publication

Since it's usually possible to read the metadata of a publication without unlocking its protection, the credentials are not always necessary. If the provided credentials are incorrect or missing, the `Publication` can be returned in a locked state: part of its manifest is readable, but not all of its resources.

However, if you need to render the publication to the user, you can set the `askCredentials` parameter to `true`. If the given credentials are incorrect, then the Content Protection will be allowed to ask the user for its credentials.

```kotlin
streamer.open(file, askCredentials = true, credentials = "open sesame")
```

Some Content Protections – e.g. ZIP encryption – don't allow reading a publication's metadata without the proper credentials, and thus can't return a `Publication` in a locked state. In this case, they will return an `IncorrectCredentials` error. However, you may be able to recover from the error using its associated `recoveryDialog`.

```kotlin
try {
    publication = streamer.open(file, askCredentials = false, credentials = "open sesame")
} catch (error: IncorrectCredentials) {
    // Prompt the user for its password and try again...
    showDialog(error.recoveryDialog, callback = ...)
}
```

### Using Third-Party Protections

Format-specific protections are natively handled by the Streamer, since they are tied to the file format. However, for third-party technologies such as a DRM, you need to register them by providing `ContentProtection` instances to the Streamer. Here's an example with LCP:

```swift
streamer = Streamer(
    contentProtections: [
        // The provided `authentication` argument is private to the LCP library,
        // and knows how to ask the user for its passphrase.
        LCPContentProtection(authentication)
    ]
)
```

### Rendering a Publication

To render the publication, reading apps must first check if the protection is unlocked. Navigators will refuse to be created with a locked publication.

```swift
if !publication.isLocked {
    render(publication)
}
```

### Consuming User Rights

Some Content Protection technologies support user rights, such as copy or print. It's possible to consume these rights using the `UserRights` API, for example, to copy a text selection:

```swift
// Consumes the given `text` using the copy right. If it exceeds the
// amount of copyable content left, then the text is truncated.
text = publication.rights.copy(text)
pasteboard.add(text)
```

Sometimes, you need to know what's the truncated result before actually consuming the *copy* right, for example for a dismissable sharing popup. In which case, you can set the `peek` parameter of `copy()` to `true`.

To know if you should grey out the "Copy" action, use `canCopy`.

### Backward Compatibility and Migration

TODO


## Reference Guide

The Readium toolkit offers different tools to address the various Content Protection technologies:

* A string credentials passed during the parsing, for password protections or license unlocking.
* Resource transformers, to handle decryption and deobfuscation.
* Customizing the `Fetcher`, for access restrictions.
* A `ContentProtectionService` attached to the `Publication`, to manage user rights and hold additional DRM-specific extensions, such as a license object.

### Content Protections

Content Protections can be grouped in two categories:

* *Format-Specific Protections*, which are natively supported in the parsers, e.g. PDF permissions and ZIP passwords.
* *Third-Party Protections*, which are managed by reading apps and registered to the Streamer, e.g. DRM and access restrictions.

Readium supports only a single enabled Content Protection per publication, because cumulating rights consumption or decryption from different sources can't be done blindly. Third-party protections provided to the Streamer take precedence (in order) over any format-specific protection.

#### Format-Specific Protections

There's currently only two format-specific protections recognized by Readium: PDF and ZIP. When a password protection is used, the `credentials` parameter provided to the Streamer is used to unlock the protected file.

##### ZIP Protection

There are many encryption methods supported in ZIP, some proprietary. Readium can't reasonably handle all of it, and the supported protections will depend on the underlying ZIP library used. Traditional PKWARE encryption, even though not really secure, is widely used to add password protection to a ZIP, and should therefore be supported if possible.

A ZIP parser should use the `credentials` parameter passed to the Streamer. If the password is incorrect, an `IncorrectCredentials` error is returned, instead of an unlocked `Publication`. The rationale is that a locked ZIP can't be used to read the publication metadata to construct a locked `Publication`.

Reading apps are welcome to prompt the user for the password upon receiving `IncorrectCredentials`, and try again.

##### PDF Protection

PDF supports encryption protected by password and user permissions.

In the Streamer, PDF password works the same way as a ZIP password, using the `credentials` parameter.

If a PDF contains user permissions, then the Streamer will create a `ContentProtectionService` instance to manage its rights, such as "copy". Only a subset of PDF permissions are supported: the ones used in Readium. For example, the "changes allowed" permission doesn't make sense since we can't edit a PDF in Readium.

Note that Readium supports only publication-level protections. If a ZIP package contains a password-protected PDF file, then the PDF won't be readable in Readium. However, this could be implemented as a reading app extension, by injecting a custom `Fetcher` prompting the user for resource-specific passwords when accessed.

#### Third-Party Protections

Third-party protections can be widely different, therefore the Readium toolkit avoids making assumptions about the way they work. This means that only the core features used in Readium – publication locking, resources transformation and rights consumption – need to be implemented with protection-agnostic interfaces. Any peripheral features, such as managing loans or presenting license information, are out of scope for Readium. They should be handled by reading apps themselves, using whatever API a Content Protection library is providing.

A third-party protection library (or bridge) should implement the `ContentProtection` interface, which will be registered to the Streamer and used when parsing a publication.

##### Unlocking a Publication

A protected publication can be opened in two states: *locked* or *unlocked*. A locked publication has a restricted access to its manifest and resources, and can't be rendered with a Navigator. It is usually only used to import a publication to the user's bookshelf.

Readium makes no assumption about the way a Third-Party Protection can unlock a publication. It could for example:

* fetch the credentials from a web service or an encrypted storage,
* compute it from locally available data, for example to deobfuscate,
* display a dialog to the user,
* start an OAuth authentication flow through a web view,
* or even, like a format-specific password protection, use the input `credentials` parameter and return an `IncorrectCredentials` error with an associated `Dialog`.

`ContentProtection` is allowed to prompt the user for its credentials *only* if the `askCredentials` parameter is set to true. The rationale is that a reading app might want to import a collection of publications, in which case the user should not be asked for all the credentials.

Note that if, for a given third-party protection, a locked publication can't be used to create its manifest at all, then the parsing should fail with an `IncorrectCredentials` error, like with a password-protected ZIP.

<img src="assets/000-open-statechart.svg">

### API Reference

*Note: Asynchronicity is represented with `Future` in this reference, but each platform should use the most idiomatic concurrency structure.*

#### `Streamer` Extensions

##### `Methods`

There's three new parameters to `Streamer::open()`: `askCredentials`, `credentials` and `sender`.

* `open(file: File, askCredentials: Boolean, credentials: String? = null, sender: Any? = null) -> Future<Publication>`
  * `askCredentials: Boolean`
    * Indicates whether the user can be prompted for its credentials.
    * This should be used for example when you want to render a publication in a Navigator.
    * When `false`, Content Protections are allowed to do background requests, but not to present a UI to the user.
  * `credentials: String? = null`
    * Credentials that Content Protections can use to attempt to unlock a publication, for example a password.
    * Supporting string credentials is entirely optional for Content Protections, this is only provided as a convenience.
    * The format is free-form: it can be a simple password, or a structured format such as JSON or XML.
    * Reading apps may store these credentials in a secure database, in two cases:
      * When presenting a `Dialog` taken from an `IncorrectPassword` error. In which case, the reading app may save the dialog's fields for later reuse, if the `Publication` is successfully unlocked.
      * Using a private third-party API to provide the credentials back to the reading app. For example, as a property in the created `ContentProtectionService`.
  * `sender: Any? = null`
    * Free object that can be used by reading apps to give some context to the Content Protections.
    * For example, it could be the source `Activity`/`ViewController` which would be used to present a credentials dialog.
    * Content Protections are not supposed to examinate this parameter, it should be forwarded to the reading app if an interaction is needed.

##### `Streamer.Error` Enum

* `Canceled`
  * Returned when the user canceled the parsing, for example by dismissing a credentials dialog.
* `IncorrectCredentials(recoveryDialog: Dialog?)`
  * Returned when the credentials – either from the `credentials` parameter, or from an external source – are incorrect, and we can't create a locked `Publication` object, e.g. for a password-protected ZIP.
  * If the reading app may present a dialog to the user, to enter the credentials, a description of the dialog is given as an associated value. `Dialog` will be specified in its own proposal.
* `Forbidden(Error?)`
  * Returned when we're not allowed to open the `Publication` at all, for example because it expired.
  * The Content Protection can provide a custom underlying error as an associated value.
* `Unavailable(Error?)`
  * Returned when the Content Protection can't open the `Publication` at the moment, for example because of a networking error.
  * This error is generally temporary, so the operation can be retried or postponed.

#### `ContentProtection` Interface

Bridge between a Content Protection technology and the Readium toolkit.

Its responsibilities are to:

* unlock a publication by returning a customized `Fetcher`,
* create a `ContentProtectionService` publication service.

##### Methods

* `open(file: File, fetcher: Fetcher?, askCredentials: Boolean, credentials: String?, sender: Any? = null) -> Future<ProtectedFile>?`
  * Attempts to unlock a potentially protected file.
  * `fetcher: Fetcher?`
    * The Streamer will attempt to open a `Fetcher` for the low-level file access (e.g. `ZIPFetcher`), to avoid having each Content Protection open the `file` to check if it's protected by its technology.
      * The media type's [structured syntax name suffix](https://tools.ietf.org/html/rfc6838#section-4.2.8) can be used by the Streamer for unknown formats, to determine which kind of `Fetcher` to create.
    * A publication might be protected in such a way that the package format can't be recognized, in which case, the Streamer will pass a `null` fetcher and the Content Protection will have the responsibility of creating the `Fetcher`.
  * Returns:
    * (synchronously) `null` if the `file` is not protected by this technology,
    * a `Streamer.Error` if the file can't be opened,
    * a `ProtectedFile` in case of success.

##### `ProtectedFile` Data Class

Holds the result of opening a `File` with a `ContentProtection`.

*All the constructor parameters are public.*

* `ProtectedFile(file: File, unprotectedFormat: Format?, fetcher: Fetcher, contentProtectionServiceFactory: ContentProtectionService.Factory?)`
  * `file: File`
    * Protected file to parse.
    * In most cases, this will be set to the `file` given to `ContentProtection::open()`. But if the Content Protection technology needs to point to a different secure file, or a temporary file, this new `file` will be used to parse the `Publication`. For example, this could be used to decrypt on-the-fly a publication to a temporary location.
  * `unprotectedFormat: Format?`
    * Equivalent format when the file is unprotected, if there's any.
    * This will be used to select the appropriate publication parser, for example:
      * `LCPProtectedAudiobook` becomes `Audiobook`,
      * but `LCPProtectedPDF` doesn't become `PDF`, because the PDF parser can't understand an LCPDF file.
  * `fetcher: Fetcher`
    * Primary fetcher to be used by the parser.
    * The Content Protection can unlock resources with a custom `Fetcher`, for example by:
      * Wrapping the leaf `fetcher` provided by the Streamer in a `TransformingFetcher` with a decryption `Resource.Transformer` function.
      * Discarding the source leaf `fetcher` altogether and creating a new one to handle access restrictions. For example, by creating an `HTTPFetcher` that will inject a Bearer Token in requests.
  * `contentProtectionServiceFactory: ContentProtectionService.Factory?`
    * Factory for the publication service that will be added to the created `Publication` by the Streamer.

#### `UserRights` Interface

Manages consumption of user rights and permissions.

##### Copy

* `canCopy: Boolean`
  * Returns whether the user is currently allowed to copy the content to the pasteboard.
  * Returns `false` if the *copy* right is all consumed.
  * Navigators and reading apps can you use this to know if the "Copy" action should be greyed out or not.
    * *Important: This should be called every time the "Copy" action will be summoned, because the value might change.*
* `copy(text: String, peek: Boolean = false) -> String?`
  * Consumes the given text with the *copy* right.
  * Returns:
    * `null` if the copy is forbidden, for example the *copy* right is entirely consumed.
    * The input string, optionally truncated to the amount of allowed characters.
  * `peek: Boolean = false`
    * When `true`, the *copy* right is not consumed.
    * This should be used when you need a preview of the copied content before actually validating the copy, for example for a dismissable Sharing action.

##### Print

* `canPrint: Boolean`
  * Returns whether the user is currently allowed to print the content.
  * Returns `false` if the *print* right is all consumed.
  * Navigators and reading apps can you use this to know if the "Print" action should be greyed out or not.
    * *Important: This should be called every time the "Print" action will be summoned, because the value might change.*
* `print(pageCount: Int, peek: Boolean = false) -> Int`
  * Consumes the given amount of pages with the *print* right.
  * Returns:
    * `0` if the print is forbidden, for example the *print* right is entirely consumed.
    * The number of pages actually authorized to be printed.
  * `peek: Boolean = false`
    * When `true`, the *print* right is not consumed.
    * This should be used when you need to know in advance the number of pages that can be printed, or for example to make an attempt at printing that may fail.

##### Implementations

* `UnrestrictedUserRights`
  * The default implementation used when there are no rights restrictions. Basically a "passthrough" object.

#### `ContentProtectionService` Interface (implements `PublicationService`)

* Publication Service Key: `content-protection`

##### Factory

* `typealias ContentProtectionService.Factory = (Manifest, Fetcher) -> ContentProtectionService?`
  * Function type used to create a `ContentProtectionService`.

##### Properties

* `isLocked: Boolean`
  * Whether the `Publication` has an unrestricted access to its resources, and can be rendered in a Navigator.
* `rights: UserRights`
  * Manages consumption of user rights and permissions.
* `name: LocalizedString?`
  * User-facing name for this Content Protection, e.g. "Readium LCP".
  * It could be used in a sentence such as `"Protected by {name}"`

##### `Publication` Helpers

* `isProtected: Boolean`
  * Returns whether this `Publication` is protected by a Content Protection technology.
  * Shortcut to `(serviceForKey("content-protection") as? ContentProtectionService) != null`.
* `isLocked: Boolean`
  * Shortcut to `(serviceForKey("content-protection") as? ContentProtectionService)?.isLocked`.
  * Fallback on `false`.
* `rights: UserRights`
  * Shortcut to `(serviceForKey("content-protection") as? ContentProtectionService)?.rights`.
  * Fallback on `UnrestrictedUserRights()`.
* `protectionLocalizedName: LocalizedString?`
  * Shortcut to `(serviceForKey("content-protection") as? ContentProtectionService)?.name`.
* `protectionName: String?`
  * Shortcut to `protectionLocalizedName?.string`

##### Web Service

###### `content-protection` Route

* href: `/.readium/content-protection`
* type: `application/vnd.readium.content-protection+json`
* rel: `content-protection`

Only `isProtected` is required in the response.

```json
{
  "isProtected": true,
  "isLocked": false,
  "name": {
    "en": "Readium LCP"
  },
  "rights": {
    "canCopy": true,
    "canPrint": false
  }
}
```

###### `rights/copy` Route

* href: `/.readium/rights/copy?text={text}{&peek}`
  * `text` is the percent-encoded string to copy.
  * `peek` is `true`, `false` or missing.
* type: `application/vnd.readium.rights.copy+json`
* rel: `rights-copy`

An HTTP `403` status code is returned if the copy is forbidden.

```json
{
  "text": "string to copy, potentially truncated"
}
```

###### `rights/print` Route

* href: `/.readium/rights/print?pageCount={pageCount}{&peek}`
  * `pageCount` is the number of pages to print, as a positive integer.
  * `peek` is `true`, `false` or missing.
* type: `application/vnd.readium.rights.print+json`
* rel: `rights-print`

An HTTP `403` status code is returned if the print is forbidden.

```json
{
  "pageCount": 4
}
```


### Extensibility for Third-Party Protections

While the presented protection features are only limited to the ones used by Readium components, the architecture is opened to third-party extensions.

#### Publication-Scoped Extensions

`ContentProtectionService` is a place of choice for extensibility, because it is tied to and stored in the `Publication` object. You can add any extra features and, optionally, expose them as *publication helpers*.

Here's an example of how to expose the license of the LCP DRM inside the `Publication`:

```swift
class LCPContentProtectionService: ContentProtectionService {

    let license: LCPLicense

}

extension Publication {

    var lcpLicense: LCPLicense? {
        (serviceForKey(ContentProtectionServiceKey) as? LCPContentProtectionService)?.license
    }

}

// Then the reading app can access the license from the `Publication` itself:
publication.lcpLicense?.renew()
```

#### Globally-Scoped Extensions

You can also add global features in your implementation of the `ContentProtection` interface. This class is instanciated by reading apps, so you have full control on the exposed API.

A common use case would be to require the reading app to implement a custom interface to ask the user for the credentials when requested, here's an LCP example:

```swift
protocol LCPAuthenticating {
    func requestPassphrase(for license: LCPAuthenticatedLicense) -> Future<String?>
}

class LCPContentProtection: ContentProtection {

    private let authentication: LCPAuthenticating

    init(authentication: LCPAuthenticating) {
        self.authentication = authentication
    }
}
```


## Rationale and Alternatives

### Unlocking is Only Done During Parsing

Compared to the current implementation, a `Publication` is opened either unlocked, or locked. There's no way to unlock an existing `Publication` without reparsing it. The reason for this choice is to simplify the code in reading apps, and we usually don't need to unlock a `Publication` after it's opened:

* Importing a publication usually requires *not* to ask the user for credentials, so it can stay unlocked.
* Rendering a publication requires it to be unlocked during parsing.

### Peripheral Features

Peripheral features were initially considered to be integrated in a DRM-agnostic interface: displaying rights information, renewing loans, etc. However, it was guided by the LCP specification, and it became clear that it wouldn't really be agnostic.

For example, LCP is limiting copy by a character count. But a DRM could restrict word count, or number of copies. Therefore, it's not easy to display localized information about the remaining *copy* right available.


## Drawbacks and Limitations

Why should we *not* do this? Are there any unresolved questions?


## Future Possibilities

### Invalidating the Publication File

A Content Protection technology might alter the publication file during the lifetime of the `Publication` object. For example, by injecting an updated license file after renewing a loan. This could potentially be an issue for opened file handlers in the leaf `Fetcher` accessing the publication file.

A solution would be the introduction of an `InvalidatingFetcher`, which would be able to recreate its child `Fetcher` on-demand. The `ContentProtectionService` would keep a reference to this `InvalidatingFetcher`, and call `invalidate()` every time the publication file is updated.

#### `InvalidatingFetcher` Class

##### Constructor

* `InvalidatingFetcher(fetcher: Fetcher, invalidate: (Fetcher) -> Fetcher)`
  * `fetcher: Fetcher`
    * Initial child fetcher to use.
  * `invalidate: (Fetcher) -> Fetcher`
    * Closure that will recreate the child fetcher when called.
    * The previous fetcher is passed as an argument.

##### Methods

* `invalidate()`
  * Invalidate the child fetcher.
  * `close()` will be called on the previous child fetcher, after calling the `invalidate` closure to create the new one.
