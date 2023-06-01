# Preferences API

* Editor: [Mickaël Menu](https://github.com/mickael-menu)
* Contributors: [Hadrien Gardeur](https://github.com/HadrienGardeur), [Quentin Gliosca](https://github.com/qnga), [Steven Zeck](https://github.com/stevenzeck)
* Review PR: [#164](https://github.com/readium/architecture/pull/164)

## Summary

One paragraph description of what the proposal is.


## Motivation

Describe the problems that this proposal seeks to address. How this new functionality would help Readium developers create better reading apps?


## Developer Guide

### Overview

The Navigator and other Readium components support dynamic configuration through the `Configurable` interface. This makes it simple to create a settings interface for users and save their preferences as a JSON object.

The application can't directly set the Navigator settings. Instead, it can submit a `Preferences` set to the Navigator (`Configurable`), which will recalculate its actual settings and refresh the display. The application can then update its user settings interface with the new settings emitted by the Navigator.

<img src="assets/000-flow.svg">

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
let editor = epubNavigator.editor(of: preferences)
    
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
let editor = epubNavigator.editor(of: preferences)
editor.wordSpacing.isEffective
```

#### Preferences are low-level

Preferences are low-level technical settings. Some of them can be shown to the user, like the font size, but others should not be displayed as-is.

For example, we can display two EPUB pages side-by-side using the `columnCount` (`auto`, `1`, `2`) property for reflowable resources and the `spread` (`auto`, `never`, `always`) property for fixed-layout publications. Instead of displaying both of these settings with all their possible values in the user interface, it may be more user-friendly to show a single switch button to activate dual-page mode, which will set both settings correctly.

### Saving and restoring user preferences

A user settings screen is not useful unless you can save and restore the selected preferences for future sessions. All `Preferences` types can be serialized to and from JSON. The API varies depending on the platform..

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

The toolkit provides suggested filters for each `Preferences` type to help you extract the preferences that are intrinsic to a publication..

```swift
let publicationPrefs = preferences.filterPublicationPreferences()
let sharedPrefs = preferences.filterSharedPreferences()

// You can reconstruct the original preferences by combining the filtered ones.
let combinedPrefs = publicationPrefs.merging(sharedPrefs)
```

:warning: Preferences that are specific to a certain publication, such as `language`, should not be shared across different publications. It is recommended to store these preferences separately for each book. Using the suggested filters will accomplish this..

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

### `Setting<V>` Class

Represents a single configurable property of a [Configurable] component and holds its current [value].

:warning: This class **must** be immutable.

For clarity, this reference guide is using a class hierarchy to represent specialization of the `Setting<V>` class, but you could use other solutions. For example in the Kotlin toolkit, there's a unique `Setting<V, E>` class which uses composition to store additional metadata into a `extras: E` property. Specialization are declared as type aliases, e.g. the `RangeSetting` is associated with a `RangeExtras` and declared as `RangeSetting<V> = Setting<V, RangeExtras>`.

#### Properties

* `key: String`
    * Unique identifier used to serialize [Preferences] to JSON.
* `value: V`
    * Current value for this setting.
* `coder: SettingCoder<V> = IdentitySettingCoder()`
    * JSON serializer for the [value]
* `validator: SettingValidator<V> = IdentitySettingValidator()`
    * Ensures the validity of a [V] value.
* `activator: SettingActivator = NullSettingActivator()`
    * Ensures that the condition required for this setting to be active are met in the given [Preferences] – e.g. another setting having a certain preference.

#### Methods

:question: A parameter prefixed with `...` indicates that the function can receive a variable number of arguments.

* `jsonValue() -> Any`
    * JSON raw representation for the current value.
    * It is computed using `coder.encode(value)`.
* `copyFirstValidValueFrom(...candidates: Preferences?, fallback: Setting<V> = this) -> Setting<V>`
    * Creates a copy of the [Setting] receiver, after replacing its value with the first valid value taken from the given [Preferences] objects, in order.
    * Each preference is verified using the setting [validator].
    * If no valid value is found, falls back on the value of `fallback` which defaults to the current value.

### `ToggleSetting` Class (extends `Setting<Boolean>`)

A boolean [Setting].

### `RangeSetting<V>` Class (extends `Setting<V>`)

A [Setting] whose value is constrained to a range.

#### Properties

* `range: Range<V>`
    * The valid range for the setting value.
* `suggestedSteps: List<V>?`
    * Value steps which can be used to decrement or increment the setting. It **must** be sorted in increasing order.
* `suggestedIncrement: V?`
    * Suggested value increment which can be used to decrement or increment the setting.
* `label: (V) -> String`
    * Returns a user-facing label for the given value. This can be used to format the value unit.

### `PercentSetting` Class (extends `RangeSetting<Double>`)

A [RangeSetting] representing a percentage from 0.0 to 1.0.

It adds the following default values to the `RangeSetting` properties:

* `range: Range<Double> = 0.0..1.0`
* `suggestedIncrement: Double? = 0.1`
* `label: (V) -> String = { value -> "${value * 100}%"`

### `EnumSetting<E>` Class (extends `Setting<E>`)

A [Setting] whose value is a member of the enum [E].

The default `validator` uses an `AllowlistSettingValidator` initialized with the `values`.

#### Properties

* `values: List<E>?`
    * List of valid [E] values for this setting. Not all members of the enum are necessary supported.
* `label: (E) -> String?`
    * Returns a user-facing label for the given value, when one is available.

### `ColorSetting` Class (extends `EnumSetting<Color>`)

A color [Setting].

The `Color` type depends on what is available on the platform.

A `Configurable` implementation might restrict the available colors with the `EnumSetting`'s `values` property. With a special `coder`, it can also recognize various types of JSON colors: integers, hexadecimal, named colors (`red`, `green`, etc.).


### `Preferences` Class

Set of preferences used to update a `Configurable`'s settings.

:point_up: Prefer implementing an immutable and a mutable version of `Preferences`, if possible. The mutable APIs are marked with "(*mutable*)". If not possible, the `copy()` method should be sufficient to prevent mutations of the preferences after submitting them to a `Configurable` object.

#### Properties

* `values: Map<String, *>`
    * Direct access to the JSON values.
    * Prefer using the safe `Setting`-based accessors instead.

#### Methods

* `copy() -> Preferences`
    * Creates a deep copy of this `Preferences`.
* (*mutable*) `merge(other: Preferences)`
    * Merges the preferences of [other], overwriting the ones from the receiver in case of conflict.

##### JSON serialization

* `Preferences(jsonString: String?)`
    * Creates a `Preferences` object from its JSON representation.
* `toJSON() -> Map<String, *>`
    * Serializes this [Preferences] to a JSON object.
* `toJSONString() -> String`
    * Serializes this [Preferences] to a JSON object.

##### Setting accessors

* `get(setting: Setting<V>) -> V?`
    * Gets the preference for the given [setting], if set.
* (*mutable*) `set(setting: Setting<V>, preference: V?, activate: Boolean = true)`
    * Sets the preference for the given [setting].
    * `activate: Boolean = true`
        * Indicates whether the setting will be force activated if needed.
* (*mutable*) `update(setting: Setting<V>, activate: Boolean = true, transform: (V) -> V`
    * Sets the preference for the given [setting] after transforming the current value.
* (*mutable*) `remove(setting: Setting<*>)`
    * Removes the preference for the given [setting].
* (*mutable*) `clear()`
    * Clears all preferences.

##### Setting activation

* `isActive(setting: Setting<*>) -> Boolean`
    * Returns whether the given [setting] is active in these preferences.
    * An inactive setting is ignored by the [Configurable] until its activation conditions are met (e.g. another setting has a certain preference).
* (*mutable*) `activate(setting: Setting<*>) -> Boolean`
    * Activates the given [setting] in the preferences, if needed.

##### Filtering

:question: A parameter prefixed with `...` indicates that the function can receive a variable number of arguments.

* `filter(...settings: Setting<*>) -> Preferences`
    * Creates a copy of this [Preferences], keeping only the preferences for the given settings.
* `filter(...keys: String) -> Preferences`
    * Creates a copy of this [Preferences], keeping only the preferences for the given setting [keys].
* `filterNot(...settings: Setting<*>) -> Preferences`
    * Creates a copy of this [Preferences], excluding the preferences for the given settings.
* `filterNot(...keys: String) -> Preferences`
    * Creates a copy of this [Preferences], excluding the preferences for the given setting [keys].

##### Type-specific helpers

###### `ToggleSetting`

* (*mutable*) `toggle(setting: ToggleSetting, activate: Boolean = true)`
    * Toggles the preference for the given boolean [setting].

###### `EnumSetting<E>`

* (*mutable*) `toggle(setting: EnumSetting<E>, preference: E, activate: Boolean = true)`
    * Toggles the preference for the enum [setting] to the given [preference].
    * If the preference was already set to the same value, it is removed.

###### `RangeSetting<V>`

* (*mutable*) `increment(setting: RangeSetting<V>, activate: Boolean = true, next: (V) -> V)`
    * Increments the preference for the given [setting] to the next step.
    * If the [setting] doesn't have any suggested steps, the [next] function will be used instead to determine the next step.
* (*mutable*) `decrement(setting: RangeSetting<V>, activate: Boolean = true, previous: (V) -> V)`
    * Decrements the preference for the given [setting] to the previous step.
    * If the [setting] doesn't have any suggested steps, the [previous] function will be used instead to determine the previous step.

###### `RangeSetting<Int>`

* (*mutable*) `increment(setting: RangeSetting<Int>, amount: Int = setting.extras.suggestedIncrement ?: 1, activate: Boolean = true)`
    * Increments the preference for the given [setting] to the next step.
    * `amount: Int = setting.extras.suggestedIncrement ?: 1`
        * Amount to increment, when the [setting] doesn't have any suggested steps or increment.
* (*mutable*) `decrement(setting: RangeSetting<Int>, amount: Int = setting.extras.suggestedIncrement ?: 1, activate: Boolean = true)`
    * Decrements the preference for the given [setting] to the previous step.
    * `amount: Int = setting.extras.suggestedIncrement ?: 1`
        * Amount to decrement, when the [setting] doesn't have any suggested steps or increment.
*  (*mutable*)`adjustBy(setting: RangeSetting<Int>, amount: Int, activate: Boolean = true)`
    * Adjusts the preference for the given [setting] by the [amount].
    * `amount: Int`
        * Amount to add to the current preference value.

###### `RangeSetting<Double>`

* (*mutable*) `increment(setting: RangeSetting<Double>, amount: Double = setting.extras.suggestedIncrement ?: 0.1, activate: Boolean = true)`
    * Increments the preference for the given [setting] to the next step.
    * `amount: Double = setting.extras.suggestedIncrement ?: 0.1`
        * Amount to increment, when the [setting] doesn't have any suggested steps or increment.
* (*mutable*) `decrement(setting: RangeSetting<Double>, amount: Double = setting.extras.suggestedIncrement ?: 0.1, activate: Boolean = true)`
    * Decrements the preference for the given [setting] to the previous step.
    * `amount: Double = setting.extras.suggestedIncrement ?: 0.1`
        * Amount to decrement, when the [setting] doesn't have any suggested steps or increment.
* (*mutable*) `adjustBy(setting: RangeSetting<Double>, amount: Double, activate: Boolean = true)`
    * Adjusts the preference for the given [setting] by the [amount].
    * `amount: Double`
        * Amount to add to the current preference value.

