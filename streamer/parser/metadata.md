#Parsing EPUB Metadata

> Work in progress, will need to be updated on a regular basis until we reach a 1.0 version of the streamer.

## Mapping to EPUB 3.1

| Key  | EPUB 3.1 |
| ---- | -------- |
| [identifier](#identifier) | dc:identifier |
| [title](#title)  | dc:title |
| [sort_as](#title)  | dc:title@opf:file-as |
| [author](#contributors) | dc:creator |
| [translator](#contributors) | dc:contributor@opf:role="trl" |
| [editor](#contributors) | dc:contributor@opf:role="edt" |
| [illustrator](#contributors)| dc:contributor@opf:role="ill" |
| [narrator](#contributors) | dc:contributor@opf:role="nrt" |
| [contributor](#contributors) | dc:contributor |
| [	language](#language) | dc:language |
| [subject](#subjects) | dc:subject |
| [	publisher](#publisher) | dc:publisher |
| [modified](#identifier) | dcterms:modified |
| [	published](#publication-date) | dc:date |
| [	description](#description) | dc:description |
| numberOfPages  | schema:numberOfPages |
