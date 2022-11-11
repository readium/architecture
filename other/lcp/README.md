# Readium LCP DRM support in Readium-2

This document describes how a R2 based app should handle DRMs. It details the Readium LCP support, but other DRM modules should be handled the same way.

A protected publication may be imported in an R2 app in two ways: 
- import of a protected EPUB, i.e. an EPUB containing a DRM license;
- import of a DRM licence, e.g. a .lcpl file

These resources may be imported via side loading (Open with ... from  a web page on a mobile app, Open file ... in a desktop app), via an OPDS feed or any other supported way to access extenal resources.

To get more details about Reading system behavior in a Readium LCP context,  please read the [Readium LCP spec](https://readium.org/lcp-specs/releases/lcp/latest), specifically section 7 (Reading System Behavior). 

## Being ready
A Readium LCP compliant app must embed a root certificate provided by the DRM administrator.  

A Readium LCP compliant app must update the Readium LCP certificate revocation list (CRL) on a regular basis (e.g. on a weekly basis, at the time the app is launched).

A Readium LCP compliant app must generate a unique device id and human readable device name at install time. 

A quick note about the device ID: both Android and iOS "test app" open-source implementations use a UUID coupled with a per-app-install persistent storage (i.e. the device "id" is renewed and the persistent storage re-created if the app is removed then reinstalled).

[Android sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/android/lib/src/clientlib/java/org/readium/sdk/lcp/StatusDocumentProcessing.java#L62-L70) and [Android sample 2](https://github.com/readium/SDKLauncher-Android/blob/bbe16a5a8655d8e7260a2bc4a0e011a8419bf782/SDKLauncher-Android/app/src/main/java/org/readium/sdk/android/launcher/ContainerList.java#L448-L515)

[iOS sample 1](https://github.com/readium/readium-lcp-client/blob/cd65c5e5615828c41aded659a9d518059149c1f9/platform/apple/src/LCPStatusDocumentProcessing.h#L29-L36) and [iOS sample 2](https://github.com/readium/SDKLauncher-iOS/blob/96f23bdc4cd9d5c0507c7aa3a6828d7c4fbc0e75/Classes/LCPStatusDocumentProcessing_DeviceIdManager.mm#L35-L118)







