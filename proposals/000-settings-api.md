# Settings API

* Editor: [Mickaël Menu](https://github.com/mickael-menu)
* Contributors: [Hadrien Gardeur](https://github.com/HadrienGardeur), [Quentin Gliosca](https://github.com/qnga), [Steven Zeck](https://github.com/stevenzeck)
* Review PR: [#164](https://github.com/readium/architecture/pull/164)


## Summary

One paragraph description of what the proposal is.


## Motivation

Describe the problems that this proposal seeks to address. How this new functionality would help Readium developers create better reading apps?


## Developer Guide

### Overview

A few Readium components – such as the Navigator – support dynamic configuration through the `Configurable` interface. It provides an easy way to build a user settings interface and save user preferences as a JSON object.

The application cannot explicitly set the Navigator settings. Instead, you can submit a set of `Preferences` to the Navigator (`Configurable`) which will in turn recompute its settings and refresh the presentation. Then, the application can update its user settings interface with the new settings emitted by the Navigator.

For a concrete example: "font size" is a **setting**, the application can submit the font size value `150%` which is a **preference**.

<img src="assets/000-flow.svg">

```javascript
// 1. Get the current Navigator settings.
let settings = navigator.settings;

// 2. Create a new set of preferences.
let preferences = Preferences()
    .set(settings.fontFamily, FontFamily.Monospace)
    .increment(settings.fontSize)
    .toggle(settings.publisherStyles);

// 3. Submit the preferences, the Navigator will in turn update its settings. 
navigator.submitPreferences(preferences);
```

#### Settings

The `Settings` (*plural*) object is unique for each `Configurable` implementation and holds the currently available `Setting` (*single*) properties. Each `Setting` object represents a single configurable property of the `Configurable` object, such as the font size or the theme. It holds the current value of the setting, as well as additional metadata and constraints depending on the setting type.

Here are some of the available setting types:

* `ToggleSetting` - a simple boolean setting, e.g. whether or not the publisher styles are enabled.
* `RangeSetting<V>` - a setting for numbers constrained in a range, e.g. the page margins as a `RangeSetting<Int>` could range from 0 to 200 pixels.
* `PercentSetting` - a specialization of `RangeSetting<Double>` which represents a percentage from, by default, 0.0 to 1.0.
* `EnumSetting<V>` - a setting whose value is a member of the enum `V`, e.g. the theme (`light`, `dark`, `sepia`) or the font family.

##### `Setting` objects are low-level

The `Setting` objects are technical low-level properties. While some of them can be directly exposed to the user, such as the font size, other settings should not be displayed as-is.

For example in EPUB, we simulate two pages side by side with `columnCount` (`auto`, `1`, `2`) for reflowable resources and `spread` (`auto`, `landscape`, `both`, `none`) for a fixed layout publication. Instead of showing both settings with all their possible values in the user interface, you might prefer showing a single switch button to enable a dual-page mode which will set both settings appropriately.

#### Preferences

The `Preferences` object holds the values which should be preferred by the Navigator when computing its `Settings`. Preferences can be combined by the app from different sources:

* Hard-coded app defaults.
* User preferences restored from JSON.
* User settings interface.

##### Inactive settings

A setting can be inactive if its activation conditions are not met in a set of preferences. A Navigator will ignore inactive settings when refreshing its presentation. For instance with the EPUB navigator, the word spacing setting requires the publisher styles to be disabled to take effect.

You can check if a setting is active with:

```javascript
preferences.isActive(settings.wordSpacing);
```

To force activate a setting, use `Preferences.activate()` which will automatically reset the other preferences to the required values.

```javascript
preferences.activate(settings.wordSpacing);
```

:point_up: For convenience, settings are force activated by default when set in a `Preferences`. This helps the user see the impact of a setting right away when changing it in the user interface. If you want to set a preference without modifying the other ones, set the `activate` option to `false`.

```javascript
preferences
    .set(settings.fontFamily, FontFamily.Monospace, { activate: false })
    .increment(settings.fontSize, { activate: false })
    .toggle(settings.publisherStyles, { activate: false });
```

### Setting the initial Navigator preferences and app defaults

When opening a publication, you want to apply the user preferences right away. You can do that by providing them to the Navigator constructor. The API depends on each Navigator implementation, but looks like this:

```javascript
let config = EPUBNavigatorConfiguration({
    preferences: preferencesStore.get(publication.profile),
    defaultPreferences: Preferences()
        .set(EPUBSettings.SCROLLED, true)
});

let navigator = EPUBNavigator(publication, { config: config });
```

The `defaultPreferences` are used as fallback values when the default Navigator settings are not suitable for your application.

:point_up: When you don't have access to an `EPUBSettings` instance, the "prototype" settings (e.g. `EPUBSettings.SCROLLED`) are helpful to modify a `Preferences` object.

## Building a user settings interface

:question: This API works best with a declarative UI toolkit like Jetpack Compose, Flutter or SwiftUI, but could be used with a regular imperative toolkit as well.

You can use the `Configurable` API to build a user settings interface dynamically. As this API is agnostic to the type of publication, you can reuse parts of the user settings screen across Navigator implementations or media types.

For example, you could group the user settings per nature of presentation:

* `ReflowableUserSettings` for a visual publication with adjustable fonts and dimensions, such as a reflowable EPUB, HTML document or PDF with reflow mode enabled.
* `FixedLayoutUserSettings` for a visual publication with a fixed layout, such as FXL EPUB, PDF or comic books.
* `PlaybackUserSettings` for an audiobook, text-to-speech or EPUB media overlays settings.

To avoid bugs and race conditions, use the following single sources of truth:

* The `PreferencesStore` holds the user `Preferences` object.
* The `Configurable` (Navigator) holds the `Settings` object.

The `View` itself is created using the combination of the latest user `Preferences` and `Settings`:

* `Preferences` is used to show which value the user selected.
* `Settings` is used to know which settings are available, their constraints and effective value.

Here's an example showing the flow of actions and events:

<img src="assets/000-flow-detailed.svg">

1. The view is laid out using the latest stored `Preferences` and navigator `Settings` objects.
2. When the user changes a setting in the user interface, the view model will send the updated `Preferences` to the `PreferencesStore` to save it.
3. The `PreferencesStore` stores the `Preferences` then emit a "changed" event with the updated `Preferences`.
4. As the view model observes changes from the `PreferencesStore`, it will:
    * Trigger an update of the view with the updated `Preferences`.
    * Submit the new `Preferences` to the Navigator.
5. The Navigator updates its current `Settings` object using the submitted `Preferences`, then emit a "changed" event with the updated `Settings`.
    * The presentation will be updated asynchronously to reflect the new settings.
6. As the view model observes changes from the Navigator's `settings` property, it will trigger an update of the view with the updated `Settings`.

Here's an example using an hypothetical declarative UI toolkit.

```javascript
function renderView(viewModel, settings, preferences) {
    let overflow = settings.overflow;
    if (overflow != null) {
        let value = preferences.get(overflow) ?: overflow.value;

        Row {
            Label("Scrolled mode")

            Switch(
                checked: (value == Overflow.SCROLLED)
            ) { isChecked in
                viewModel.updatePreferences(prefs => {
                    prefs.set(overflow, isChecked ? Overflow.SCROLLED : Overflow.PAGINATED);
                });
            }
        }
    }

    let fontSize = settings.fontSize;
    if (fontSize != null) {
        let value = preferences.get(fontSize) ?: fontSize.value;

        Row {
            Label("Font size")

            Button("-") {
                viewModel.updatePreferences(prefs => {
                    prefs.decrement(fontSize);
                });
            }

            Label(fontSize.label(value))
                .opacity(fontSize.isActive ? 1.0 : 0.5)

            Button("+") {
                viewModel.updatePreferences(prefs => {
                    prefs.increment(fontSize);
                });
            }
        }
    }
}
```

### Saving and restoring the user preferences

Having a user settings screen is moot if you cannot save and restore the selected preferences for future sessions. Thankfully you can serialize `Preferences` to a JSON object.

```javascript
let json = JSON.stringify(preferences.toJSON());
```

When you are ready to restore the user preferences, construct a new `Preferences` object from the JSON string.

```javascript
let preferences = Preferences(JSON.parse(json));
```

#### Splitting and merging preferences

How you store user preferences has an impact on the available features. You could have, for example:

* A different unique set of preferences for each publication.
* Preferences shared between publications with the same profile or media type (EPUB, PDF, etc.).
* Global preferences shared with all publications (e.g. theme).
* Several user setting profiles/themes that the user can switch to and modify independently.
* Some settings that are not stored as JSON and will need to be reconstructed (e.g. the publication language).

Use the `filter` and `filterNot` API to extract settings from a `Preferences` object. You can then merge them again together.

```javascript
let appPrefs = prefs.filter(settings.theme);
let bookPrefs = prefs.filter(settings.language, settings.readingProgression);
let profilePrefs = prefs.filterNot(settings.theme, settings.language, settings.readingProgression);

let combinedPrefs = appPrefs.copy()
    .merge(profilePrefs)
    .merge(bookPrefs);
```

#### Settings scoped to a publication

:warning: Some settings are really tied to a particular publication and should never be shared between several publications, such as the language. It's recommended that you store these settings separately per book.

While you can filter such settings explicitly, Readium offers a list of known publication-scoped settings with `PUBLICATION_SETTINGS`.

```javascript
// Filter the preferences that are related to the publication.
let bookPrefs = prefs.filter(...PUBLICATION_SETTINGS);
// Filter the preferences that will be shared between publications of the same profile.
let profilePrefs = prefs.filterNot(...PUBLICATION_SETTINGS);
```

## Reference Guide

:point_up: This reference is only a broad guide. Each platform should use the most idiomatic patterns to implement this API.

### `Configurable` Interface

A `Configurable` is a component with a set of configurable `Settings`.

#### Properties

* `settings: Settings`
    * Current `Settings` values.
    * Implementers should override this property to set the actual `Settings` sub-type.
    * This property must be observable, for example with a separate callback registry (`addSettingsObserver()`) or with a dedicated reactive object such as `StateFlow` (Kotlin coroutines) or `@Published`/`CurrentValueSubject` with Swift Combine. 

#### Methods

* `submitPreferences(preferences: Preferences)`
    * Submits a new set of `Preferences` to update the current `Settings`.
    * Note that the `Configurable` might not update its `settings` right away, or might even ignore some of the provided preferences. They are only used as hints to compute the new settings.

#### `Configurable.Settings` Interface

Marker interface for the `Setting` properties holder of a `Configurable`.

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

