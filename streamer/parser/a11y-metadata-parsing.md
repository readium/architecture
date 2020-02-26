# Parsing Accessibility Metadata

The goal of this document is to provide directions that each implementation of Readium can follow when parsing schema.org Accessibility Metadata in EPUB 3.x publications.

While the module is very flexible in the way each metadata can be represented, when parsing a publication in the streamer we always use the most complex form for each metadata to harmonize our output.

Related Repository: [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest)

## AccessibilityFeature

`accessibilityFeature` is a key whose value is an array of strings.

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityFeature`. Their value is pushed to the array.

Values can be: 

- `highContrastAudio`
- `highContrastDisplay`
- `largePrint`
- `displayTransformability`
- `annotations`
- `bookmarks`
- `index`
- `printPageNumbers`
- `readingOrder`
- `structuralNavigation`
- `synchronizedAudioText`
- `timingControl`
- `unlocked`
- `alternativeText`
- `audioDescription`
- `braille`
- `captions`
- `ChemML`
- `describedMath`
- `latex`
- `MathML`
- `longDescription`
- `rubyAnnotations`
- `signLanguage`
- `tactileGraphic`
- `tactileObject`
- `transcript`
- `ttsMarkup`

## AcessibilityHazard

`accessibilityHazard` is a key whose value is an array of strings.

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityHazard`. Their value is pushed to the array.

Values can be:

- `flashingHazard`
- `noFlashingHazard`
- `soundHazard`
- `noSoundHazard`
- `motionSimulationHazard`
- `noMotionSimulationHazard`
- `unknown`
- `none`

## AccessMode

`accessMode` is a key whose value is an array of strings.

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessMode`. Their value is pushed to the array.

Values can be:

- `textual`
- `visual`
- `auditory`
- `tactile`
- `chartOnVisual`
- `chemOnVisual`
- `colorDependent`
- `diagramOnVisual`
- `mathOnVisual`
- `musicOnVisual`
- `textOnVisual`

## AccessModeSufficient

`accessModeSufficient` is a key whose value is an array of arrays and strings.

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessModeSufficient`. 

When their value is a single `accessMode`, it is pushed to the array. When it is a multiple, another array is created then pushed to the parent array.

The values are the same as `accessMode`.

## AccessibilitySummary

`accessibilitySummary` is a key whose value is a string.

The string is the value of the `meta` element whose `property` attribute has the value `schema:accessibilitySummary`.

## CertifiedBy

`certifiedBy` is a key whose value is a string.

The string is the value of the `meta` element whose `property` attribute has the value `a11y:certifiedBy`.

## ConformsTo

`conformsTo` is a key whose value is a string. It must be a valid URL.

The string is the value of the `href` attribute of the `link` element whose `rel` attribute has the value `dcterms:conformsTo`.

## AccessibilityControl

**Note:** Not sure what to make of that as there are 2 different layers: EPUB contents and the RS itself, and they can collide.

`accessibilityControl` is a key whose value is an array of strings.

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityControl`. Their value is pushed to the array.

Values can be:

- `fullKeyboardControl`
- `fullMouseControl`
- `fullSwitchControl`
- `fullTouchControl`
- `fullVideoControl`
- `fullVoiceControl`

## AccessibilityAPI

**Note:** Not sure what to make of that as contents can only use `ARIA` and not much else, so maybe we should limit the key to this value.

`accessibilityAPI` is a key whose value is an array of strings.

The array is created from the `meta` elements whose `property` attribute has the value `schema:accessibilityAPI`. Their value is pushed to the array.

Values can be:

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