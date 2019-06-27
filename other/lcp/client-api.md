# Readium LCP client library

This document provides an overview of the public interface of Readium LCP client libraries. For platform-specific instructions, see:

- [Swift](https://github.com/readium/r2-lcp-swift)
- [Kotlin](https://github.com/readium/r2-lcp-kotlin)

Note that a private local SQLite database is currently used to save rights consumption, user passphrases and device registrations.


## LCPService

A client app should initialize the LCP service when first needed – for example with `R2MakeLCPService()` in Swift.
This service provides the following operations:

- importing a publication from a LCPL
- retrieving the license from a publication


### `importPublication(lcpl: URL, authentication: LCPAuthenticating?) -> LCPImportedPublication`

Parses a standalone LCPL file and downloads the protected publication. The result is an `LCPImportedPublication` containing at least:

- the download publication path
- the suggested filename to use in the user library

It also provides a way to observe the download progress to offer some feedback to the user. For example in Swift, an `Observable<DownloadProgress>` is returned.


### `retrieveLicense(publication: URL, authentication: LCPAuthenticating?) -> LCPLicense`

Loads a LCP license from a protected publication, to be able to read it or perform operations on it (eg. renewing a loan, using rights, etc.).


### `LCPAuthenticating`

This is an interface that is implemented by a client app to request user passphrases to be able to decrypt a license. If none is provided to the LCP service, and the license's passphrase is not already known by the LCP library, then the import/retrieve operation is cancelled.

The client app may choose to prompt the user for the passphrase, or use any other means (eg. calling a private Web Service).

[More information for Swift](https://github.com/readium/r2-lcp-swift/blob/develop/readium-lcp-swift/Public/LCPAuthenticating.swift)


## LCPLicense

A LCPLicense is retrieved from a protected publication, and allows to decrypt the publication, access the DRM metadata or perform operations on its status (eg. renewing a loan).

It also implements [DRMLicense from R2Shared](https://github.com/readium/architecture/blob/master/other/Drm.md) to be compatible with Readium 2's navigator and streamer. 


### Documents models

This is used to allow client apps to retrieve particular LCP metadata and provider custom extensions.

- `license: LicenseDocument` Read-only License Document model
- `status: StatusDocument?` Read-only Status Document model, if available

### Decryption

- `encryptionProfile: String?` (from DRMLicense) Encryption profile declared in the License Document.
- `decipher(Data) -> Data?` (from DRMLicense) Deciphers the given encrypted data to be displayed in the reader.


### Rights

#### Copy

- `charactersToCopyLeft: Int?` Number of remaining characters allowed to be copied by the user. If null, there's no limit.
- `canCopy: Bool` (from DRMLicense) Returns whether the user can copy extracts from the publication.
- `copy(text: String) -> String?` (from DRMLicense) Processes the given text to be copied by the user. The amount of characters is consumed, and the text is truncated if there is not enough characters available. Null is returned if there was no characters left, or if copy is forbidden.

#### Print

- `pagesToPrintLeft: Int?` Number of pages allowed to be printed by the user. If null, there's no limit.
- `canPrint: Bool` Returns whether the user is allowed to print pages of the publication.
- `print(pagesCount: Int) -> Bool` . Requests to print the given number of pages. The caller is responsible to perform the actual print. This method is only used to know if the action is allowed. Returns whether the user is allowed to print that many pages.


### Loan

#### Renew
- `canRenewLoan: Bool` Can the user renew the loaned publication?
- `maxRenewDate: Date?` The maximum potential date to renew to. If null, then the renew date might not be customizable.
- `renewLoan(end: Date?, present: (URL) -> ())` Renews the loan up to a certain date (if possible). The parameter `presenting` is used when the renew requires to present an HTML page to the user. The caller is responsible for presenting the URL to the user.


### Return
- `canReturnPublication: Bool` Can the user return the loaned publication?
- `returnPublication()` Returns the publication to its provider.