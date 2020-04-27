# Audiobooks, mapping of the W3C format

## Reference Documents

### From the W3C - explainers
[W3C Web Publication explainer](https://github.com/w3c/wpub/blob/master/explainers/wpub-explainer.md)
[W3C Audiobook explainer](https://github.com/w3c/wpub/blob/master/explainers/audio-explainer.md)

### From the W3C - specifications
[Publication Manifest](https://www.w3.org/TR/pub-manifest/)]
[Audiobook Profile for Publication Manifest](https://www.w3.org/TR/audiobooks/)
[Lightweight Packaging Format](https://www.w3.org/TR/lpf/)

Note: An Audiobook can live on the Open Web Platform or be downloaded in a packaged form. 

### From Readium / EDRLab
[Readium Web Publications, Audiobook Profile](https://github.com/readium/webpub-manifest/blob/master/extensions/audiobook.md)

### Accessible EPUB 3 Audiobook profile, by Daisy
[DAISY, Navigable audio-only EPUB3 Guidelines](http://www.daisy.org/ties/navigable-audio-only-epub3-guidelines)

## Context and type

W3C Publications require

```json
 "@context": [
   "https://schema.org",
   "https://www.w3.org/ns/pub-context"
 ],
 "conformsTo": "https://www.w3.org/TR/audiobooks/",
````

While Readium Web Publications require

```json
  "@context": "http://readium.org/webpub-manifest/context.jsonld",
  "metadata": {
      "@type": "https://schema.org/Audiobook",
   },
  ````

**Mapping:**

*   the W3C @context property is ignored, the Readium @context property is static
*   the W3C "conformsTo" property value is tested: if its value corresponds to an audiobook, the Readium "metadata/@type" property value is set to "https://schema.org/Audiobook", else it is set to "https://schema.org/CreativeWork" (this is a generic fallback).  


## Identifiers

W3C Web Publications can be identified by:

*   a _canonical identifier_ implemented as the JSON-LD "id" property. It is  recommended but still optional; it must be a URL and should resolve to the Web Publication.
*   an _address_ implemented as the "url" property. It is optional and resolves (on the Web) to the PEP of the Web Publication. 
*   alternative identifiers implemented as schema.org identifier properties. See a JSON-LD example at "https://schema.org/identifier"; this is a JSON object, not a literal. 
*   alternative identifiers implemented as schema.org sub-properties of "identifier", especially "isbn". 

Readium Web Publications require an "identifier" property, which is equivalent to the JSON-LD "id" property and must be "a valid URI" (i.e. a literal). 

**Mapping:**

*   the "id" property is mapped to the "identifier" property as-is.
*   if "id" is missing and "url" is present, the latter is mapped to the "identifier" property as-is.
*   if both are missing, a UUID is generated as Readium "identifier".
*   "isbn" is mapped as-is.  
*   other identifier properties potentially present in the source manifest are lost in translation.


## Descriptive metadata

Readium metadata are included in a "metadata" wrapper, W3C metadata are not. 

**Mapping:**

*   Every metadata property found in the W3C manifest is copied as-is into the Readium manifest, with the following exceptions:


<table>
  <tr>
   <td>
W3C
   </td>
   <td>Readium
   </td>
  </tr>
  <tr>
   <td>name (1)
   </td>
   <td>title (2)
   </td>
  </tr>
  <tr>
   <td>duration
   </td>
   <td>duration (3)
   </td>
  </tr>
  <tr>
   <td>inLanguage
   </td>
   <td>language
   </td>
  </tr>
  <tr>
   <td>datePublished
   </td>
   <td>published (4)
   </td>
  </tr>
  <tr>
   <td>dateModified
   </td>
   <td>modified (5)
   </td>
  </tr>
  <tr>
   <td>readBy
   </td>
   <td>narrator (6)
   </td>
  </tr>
</table>


1. see localized properties below
2. If "name" is missing (even if required), "title" is set to an empty string, 
3. **duration**: W3C and Readium use a different format. W3C is using the ISO duration format (usually "PxHyMzS") where Readium is using seconds. A subroutine must be written to transform one to the other.  
4. Readium: this is a date, W3C: date or date-time
5. Readium: this is a date-time, W3C: date or date-time
6. readyBy and narrator are contributors and therefore mapped as named entities (see below)


#### Dublin core properties

A W3C manifest may contain properties not defined in its schema, especially Dublin Core properties. Such properties have great chances to be represented using a ‘dcterms’ prefix. 

We‘ll therefore map the following properties:


<table>
  <tr>
   <td>W3C
   </td>
   <td>Readium
   </td>
  </tr>
  <tr>
   <td>dcterms:description (1)
   </td>
   <td>description 
   </td>
  </tr>
  <tr>
   <td>dcterms:subject (2)
   </td>
   <td>subject (3)
   </td>
  </tr>
</table>




1. A unique description is processed, as a string
2. Multiple subjects are processed, as an array of strings
3. Readium subjects are complex objects, [see the spec](https://github.com/readium/webpub-manifest/tree/master/contexts/default#subjects). Only the "name" property is filled, with each source subject value.


### Localized properties

Localized and multilingual properties are accepted in both W3C and W3C manifests, but with a slightly different format.  

W3C localized properties are:



*   name (descriptive metadata)
*   name (of a named entity)
*   name (of a link)
*   description (of a link)
*   accessibilitySummary

W3C flavor: 


```
{
 "name": {
   "value"     : "HTML היא שפת סימון.",
   "language"  : "he",
   "direction" : "rtl"
 },
 "name": [
   {
     "value"     : "HTML היא שפת סימון.",
     "language"  : "he",
     "direction" : "rtl" 
   },
   {
     "value"     : "HTML is a markup language",
     "language"  : "en",
     "direction" : "ltr" 
   }
 ]
}
```


Readium flavor: 


```
 "title": {
   "fr": "Vingt mille lieues sous les mers",
   "en": "Twenty Thousand Leagues Under the Sea",
   "ja": "海底二万里"
 }
```


While the addition of a direction metadata is discussed in a [webpub-manifest issue](https://github.com/readium/webpub-manifest/issues/33), this is still not a viable option in JSON-LD. As the use of a direction will be rare in W3C manifests, we will accept to loose this information during translation. 

**Mapping:**

*   for each localized property, use the value of "language" as name of a Readium property and use the value of "value" as value of this property. 


## Named entities / Contributors

W3C named entities (e.g. contributors) are defined [here](https://www.w3.org/TR/pub-manifest/#value-entity). Each has: 

*   type (array of literals e.g. "Person")
*   name (array of localizable strings, i.e. W3C localized property)
*   id (URL identifier)
*   url (URL address)
*   identifier (array of literals e.g. "orcid:12345") 

Readium contributors are defined [here](https://github.com/readium/webpub-manifest/tree/master/contexts/default#contributors), with [this json schema](https://readium.org/webpub-manifest/schema/contributor-object.schema.json). Each has:

*   name (localized property, required)
*   identifier (URL identifier)
*   sortAs (string)
*   role (string or array of string)
*   position (number)
*   links (array of link objects)

Properties which handle contributors can be a plain literal, a single object or an array of objects mixed with literals. 

**Mapping:**


<table>
  <tr>
   <td>W3C
   </td>
   <td>Readium
   </td>
  </tr>
  <tr>
   <td>name
   </td>
   <td>name
   </td>
  </tr>
  <tr>
   <td>id
   </td>
   <td>identifier
   </td>
  </tr>
</table>



## Linked resources

W3C Linked resources are defined [here](https://www.w3.org/TR/pub-manifest/#value-linked-resource). A W3C link has:



*   type (always " LinkedResource" in practice; seen as a JSON-LD requirement)
*   url (URL)
*   encodingFormat (media type)
*   name (Array of Localizable Strings)
*   description (Array of Localizable Strings)
*   rel (Array of Literals)
*   integrity (Literal)
*   duration (iso8601)
*   alternate (Array of Linked Resources)

Readium Link Objects are defined [here](https://github.com/readium/webpub-manifest#24-the-link-object). A Readium link has:


*   href (URI)
*   templated (Boolean)
*   type (media type)
*   title (String)
*   rel (Array of strings)
*   properties (Object)
*   duration (Number)
*   height
*   width
*   bitrate
*   language
*   alternate (Array of Link Objects)
*   children (Array of Link Objects)

**Mapping:**


<table>
  <tr>
   <td>W3C
   </td>
   <td>Readium
   </td>
  </tr>
  <tr>
   <td>url
   </td>
   <td>href
   </td>
  </tr>
  <tr>
   <td>encodingFormat
   </td>
   <td>type (1)
   </td>
  </tr>
  <tr>
   <td>name
   </td>
   <td>title (2)
   </td>
  </tr>
  <tr>
   <td>rel
   </td>
   <td>rel
   </td>
  </tr>
  <tr>
   <td>duration
   </td>
   <td>duration (3)
   </td>
  </tr>
  <tr>
   <td>alternate (4)
   </td>
   <td>alternate (5)
   </td>
  </tr>
</table>


Other W3C properties are lost in translation. 



1. "encodingFormat" is optional but "type" is required in the Readium audiobook profile. This will force sniffing the mime-type for the file extension in the URL. 
    1. .mp3 -> audio/mpeg
    2. .aac -> audio/aac
    3. .wav -> audio/wav
    4. .opus -> audio/ogg
    5. jpeg or jpg -> image/jpeg
    6. .png -> image/png
    7. .gif -> image/gif
    8. .webp -> image/wepb
    9. .json -> application/json
    10. .html -> text/html
    11. .css -> test/css
    12. .js -> application/javascript
    13. .epub -> application/epub+zip
    14. .pdf -> application/pdf

	etc. 

	If no file extension is found in the source url, define an empty string for type. 

2. "name" is a localized property, but "title" is a string. In case "name" as multiple values (which should be very rare), **let’s keep only the first in sequence (whatever its language is).**  
3. Same mapping as for the "duration" of the publication.
4. the W3C alternate property can be a simple string, while the Readium alternate property is an array of link objects. 
5. The mapping of sub-properties of alternate (i.e. new links) is identical to the one described here (recursive explanation).   

**Note about the Primary Entry Page:**

It is an important HTML resource in the W3C Audiobooks format: 

*   the address of the Web Publication ("url" property, optional) is the URL of this entry page.
*   it SHOULD contains the HTML ToC of the publication. 

Acknowledging that audiobooks a usually created by audio recording studios "outside of the Web", it has been decided that the Primary Entry Page (PEP) is optional in W3C Web Publications. If present, it should be listed in the publication resources (and not in the reading order).  Therefore the mapping of resources described here solves this case. 

**Note about the Cover:**

This processing also solves the case of an audiobook cover, implemented as a linked resource with the same rel value in both W3C and Readium flavors. 


### Table of Contents

In the case of **W3C Web Publications**, it is an HTML page with a [restricted structure](https://www.w3.org/TR/audiobooks/#audio-toc) typically starting with a &lt;nav role="doc-toc"> or &lt;section role="doc-toc"> element ([samples](https://www.w3.org/TR/audiobooks/#audio-toc-examples)).

W3C example:


```
<body>
  <nav role="doc-toc">
    <h1>Flatland</h1>
    <ol>
      <li><a href="track1.mp3#t=71">Part 1 - This World</a></li>
      <li>
        <ol>
          <li>a href="track1.mp3#t=80" >Section 1 - Of the Nature of Flatland</a></li>
          <li>a href="track1.mp3#t=415">Section 2 - Of the Climate and Houses in Flatland</a></li>
          <li>a href="track1.mp3#t=789">Section 3 - Concerning the Inhabitants of Flatland</a></li>
        </ol>
      </li>
    </ol>
  </nav>
</body>
```


Such ToC is referenced from the manifest using a specifc rel attribute with value "contents". The ToC may be placed in the Primary Entry Page, as a standalone resource in the reading order or as an extra-resource. 

For the W3C WG, using HTML is a guarantee of extended internationalization.  

In the case of **Readium Web publications**, it is a [JSON structure](https://github.com/readium/webpub-manifest/tree/presentation-hints#5-table-of-contents) embedded in the manifest. 

Readium example:

```json
"toc": [
  {
    "href": "track1.mp3#t=71",
    "title": "Part 1 - This World",
    "children": [
      {
        "href": "track1.mp3#t=80",
        "title": "Section 1 - Of the Nature of Flatland"
      },
      {
        "href": "track1.mp3#t=415",
        "title": "Section 2 - Of the Climate and Houses in Flatland"
      },
      {
        "href": "track1.mp3#t=789",
        "title": "Section 3 - Concerning the Inhabitants of Flatland"
      }
    ]
  }
]
```


**Mapping:**

*   In the initial version, a Readium Web Publication Manifest will simply identify an HTML or XHTML resource in _readingOrder_ or _resources_ as a table of contents using the _contents_ link relation -> this is treated in a preceding section). 
*   In a second version, a simple mapping (still tbd) with be developed. If this mapping fails, no ToC will be present in the Readium manifest and the reading system will use the reading order as a fallback. 


### Accessibility metadata

The W3C specification of accessibility metadata is [here](https://www.w3.org/TR/pub-manifest/#accessibility). 

*   accessMode is an Array of Literals (strings)
*   accessibilityFeature is an Array of Literals
*   accessibilityHazard is an Array of Literals
*   accessibilitySummary is an Array of Localizable Strings
*   accessModesufficient is an Array of Objects (see mapping)

Some useful links:

[Daisy, schema.org accessibility metadata](http://kb.daisy.org/publishing/docs/metadata/schema.org/)

[W3C Wiki WebSchemas Accessibility](https://www.w3.org/wiki/WebSchemas/Accessibility)

Additional properties (supported in R2, not explicitly in W3C spec.):

[Daisy evaluation metadata](http://kb.daisy.org/publishing/docs/metadata/evaluation.html)

Related discussions:

[Readium architeture #94](https://github.com/readium/architecture/issues/94#issuecomment-613965656)

Draft Readium parsing rules:

[Jiminy a11y metadata parsing](https://github.com/JayPanoz/architecture/blob/a11y-metadata-parsing/streamer/parser/a11y-metadata-parsing.md)

Code references:

[r2-shared-js/metadata.ts#L66-L220](https://github.com/readium/r2-shared-js/blob/9a9abe127b03097191ea7221a091a3dc48227ea8/src/models/metadata.ts#L66-L220)

[r2-shared-js/epub.ts#L500-L673](https://github.com/readium/r2-shared-js/blob/9a9abe127b03097191ea7221a091a3dc48227ea8/src/parser/epub.ts#L500-L673)

[readium/r2-shared-js/metadata.ts#L646-L667](https://github.com/readium/r2-shared-js/blob/9a9abe127b03097191ea7221a091a3dc48227ea8/src/models/metadata.ts#L646-L667)

**Mapping:**

*   **accessMode**, **accessibilityFeature** and **accessibilityHazard** are mapped directly as string arrays. 
*   **accessibilitySummary** is processed like other localized properties.
*   **accessModeSufficient**: the type and optional description are simply lost. Here is a W3C sample

    ```json
       "accessModeSufficient"    : [
            {
                "type"            : "ItemList",
                "itemListElement" : ["textual", "visual"]
            },
            {
                "type"            : "ItemList",
                "itemListElement" : ["textual"]
            }
        ],

    ```


and the corresponding Readium snippet


```
       "accessModeSufficient"    : [["textual","visual"],["textual"]],
```



## Audiobook samples


### EDRLab

Several test files in W3C and Readium formats are placed [on GDrive](https://drive.google.com/drive/folders/1vVvGcoYqYf1PXBYNxuy382OfW7QQIRs4?usp=sharing). 


### Readium

Flatland and MobyDick in Readium Format (unzipped) are available on [Github / webpub-manifest](https://github.com/readium/webpub-manifest/tree/master/examples).


### W3C

A W3C manifest is available on the [Github / W3C / audiobooks](https://github.com/w3c/audiobooks/tree/master/experiments). 


### Internet Archive

The Internet Archive (Librivox) is exposing a collection of audiobooks online, with  Readium WebPub Manifest. The corresponding Atom feed is: [https://bookserver.archive.org/group/openaudiobooks](https://bookserver.archive.org/group/openaudiobooks)

An example of RWPM is [https://api.archivelab.org/books/art_letters_1809_librivox/opds_audio_manifest](https://api.archivelab.org/books/art_letters_1809_librivox/opds_audio_manifest)

They are accessible online, e.g. not packaged as zip.

These samples are still buggy (tracks are duplicated where there should be alternate resources, bitrates should be floats). I’ve requested a change to the people at the Internet Archive, with no response.
