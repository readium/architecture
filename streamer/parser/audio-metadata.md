# Audio metadata mapping

Reference for building a Readium Web Publication Manifest from audio files that ship without a manifest: a standalone audio file (e.g. M4B, MP3) or a package of audio files (e.g. ZAB, ZIP, folder).

## Vocabulary

| Term | Meaning |
|---|---|
| File metadata | Facts read from one audio file: tags, duration, chapters, cover. |
| Aggregation | Rules turning the metadata of all the files into one manifest. |
| MP4 atom | A tag in the `moov/udta/meta/ilst` box of an MP4 file (M4A, M4B). Written here as `©nam`. |
| Freeform atom | An MP4 `----` atom with the mean `com.apple.iTunes` and a name. Written here as `----:NAME`. |
| ID3 frame | A tag in the ID3v2 block of an MP3 file. Written here as `TIT2`. |
| User-defined frame | An ID3 `TXXX` frame with a description and a value. Written here as `TXXX:NAME`. |
| Chapter | A titled time range inside one audio file. |

## Book metadata

Sources are listed in priority order within a cell. The first one holding a non-blank value wins.

| Field | MP4 atoms | ID3v2 frames | Manifest target |
|---|---|---|---|
| Title | `©alb`, `©nam` | `TALB`, `TIT2` | `metadata.title` |
| Subtitle | `©st3`, `----:SUBTITLE` | `TIT3` | `metadata.subtitle` |
| Authors | `aART`, `©ART` | `TPE2`, `TPE1` | `metadata.author` |
| Narrators | `©nrt`, `©wrt` | `TXXX:NARRATOR`, `TCOM` | `metadata.narrator` |
| Series | `©mvn`, `----:SERIES` | `MVNM`, `TXXX:SERIES` | `metadata.belongsTo.series[].name` |
| Series position | `©mvi`, `----:SERIES-PART` | `MVIN`, `TXXX:SERIES-PART` | `metadata.belongsTo.series[].position` |
| Publisher | `©pub` | `TPUB` | `metadata.publisher` |
| Date | `©day` | `TDRL`, `TDRC`, `TYER` | `metadata.published` |
| Genres | `©gen`, `gnre` | `TCON` | `metadata.subject` |
| Description | `ldes`, `desc`, `©cmt` | `TXXX:DESCRIPTION`, `TDES`, `COMM` | `metadata.description` |
| Language | `----:LANGUAGE` | `TLAN` | `metadata.language` |
| ISBN | `----:ISBN` | `TXXX:ISBN` | `metadata.identifier` |
| Sort title | `soal`, `sonm` | `TSOA`, `TSOT` | `metadata.sortAs` |
| Cover | `covr` | `APIC` | cover of the publication |

Notes on the choices. The tools and guides named here are listed in [Sources](#sources).

- **Title.** The Plex Audiobook Guide and beets-audible write the book title to the album. The Plex Audiobook Guide keeps the track title for the chapter title, and Audiobook authoring on macOS for the title with its sequence number. The album therefore comes first.
- **Authors.** The Plex Audiobook Guide and beets-audible write the artist as "Author, Narrator" and the album artist as the author alone. The album artist therefore comes first, and the two are not merged.
- **Narrators.** Audiobookshelf reads the narrator from the composer tag. The Plex Audiobook Guide, beets-audible and Audiobook authoring on macOS write it there. An explicit narrator tag wins when present: Mp3tag maps its `NARRATOR` field to the `©nrt` atom in MP4 and, having no ID3 frame for it, to a `TXXX:NARRATOR` frame.
- **Series.** The Plex Audiobook Guide and beets-audible write the series to both the movement tags and the `SERIES` / `SERIES-PART` pair. A series name without a position is valid.
- **Subtitle.** FFmpeg reads the `©st3` atom as the subtitle. Mp3tag has no MP4 atom for its `SUBTITLE` field and writes the freeform atom instead.
- **Date.** `metadata.published` is the release of the audiobook. In ID3v2.4, `TDRL` is the release time and `TDRC` the recording time, so `TDRL` comes first. `TYER` is the ID3v2.3 year. The ID3v2.3 day and month (`TDAT`) are not read.
- **Description.** Mp3tag has no ID3 frame for its `DESCRIPTION` field and writes it as a `TXXX:DESCRIPTION` frame, which Audiobookshelf reads. An explicit description wins over the comment.
- **Language.** Only an explicit tag is used. The language of the MP4 audio track is not, as ffprobe and AVFoundation disagree on it: see [Not mapped](#not-mapped).
- **Sort title.** For a book in a series, the Plex Audiobook Guide and beets-audible fill the album sort tag with the key `%Series% %Series-part% - %Title%`. It is still a sort key, but not a sortable form of the title.

## File metadata

One reading order link per audio file.

| Field | MP4 | ID3v2 / MP3 | Manifest target |
|---|---|---|---|
| Title | `©nam` | `TIT2` | `readingOrder[].title` |
| Duration | Container duration | Estimated or scanned duration | `readingOrder[].duration`, in seconds |
| Bitrate | Audio track data rate | Audio stream bitrate | `readingOrder[].bitrate`, in kbps |

- The bitrate is omitted when it is unknown or reported as 0.
- The duration of an MP4 file is exact, it is stored in the container.
- The duration of an MP3 file may be estimated instead of scanning the whole file. It is exact for constant bitrate files and for files with a Xing or VBRI header. A player must treat `duration` as a hint and correct it once it knows the real one.

## Chapters

| Format | Sources, in priority order | Nested |
|---|---|---|
| MP4 | QuickTime chapter track, Nero `chpl` atom | No |
| MP3 | ID3v2 `CHAP` frames | Through `CTOC` |

A chapter has an optional title, a start time and a duration.

- **QuickTime chapter track.** A text track referenced by the audio track with a `tref` / `chap` reference. Each sample is one chapter: the sample time is the start, the sample duration is the duration, the sample text is the title.
- **Nero `chpl`.** An atom in `moov/udta` listing start times and titles. It has no end times: the duration of a chapter runs to the next start, or to the end of the file for the last one.
- **ID3 `CHAP`.** One frame per chapter with start and end times in milliseconds. The title is the embedded `TIT2` sub-frame.
- Chapters are ordered by start time. Any hierarchy declared by `CTOC` might be mapped using link's `children`.

### Table of contents

1. The table of contents is a nested list. It is the concatenation of the chapters of each file, following the reading order.
2. A chapter without a title, or with a blank title, is left out.
3. The `toc` is only produced when at least one file has a titled chapter. Otherwise the manifest has no `toc`.
4. A chapter link has:
   - `href`: the HREF of the file, with the fragment `#t=<start>`. The first chapter of a file carries `#t=0`.
   - `title`: the chapter title.
   - `duration`: the chapter duration in seconds.
5. When a `toc` is produced, a file without any titled chapter contributes one link:
   - `href`: the HREF of the file, without fragment.
   - `title`: the title tag of the file, if missing the link is removed from the table of contents.
   - `duration`: the duration of the file.

### Example

A package with a chaptered M4B followed by a plain MP3:

```json
{
  "metadata": {
    "conformsTo": "https://readium.org/webpub-manifest/profiles/audiobook",
    "title": "The Book",
    "subtitle": "A Subtitle",
    "author": "Jane Author",
    "narrator": "Nora Narrator",
    "publisher": "Acme Audio",
    "published": "2021-03-04",
    "language": "fr",
    "identifier": "urn:isbn:9781234567897",
    "subject": ["Fantasy"],
    "belongsTo": {
      "series": [{"name": "The Saga", "position": 2}]
    },
    "duration": 5400
  },
  "readingOrder": [
    {"href": "part1.m4b", "type": "audio/mp4", "title": "Part One", "duration": 3600, "bitrate": 64},
    {"href": "part2.mp3", "type": "audio/mpeg", "duration": 1800, "bitrate": 64}
  ],
  "toc": [
    {"href": "part1.m4b#t=0", "title": "Opening Credits", "duration": 71.5},
    {"href": "part1.m4b#t=71.5", "title": "Chapter 1", "duration": 3528.5},
    {"href": "part2.mp3", "title": "Part 2", "duration": 1800}
  ]
}
```

## Aggregation

| Manifest value | Rule |
|---|---|
| `readingOrder` | One link per audio file, sorted by path in natural order (`2.mp3` before `10.mp3`). Tags never change the order, so that it is the same whether or not the files are read. |
| `metadata.duration` | Sum of the file durations. Omitted when the duration of a file is unknown. |
| `toc` | See [Table of contents](#table-of-contents). |
| Cover | The first embedded cover found, following the reading order. |
| Book metadata with one value (title, subtitle, description, date, ISBN, sort title) | The first value found, following the reading order. |
| Book metadata with several values (authors, narrators, publishers, genres, languages, series) | The distinct values of all the files, following the reading order. |

The priority between the sources of a field applies across the whole package, not inside each file. For each field, use the highest priority source that has a value in any file, and combine only the values of that source.

| Files | Result |
|---|---|
| File 1 has only `©nam` "Part 1". File 2 has `©alb` "The Book". | Title "The Book" |
| File 1 has `aART` "Jane". File 2 has no `aART`, and `©ART` "Jane, Nora". | Authors "Jane" |

This requires reading each file into format-neutral tags (album, title, artist, album artist, composer, narrator, and so on) and resolving the roles only once all the files are read.

Reading policy:

- A standalone audio file is always read.
- Reading the files nested in a package is optional, as it costs one read per file. It is controlled by the host app, whatever the transport. When disabled, the links only have an `href` and a `type`.
- A file whose metadata cannot be interpreted (unknown format, corrupt tags) is kept as a link with `href` and `type`.
- A failure to access the content (file system, network, cancellation) fails the parsing, so that the host app can retry instead of storing an incomplete publication.

## Value decoding

| Value | Rule |
|---|---|
| Blank values | A value that is empty or only whitespace is treated as missing. |
| Freeform atom and `TXXX` names | Matched case-insensitively. |
| Authors, narrators, publisher | One contributor per native value: several `data` atoms in one MP4 atom, or ID3v2.4 values separated by a null character. |
| `/` in ID3 values | Split on `/` the values of the ID3 frames feeding a field with several values: `TPE1`, `TPE2`, `TCOM`, `TXXX:NARRATOR`, `TPUB` and `TLAN`. Do it whatever the ID3 version, then trim each part and drop the empty ones. ID3v2.3 defines `/` as the separator for `TPE1` and `TCOM`. For the other frames it comes from mutagen, which by default joins the values of any text frame with `/` when saving ID3v2.3: two publishers are written as `A/B`. |
| Other punctuation | A contributor is never split on commas, semicolons or `&`. An MP4 value is never split, not even on `/`. A title or a series name is never split. |
| Genres | Split on `;` and `/` (which covers `//`), then trim each part and drop the empty ones. Each part is one subject. |
| `TCON` | May hold ID3v1 genre references such as `(17)` or `17`, to resolve against the ID3v1 genre list. |
| `gnre` | 16-bit integer holding the ID3v1 genre index plus one. |
| Series position | `©mvi` is an integer. `MVIN` is a string such as `2/5`, where the position is the part before the slash. `SERIES-PART` is a string that may be decimal (`2.5`). A value that is not a number is ignored. |
| Date | `©day`, `TDRC` and `TDRL` hold a year (`2021`), a year and month (`2021-03`), a date (`2021-03-04`) or an ISO 8601 timestamp. `TYER` holds a four-digit year. Parse the text of the tag. A missing component takes its earliest value: a year alone maps to January 1st of that year, a year and month to the first day of that month. |
| Language | `TLAN` may list several languages, such as `eng/fra`: split it on `/` first, as described above, and convert each part on its own. Each value is a BCP 47 tag (`fr`, `fr-CA`) or an ISO 639 code, matched case-insensitively. ID3v2.3 and ID3v2.4 define `TLAN` as ISO 639-2 codes, which have two variants for some languages: the terminology code (`fra`) and the bibliographic code (`fre`). Convert every form to BCP 47, using the two-letter code when one exists (`fr`). Ignore `und` and any other value, such as a language name ("English"). |
| ISBN | Strip spaces and hyphens, then write `urn:isbn:<value>`. An ISBN-10 may end with `X`. |
| `COMM` | Use the frame whose description is empty. A `COMM` frame with a description may hold technical data: iTunes stores its normalization settings in one described as `iTunNORM`. |
| Bitrate | The manifest expects kbps. Divide a value in bits per second by 1000. |
| ID3 text frames | First byte is the encoding: `0` ISO-8859-1, `1` UTF-16 with BOM, `2` UTF-16BE, `3` UTF-8. The text follows, optionally null terminated. |
| Cover media type | Declared by the file: the type code of the `covr` data atom (13 for JPEG, 14 for PNG), or the MIME type of the `APIC` frame (treat `image/jpg` as `image/jpeg`). The declared type is trusted and exposed as the `type` of the cover. A wrong declaration is an authoring error. |
| `APIC` | Prefer the picture of type 3 (front cover), otherwise the first one. |
| `chpl` | Version (1 byte), flags (3 bytes), 4 reserved bytes when the version is 1, chapter count (1 byte). Then for each chapter: start (64-bit big endian, in units of 100 ns), title length (1 byte), title (UTF-8). |
| `CHAP` | Element ID (null terminated), start time and end time (32-bit, milliseconds), start offset and end offset (32-bit), then sub-frames. |
| Chapter track sample | Text length (16-bit big endian), then the text in UTF-8, or UTF-16 when it starts with a BOM. |

## Not mapped

| Data | Reason |
|---|---|
| ASIN (`----:ASIN`, `TXXX:ASIN`) | No registered URN form for `metadata.identifier`. |
| Grouping as series (`©grp`, `TIT1`, `GRP1`) | The Plex Audiobook Guide and beets-audible write `TIT1` as the free text "Series, Book #", which needs heuristics to split. |
| OverDrive MediaMarkers (`TXXX`) | Chapters stored as XML in library MP3 files. |
| Per-chapter artwork and URLs | No slot in the manifest. |
| Copyright, lyrics, explicit rating, media kind (`cprt`, `©lyr`, `rtng`, `stik`) | No matching metadata field. |
| DRM flag | A separate feature. |
| MP4 audio track language | Not read the same way everywhere. A file encoded by Apple's encoder carries the legacy QuickTime language code 0, which ffprobe reports as `eng` and AVFoundation as `und`, whatever the spoken language. |
| Language names ("English") | Would need a table of language names on every platform. |
| Track and disc numbers (`trkn`, `disk`, `TRCK`, `TPOS`) | The reading order follows the filenames. Using the tags too needs arbitration heuristics: Audiobookshelf reads both and chooses "the more accurate" number of the two. |

## Sources

Conventions:

- [Audiobookshelf, Book Library Structure (File Metadata)](https://audiobookshelf.org/docs/documentation/libraries/book-library/directory-structure/)
- [Audiobookshelf, `AudioFileScanner.js`](https://github.com/advplyr/audiobookshelf/blob/master/server/scanner/AudioFileScanner.js)
- [Audiobookshelf, `prober.js`](https://github.com/advplyr/audiobookshelf/blob/master/server/utils/prober.js)
- [Mp3tag, field mappings between ID3v2 and MP4](https://docs.mp3tag.de/mapping/)
- [Plex Audiobook Guide](https://github.com/seanap/Plex-Audiobook-Guide)
- [beets-audible](https://github.com/seanap/beets-audible)
- [Audiobook authoring on macOS](https://blog.mbirth.uk/2025/04/15/audiobook-authoring-on-macos.html)
- [mutagen issue #606, audiobook tags for MP4](https://github.com/quodlibet/mutagen/issues/606)
- [tone, audio tagger for audiobooks](https://github.com/sandreas/tone)

Tool behavior:

- [FFmpeg, `mov.c`](https://github.com/FFmpeg/FFmpeg/blob/master/libavformat/mov.c), which maps `©st3` to `subtitle`
- [mutagen, `ID3.save`](https://mutagen.readthedocs.io/en/latest/api/id3.html#mutagen.id3.ID3.save), whose `v23_sep` parameter joins multiple text values with `/` in ID3v2.3
- [ID3.org, iTunes Normalization settings](https://id3.org/iTunes%20Normalization%20settings)

Specifications:

- [Readium Web Publication Manifest, Audiobook Profile](https://readium.org/webpub-manifest/profiles/audiobook)
- [W3C Media Fragments URI 1.0](https://www.w3.org/TR/media-frags/)
- [ID3v2.3.0, text information frames](https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.3.0.html)
- [ID3v2.4.0, native frames](https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html)
- [ID3v2 Chapter Frame Addendum](https://id3.org/id3v2-chapters-1.0)
- [QuickTime File Format, Chapter lists](https://developer.apple.com/documentation/quicktime-file-format/chapter_lists)

What each convention source supports:

| Mapping | Supported by |
|---|---|
| Title from the album, then the title | Audiobookshelf, Plex Audiobook Guide, beets-audible, Audiobook authoring on macOS |
| Author from the album artist | Plex Audiobook Guide, beets-audible, Audiobook authoring on macOS. Audiobookshelf reads the artist first. |
| Artist written as "Author, Narrator" | Plex Audiobook Guide, beets-audible |
| Narrator from the composer | Audiobookshelf, Plex Audiobook Guide, beets-audible, Audiobook authoring on macOS, mutagen issue |
| Narrator from `©nrt` | Mp3tag, mutagen issue |
| Narrator from `TXXX:NARRATOR`, description from `TXXX:DESCRIPTION` | Mp3tag, which writes the fields without an ID3 frame as `TXXX:<field>`. Audiobookshelf reads the description one. |
| Series from the movement tags | Plex Audiobook Guide, beets-audible, mutagen issue, tone. Audiobookshelf lists them, but ffprobe, which it reads tags with, did not surface `©mvn` or `MVNM` in our tests. |
| Series from `SERIES` and `SERIES-PART` | Audiobookshelf, Plex Audiobook Guide, beets-audible |
| Subtitle from `TIT3` | Audiobookshelf, Mp3tag, Plex Audiobook Guide |
| Subtitle from `©st3` | FFmpeg `mov.c`, and so Audiobookshelf, which reads the `subtitle` tag reported by ffprobe |
| Subtitle from `----:SUBTITLE` | Mp3tag, which writes the fields without an MP4 atom as `----:com.apple.iTunes:<field>` |
| Album sort holding a series key | Plex Audiobook Guide, beets-audible |
| Release date from `TDRL` | Plex Audiobook Guide, which keeps `TYER` for the copyright year of the book. beets-audible, which writes the audio publication date to both `TDRC` and `TDRL`. |
| Description from the comment | Audiobookshelf, Plex Audiobook Guide |
| Description from `desc` and `ldes` | Mp3tag, Plex Audiobook Guide, Audiobook authoring on macOS |
| Genre separators | Audiobookshelf |
| ISBN and language from named tags | Audiobookshelf |
