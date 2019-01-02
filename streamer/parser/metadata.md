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

...

### EPUB 3.0

...