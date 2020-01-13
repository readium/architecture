# Parsing EPUB Metadata

The goal of this document is to provide directions that each implementation of Readium can follow when parsing EPUB 2.x and 3.x publications.

While the default context is very flexible in the way each metadata can be represented, when parsing a publication in the streamer we always use the most complex form for each metadata to harmonize our output.

Related Repository: [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest)

## Title

The `title` of a publication is an object where each key is a BCP 47 language tag and each value of this key is a string.

In addition to `title`, a publication may also contain a `sortAs` string, used to sort the title as well.

When parsing an EPUB, we need to establish:

* which title is the primary one
* the language(s) used to express the primary title along with the associated strings
* the string used to sort the title of the publication
* the subtitle of the publication
* the default language for metadata

### EPUB 2.x

The first `<dc:title>` element should be considered the primary one.

To determine the language of the `title` element, check:

1. if it has an `xml:lang` attribute;
2. if it shares an `xml:lang` attribute (i.e. it is present on the `package` element);
3. the primary language of the publication.

The string for `sortAs` is the value of `content` in a `meta` whose `name` is `calibre:title_sort` and `content` is the value to use.

The subtitle can’t be expressed.

To determine the default language for metadata, check:

1. if the `package` has an `xml:lang` attribute;
2. the primary language of the publication.

### EPUB 3.x

The primary `title` is defined using the following logic:

1. it is the `<dc:title>` element whose `title-type` (refine) is `main`;
2. if there is no such refine, it is the first `<dc:title>` element. 

To determine the language of the `title` element, check

1. if it has an `xml:lang` attribute;
2. if it shares an `xml:lang` attribute (i.e. it is present on the `package` element);
3. the primary language of the publication.

The string used to sort the `title` of the publication is the value of the main title’s refine whose `property` is `file-as`.

The subtitle of the publication is the value of the `<dc:title>` element whose `title-type` (refine) is `subtitle`. In case there are several, check their `display-seq` (refine).

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

The valid URI is the result of this second step e.g. `urn:isbn:123456789X`.

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

| element        | opf:role               | key         |
|----------------|------------------------|-------------|
| dc:creator     | aut                    | author      |
| dc:contributor | trl                    | translator  |
| dc:contributor | edt                    | editor      |
| dc:contributor | ill                    | illustrator |
| dc:contributor | art                    | artist      |
| dc:contributor | clr                    | colorist    |
| dc:contributor | nrt                    | narrator    |
| dc:contributor | \<empty\> or \<other\> | contributor |

Where `opf:role` is the value of the attribute of the `<dc:element>`.

The `name` of the contributor is the value of the element.

Finally, the string used to sort the name of the contributor is the value of the `opf:file-as` attribute of this element.

### EPUB 3.x

The following mapping should be used to determine to key of the contributor’s object: 

| element        | role                   | key         |
|----------------|------------------------|-------------|
| dc:creator     | aut                    | author      |
| dc:contributor | trl                    | translator  |
| dc:contributor | est                    | editor      |
| dc:contributor | ill                    | illustrator |
| dc:contributor | art                    | artist      |
| dc:contributor | clr                    | colorist    |
| dc:contributor | nrt                    | narrator    |
| dc:contributor | \<empty\> or \<other\> | contributor |

Where `role` is the value of the refine whose `scheme` is a value of `marc:relators`.

To handle the `name` of the contributor:

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

The `subject` of a publication is a key whose value is string or an array.

Although each subject should have its own `<dc:subject>` element, this is not necessarily the case in practice, authors and authoring tools often separating multiple subjects using commas or semicolons in the same element.

To retrive the value of the `subject` key:

1. if there is a one single `<dc:subject>` element, make sure keywords are not separated using commas or semicolons;
    1. if it doesn’t, the string is the value;
    2. if it does, split the string to build an array;
2. if there are more than one `<dc:subject>` elements, build an array using their values.

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

## Rendition / Presentation

The `presentation` of a publication is an object containing the following keys: 

- `continuous`;
- `layout`;
- `orientation`;
- `overflow`;
- `spread`.

In addition, the following elements may be included in `properties` in a Link Object from the `readingOrder` (spine overrides):

- `layout`;
- `orientation`;
- `overflow`;
- `page`;
- `spread`.

### Flow

The `rendition:flow` metadata is mapped to `overflow` and `continuous`.

The `overflow` of a publication is a key whose value can be the following string: 

- `auto`;
- `paginated`;
- `scrolled`.

This `overflow` can be `continuous`, which is a key whose value is a boolean: `true` or `false`

#### EPUB 2.x

Does not apply.

#### EPUB 3.x

##### Global Property

The string is the value of the `<meta>` element whose `property` attribute has the value `rendition:flow` with the following mapping:

| rendition:flow      | values                                        |
|---------------------|-----------------------------------------------|
| auto                | "overflow": "auto" + "continuous": false      |
| paginated           | "overflow": "paginated" + "continuous": false |
| scrolled-doc        | "overflow": "scrolled" + "continuous": false  |
| scrolled-continuous | "overflow": "scrolled" + "continuous": true   |

If no value is set, it defaults to `auto`.

##### Spine Overrides

For each spine item, the value of `overflow` must be inferred from the `properties` attribute whose value contains `rendition:flow-`.

| Properties                         | value     |
|------------------------------------|-----------|
| rendition:flow-auto                | auto      |
| rendition:flow-paginated           | paginated |
| rendition:flow-scrolled-doc        | scrolled  |
| rendition:flow-scrolled-continuous | scrolled  |

### Layout

The `layout` of a publication is a key whose value can be the following string: 

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

##### Global Property

The string is the value of the `<meta>` element whose `property` attribute has the value `rendition:layout` with the following mapping:

| rendition:layout | value      |
|------------------|------------|
| reflowable       | reflowable |
| pre-paginated    | fixed      |

If no value is set, it defaults to `reflowable`.

##### Spine Overrides

For each spine item, the value of `layout` must be inferred from the `properties` attribute whose value contains `rendition:layout-`.

| Properties                     | value      |
|--------------------------------|------------|
| rendition:layout-reflowable    | reflowable |
| rendition:layout-pre-paginated | fixed      |

### Orientation

The `orientation` of a publication is a key whose value can be the following string: 

- `auto`;
- `landscape`;
- `portrait`.

#### EPUB 2.x

If the publication has a `com.apple.ibooks.display-options.xml` in its `META-INF` folder, then: 

1. prioritize the `platform` element whose `name` attribute has a value of `*`;
2. if there is none, then prioritize `ipad`;
3. if there is still none, then fall back on `iphone`.

The string is the value of the `<option>` element whose `name` attribute is `orientation-lock` with the following mapping: 

| option         | value     |
|----------------|-----------|
| none           | auto      |
| landscape-only | landscape |
| portrait-only  | portrait  |

If no such option is set, it defaults to `auto`.

#### EPUB 3.x

##### Global Property

The string is the value of the `<meta>` element whose `property` attribute has the value `rendition:orientation`.

If no value is set, it defaults to `auto`.

##### Spine Overrides

For each spine item, the value of `orientation` must be inferred from the `properties` attribute whose value contains `rendition:orientation-`.

| Properties                      | value     |
|---------------------------------|-----------|
| rendition:orientation-auto      | auto      |
| rendition:orientation-landscape | landscape |
| rendition:orientation-portrait  | portrait  |

### Spread

The `spread` of a publication is a key whose value can be the following string: 

- `none`;
- `auto`;
- `landscape`;
- `both`.

#### EPUB 2.x

Does not apply.

#### EPUB 3.x

##### Global Property

The string is the value of the `<meta>` element whose `property` attribute has the value `rendition:spread` with the following mapping:

| rendition:spread | value     |
|------------------|-----------|
| none             | none      |
| auto             | auto      |
| landscape        | landscape |
| portrait         | both      |
| both             | both      |

If no value is set, it defaults to `auto`.

##### Spine Overrides

For each spine item, the value of `spread` must be inferred from the `properties` attribute whose value contains `rendition:spread-`.

| Properties                 | value     |
|----------------------------|-----------|
| rendition:spread-none      | none      |
| rendition:spread-auto      | auto      |
| rendition:spread-landscape | landscape |
| rendition:spread-portrait  | both      |
| rendition:spread-both      | both      |

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