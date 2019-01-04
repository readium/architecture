# Parsing EPUB Metadata

The goal of this document is to provide directions that each implementation of Readium can follow when parsing EPUB 2.x and 3.x publications.

While the default context is very flexible in the way each metadata can be represented, when parsing a publication in the streamer we always use the most complex form for each metadata to harmonize our output.

## Title

The `title` of a publication is an object where each key is a BCP 47 language tag and each value of this key is a string.

In addition to `title`, a publication may also contain a `sortAs` string, used to sort the title as well.

When parsing an EPUB, we need to establish:

* which title is the primary one
* the language(s) used to express the primary title along with the associated strings
* the string used to sort the title of the publication
* the default language for metadata

### EPUB 2.x

TBD as I’m very unfamiliar with this (never encountered corner cases there)

The first `<dc:title>` element should be considered the primary one.

To determine the language of the `title` element, check:

1. if it has an `xml:lang` attribute;
2. if it shares an `xml:lang` attribute (i.e. it is present on the `package` element);
3. the primary language of the publication.

The string for `sortAs` is the value of `content` in a `meta` whose `name` is `calibre:title_sort` and `content` is the value to use.

To determine the default language for metadata, check:

1. if the `package` has an `xml:lang` attribute;
2. the primary language of the publication.

### EPUB 3.x

The primary `title` is defined using the following logic:

- it is the `<dc:title>` element whose `title-type` (refine) is `main`;
- if there is no such refine, it is the first `<dc:title>` element. 

To determine the language of the `title` element, check

1. if it has an `xml:lang` attribute;
2. if it shares an `xml:lang` attribute (i.e. it is present on the `package` element);
3. the primary language of the publication.

The string used to sort the `title` of the publication is the value of the main title’s refine whose `property` is `file-as`.

To determine the default language for metadata, check:

1. if the `package` has an `xml:lang` attribute;
2. the primary language of the publication.

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

The valid URI is the result of this second step e.g. `urn:doi:10.1016/j.iheduc.2008.03.001`.

## Contributors

The contributor’s key depend on the role of the creator or contributor. It is an object that contains a `name`, a `sortAs` and an `identifier` key.

The `name` of each `contributor` is an object where each key is a BCP 47 language tag and each value of the key is a string.

The contributor object may also contain a `sortAs` string, used to sort the contributor as well, and an `identifier` string that must be a valid URI.

When parsing an EPUB, we need to establish:

* the key of the contributor;
* the name of this contributor;
* the alternate forms for this name;
* the string used to sort the name of the contributor.

### EPUB 2.x

The following mapping should be used to determine the key of the contributor’s object: 

| element        | opf:role           | key         |
|----------------|--------------------|-------------|
| dc:creator     | aut                | author      |
| dc:contributor | trl                | translator  |
| dc:contributor | est                | editor      |
| dc:contributor | ill                | illustrator |
| dc:contributor | art                | artist      |
| dc:contributor | clr                | colorist    |
| dc:contributor | nrt                | narrator    |
| dc:contributor | <empty> or <other> | contributor |

Where `opf:role` is the value of the attribute of the `<dc:element>`.

The name of the contributor is the value of the element.

Finally, the string used to sort the name of the contributor is the value of the `opf:file-as` attribute of this element.

### EPUB 3.x

The following mapping should be used to determine to key of the contributor’s object: 

| element        | role               | key         |
|----------------|--------------------|-------------|
| dc:creator     | aut                | author      |
| dc:contributor | trl                | translator  |
| dc:contributor | est                | editor      |
| dc:contributor | ill                | illustrator |
| dc:contributor | art                | artist      |
| dc:contributor | clr                | colorist    |
| dc:contributor | nrt                | narrator    |
| dc:contributor | <empty> or <other> | contributor |

Where `role` is the value of the refine whose `scheme` is a value of `marc:relators`.

To handle the name of the contributor:

1. check if there is a refine whose propery is `alternate-script` and its corresponding `xml:lang` value;
2. if there is none, use the value of the `<dc:element>`.

Finally, the string used to sort the name of the contributor is the value of a refine with a `file-as` property.

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

## Publisher

The `publisher` of a publication is a key whose value is a string.

The string is the value of the `<dc:publisher>` element.

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

The `subject` of a publication is a string or an array.

Although each subject should have its own `<dc:subject>` element, this is not necessarily the case in practice, authors and authoring tools often separating multiple subjects using commas or semicolons in the same element.

TBD + comment: so huh yeah… what if the subject has commas in the scheme it belongs to?

## Collections and Series

TBD, calibre meta + https://github.com/w3c/publ-epub-revision/issues/326

### EPUB 2.x

...

### EPUB 3.x

...

## Progression Direction

The `readingProgression` of a publication is a key whose value is a string amongst the following:

* auto;
* ltr;
* rtl;

This string is the value of the `page-progression-direction` attribute of the `<spine>` element.

## Rendition

TBD