# Presentation API

* Authors: [Hadrien Gardeur](https://github.com/HadrienGardeur), [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Review PR: [#164](https://github.com/readium/architecture/pull/164)


## Summary

One paragraph description of what the proposal is.


## Motivation

Describe the problems that this proposal seeks to address. How this new functionality would help Readium developers create better reading apps?


## Developer Guide

### Presentable Navigator

Each `Navigator` implementing the Presentation API has a set of *presentation settings* influencing how a publication is rendered.

#### Presentation Settings

A *setting* determines one aspect of the presentation, such as the font size or the playback rate. It is identified by a unique string key (e.g. `fontSize`) and holds a configurable value.

You can get the current list of *presentation settings* with `navigator.presentationSettings`. This is an observable property.

##### Updating the settings

The application cannot directly overwrite the setting values, as the Navigator controls the validity of its settings. Instead, the app can submit *preferences* (a dictionary of setting values) which will be applied by the Navigator when possible. The effective *value* of a *setting* might not be the one submitted by the app.

```swift
navigator.submit(PresentationValues(
    readingProgression: .ttb,
    columnCount: 2
))

let settings = navigator.presentationSettings
assert(settings.overflow.value == .scrolled)
// columnCount = 2 requires that overflow be paginated,
// so the effective value is null.
assert(settings.columnCount.value == 2)
assert(settings.columnCount.effectiveValue == nil)
```

##### Setting constraints

*Settings* are not active at all times, as two *settings* can be incompatible. For example, the `columnCount` setting is only active with a `overflow` setting set to `paginated`. Besides, a *setting* might have a restricted set of possible values, depending on the Navigator, such as only `ltr` and `rtl` for the `readingProgression` setting. Each *setting* has a set of *constraints* holding these rules and dependencies. The available constraint properties depend on the type of the *setting*.

Given a fictional Navigator implementation:

```swift
let settings = navigator.presentationSettings

// columnCount requires the overflow setting to be set to paginated to be active.
assert(settings.columnCount.requiredValues == PresentationValues(overflow = .paginated))

// This Navigator supports only LTR and RTL reading progressions.
assert(settings.readingProgression.supportedValues == [.ltr, .rtl])

// This Navigator has 20 different values for the font size.
assert(settings.fontSize.stepCount)
```

##### Settings are low-level

The *presentation settings* are technical low-level properties. While some of them can be directly exposed to the user, such as the font size, other *settings* should not be displayed as-is. For example in EPUB, we simulate two-page spreads with `columnCount` (`auto`, `1`, `2`) for reflowable resources and `spread` (`auto`, `landscape`, `both`, `none`) for a fixed layout publication. Instead of showing both *settings* with all their possible values in the user interface, an app might prefer to show a single switch button to enable "dual-page" which will set both *settings* appropriately.

Similarly, an app might want to cluster several *settings* together. For example, given a *scrolled* mode switch in the user interface:

* When on, `overflow` is set to `scrolled` and `readingProgression` to `ttb`.
* When off, `overflow` is set to `paginated` and the user can freely select the `readingProgression` between the two values `ltr` and `rtl`.

#### Presentation Controller

The Navigator Presentation API is pretty simple, but requires a lot of glue code to build an effective user interface and handle settings persistence. The `PresentationController` helper provides a set of API to handle this.

First, create a `PresentationController` with an initial set of setting preferences.

```swift
let controller = PresentationController(navigator: navigator, preferences: userValues)
```

##### Setting up the user interface

You can observe the *settings* changes to update your user interface accordingly.

```swift
let overflow = controller.settings.overflow
if (overflow != null) {
    Row {
        Label("Scrolled mode")

        Switch(
            checked: (overflow.value == .scrolled)
        ) { isChecked in
            controller.set(overflow, isChecked ? .scrolled : .paginated)
        }
    }
}

let fontSize = controller.settings.fontSize
if (fontSize != null) {
    Row {
        Label("Font size")

        Button("-") {
            controller.decrement(fontSize)
        }

        Label(fontSize.valueDescription)
            .color(fontSize.isActive ? .black : .gray)

        Button("+") {
            controller.increment(fontSize)
        }
    }
}
```

#### Persisting the user preferences.

The `PresentationValue` object holds a simple map which can be serialized into a JSON object. Reading apps are responsible for storing and retrieving the JSON when needed.

When using the `PresentationController` helper class, you can observe the list of user settings to save any changes.

```typescript
controller.userSettings.observe { settings ->
    preferencesStorage.save(settings.values)
}
```

#### Terms

* **Setting** – A configurable property that determines one aspect of the publication presentation, e.g. the font size or the playback rate.
* **Key** – Each setting is identified by a unique string key, e.g. `fontSize`.
* **Value** – Each setting has a value of a given value type, e.g. the `Orientation` enum or a boolean.
* **Preference** – A preference is a preferred setting value provided by the app, usually set by the user.
* **Constraints** – A set of rules and dependencies constraining a setting's value.

    * The properties are computed by the Navigator from, by order of precedence:
        1. *User Presentation Settings* provided by the app.
        2. *App Presentation Settings* provided by the app.
        3. *Presentation Hints* embedded in the publication.
        4. *Presentation Defaults* provided by the Navigator.
* **Presentation Settings**: A list of key-value pairs provided by the app to influence the current Navigator's *Presentation Properties*. The keys must be valid *Presentation Property Keys*.
    * **User Settings**: A dynamic list of *Presentation Settings* the app chooses to expose in the user settings interface for the user to modify.
    * **App Settings**: A hard coded list of *Presentation Settings* that the app chooses to customize but without user input.
* **Presentation Hints**: An immutable list of metadata embedded in a publication. Navigators use them to compute default values for the settings. [See the RWPM specification](https://readium.org/webpub-manifest/modules/presentation.html).
* **Presentation Defaults**: A static list of *Presentation Property Values* used as fallback by a Navigator when a property is not overriden by *Presentation Hints* or *Presentation Settings*.


## Reference Guide

### `Observable<T>` Class

A value holder which has a current value and notifies observers when its value changes, for example:
* `BehaviorSubject` with ReactiveX
* `StateFlow` with Kotlin coroutines
* `@Published`/`CurrentValueSubject` with Swift Combine

If the platform does not offer reactive programming capabilities, `Observable` can be implemented with a simple callback registry. [Here's a Swift implementation](https://github.com/readium/r2-shared-swift/blob/7c66c3b7eb8711946b4fca4a1cce8f5ae0bc6bfe/r2-shared-swift/Toolkit/Observable.swift). 

### `PresentationNavigator` Interface

A Navigator whose presentation can be customized with app-provided settings.

#### Properties

* `presentation: PresentationProperties`
    * Current values for the Presentation Properties and their metadata.

#### Methods

* `apply(settings: PresentationSettings)`
    * Submits a new set of Presentation Settings used by the Navigator to recompute its Presentation Properties.
    * Note that the Navigator might not update its presentation right away, or might even ignore some of the provided settings. They are only used as guidelines to compute the Presentation Properties.

### `PresentationProperties` Class

Holds the current values for the Presentation Properties determining how a publication is rendered by a Navigator. For example, "font size" or "playback rate".

#### Properties

* `properties: Map<String, Observable<PresentationProperty?>>`
    * Maps each Property Key to the current property value.
    * If a property is null, it means that the Navigator does not support it.

#### Helpers

`PresentationProperties` offers type-safe helpers for each standard properties, for example:

* `fontSize: Observable<RangeProperty?>`
* `publisherDefaults: Observable<ToggleProperty?>`
* ...

#### `PresentationProperty<T>` Interface

Holds the current value and the metadata of a Presentation Property of type `T`.

##### Properties

All properties are immutable.

* `value: T`
    * Current value for the property.

##### Methods

*Note*: For convenience, these methods can be implemented as closures in the implementing classes.

* `isActiveForSettings(settings: PresentationSettings) -> Boolean`
    * Determines whether the property will be active when the given settings are applied to the Navigator.
    * For example, with an EPUB Navigator using Readium CSS, the property "letter spacing" requires to switch off the "publisher defaults" setting to be active.
    * This is useful to determine whether to grey out a view in the user settings interface.
* `activateInSettings(settings: PresentationSettings) throws -> PresentationSettings`
    * Modifies the given settings to make sure the property will be activated when applying them to the Navigator.
    * For example, with an EPUB Navigator using Readium CSS, activating the "letter spacing" property means ensuring the "publisher defaults" setting is disabled.
    * If the property cannot be activated, returns a user-facing localized error.

#### `ColorProperty` Class (implements `PresentationProperty<Color>`)

Property holding an arbitrary color. For example, "text color" or "background color".

The `Color` type depends on the platform.

#### `ToggleProperty` Class (implements `PresentationProperty<Boolean>`)

Property representable as a toggle switch in the user interface. For example, "publisher defaults" or "continuous".

#### `EnumProperty` Class (implements `PresentationProperty<String>`)

Property representable as a dropdown menu or radio buttons group in the user interface. For example, "reading progression" or "font family".

##### Properties

* `values: [String]`
    * List of available values for this property, in logical order.

##### Methods

* `labelForValue(String) -> LocalizedString`
    * Returns a user-facing localized label for the given value, which can be used in the user interface.
    * For example, with the "reading progression" property, the value `ltr` has for label "Left to right" in English.

#### `RangeProperty` Class (implements `PresentationProperty<Double>`)

Property representable as a draggable slider or a pair of increment/decrement buttons. For example, "font size" or "playback volume".

A range value is valid between 0.0 to 1.0.

##### Properties

* `stepsCount: Int?`
    * Number of discrete values in the range.
    * A given range property might not have the same number of effective steps. Therefore, knowing the number of steps is important to make sure that incrementing a property triggers a visible change in the Navigator.
    * It can be null for continuous properties, such as "playback volume". 

##### Methods

* `labelForValue(Double) -> LocalizedString`
    * Returns a user-facing localized label for the given value, which can be used in the user interface.
    * For example, with the "font size" property, the value `0.4` might have for label "12 pt", depending on the Navigator.

### `PresentationSettings` Class

Holds a list of key-value pairs provided by the app to influence a Navigator's Presentation Properties. The keys must be valid Presentation Property Keys.

#### Constructor

* `PresentationSettings(json: String)`
    * Parses Presentation Settings from a serialized JSON object.

#### Properties

* `settings: Map<String, Any?>`
    * Maps a Presentation Property Key with a value.
    * Contrary to `PresentationProperties`, the value of a setting can be null to let the Navigator use a default value.

#### Methods

* `merge(other: PresentationSettings) -> PresentationSettings`
    * Returns a copy of self after overwriting any setting with the values from `other`.
* `toJSON() -> String`
    * Serializes the settings into a JSON object.
 
#### Helpers

`PresentationSettings` provides type-safe helpers to access their values, for example:

* `fontSize: Double?`
* `publisherDefaults: Boolean?`
* ...


### `PresentationController`

Helper class which simplifies the modification of Presentation Settings and designing a user settings interface.

#### Constructor

* `PresentationController(navigator: Navigator, appSettings: PresentationSettings, userSettings: PresentationSettings)`
   * `appSettings` An immutable list of *Presentation Settings* that the app chooses to customize but without user input.
   * `userSettings` A dynamic list of *Presentation Settings* the app chooses to expose in the user settings interface for the user to modify.

#### Properties

* `userSettings: Observable<PresentationSettings>`
    * Current set of raw User Presentation Settings, which is updated every time the settings are changed.
    * The initial value is the one provided in the constructor.
    * The reading app can observe it to persist the latest user settings.
* `settings: Map<String, Observable<PresentationController.Setting?>>`
    * Maps each Property Key to a high-level user setting object.
    * If a setting is null, it means that the Navigator does not support the matching Presentation Property.
    * To ensure that we always display an appropriate value in the user interface, we want to get the one selected by the user or the effective one from the Navigator as a fallback. To do that, the current value of the setting is computed automatically from, by order of precedence:
        1. The `userSettings` value.
        2. The `appSettings` value.
        3. The `PresentationProperty` value observed from the matching `navigator.presentation` property.

#### Methods

* `apply()`
    * Applies the current set of `userSettings` to the Navigator.
    * Typically, this is called after the user changes a single setting, or after restoring a bunch of settings together.
    ```
    apply() {
        navigator.apply(appSettings.merge(userSettings))
    }
    ```
* `reset()`
    * Clears all user settings to revert to the Navigator default values.
    ```
    reset() {
        userSettings = {}
    }
    ```
* `reset(setting: PresentationController.Setting)`
    * Clears the given setting to revert to the Navigator default value.
* `set<T>(setting: PresentationController.Setting<T>, value: T?)`
    * Changes the value of the given setting.
    * The new value will be saved in the `userSettings` object.
    ```
    set(setting, value) {
        if (value != null) {
            activate(setting)
        }
        userSettings[setting.key] = value
    }
    ```
* `toggle(setting: PresentationController.ToggleSetting)`
    * Inverts the value of the given switch setting.
    ```
    toggle(setting) {
        set(setting, !setting.value)
    }
    ```
* `increment(setting: PresentationController.RangeSetting)`
    * Increments the value of the given range setting to the next effective step.
    * The minimum step is calculated from the `setting.stepCount` property.
* `decrement(setting: PresentationController.RangeSetting)`
    * Decrements the value of the given range setting to the previous effective step.
    * The minimum step is calculated from the `setting.stepCount` property.
* `activate(setting: PresentationController.Setting)`
    * Updates the user setting to ensure the matching Presentation Property is active.
    
#### Helpers

`PresentationController` offers type-safe helpers for each standard settings, for example:

* `fontSize: Observable<PresentationController.RangeSetting?>`
* `publisherDefaults: Observable<PresentationController.ToggleSetting?>`
* ...


#### `PresentationController.Setting<T>` Interface

Holds the current value and the metadata of a Presentation Setting of type `T`.

##### Properties

All properties are immutable.

* `key: String`
    * Presentation Property Key for this setting.
* `value: T`
    * Current value for the property.
* `isActive: Boolean`
    * Indicates whether the Presentation Property is active for the current set of user settings.

#### `PresentationController.ColorSetting` Class (implements `PresentationController.Setting<Color>`)

#### `PresentationController.ToggleSetting` Class (implements `PresentationController.Setting<Boolean>`)

#### `PresentationController.EnumSetting` Class (implements `PresentationController.Setting<String>`)

##### Properties

* `values: [String]`
    * List of available values for this setting, in logical order.

##### Methods

* `labelForValue(String) -> LocalizedString`
    * Returns a user-facing localized label for the given value, which can be used in the user interface.
    * For example, with the "reading progression" setting, the value `ltr` has for label "Left to right" in English.

#### `PresentationController.RangeSetting` Class (implements `PresentationController.Setting<Double>`)

##### Properties

* `stepsCount: Int?`
    * Number of discrete values in the range.
    * A given range setting might not have the same number of effective steps. Therefore, knowing the number of steps is important to make sure that incrementing a setting triggers a visible change in the Navigator.
    * It can be null for continuous settings, such as "playback volume". 

##### Methods

* `labelForValue(Double) -> LocalizedString`
    * Returns a user-facing localized label for the given value, which can be used in the user interface.
    * For example, with the "font size" setting, the value `0.4` might have for label "12 pt", depending on the Navigator.


## Appendix A: Readium Standard Presentation Properties

| Key                     | Type                                             | Description                                                                                           |
|-------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| `verticalPageMargins`   | `Range`                                          | Vertical margins around a page                                                                        |
| `horizontalPageMargins` | `Range`                                          | Horizontal margins around a page                                                                      |
| `appearance`            | `Enum`                                           | Predefined theme, e.g. `dark` or `sepia`                                                              |
| `backgroundColor`       | `Color`                                          | Color of the background                                                                               |
| `textColor`             | `Color`                                          | Color of the text content                                                                             |
| `textAlignment`         | `Enum` (`left`, `right`, `center`, `justify`)    | Alignment of the text content                                                                         |
| `hyphenation`           | `Toggle`                                         | Indicates whether the text should be hyphenated                                                       |
| `ligature`              | `Toggle`                                         | Indicates whether ligatures should be enabled                                                         |
| `fontFamily`            | `Enum`                                           | Font family stack used for the text content                                                           |
| `fontSize`              | `Range`                                          | Font size used for the text content                                                                   |
| `lineHeight`            | `Range`                                          | Height of a text line                                                                                 |
| `paragraphIndent`       | `Range`                                          | Indent of the first line of a paragraph                                                               |
| `paragraphSpacing`      | `Range`                                          | Spacing between paragraphs                                                                            |
| `wordSpacing`           | `Range`                                          | Spacing between words                                                                                 |
| `letterSpacing`         | `Range`                                          | Spacing between letters                                                                               |
| `publisherDefaults`     | `Toggle`                                         | Indicates whether the publisher's styles should be honored                                            |
| `readingProgression`    | `Enum` (`ltr`, `rtl`, `ttb`, `btt`, `auto`)      | Direction in which resources are laid out                                                             |
| `doublePageSpread`      | `Enum` (`landscape`, `portrait`, `both`, `auto`) | Indicates the condition to be met for the publication to be rendered with synthetic spreads           |
| `columns`               | `Range`                                          | Number of columns displayed in a reflowable publication                                               |
| `overflow`              | `Enum` (`paginated`, `scrolled`, `auto`)         | Indicates if the overflow of the content from should be handled using dynamic pagination or scrolling |
| `continuous`            | `Toggle`                                         | Indicates if consecutive resources should be handled in a continuous or discontinuous way             |
| `orientation`           | `Enum`                                           | Suggested orientation for the device when displaying the publication                                  |
| `fit`                   | `Enum` (`contain`, `cover`, `width`, `height`)   | Specifies constraints for the presentation of the publication within the viewport                     |
| `playbackRate`          | `Range`                                          | Speed of the media playback                                                                           |
| `playbackVolume`        | `Range`                                          | Rendition volume of the media                                                                         |
| `quality`               | `Range`                                          | Quality of the publication resources                                                                  |
| `captions`              | `Enum`                                           | Caption sources for the media                                                                         |


## Writing Notes

### References

* [Readium CSS variables](https://github.com/readium/readium-css/blob/master/docs/CSS08-defaults.md)
* [Presentation Hints](https://readium.org/webpub-manifest/modules/presentation)


### Requirements

* Four types of settings:
    * Toggle (boolean, e.g. continuous)
    * Range (0 - 100%, e.g. font size)
    * Fixed Enum (depends on the particular setting, e.g. orientation)
    * Dynamic Enum (depends on the current navigator, e.g. font families)
* Every setting is optional. When unset, the Navigator uses a default value.
    * "Reset to defaults" means unsetting all settings.
* A navigator should be able to declare custom settings that are not known by the toolkit.
* (Recommended for app implementers) Settings should be shared between publications of the same media type, but not between two different media types. For example, users might want to:
    * play audiobooks at a higher speed rate, but without changing the rate of movie-based publications
    * read ebooks as paginated but PDFs as continuous scroll
* The app needs:
    * To know which settings are available in the navigator / current resource, to show only relevant settings (e.g. rate is useless in an EPUB).
    * To know which setting is currently inactive, to grey it out in the user settings interface (e.g. "double page spread" requires "scroll mode off").
    * If possible, a way to switch on an inactive setting, e.g. either by:
        * Being provided a list of required setting and their values (e.g. "scroll mode = off"). Pro: we can tell the user why a setting is inactive.
        * A Navigator API to modify the settings as needed. Each Navigator might have a different dependency graph between the settings, so this can't be hard-coded in the Settings object directly.
    * For a Range setting:
	    * How many steps are available in the range? If we don't know this, we might increase the value too little with no visible effect.
		* For a given value (0-100%), a user-facing label with units. E.g. 20% = "50px" page margin
    * For a Dynamic Enum setting, which values are available (e.g. list of fonts).
    * For all settings, what is the default (not current) value. This is useful when a setting is "unset". For example:
        * With a Toggle, we need to know if it's on or off by default, otherwise toggling the Toggle might not produce any effect.
        * With a Range, we need to know the starting step when increasing/decreasing the value.


All settings are optional. When not set, the actual value is automatically determined by the navigator.


> It is important to note that the list of user settings you may provide users with can change depending on the primary language of the publication.
> 
> Indeed, it doesn’t make sense to have some user settings in some languages, and they would do more harm than good e.g. hyphens in CJK. Ideally, those settings should therefore be removed from the UI, or at least disabled, if needed.
> https://github.com/readium/readium-css/blob/master/docs/CSS12-user_prefs.md#user-settings-can-be-language-specific
