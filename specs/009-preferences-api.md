# Preferences API

* Editor: [Mickaël Menu](https://github.com/mickael-menu)
* Contributors: [Hadrien Gardeur](https://github.com/HadrienGardeur), [Quentin Gliosca](https://github.com/qnga), [Steven Zeck](https://github.com/stevenzeck)
* Review PR: [#164](https://github.com/readium/architecture/pull/164)

## Summary

The Preferences API is a tool for creating components configurable during runtime. It provides a useful framework for constructing user settings interfaces, taking into account all the rules and dependencies associated with each setting. This makes it easy for developers to create a user interface that can be customized to their individual needs.

Multiple Readium components, such as Navigators, use this new framework to provide a unified API that enables them to change their settings on-the-fly.

## Motivation

Navigators in Readium are built differently depending on the type of publication. In the past, the API for modifying their presentation varied across implementations, making it more difficult to build a user interface and store user preferences.

Developers now have access to a single API enabling them to reuse user interface views across types of publications, such as:

* Visual publication with adjustable fonts and dimensions, e.g. reflowable EPUB, HTML document or PDF with reflow mode enabled.
* Visual publication with a fixed layout, e.g. fixed-layout EPUB, PDF or comic books.
* Publication with media playback, e.g. audiobook, text-to-speech or EPUB media overlays settings.

## Developer Guide

### Overview

The Navigator and other Readium components support dynamic configuration through the `Configurable` interface. This makes it simple to create a settings interface for users and save their preferences as a JSON object.

The application can't directly set the Navigator settings. Instead, it can submit a `Preferences` set to the Navigator (`Configurable`), which will recalculate its actual settings and refresh the display. The application can then update its user settings interface with the new settings emitted by the Navigator.

<img src="assets/009-flow.svg">

```swift
// 1. Create a set of preferences.
let preferences = EPUBPreferences(
    fontFamily: .serif,
    fontSize: 2.0,
    publisherStyles: false
)

// 2. Submit the preferences, the Navigator will update its settings and the presentation.
epubNavigator.submitPreferences(preferences)

// 3. Read the new settings.
assert(epubNavigator.settings.fontFamily == .serif)
```

### Editing preferences

`Configurable` objects usually provide a `PreferencesEditor` to help you create or modify preferences. They offer a collection of adjustable `Preference<Value>` properties, with rules and helpers to modify their values depending on their type.

```swift
// 1. Create a preferences editor.
let editor = EPUBPreferencesEditor(preferences)
    
// 2. Modify the preferences through the editor.
editor.fontFamily.set(.serif)
editor.fontSize.increment()
editor.publisherStyles.toggle()

// 3. Submit the edited preferences.
epubNavigator.submitPreferences(editor.preferences)
```

## Setting the initial Navigator preferences and app defaults

When opening a publication, you can immediatly apply user preferences by passing them to the Navigator constructor. The API for this varies depending on the Navigator implementation, but usually looks like this:

```swift
let navigator = try EPUBNavigatorViewController(
    publication: publication,
    config: .init(
        preferences: EPUBPreferences(
            language: Language(code: "fr")
        ),
        defaults: EPUBDefaults(
            pageMargins: 1.5,
            scroll: true
        )
    )
)
```

The `defaults` are used as fallback values when the default Navigator settings are not suitable for your application.

### Inactive settings

If the activation conditions of a setting are not met in the preferences, the setting is inactive. The Navigator will not consider inactive settings when updating its presentation. For example, the EPUB word spacing setting will only take effect if the publisher styles are disabled.

You can use the `PreferencesEditor` to determine if a setting is effective for a given set of preferences.

```swift
let editor = EPUBPreferencesEditor(preferences)
editor.wordSpacing.isEffective
```

#### Preferences are low-level

Preferences are low-level technical settings. Some of them can be shown to the user, like the font size, but others should not be displayed as-is.

For example, we can display two EPUB pages side-by-side using the `columnCount` (`auto`, `1`, `2`) property for reflowable resources and the `spread` (`auto`, `never`, `always`) property for fixed-layout publications. Instead of displaying both of these settings with all their possible values in the user interface, it may be more user-friendly to show a single switch button to activate dual-page mode, which will set both settings correctly.

### Saving and restoring user preferences

All `Preferences` types can be serialized to and from JSON, which is useful for saving and restoring the selected preferences for future sessions. The API differs depending on the platform.

```swift
let jsonData = try JSONEncoder().encode(preferences)
```

When you are ready to restore the user preferences, construct a new `Preferences` object from the JSON data.

```swift
let preferences = try JSONDecoder().decode(EPUBPreferences.self, from: jsonData)
```

#### Splitting and merging preferences

The way you store user preferences can impact the features available. For instance, you might have:

* A unique set of preferences for each publication.
* Preferences shared between publications with the same profile or media type (EPUB, PDF, etc.).
* Global preferences shared with all publications – e.g. theme.
* Several user preferences profiles/themes that the user can switch between and modify independently.
* Some preferences that are not stored as JSON and will need to be reconstructed – e.g. the publication language.

The toolkit provides suggested filters for each `Preferences` type to help you extract the preferences that are intrinsic to a publication.

```swift
let publicationPrefs = preferences.filterPublicationPreferences()
let sharedPrefs = preferences.filterSharedPreferences()

// You can reconstruct the original preferences by combining the filtered ones.
let combinedPrefs = publicationPrefs.merging(sharedPrefs)
```

:warning: Preferences that are specific to a certain publication, such as `language`, should not be shared across different publications. It is recommended to store these preferences separately for each book. Using the suggested filters will accomplish this.

## Reference Guide

:point_up: This reference is only a broad guide. Each platform should use the most idiomatic patterns to implement this API.

### `Configurable<S : Configurable.Settings, P : Configurable.Preferences>` Interface

A `Configurable` is a component with a set of `Configurable.Settings`.

#### Properties

* `settings: S`
    * Current setting values.

#### Methods

* `submitPreferences(preferences: P)`
    * Submits a new set of preferences to update the current settings.
    * Note that the `Configurable` might not update its `settings` right away, or might even ignore some of the provided preferences. They are only used as hints to compute the new settings.

#### `Configurable.Settings` Interface

Marker interface for the setting properties holder.

#### `Configurable.Preferences` Interface

Marker interface for the preferences properties holder.

Each implementation must adhere to the interface that enables JSON serialization and deserialization on the platform.

##### Methods

* `merging(other: Self) -> Self`
    * Creates a new instance of `Self` after merging the values of `other`.
    * In case of conflict, `other` takes precedence.
    * Note: It should be adapted for each platform to be more idiomatic.

### `PreferencesEditor<P : Configurable.Preferences>` Interface

Interactive editor of preferences. This can be used as a helper for a user preferences screen.

Each implementation provides a set of `Preference<V>` properties to modify the associated preference value.

#### Properties

* `preferences: P`
    * The current preferences.

#### Methods

* `clear()`
    * Unset all preferences.

### `Preference<V>` Interface

A handle to edit the value of a specific preference which is able to predict which value the `Configurable` will effectively use.

#### Properties

* `value: V?`
    * The current value of the preference.
* `effectiveValue: V`
    * The value that will be effectively used by the `Configurable` object if preferences are submitted as they are.
* `isEffective: Boolean`
    * Indicates if this preference will be effectively used by the `Configurable` object if preferences are submitted as they are.

#### Methods

* `set(value: V?)`
    * Set the preference to `value`.
    * A null value means unsetting the preference.
* `clear()`
    * Unset the preference.
    * Equivalent to `set(null)`
    
#### `Preference<Boolean>`

A `Preference` with a boolean for value.

##### Methods

* `toggle()`
    * Toggle the preference value. A default value is taken as the initial one if the preference is currently unset.
    
#### `EnumPreference<V>`
    
A `Preference` which accepts a closed set of values.

##### Properties

* `supportedValues: List<V>`
    * List of valid values for this preference.
    
#### `RangePreference<V>`

A `Preference` whose values must lie in a range of `V`.

##### Properties

* `supportedRange: Range<V>`
    * Supported range for the values.
    
##### Methods

* `increment()`
    * Increment the preference value from its current value or a default value.
* `decrement()`
    * Decrement the preference value from its current value or a default value.
* `format(value: V) -> String`
    * Format `value` in a way suitable for display, including unit if relevant.
    
#### Mapping helpers
    
The toolkit ships with mapping helpers to create new custom `Preference` objects, allowing a reading app to adapt the type and range of values available in its user interface.

##### `Preference<V>`

* `map<T>(from: (V) -> T, to: (T) -> V) -> Preference<T>`
    * Creates a new `Preference` object wrapping the receiver and converting its value `from` and `to` the target type `T`.
* `withSupportedValues(values: List<V>) -> EnumPreference<V>`
    * Creates a new `EnumPreference` object wrapping the receiver with the provided supported `values`.

##### `Preference<Boolean>`

* `flipped() -> Preference<Boolean>`
    * Returns a new preference with its boolean value flipped.

##### `EnumPreference<V>`

* `map<T>(from: (V) -> T, to: (T) -> V, supportedValues: (List<V>) -> List<T>)? = null) -> EnumPreference<T>`
    * Creates a new `EnumPreference` object wrapping the receiver and converting its value and `supportedValues`, `from` and `to` the target type `T`.
    * If `supportedValues` is null, then the original supported values will be mapped with `from`.
* `mapSupportedValues(transform: (List<V>) -> List<V>) -> EnumPreference<V>`
    * Creates a new `EnumPreference` object wrapping the receiver and transforming its supported values with `transform`.
