# Parsing Accessibility Metadata

The goal of this document is to provide directions that each implementation of Readium can follow when parsing schema.org Accessibility Metadata in EPUB publications.

When parsing a publication in the streamer we always use the most complex form for each metadata to harmonize our output.

Related Repository: [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest)

References: 

- http://kb.daisy.org/publishing/docs/metadata/schema-org.html
- http://kb.daisy.org/publishing/docs/metadata/evaluation.html
- https://www.w3.org/wiki/WebSchemas/Accessibility

## AccessMode

`accessMode` is a key whose value is an array of strings.

It is expected in a conformant EPUB publication ([EPUB Accessibility 1.0](https://www.w3.org/Submission/epub-a11y/#sec-disc-package))

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `schema:accessMode`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessMode`. Their value is pushed to the array.

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

## AccessModeSufficient

`accessModeSufficient` is a key whose value is an array of arrays and strings.

The known values are the same as `accessMode`.

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `schema:accessModeSufficient`. 

When the value of their `content` attribute is a single `accessMode`, it is pushed to the array. When it is a multiple, another array is created then pushed to the parent array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessModeSufficient`. 

When their value is a single `accessMode`, it is pushed to the array. When it is a multiple, another array is created then pushed to the parent array.

## AccessibilitySummary

`accessibilitySummary` is a key whose value is an array of localized strings (JSON-LD language maps).

It is expected in a conformant EPUB publication ([EPUB Accessibility 1.0](https://www.w3.org/Submission/epub-a11y/#sec-disc-package))

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `schema:accessibilitySummary`. The key of the localized string is the value of the `xml:lang` attribute, and its value the value of the `content` attribute.

In case there is no `xml:lang` attribute to be found, check whether the carrying element inherits an `xml:lang` attribute. Otherwise fall back to the primary language of the publication.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilitySummary`. The key of the localized string is the value of the `xml:lang` attribute, and its value the value `meta` element.

In case there is no `xml:lang` attribute to be found, check whether the carrying element inherits an `xml:lang` attribute. Otherwise fall back to the primary language of the publication.

## CertifiedBy

`certifiedBy` is a key whose value is an array of strings.

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `a11y:certifiedBy`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `a11y:certifiedBy`. Their value is pushed to the array.

## CertifierCredential

`certifierCredential` is a key whose value is an array of strings.

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `a11y:certifierCredential`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from: 

- the `meta` elements whose `property` attribute has the value `a11y:certifierCredential`. Their value is pushed to the array;
- the `link` elements whose `property` attribute has the value `a11y:certifierCredential`. Their value is pushed to the array – the value is expected to be a URL.

## CertifierReport

`certifierReport` is a key whose value is an array of strings.

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `a11y:certifierReport`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `link` elements whose `property` attribute has the value `a11y:certifierReport`. Their value is pushed to the array – the value is expected to be a URL.

## ConformsTo

`conformsTo` is a key whose value is an array of strings.

These strings must be valid URLs. 

Although this URL can be arbitrary, it is likely one of the following:

- http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-a 
- http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa
- http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa

### EPUB 2.x

The array is created from the `meta` elements whose `name` attribute has the value `dcterms:conformsTo`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `link` elements whose `property` attribute has the value `dcterms:conformsTo`. The value of their `href` attribute is pushed to the array.

## AccessibilityFeature

`accessibilityFeature` is a key whose value is an array of strings.

It is expected in a conformant EPUB publication ([EPUB Accessibility 1.0](https://www.w3.org/Submission/epub-a11y/#sec-disc-package))

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

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityFeature`. Their value is pushed to the array.

## AcessibilityHazard

`accessibilityHazard` is a key whose value is an array of strings.

It is expected in a conformant EPUB publication ([EPUB Accessibility 1.0](https://www.w3.org/Submission/epub-a11y/#sec-disc-package))

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

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityHazard`. Their value is pushed to the array.

## AccessibilityControl

`accessibilityControl` is a key whose value is an array of strings.

### EPUB 2.x

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityControl`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityControl`. Their value is pushed to the array.

At the time of writing, known values are:

- `fullAudioControl`
- `fullKeyboardControl`
- `fullMouseControl`
- `fullSwitchControl`
- `fullTouchControl`
- `fullVideoControl`
- `fullVoiceControl`

## AccessibilityAPI

`accessibilityAPI` is a key whose value is an array of strings.

### EPUB 2.x

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityAPI`. The value of their `content` attribute is pushed to the array.

### EPUB 3.X

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityAPI`. Their value is pushed to the array.

At the time of writing, known values are:

- `ARIA`
- `AndroidAccessibility`
- `ATK`
- `AT-SPI`
- `BlackberryAccessibility`
- `IAccessible2`
- `iOSAccessibility`
- `JavaAccessibility`
- `MacOSXAccessibility`
- `MSAA`
- `UIAutomation`

Currently, only the `ARIA` value might be trustworthy in the EPUB context.