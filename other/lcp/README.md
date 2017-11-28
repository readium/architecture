# Readium LCP DRM support in Readium-2

This document describes how a R2 based app should handle DRMs. It details the Readium LCP support, but other DRM modules should be handled the same way.

A protected publication may be imported in an R2 app in two ways: 
- import of a protected EPUB, i.e. an EPUB containing a DRM license;
- import of a DRM licence, e.g. a .lcpl file

These resources may be imported via side loading (Open with ... from  a web page on a mobile app, Open file ... in a desktop app), via an OPDS feed or any other supported way to access extenal resources.

To get more details about Reading system behavior in a Readium LCP context,  please read the [Readium LCP spec](https://readium.github.io/readium-lcp-specification/), specifically section 7 (Reading System Behavior). 

## Being ready
A Readium LCP compliant app must embed a root certificate provided by the DRM administrator.  

A Readium LCP compliant app must update the Readium LCP certificate revocation list (CRL) on a regular basis (e.g. on a weekly basis, at the time the app is launched).

A Readium LCP compliant app must generate a unique device id and human readable device name at install time. 

A quick note about the device ID: both Android and iOS "launcher app" default open-source implementations use UUID coupled with a per-app-install persistent storage (i.e. device "id" gets wiped and renewed if app is removed then reinstalled).

[Android sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/android/lib/src/clientlib/java/org/readium/sdk/lcp/StatusDocumentProcessing.java#L62-L70) and [Android sample 2](https://github.com/readium/SDKLauncher-Android/blob/bbe16a5a8655d8e7260a2bc4a0e011a8419bf782/SDKLauncher-Android/app/src/main/java/org/readium/sdk/android/launcher/ContainerList.java#L448-L515)


[iOS sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/apple/src/LCPStatusDocumentProcessing.h#L29-L36) and [iOS sample 2](https://github.com/readium/SDKLauncher-iOS/blob/96f23bdc4cd9d5c0507c7aa3a6828d7c4fbc0e75/Classes/LCPStatusDocumentProcessing_DeviceIdManager.mm#L35-L118)


## Check if the EPUB is DRM protected

An LCP protected publication is signaled by the presence of a license document (META-INF/license.lcpl) plus certain specific values in META-INF/encryption.xml which indicate which resources are encrypted and with which algorthm. 

As the licence document is mandatory, the app must raise an error if this file is missing but the content is declared encrypted. Also, the app should check that all resources referenced in encryption.xml are found in the EPUB archive.


## Open a protected publication
An app which imports or opens an EPUB will follow these steps:

### 1/ Validate the license structure

The app checks that the license is valid (EDRLab provides a JSON schema for LCP licenses in the EDRLab github, lcp-testing-tools). 

### 2/ Get the passphrase associated with the license

Each LCP license is associated with a passphrase. The app must:

1/ Check if a passphrase hash has already been stored for the license. If yes, the app calls the r2-lcp-client library (C++) with the license key_check and the passphrase hash as parameters. The lib returns the passphrase hash, or an error if the passphrase is incorrect.

2/ Check if one or more passphrase hash associated with licenses from the same user (by user id) have been stored. In case the user id has not been given in the license (it is highly recommended but not required), this optimization can't be done. If one or more values are found, the app calls the r2-lcp-client library (C++) with the license key_check and the array of passphrase hash as parameters. The lib returns the correct passphrase, if any, or an error if none is correct. 

3/ Display the hint and ask the passphrase to the user. The app the calls the r2-lcp-client library (C++) with the license key_check and the passphrase as parameters. Note that the hash algorithm may depend on the LCP profile used in the license; therefore the app lets the lib calculate this hash value. The lib returns the passphrase hash, or an error if the passphrase is incorrect.

4/ Store the passphrase hash + license id tuple securely.

### 3/ Validate the license integrity

Before checking the license status, it's good to verify the license integrity.

The app calls the r2-lcp-client library (C++) with the passphrase hash, the license and CRL as parameters.

The r2-lcp-client library will:

* check the signature of the provider certificate using the embedded root certificate;
* check that the provider certificate is not in the CRL; 
* check that the provider certificate was not expired when the license was last updated;
* validate the signature of the license;
* check the user key;
* check the date rights. An LCP license handles a datetime start and datetime end, which must be compared with the system datetime.
* return a "context" structure, to be used later in decryption calls.

See the Readium LCP spec section 5.5 for additional details. 


### 4/ Check the license status

An LCP license may contain a "status" link, i.e. a link to a status document. If it is the case and if the app is online, the app must:

1/ Fetch the status document

2/ Validate the structure of the status document

3/ Check that the status is "ready" or "active".

If this is not the case (revoked, returned, cancelled, expired), the app will notify the user and stop there.

### 5/ Register the device / license 

If the app is online, it must silently (= non-blocking for the user):

1/ check if the device / license is already registered. If it is the case, the app moves on. 

2/  call the "register" link associated with the license id, passing a device id and device name as parameters. In case of error, the app must let the user read the publication. 

3/ Store the fact the the device / license has been registered.



## Import a DRM license

An app which imports a DRM license will follow these steps (see the previous section for more details):

### 1/ Validate the license structure

### 2/ Get the passphrase associated with the license

### 3/ Validate the license integrity

### 4/ Check the license status

### 5/ Fetch the encrypted publication

In the LCP use case, the app will use the "publication" link. It will store the encrypted publication and insert the license as META-INF/license.lcpl. In case of error, the user is notified and the app stops there. 

### 6/ Register the device / license



## Decrypt a publication

For each encrypted resource or chunk, the app will call r2-lcp-lib (C++), passing the context previously initialized and the encrypted content as parameters.



## Update a license

The update of a license is processed in two cases:

1/ **At the time the publication is closed**. This is because a license update can take some time in case of bad network connectivity, therefore doing so when the publication is open, after downloading a status document (which is mandatory and may already take some time) is not the best approach. Also, the update of the license in the publication must be done when the publication is closed, not during its use by the streamer.

2/ **From the app "catalog view"**, i.e. at the time the user can choose to open a publication. 
 
This is a special case, when the user faces an _expired_ publication (displayed as an icon on the catalog view), for a loan which may have been extended from a library portal. In this case the user can click a **call to action** meaning “This license has expired : check if the loan has been extended”. This is a synchronous call, the user can wait for a few seconds; the new license is fetched and stored, then the publication is open. The user has also the possibility to remove the publication from the catalog. 

In each case, if the app is online, the status document has been fetched correctly and the date of update of the license is more recent that the date of the current license, the app must silently:

1/ Get the 'license' link in the status document.

2/ Fetch the updated license.

3/ Validate the structure of the updated license. In cas of error, the app must keep the current license. 

4/ Replace the current license by the updated one in the EPUB archive. 

If the user has explicitly requested a license update, the new status is displayed in the catalog view.   





## Check the print & copy rights

Each time the user decides to print a page or copy a range of characters, the app will 

### 1/ check the current counter vs the corresponding right 

The app will verify that the stored counter plus the additional volume to be printed or copied does not exceed the rights expressed in the license. 

### 2/ store the new counter





