# Parsing EPUB Metadata

The goal of this document is to provide directions that each implementation of Readium can follow when parsing EPUB 2.x and 3.x publications.

While the default context is very flexible in the way each metadata can be represented, when parsing a publication in the streamer we always use the most complex form for each metadata to harmonize our output.

Related Repository: [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest)

## Localized Strings

In many cases, the default context supports alternate representations of the same string in different scripts and languages by means of JSON-LD language maps.
To fill such a map from an EPUB metadata element, proceed as follows:

* Determine the language used in the content of the carrying element as defined in [the XML specification](https://www.w3.org/TR/xml/#sec-lang-tag),
  i.e. check whether the carrying element has or inherits an `xml:lang` attribute.
* In the EPUB 3.x case, check if the element is refined by some `meta` elements that have or inherit an `xml:lang` attribute and whose property is `alternate-script`.
  For each one, add to the map the corresponding language associated with the content of the `meta` element.
* When no language hint is available, use `null` or `und` depending on the platform.

## Sorting keys

Localized sorting keys are supported in RWPM for publication title, contributor/collection' names and subject' names. While computing the localized string, use the language of the carrying element as defined in [the XML specification](https://www.w3.org/TR/xml/#sec-lang-tag) and fallback to `null` or `und`.

## Title

The `title` and `sortAs` keys of a publication are objects where each key is a BCP 47 language tag and each value of this key is a string.

When parsing an EPUB, we need to establish:

* which title is the primary one
* a language map of the representations of the title
* a language map of strings used to sort the title of the publication
* which title is the subtitle
* a language map of the representations of the subtitle

### EPUB 2.x

The first `<dc:title>` element should be considered the primary one.

Parse it as a [localized string](#localized-strings) to compute a language map.

The value of sorting key of the publication is given by the `content` attribute in a `meta` whose `name` is `calibre:title_sort`.

The subtitle can’t be expressed.

### EPUB 3.x

The primary `title` is defined using the following logic:

1. it is the `<dc:title>` element whose `title-type` (refine) is `main`;
2. if there is no such refine, it is the first `<dc:title>` element. 

Parse it as a [localized string](#localized-strings) to compute a language map.

The sorting key of the publication is carried by the main title’s refine whose `property` is `file-as`. If there is none, fallback to the EPUB 2.x case.

The subtitle is the value of the `<dc:title>` element whose `title-type` (refine) is `subtitle`. In case there are several, use the one with the lowest `display-seq` (refine).
Parse it as a [localized string](#localized-strings) to compute a language map.

## Identifier

The `identifier` of a publication is a key whose value is a string. It must be a valid URI.

When parsing an EPUB, we need to establish:

* which identifier is the primary one
* which scheme is this identifier’s
* the identifier’s valid URI

### EPUB 2.x

The primary `identifier` is marked as the unique identifier via the `package` element `unique-identifier` attribute. It’s `id` must therefore match the value of this `unique-identifier` attribute.

To determine the scheme, first look at the `opf:scheme` attribute e.g.

```
<dc:identifier id="pub-id" opf:scheme="ISBN">123456789X</dc:identifier>
```

If there is none, then the `identifier` must be value parsed in order to guess it.

The valid URI is the result of this second step e.g. `urn:isbn:123456789X`.

### EPUB 3.x

The primary `identifier` is marked as the unique identifier via the `package` element `unique-identifier` attribute. It’s `id` must therefore match the value of this `unique-identifier` attribute.

To determine the scheme, first look if there is a refine whose property is `identifier-type` e.g.

```
<dc:identifier id="pub-id">urn:isbn:123456789X</dc:identifier>
<meta refines="#pub-id" property="identifier-type" scheme="onix:codelist5">15</meta>
```

If there is none, then the `identifier` must be value parsed in order to guess it.

The valid URI is the result of this second step e.g. `urn:isbn:123456789X`.

## Contributors

The contributor’s key depend on the role of the creator or contributor. It is an object that contains a `name`, a `sortAs` and an `identifier` key.

The `name` and `sortAs` keys of each `contributor` are objects where each key is a BCP 47 language tag and each value of the key is a string.

The contributor object may also contain an `identifier` string that must be a valid URI.

When parsing an EPUB, we need to establish:

* the key of the contributor;
* a language map for the name of this contributor;
* a language map used to sort the name of the contributor.

### EPUB 2.x

The following mapping should be used to determine the key of the contributor’s object: 

| element                      | opf:role                 | key         |
|------------------------------|--------------------------|-------------|
| dc:creator                   | \<empty\> or \<unknown\> | author      |
| dc:contributor               | \<empty\> or \<unknown\> | contributor |
| dc:creator or dc:contributor | aut                      | author      |
| dc:creator or dc:contributor | pbl                      | publisher   |
| dc:creator or dc:contributor | trl                      | translator  |
| dc:creator or dc:contributor | edt                      | editor      |
| dc:creator or dc:contributor | ill                      | illustrator |
| dc:creator or dc:contributor | art                      | artist      |
| dc:creator or dc:contributor | clr                      | colorist    |
| dc:creator or dc:contributor | nrt                      | narrator    |
| dc:publisher                 | N/A                      | publisher   |

Where `opf:role` is the value of the attribute of the `<dc:element>`.

Parse the carrying element as a [localized string](#localized-strings) to compute a language map for the contributor’s name.

Finally, the string used to sort the name of the contributor is provided by the value of the `opf:file-as` attribute of this element.

### EPUB 3.x

The following mapping should be used to determine to key of the contributor’s object:

| element                      | role                     | key         |
|------------------------------|--------------------------|-------------|
| dc:creator                   | \<empty\> or \<unknown\> | author      |
| dc:contributor               | \<empty\> or \<unknown\> | contributor |
| dc:creator or dc:contributor | aut                      | author      |
| dc:creator or dc:contributor | pbl                      | publisher   |
| dc:creator or dc:contributor | trl                      | translator  |
| dc:creator or dc:contributor | edt                      | editor      |
| dc:creator or dc:contributor | ill                      | illustrator |
| dc:creator or dc:contributor | art                      | artist      |
| dc:creator or dc:contributor | clr                      | colorist    |
| dc:creator or dc:contributor | nrt                      | narrator    |
| dc:publisher                 | N/A                      | publisher   |
| media:narrator               | N/A                      | narrator    |

Where `role` is the value of the refine whose `scheme` is a value of `marc:relators`.

Parse the `contributor` element as a [localized string](#localized-strings) to compute a language map for the contributor’s name.

Finally, the string used to sort the name of the contributor is carried by the contributor's refine whose property is `file-as`.

## Language

The `language` of a publication is a key whose value is a string or an array of valid BCP 47 language tags.

When parsing an EPUB, we need to establish: 

* which language is the primary one
* additional languages

### EPUB 2.x

The first `<dc:language>` element must be considered the primary language of the publication.

If there is more that one `<dc:language>` elements, then the value of the key is an array whose first entry is the primary language.

### EPUB 3.x

The first `<dc:language>` element must be considered the primary language of the publication.

If there is more that one `<dc:language>` elements, then the value of the key is an array whose first entry is the primary language.

## Description

The `description` of a publication is a key whose value is a string in plain text.

The string is the value of the `<dc:description>` element.

## Publication Date

The `published` date of a publication is a key whose value is a string conforming to ISO 8601.

### EPUB 2.x

The string is the value of the `<dc:date>` element whose `opf:event` attribute has the value `publication`.

### EPUB 3.x

The string is the value of the `<dc:date>` element.

## Modification Date

The `modified` date of a publication is a key whose value is a string conforming to ISO 8601.

### EPUB 2.x

The string is the value of the `<dc:date>` element whose `opf:event` attribute has the value `modification`.

### EPUB 3.x

The string is the value of the `meta` element whose `property` attribute has the value `dcterms:modified`.

## Subjects

The `subject` of a publication is a key whose value is, in the most complex form, an array of `subject` objects.

Although each subject should have its own `<dc:subject>` element, this is not necessarily the case in practice, authors and authoring tools often separating multiple subjects using commas or semicolons in the same element.
So, if there is a single `dc:subject` that is not refined by any property, split its content at every comma and semicolon and consider you have several `dc:subject` with shared attributes.

Parse each `<dc:subject>` element as a [localized string](#localized-strings) to compute a language map for the subject’s `name`.

### EPUB 2.x

`sortAs`, `code` and `scheme` cannot be expressed.

### EPUB 3.x

The `sortAs` string used to sort the subject is the value of the refine whose `property` has the value of `file-as`.

The `code` property has the same value as the refine whose `property` has the value of `term`.

The `scheme` property has the same value as the refine whose `property` has the value of `authority`.

## Collections and Series

The `belongsTo` of a publication is an object containing a `collection` or `series` object.

This latter object contains `name`, `sortAs` and `identifier` keys, whose values are a string, and a `position` key, whose value is a number.

When parsing an EPUB, we need to establish:

* which object to use;
* the name of the collection/series;
* the string used to sort the name of the collection/series;
* the URI for the collection/series;
* the position of the publication in this collection/series.

### EPUB 2.x

The object to use will always be `series`.

The string for its `name` is the value of the `content` attribute in the `<meta>` element whose `name` attribute has the value `calibre:series`.

The `position` of the publication is the value of the `content` attribute – converted to a number – in the `<meta>` element whose `name` attribute has the value `calibre:series_index`.

Please be aware that it can be a floating point number with up to two digits of precision e.g. `1.01`, and zero and negative numbers are allowed.

### EPUB 3.x

The object to use depends on the refine whose `property` has the value of `collection-type`:

1. if it is `series`, use `series`;
2. else use `collection`.

The string for its `name` is the value of the `<meta>` element whose `property` has the value of `belongs-to-collection` and which is refined.

The `sortAs` string used to sort the name is the value of the refine whose `property` has the value of `file-as`.

The `identifier` string is the value of the refine whose `property` has the value of `dcterms:identifier`.

The `position` of the publication is the value of the refine whose `property` has the value of `group-position`.

If there is no `series`, try to parse `calibre:series` as in the EPUB 2.x case.

## Progression Direction

The `readingProgression` of a publication is a key whose value is a string amongst the following:

* `auto`;
* `ltr`;
* `rtl`.

This string is the value of the `page-progression-direction` attribute of the `<spine>` element.

If no value is set, it defaults to `auto`.

## Number of pages

The `numberOfPages` of a publication is a key whose value is an integer.

### EPUB 2.x

Does not apply.

### EPUB 3.x

The integer is the value of the `meta` element whose `property` attribute has the value `schema:numberOfPages`.

## Rendition

### Layout

The `layout` of a publication `metadata` object is a key whose value can be the following string: 

- `reflowable`;
- `fixed`.

#### EPUB 2.x

If the publication either has a `com.kobobooks.display-options.xml` or `com.apple.ibooks.display-options.xml` in its `META-INF` folder, then check whether an `<option>` element whose `name` attribute is `fixed-layout` exists e.g.

```
<display_options>
  <platform name="*">
    <option name="fixed-layout">true</option>
  </platform>
</display_options>
```

- If the value is `true`, then the value of the `layout` key is `fixed`. 
- If the value is `false`, then the value of the `layout` key is `reflowable`.
- If no such option is set, then the value of the `layout` key defaults to `reflowable`.

#### EPUB 3.x

The string is the value of the `<meta>` element whose `property` attribute has the value `rendition:layout` with the following mapping:

| rendition:layout | value      |
|------------------|------------|
| reflowable       | reflowable |
| pre-paginated    | fixed      |

If no value is set, it defaults to `reflowable`.

### Page-spread-* properties

The `page` of a Link Object `properties` is a key whose value can be the following string:

- `center`;
- `left`;
- `right`.

#### EPUB 2.x

Does not apply.

#### EPUB 3.x

For each spine item, the value of `page` must be inferred from the `properties` attribute whose value contains `rendition:page-spread-`.

| Properties                    | value   |
|-------------------------------|---------|
| rendition:page-spread-center  | center  |
| rendition:page-spread-left    | left    |
| rendition:page-spread-right   | right   |


## Appendix: Deprecated properties

### Layout in a Presentation object 

This document was initially responsible for documenting the parsing of the `layout` of an entire publication using either: `reflowable` or `fixed`.

This was handled using a `layout` property in a `presentation` object.

This is now handled using the `layout` key of a publication directly in `metadata`.

### Layout as a property of a Link Object

This document was initially responsible for documenting the Spine Overrides for the `layout` property. 

This was originally supported in the EPUB Profile of the Readium Web Publication Manifest through a `layout` property in `properties`.

This is no longer documented since [the Readium Web Publication Manifest does no longer support this](https://github.com/readium/webpub-manifest/blob/master/profiles/epub.md#appendix-b---deprecated-properties).

### Flow

The EPUB Specification allow content creators to specify the intended flow of an entire publication, or a specific resource.

This was originally supported in this EPUB profile of the Readium Web Publication Manifest through:

- an `overflow` property for the `presentation` object in `metadata` (for the entire publication)
- an `overflow` property in the `properties` of a Link Object (for a specific resource)

This document was initially responsible for documenting both but is no longer as it is now handled using the `layout` key of a publication directly in `metadata`, but not for EPUB.

### Orientation

The EPUB specification allow content creators to specify the intended orientation of an entire publication, or a specific resource.

This was originally supported in this EPUB profile of the Readium Web Publication Manifest through:

- an `orientation` property for the `presentation` object in `metadata` (for the entire publication)
- an `orientation` property in the `properties` of a Link Object (for a specific resource)

This document was initially responsible for documenting both but is no longer since [the Readium Web Publication Manifest does no longer support this](https://github.com/readium/webpub-manifest/blob/master/profiles/epub.md#appendix-b---deprecated-properties).

### Spread

The EPUB specification allow content creators to specify the intended spread of an entire publication, or a specific resource. 

This was originally supported in this EPUB profile of the Readium Web Publication Manifest through:

- a `spread` property for the `presentation` object in `metadata` (for the entire publication)
- a `spread` property in the `properties` of a Link Object (for a specific resource)

This document was initially responsible for documenting both but is no longer since [the Readium Web Publication Manifest does no longer support this](https://github.com/readium/webpub-manifest/blob/master/profiles/epub.md#appendix-b---deprecated-properties).