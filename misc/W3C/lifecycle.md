# WP Manifest Life-cycle

This document is an experiment based on the Readium Web Publication Manifest to draft a Web Publication Manifest Lifecycle.

> **Note:** This experiment is essentially based on the [Manifest Life-cycle](https://w3c.github.io/manifest/#manifest-life-cycle) from the [Web App Manifest draft](https://w3c.github.io/manifest/).


## 1. Obtaining a manifest

> **Note:** In Readium, we use `manifest` as a rel plus a dedicated media type. This is based on the WP FPWD instead, where a dedicated `publication` rel is used instead.

The **steps for obtaining a manifest** are given by the following algorithm. The algorithm, if successful, returns a processed manifest and the manifest URL; otherwise, it terminates prematurely and returns nothing. In the case of nothing being returned, the user agent MUST ignore the manifest declaration. In running these steps, a user agent MUST NOT delay the load event.

1. From the Document of the top-level browsing context, let origin be the Document's origin, and *manifest* link be the first link element in tree order whose rel attribute contains the token `publication`.
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
5. Set *manifest*["spine"] to the result of running processing the `spine` member given *manifest*["spine"], *manifest URL*, and *document URL*.
7. Set *manifest*["metadata"["language"]] to the result of running processing the `language` member given *manifest*["metadata"["language"]], *manifest URL*, and *document URL*.
8. Return the manifest

> **Note:** I'm not sure if *manifest*["metadata"["language"]] is valid WebIDL.

### 3.1. Processing the default reading order

TODO

### 3.2. Processing the title

TODO

### 3.3. Processing the language

TODO


## 3. WebIDL

### 3.1. Readium Web Publication Manifest

> **Note:** This is a simplified version of what we usually work with in Readium-2, it's missing all the EPUB specific collections for what's usually contained in the NavDoc.

```webidl
dictionary WebPublicationManifest {
    USVString           context;
    Metadata            metadata;
    sequence<Link>      links;
    sequence<Link>      spine;
    sequence<Link>      resources;
};
```

### 3.2. Metadata

> **Note:** This is a simplified version compared to Readium Web Publication Manifest as well, limited to the WP infoest and a simplified model for expressing strings (single language, no sortable string).

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

### 3.3. Link

> **Note:** Simplified as well, omitted `properties` and `duration` for now.

```webidl
dictionary Metadata {
    required    USVString           href;          
    required    USVString           type;        
                USVString           title;
                sequence<USVString> rel;
                DOMString           height;
                DOMString           width;
                boolean             templated;
};
```

### 3.4. Progression Direction

```webidl
enum ProgressionDirection {
    "ltr",
    "rtl",
    "auto"
};
```
