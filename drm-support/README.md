# DRM support in Readium-2

This document describes how a R2 based app should handle DRMs. It details the REadium LCP support, but other DRM modules should be handled the same way.

A protected publication may be imported in an R2 app in two ways: 
- import of a protected EPUB, i.e. an EPUB containing a DRM license;
- import of a DRM licence, e.g. a .lcpl file

These resources may be imported via side loading (Open with ... from  a web page on a mobile app, Open file ... in a desktop app), via an OPDS feed or any other supported way to access extenal resources.

To get more details about Reading system behavior in a Readium LCP context,  please read the [Readium LCP spec](https://readium.github.io/readium-lcp-specification/), specifically section 7 (Reading System Behavior). 

## Being ready
An app which handles a DRM like Readium LCP must embed a root certificate provided by the DRM administrator.  

An app which handles a DRM like Readium LCP must update on a regular basis (maybe each time the app is launched, on a weekly basis) the certificate revocation list associated with the DRM.

An app which handles a DRM like Readium LCP must generate a unique device id and human readable device name at install time. 

A quick note about the device ID: both Android and iOS
"launcher app" default open-source implementations use UUID coupled
with a per-app-install persistent storage (i.e. device "id" gets wiped
+ renewed if app is removed + reinstalled).

[Android sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/android/lib/src/clientlib/java/org/readium/sdk/lcp/StatusDocumentProcessing.java#L62-L70)


[Android sample 2](
https://github.com/readium/SDKLauncher-Android/blob/bbe16a5a8655d8e7260a2bc4a0e011a8419bf782/SDKLauncher-Android/app/src/main/java/org/readium/sdk/android/launcher/ContainerList.java#L448-L515)


[iOS sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/apple/src/LCPStatusDocumentProcessing.h#L29-L36)

[iOS sample 2](https://github.com/readium/SDKLauncher-iOS/blob/96f23bdc4cd9d5c0507c7aa3a6828d7c4fbc0e75/Classes/LCPStatusDocumentProcessing_DeviceIdManager.mm#L35-L118)


## Importing a protected EPUB
An app which imports an EPUB will follow these steps:

### 1/ Check if the EPUB is DRM protected

An LCP protected publication is signaled by the presence of a license document (META-INF/license.lcpl) plus certain specific values in META-INF/encryption.xml which indiate which resources are encypted and with which algorthm. As the licence document is mandatory, the app must raise an error if this file is missing but the content is declared encrypted. Also, the app should check that all resources referenced in encryption.xml are found in the EPUB archive.

### 2/ Validate the license

An LCP license must be valid (EDRLab provides a JSON schema in the EDRLab github, lcp-testing-tools) and its signature must be valid. See the LCP spec, section 5.5. The LCP client lib provides a signature verifier. Note that the provider certificate must not be in the current revocation list. 

The app should also check the presence of "hint"" and "publication"" links, required by the specification.

### 3/ Check a license update

An LCP license may contain a "status" link, i.e. a link to a status document. If it is the case, and if the app is online, it will silently (non-blocking for the user):


3.1/ Fetch the status document

3.2/ Validate the status document

3.3/ Check that the status is "ready" or "active".

If this is not the case (revoked, returned, cancelled, expired), the app will notify the user and stop there. 

3.4/ Check if the license has been updated. If it is the case, the app must:

3.4.1/ Fetch the updated license.

3.4.2/ Validate the updated license. If the updated license is not valid, the app must keep the current one. 

3.4.3/ Replace the current license by the updated one in the EPUB archive. 

During this time the user can read the book if the current license allows for it.  
Therefore, if the license has been extended from a library portal, the device may see an expired license. In this case the user can click a button that says “Check if the license has been updated”. This is a synchronous call, the user can wait for 5 sc; the new license is fetched and validated. 

### 4/ Check the rights

An LCP license handles a datetime start and datetime end, which must be compared with the system datetime. It the test is negative, the app will notify the user and stop there. 

### 5/ Register the device / license if needed

It may be a feature specific to LCP. The app must:

5.1/ check if the device / license is already registered.

If it is the case, the app moves on. 

5.2/  call the "register" link associated with the license id, passing a device id and device name as parameters.

5.3/ Store the fact the the device / license has been registered.

### 6/ Open the publication

The following is LCP specific. Each license is associated with a passphrase. The app must:

6.1/ Check if the publication can be open via a stored passphrase.

It may be the passphrase directly associated with the publication's license or a passphrase associated with a license from the same provider. It's easy to check if a passphrase fits, thanks to the key_check feautre of LCP. 

If yes, read the publication, else:

6.2/ Display the hint and ask the passphrase to the user.

6.3/ Store the passphrase (hash) securely.

And then read the publication.


## Importing a DRM license
An app which imports a DRM license will follow these steps:

### 1/ Validate the license

### 2/ Check a license update

The process is the same as above, but the license cannot be inserted in the publication yet. 

### 3/ Fetch the encrypted publication

In the LCP use case, the app will use the "publication" link. It will store the encrypted publication and insert the license as META-INF/license.lcpl. 

### 4/ Check the rights

### 5/ Register the device / license if needed




## Read the publication

The app will:

### 1/ Initialize a decryption context, with the following parameters:

* encrypted content key
* hashed passphrase

### 2/ Decrypt each resource or chunk of the publication, passing the context as a parameter.



