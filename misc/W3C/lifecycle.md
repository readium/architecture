# WP Manifest Life-cycle

This document is an experiment based on the Readium Web Publication Manifest to draft a Web Publication Manifest Lifecycle.

> **Note:** This experiment is essentially based on the [Manifest Life-cycle](https://w3c.github.io/manifest/#manifest-life-cycle) from the [Web App Manifest draft](https://w3c.github.io/manifest/).


## 1. Obtaining a manifest

> **Note:** In Readium, we use `manifest` as a rel plus a dedicated media type. This is based on the WP FPWD instead, where a dedicated `publication` rel is used instead.

The **steps for obtaining a manifest** are given by the following algorithm. The algorithm, if successful, returns a processed manifest and the manifest URL; otherwise, it terminates prematurely and returns nothing. In the case of nothing being returned, the user agent MUST ignore the manifest declaration. In running these steps, a user agent MUST NOT delay the load event.

1. From the Document of the top-level browsing context, let *origin* be the Document's origin, and *manifest* link be the first link element in tree order whose `rel` attribute contains the token `publication`.
2. If origin is an [HTML] opaque origin, terminate this algorithm.
3. If *manifest* link is `null`, terminate this algorithm.
4. If *manifest* link's `href` attribute's value is the empty string, then abort these steps.
5. Let *manifest URL* be the result of parsing the value of the href attribute, relative to the element's base URL. If parsing fails, then abort these steps.
6. Let request be a new [FETCH] request, whose URL is *manifest URL*, and whose context is `"publication"`.
7. If the *manifest* link's `crossOrigin` attribute's value is `'use-credentials'`, then set request's credentials to `'include'`.
8. Await the result of performing a fetch with request, letting response be the result.
9. If response is a network error, terminate this algorithm.
10. Let text be the result of UTF-8 decoding response's body.
11. Let *manifest* be the result of running processing a *manifest* given text, *manifest URL*, and the URL that represents the address of the top-level browsing context.
12. Return *manifest* and *manifest URL*.

> **Note:** There's no `publication` context currently defined, might need to revisit step 6.

## 2. Processing the manifest

1. Let json be the result of parsing text. If parsing throws an error:
    1. Issue a developer warning with any details pertaining to the JSON parsing error.
    2. Set json to be the result of parsing the string "{}".
2. If Type(json) is not Object:
    1. Issue a developer warning that the manifest needs to be an object.
    2. Set json to be the result of parsing the string "{}".
3. Extension point: process any proprietary and/or other supported members at this point in the algorithm.
4. Let *manifest* be the result of converting json to a `WebPublicationManifest` dictionary.
5. Set *manifest*["spine"] to the result of [processing the default reading order](#21-processing-the-default-reading-order) given *manifest*["spine"], *manifest URL*, and *document URL*.
7. Set *manifest*["metadata"["language"]] to the result of [processing the language]((#23-processing-the-language)) given *manifest*["metadata"["language"]], *manifest URL*, and *document URL*.
8. Return the manifest

> **Note:** I'm not sure if *manifest*["metadata"["language"]] is valid WebIDL.

### 2.1. Processing the default reading order

> **Note:** This is the most complex part of how the current WP Manifest is processed, mostly because we allow the default reading order to be defined in another document. I don't think that's a good idea, since it pretty much defeats the reason for having a manifest document at all.

1. If *manifest*["spine"] is not empty, set the *default reading order* to *manifest*["spine"] and terminate this algorithm.
2. If *manifest*["resources"] is not empty, let *navigation document URL* be the `href` of the first object where the `rel` attribute contains the `contents` token.
3. If *navigation document URL* is empty, use *document URL* as the *navigation document URL*.
4. Let request be a new [FETCH] request, whose URL is *navigation document URL*, and whose context is `"publication"`.
5. If the *manifest* link's `crossOrigin` attribute's value is `'use-credentials'`, then set request's credentials to `'include'`.
6. Await the result of performing a fetch with request, letting response be the result.
7. If response is a network error, terminate this algorithm.
8. Let resource be the result of UTF-8 decoding response's body.
7. If resource is not an [HTML] document, terminate this algorithm.
9. Let *default reading order* be the result of processing resource:
    1. If resource contains a `nav` element
        1. Extract a list of resource paths referenced from the `href` attribute of all `a` elements.
        2. Strip any fragment identifiers from the references.
        3. Resolve all relative paths to full URLs.
        4. Remove all consecutive references to the same resource, leaving only the first.
    2. Otherwise terminate this algorithm.
10. Return *default reading order*.

### 2.2. Processing the title

> **Note:** The FPWD has a long list of what a User Agent MIGHT do if the title is missing from the manifest. Is this something that we should have in this manifest life-cycle at all?

### 2.3. Processing the language

> **Note:** We probably need to process languages like in the WAM life-cycle.


## 3. Processing a Web Publication

### 3.1. Browsers and their extensions

Whenever an HTML resource is fetched by a browser or a dedicated extension, it should attempt to [obtain a manifest](#1-obtaining-a-manifest) and [process it](#2-processing-the-manifest).

If a *manifest* can be extracted, the User Agent SHOULD provide an affordance to enable a *Web Publication reader mode* for the current resource.

This affordance:

- MUST inform the user that the current resource is part of a Web Publication
- SHOULD contain the title of the Web Publication
- MAY contain additional metadata extracted from the Web Publication

Most browsers provide a reader mode with the following features:

- a distraction free reading environment (minimal UI and/or full screen display mode)
- user settings (font family, font size, themes, margins, text alignment)
- Text-to-speech

A *Web Publication reader mode* is an enhanced reader mode which MAY be built on top of the existing browser reader mode.

It MUST follow the requirements listed in "[Displaying a Web Publication](#33-displaying-a-web-publication)".

### 3.2. Dedicated native reading apps

If a manifest or an HTML resource is passed to a dedicated native reading app, it should follow the following steps:

1. If a manifest is passed directly to the User Agent (native apps can register file extensions and media types), skip directly to step 4.
2. If an HTML resource is passed to the User Agent, go through the steps listed in [obtaining a manifest](#1-obtaining-a-manifest).
3. If no manifest can be extracted from the HTML resource, terminate this algorithm. The User Agent MAY provide a fallback for such resources (extract metadata from it or display it directly).
4. If the User Agent has a list of publications that belong to the user, it MAY add the Web Publication to it by processing the manifest and extracting relevant metadata and/or resources (cover image for instance). In this case, it MUST store the manifest as well.
5. It MAY also cache resources listed in the default reading order and the resource list, to enable offline viewing.
6. It MAY display the Web Publication or prompt the user about it.

Suchs apps must follow the requirements listed in "[Displaying a Web Publication](#33-displaying-a-web-publication)". In addition, this specification recommends the following behavior for the User Agent:

- it SHOULD rely on the platform's native webview and/or APIs to display resources from the default reading order
- it MAY preload or prerender resources in the background to provide a smoother user experience

### 3.3. Displaying a Web Publication

When a User Agent displays a Web Publication:

- it MUST display the first resource in the default reading order, the first time that a Web Publication is displayed
- it MUST provide an affordance to move forward and backward in the default reading order
- it SHOULD save the user's reading position (current resource displayed plus position in that resouce) and use it as the starting position the next time that the Web Publication is displayed
- it SHOULD offer an affordance to enable offline reading


## 4. WebIDL

### 4.1. Readium Web Publication Manifest

> **Note:** This is a simplified version of what we usually work with in Readium-2, it's missing all the EPUB specific collections for what's usually contained in the NavDoc.

```webidl
dictionary WebPublicationManifest {
    sequence<USVString> context;
    Metadata            metadata;
    sequence<Link>      links;
    sequence<Link>      spine;
    sequence<Link>      resources;
};
```

### 4.2. Metadata

> **Note:** This is a simplified version compared to Readium Web Publication Manifest as well, limited to the WP infoset and a simplified model for expressing strings (single language, no sortable string).

```webidl
dictionary Metadata {
    USVString               title;          
    USVString               identifier;
    sequence<USVString>     author;
    sequence<USVString>     language;
    USVString               modified;
    USVString               publicationDate;
    ProgressionDirection    direction;
};
```

### 4.3. Link

> **Note:** Simplified as well, omitted `properties` and `duration` for now.

```webidl
dictionary Link {
    required    USVString           href;          
    required    USVString           type;        
                USVString           title;
                sequence<USVString> rel;
                DOMString           height;
                DOMString           width;
                boolean             templated;
};
```

### 4.4. Progression Direction

```webidl
enum ProgressionDirection {
    "ltr",
    "rtl",
    "auto"
};
```

## 5. Conclusion

- Obtaining a manifest for WP/RWPM is almost identical to the WAM
- The life-cycle of a Web Publication requires a lot less processing than the WAM
- It also has very little in common with the processing requirements of the WAM (only language is similar)
- The most complex part (by far) is the default reading order, since we allow its definition outside of the WP Manifest in a separate document
