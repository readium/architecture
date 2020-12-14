# Proposed solutions for limiting copy of Web content

## Control access to the publication

1.1/ Allow access to publications to authorized users only.

Users must be authenticated / authorized to access the manifest and all resources of a publication. 

The recommended solution is currently OAuth2.0. 

1.2/ Restrict concurrent access to resources from a given computer. 

The use of multi-threaded scripts, which can grab in parallel all resources of a publication once the manifest has been parsed, should be blocked by the server. 

An nginx server, for instance, can easily [limit access to proxied HTTP resources](https://docs.nginx.com/nginx/admin-guide/security-controls/controlling-access-proxied-http/). 

1.3/ Restrict replay of user requests. 

The use of scripts which replay user requests using the same HTTP parameters (including access tokens) should be blocked by the server. 

Replay attacks are mitigated by the use of short lived tokens, obfuscated timestamps ot tokens that can be used only once. There is no standard implementation of such protection.

## Hide the URLs of publication resources

2.1/ Do not reveal target URLs when interacted with (using mouse over, finger touch or keyboard focus).

A client-side Javascript technique is demonstrated in the prototype.

2.2/ Make resource URLs un-predictable. 

Avoid auto-incremented integers in resource names, like "chapter-1.html". 

## Block the copy of textual content

3.1/ Block selection of text in HTML content (using the mouse of keyboard shortcuts).

A client-side Javascript + CSS technique is demonstrated in the prototype.

3.2/ Block the copy to the clipboard of text in HTML content (using the context menu or keyboard shortcut).

A client-side Javascript technique is demonstrated in the prototype.

## Block the copy of HTML markup

4.1/ Block the access to the Web inspector / debugger via the context menu. 

This blocks access to the HTML markup, associated CSS stylesheets and Javascript code.

A client-side Javascript technique is demonstrated in the prototype. 

4.2/ Block the browser "view source" feature.

This blocks access to the HTML markup.

A server-side Javascript Node Express technique, with client-side Javascript execution, is demonstrated in the prototype.

4.3/ Block the browser "save as" feature.

This blocks the download of the HTML markup in a local file.

4.4/ Use a sandboxed iframe for displaying textual content.

This blocks the HTTP referer header to be provided to the destination URL / hosting server, during a cross-origin navigation. Additionally, the HTML documents can be hidden by default (CSS technique) and only displayed when certain conditions are met. 

A client-side Javascript + CSS technique is demonstrated in the prototype. 

## Block the copy of image content

5.1/ Block images to be dragged (using the mouse), then dropped into another document.

A client-side Javascript technique is demonstrated in the prototype.

5.2/ Block images to be easily copied or downloaded using the context menu.

This is obtained by blocking access to the context menu, as in item 8 before. It can also be obtained by adding a transparent 1 pixel layer over the image. 

5.3/ Obfuscate images server-side and de-obfuscate them when displayed. 

This makes images fetched from their URL unusable. It also blocks fetching resources from the cache of the Web browser.

A server-side Javascript Node Express technique, with client-side Javascript execution, is demonstrated in the prototype.

## Block direct fetching of resources from the server 

6.1/ Block resources to be fetched without an appropriate HTTP referer header.

This blocks fetching resources from e.g. a Web browser address bar, a curl or wget command etc. 

6.2/ Use HTTPS. 

This blocks resources to be grabbed by an HTTP proxy during their transmission from the server to the client.

## Block fetching resources from the cache of the Web browser

7.1/ Minimize the use of caching to use cases where it's truly needed (i.e. offline access).

7.2/ Do not use well-known file extensions when caching resources.

7.3/ Obfuscate resources when cached.

## Misc.

8.1/ Block the print feature (control key and context menu).

The print feature of the browser allows for an easy export of individual documents from the publication. 

A client-side Javascript technique is demonstrated in the prototype.

8.2/ Block Javascript to be turned-off. 

Several solutions listed in this document rely on Javascript to disable browser functionalities like right-click, selection, drag&drop and activation of the debugger. However it is easy to turn-off Javascript using 3rd party plugins or by selecting the ‘disable JavaScript’ option in the debugger settings of the web browser.

Integrating a "noscript" tag in the HTML content can neutralize this reaction.

8.3/ Insert invisible watermarks into content.

Invisible watermarks inserted into image and textual content, with user specific data embedded, may help tracking over-shared content.

## Limitations of the recommended solutions. 

9.1/ Access to the DOM using customized Web browsers

Customized web browsers developed using open-source browser engines like Webkit or Chromium can access the DOM of the different publication resources without going through the browser debugger. 

Even though resources may be obfuscated server side and de-obfuscated client side, each resource must be de-obfuscated before being displayed in the Web browser. Accessing the DOM therefore gives also access to de-obfuscated resources.

This practice does not have proper counter protection measures.

9.2/ Access to the URLs of the resources of a Web Publication

Even though  source URLs can be made inaccessible from a Web browser, an HTTP analyzer can see the exact URL of the source resource in the data transmitted.

9.3/ Screen capture.

Even if 3rd party (and complex) anti-capture applications may prevent screen capture on some operating systems, there is no proper way to fill the analog hole, which consists in capturing screen content (including video content) and recreate the content of a publication semi-automatically, using OCR techniques on textual content. People can also re-type the content, use a camera to grab the screen, use OCR on a print book ...


