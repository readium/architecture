# Parsing Accessibility Metadata

The goal of this document is to provide directions that each implementation of Readium can follow when parsing schema.org Accessibility Metadata in EPUB publications. Its focus is the mapping of EPUB 2/3 to the internal Readium Publication model; serialization of the JSON Readium Web Publication Manifest is out of scope in this guidance document.

When parsing a publication in the streamer we always use the most complex form for each metadata to harmonize our output.

Related Repository: [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest)

References: 

- https://www.w3.org/Submission/epub-a11y/
- https://www.w3.org/TR/epub-a11y-11/
- http://kb.daisy.org/publishing/docs/metadata/schema-org.html
- http://kb.daisy.org/publishing/docs/metadata/evaluation.html
- https://www.w3.org/wiki/WebSchemas/Accessibility
- https://www.w3.org/TR/pub-manifest/#accessibility
- https://www.w3.org/publishing/a11y/UX-Guide-metadata/techniques/epub-metadata/

## AccessMode

`accessMode` is a key whose value is an array of strings.

It is expected in a conformant EPUB publication ([EPUB Accessibility 1.0](https://www.w3.org/Submission/epub-a11y/#sec-disc-package) and
[EPUB Accessibility 1.1](https://www.w3.org/TR/epub-a11y-11/#sec-disc-package)).

At the time of writing, known values are:

- `auditory`
- `tactile`
- `textual`
- `visual`
- `chartOnVisual`
- `chemOnVisual`
- `colorDependent`
- `diagramOnVisual`
- `mathOnVisual`
- `musicOnVisual`
- `textOnVisual`

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `schema:accessMode`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessMode`. Their value (i.e. child textual content) is pushed to the array.

## AccessModeSufficient

`accessModeSufficient` is a key whose value is an array of arrays of strings.

The known values are:

- `auditory`
- `tactile`
- `textual`
- `visual`

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `schema:accessModeSufficient`. 

When the value of their `content` attribute is a single `accessMode`, make an array from the token and insert it into the `accessModeSufficient` array.

When it is a multiple:

- split the value based on comma (`,`) separator;
- trim (left + right) each resulting string token, but leave original whitespaces inside the token – some EPUBs might be using a space separator instead of comma;
- remove duplicate tokens (if any);
- make an array from the remaining tokens;
- insert this array into the `accessModeSufficient` array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessModeSufficient`. 

When their value is a single `accessMode`, make an array from the token and insert it into the `accessModeSufficient` array.

When it is a multiple:

- split the value based on comma (`,`) separator;
- trim (left + right) each resulting string token, but leave original whitespaces inside the token – some EPUBs might be using a space separator instead of comma;
- remove duplicate tokens (if any);
- make an array from the remaining tokens;
- insert this array into the `accessModeSufficient` array.

## AccessibilitySummary

`accessibilitySummary` is a key whose value is a string.

### EPUB 2.x

The string is the value of the first `meta` element whose `name` attribute has the value `schema:accessibilitySummary`.

### EPUB 3.X

The string is the value of the first `meta` element whose `property` attribute has the value `schema:accessibilitySummary`.

## CertifiedBy

`certifiedBy` is a key whose value is a string.

### EPUB 2.x

The string is the value of the first `meta` element whose `name` attribute has the value `a11y:certifiedBy`.

### EPUB 3.X

The string is the value of the first `meta` element whose `property` attribute has the value `a11y:certifiedBy`.

## CertifierCredential

`certifierCredential` is a key whose value is a string

### EPUB 2.x

The string is the value of the first `meta` element whose `name` attribute has the value `a11y:certifierCredential`.

### EPUB 3.X

- Check if the `certifiedBy` element that has been picked is refined by any `meta` whose `property` attribute has the value `certifierCredential`.
- If not, use the first `meta` element whose `property` attribute has the value `certifierCredential`.

The string is the textual value of this `meta` element. 

## CertifierReport

`certifierReport` is a key whose value is a string.

### EPUB 2.x

The string is the value of the first `meta` element whose `name` attribute has the value `a11y:certifierReport`.

### EPUB 3.X

- Check if the `certifiedBy` element that has been picked is refined by any `link` whose `rel` attribute has the value `a11y:certifierReport`.
- If `certifiedBy` is not refined by any suitable `link`, use the first `link` whose `rel` attribute has the value `a11y:certifierReport`.

The string is the textual value of this `link` – the value is expected to be a URL.

## ConformsTo

`conformsTo` is a key whose value is an array of strings.

Values are likely to point to some version of the EPUB accessibility specification and some WCAG profile.
Try to canonicalize the values to well-known URLs.

Replace any of the following strings with "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-a":
- "EPUB Accessibility 1.1 - WCAG 2.0 Level A"
- "http://idpf.org/epub/a11y/accessibility-20170105.html#wcag-a"
- "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-a"
- "https://idpf.org/epub/a11y/accessibility-20170105.html#wcag-a"
- "https://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-a"

Replace any of the following strings with "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa":
- "EPUB Accessibility 1.1 - WCAG 2.0 Level AA"
- "http://idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa"
- "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa"
- "https://idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa"
- "https://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa"

Replace any of the following strings with "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa":
- "EPUB Accessibility 1.1 - WCAG 2.0 Level AAA",
- "http://idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa",
- "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa",
- "https://idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa",
- "https://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa",

Put canonicalized values into the array. Drop the unknown ones.

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `dcterms:conformsTo`
and `content` attribute has a value matching any well-known accessibility profile.
The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `link` elements whose `rel` attribute has the value `dcterms:conformsTo`
and `href` attribute is matching any well-known accessibility profile.
The value of their `href` attribute is pushed to the array.

## AccessibilityFeature

`accessibilityFeature` is a key whose value is an array of strings.

It is expected in a conformant EPUB publication ([EPUB Accessibility 1.0](https://www.w3.org/Submission/epub-a11y/#sec-disc-package)) and
[EPUB Accessibility 1.1](https://www.w3.org/TR/epub-a11y-11/#sec-disc-package)).

At the time of writing, known values are:

- `alternativeText`
- `annotations`
- `audioDescription`
- `bookmarks`
- `braille`
- `captions`
- `ChemML`
- `describedMath`
- `displayTransformability`
- `displayTransformability/font-size`
- `displayTransformability/font-family`
- `displayTransformability/line-height`
- `displayTransformability/word-spacing`
- `displayTransformability/letter-spacing`
- `displayTransformability/color`
- `displayTransformability/background-color`
- `highContrastAudio`
- `highContrastAudio/noBackground`
- `highContrastAudio/reducedBackground`
- `highContrastAudio/switchableBackground`
- `highContrastDisplay`
- `index`
- `largePrint`
- `latex`
- `longDescription`
- `MathML`
- `none`
- `printPageNumbers`
- `readingOrder`
- `rubyAnnotations`
- `signLanguage`
- `structuralNavigation`
- `synchronizedAudioText`
- `tableOfContents`
- `taggedPDF`
- `tactileGraphic`
- `tactileObject`
- `timingControl`
- `transcript`
- `ttsMarkup`
- `unlocked`

Note the enumerated values are actually open-ended, due to the possible `displayTransformability` suffixes which map to CSS rules.

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `schema:accessibilityFeature`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityFeature`. Their value (i.e. child textual content) is pushed to the array.

## AcessibilityHazard

`accessibilityHazard` is a key whose value is an array of strings.

It is expected in a conformant EPUB publication ([EPUB Accessibility 1.0](https://www.w3.org/Submission/epub-a11y/#sec-disc-package)) and
[EPUB Accessibility 1.1](https://www.w3.org/TR/epub-a11y-11/#sec-disc-package)).

At the time of writing, known values are:

- `flashingHazard`
- `noFlashingHazard`
- `motionSimulationHazard`
- `noMotionSimulationHazard`
- `soundHazard`
- `noSoundHazard`
- `unknown`
- `none`

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `schema:accessibilityHazard`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityHazard`. Their value (i.e. child textual content) is pushed to the array.
