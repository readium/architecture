# Aspects of Web content which allow easy copy

## Uncontrolled access to the publication

1.1/ The Web Publication manifest and all resources of a publication are accessible without proper authorization.

1.2/ Concurrent access to the resources of a publication is possible from multi-threaded scripts, allowing a great optimization of content grabbing.

1.3/ Replay of fetch commands is easy, even after some time has passed.  

## Discovery of the URLs of publication resources

2.1/ Hyperlinks in HTML content reveal target URLs when interacted with (using mouse over, finger touch or keyboard focus).

2.2/ Resource URLs are predictable.

## Copy of textual content

3.1/ Text in HTML content can be selected (using the mouse of keyboard shortcuts)

3.2/ Once selected, text in HTML content can be copied to the clipboard (using the context menu or keyboard shortcut).

## Copy of HTML markup

4.1/ The Web inspector / debugger can be opened via the context menu, offering access to the HTML markup, associated CSS stylesheets and Javascript code. 

4.2/ The browser "view source" feature displays the HTML markup. 

## Copy of image content

5.1/ Images can be dragged (using the mouse), then dropped into another document.

5.2/ Images can be easily copied or downloaded (using the context menu). 

5.3/ Images can be fetched from their URL, if known. 

## Direct fetching of resources from the server 

6.1/ Resources are obtained from any client without an appropriate HTTP referer header (URL obtained via the Web browser address bar or tools like curl / wget).

6.2/ Resources are grabbed by an HTTP proxy, during their transmission from the server to the client. 

## Fetch of resource from the cache of the Web browser

7.1/ Non-obfuscated resources are copied from the cache of the Web browser. 

## Misc.

8.1/ The print feature of the browser allows for an easy export of individual documents from the publication. 

8.2/ Screen capture tools (including video capture like Snagit or Camtasia), associated with proper OCR for textual content, allows user to recreate the content of a publication semi-automatically.


