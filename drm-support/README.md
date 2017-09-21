# Readium LCP DRM support in Readium-2

This document describes how a R2 based app should handle DRMs. It details the Readium LCP support, but other DRM modules should be handled the same way.

A protected publication may be imported in an R2 app in two ways: 
- import of a protected EPUB, i.e. an EPUB containing a DRM license;
- import of a DRM licence, e.g. a .lcpl file

These resources may be imported via side loading (Open with ... from  a web page on a mobile app, Open file ... in a desktop app), via an OPDS feed or any other supported way to access extenal resources.

To get more details about Reading system behavior in a Readium LCP context,  please read the [Readium LCP spec](https://readium.github.io/readium-lcp-specification/), specifically section 7 (Reading System Behavior). 

## Being ready
A Readium LCP compliant app must embed a root certificate provided by the DRM administrator.  

A Readium LCP compliant app must update on a regular basis (maybe each time the app is launched, on a weekly basis) the certificate revocation list (CRL) associated with the DRM.

A Readium LCP compliant app must generate a unique device id and human readable device name at install time. 

A quick note about the device ID: both Android and iOS "launcher app" default open-source implementations use UUID coupled with a per-app-install persistent storage (i.e. device "id" gets wiped and renewed if app is removed then reinstalled).

[Android sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/android/lib/src/clientlib/java/org/readium/sdk/lcp/StatusDocumentProcessing.java#L62-L70) and [Android sample 2](https://github.com/readium/SDKLauncher-Android/blob/bbe16a5a8655d8e7260a2bc4a0e011a8419bf782/SDKLauncher-Android/app/src/main/java/org/readium/sdk/android/launcher/ContainerList.java#L448-L515)


[iOS sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/apple/src/LCPStatusDocumentProcessing.h#L29-L36) and [iOS sample 2](https://github.com/readium/SDKLauncher-iOS/blob/96f23bdc4cd9d5c0507c7aa3a6828d7c4fbc0e75/Classes/LCPStatusDocumentProcessing_DeviceIdManager.mm#L35-L118)


## Importing a protected EPUB
An app which imports an EPUB will follow these steps:

### 1/ Check if the EPUB is DRM protected

An LCP protected publication is signaled by the presence of a license document (META-INF/license.lcpl) plus certain specific values in META-INF/encryption.xml which indicate which resources are encrypted and with which algorthm. 

As the licence document is mandatory, the app must raise an error if this file is missing but the content is declared encrypted. Also, the app should check that all resources referenced in encryption.xml are found in the EPUB archive.

### 2/ Validate the license structure

The app checks that the license is valid (EDRLab provides a JSON schema for LCP licenses in the EDRLab github, lcp-testing-tools). 

### 3/ Get the passphrase associated with the license

Each LCP license is associated with a passphrase. The app must:

3.1/ Check if a passphrase hash has already been stored for the license. 

3.2/ Check if one or more passphrase hash associated with licenses from the same provider have been stored. If yes, the app calls the r2-lcp-client library (C++) with the license key_check and the array of passphrase hash as parameters. The lib returns the correct passphrase, if any.

3.3/ Display the hint and ask the passphrase to the user.

3.4/ Store the passphrase hash + license id tuple securely.

### 4/ Validate the license integrity

Before checking the license status, it's good to verify the license integrity.

The app calls the r2-lcp-client library (C++) with the passphrase hash, the license and CRL as parameters.

The r2-lcp-client library will:

* check that the provider certificate was not expired when the license was last updated;
* check the signature of the provider certificate using the embedded root certificate;
* check that the provider certificate is not in the CRL; 
* validate the signature of the license;
* return a "context" structure, to be used later in decryption calls.

See the Readium LCP spec section 5.5 for additional details. 

### 5/ Check the license status

An LCP license may contain a "status" link, i.e. a link to a status document. If it is the case, and if the app is online, the app will silently (= non-blocking for the user):

5.1/ Fetch the status document

5.2/ Validate the structure of the status document

5.3/ Check that the status is "ready" or "active".

If this is not the case (revoked, returned, cancelled, expired), the app will notify the user and stop there.

### 6/ Process a license update 

The status document contains the information necessary to process a license update. In such a case, the app must:

6.1/ Fetch the updated license.

6.2/ Validate the updated license (see sections 2 and 4). If the updated license is not valid, the app must keep the current one. 

6.3/ Replace the current license by the updated one in the EPUB archive. 

During this time the user can read the book if the current license allows for it.  

Special case: the device may face an _expired_ license, which has been extended from a library portal. In this case the user can click a call to action like “It seems that this license has expired : check if it has been extended”. This is a synchronous call, the user can wait for 5 sc; the new license is fetched and validated. 

### 7/ Check the date rights

An LCP license handles a datetime start and datetime end, which must be compared with the system datetime. It the test is negative, the app will notify the user and stop there. 

### 8/ Register the device / license if needed

The app must:

8.1/ check if the device / license is already registered. If it is the case, the app moves on. 

8.2/  call the "register" link associated with the license id, passing a device id and device name as parameters.

8.3/ Store the fact the the device / license has been registered.




## Importing a DRM license
An app which imports a DRM license will follow these steps (see the previous section for more details):

### 1/ Validate the license structure

### 2/ Get the passphrase associated with the license

### 3/ Validate the license integrity

### 4/ Check the license status

### 5/ Process a license update

The process is the same as above, but the license cannot be inserted in the publication yet. 

### 6/ Fetch the encrypted publication

In the LCP use case, the app will use the "publication" link. It will store the encrypted publication and insert the license as META-INF/license.lcpl. 

### 7/ Check the date rights

### 8/ Register the device / license if needed


## Read the publication

For each encrypted resource or chunk, the app will call r2-lcp-lib (C++), passing the context previously initialized and encrypted content as parameters.


## Check the print & copy rights

Each time the user decides to print a page or copy a range of characters, the app will 

### 1/ check the current counter vs the corresponding right 

The app will verify that the stored counter plus the additional volume to be printed or copied does not exceed the rights expressed in the license. 

### 2/ store the new counter





