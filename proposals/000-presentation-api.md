# Presentation API

* Authors: [Mickaël Menu](https://github.com/mickael-menu), [Quentin Gliosca](https://github.com/qnga)
* Review PR: [#x](https://github.com/readium/architecture/pull/x) (*added by maintainers, after merging the PR*)


## Summary

One paragraph description of what the proposal is.


## Motivation

Describe the problems that this proposal seeks to address. How this new functionality would help Readium developers create better reading apps?


# Presentation Settings

## Developer Guide

### Terms

* **Presentation Properties**: A list of dynamic key-value pairs determining how a publication is rendered by a Navigator. For example, "font size" or "playback rate".
    * **Key**: Each property has a unique string key, e.g. `fontSize`. Extensions use URIs for custom properties, such as `https://company.com/hyphenate`.
    * The properties are computed by the Navigator from, by order of precedence:
        1. *User Presentation Settings* provided by the app.
        2. *App Presentation Settings* provided by the app.
        3. *Presentation Hints* embedded in the publication.
        4. *Presentation Defaults* provided by the Navigator.
* **Presentation Settings**: A list of key-value pairs provided by the app to influence the current Navigator's *Presentation Properties*. The keys must be valid *Presentation Property Keys*.
    * **User Settings**: A dynamic list of *Presentation Settings* the app chooses to expose in the user settings interface for the user to modify.
    * **App Settings**: A hard coded list of *Presentation Settings* that the app chooses to customize but without user input.
* **Presentation Hints**: An immutable list of metadata embedded in a publication. Navigators use them to compute default values for the *Presentation Properties*. [See the RWPM specification](https://readium.org/webpub-manifest/modules/presentation.html).
* **Presentation Defaults**: A static list of *Presentation Property Values* used as fallback by a Navigator when a property is not overriden by *Presentation Hints* or *Presentation Settings*.

### Setting Up the User Settings Interface

```typescript
// Set up a list of app-level default settings statically.
let appSettings: PresentationSettings = PresentationSettings(
    publisherDefaults: false,
    pageMargins: 0.2
)

// Load the saved user settings.
let userSettings: PresentationSettings = userSettingsStorage.read()

let presentation = PresentationController(navigator, appSettings, userSettings)

// Update the views every time the font size changes.
presentation.fontSize.observe { fontSize ->
    if (fontSize == null) {
        // Font size is not supported by this Navigator.
        // We should hide the views.

    } else {
        // If the font size is currently inactive in the
        // Navigator, we can show it in the user interface.
        fontSizeLabel.color = fontSize.isActive ? black : gray
        // Display the current value for the font size
        //  as a localized user string, e.g. 14 pt
        fontSizeLabel.text = fontSize.label

        // Setup the action when the user clicks on the "+" button.
        // We increase the font size and then update the Navigator.
        fontSizePlus.onClick {
            presentation.increment(fontSize)
            presentation.apply()
        }
    }
}
```

Note that we modify the font size with: `presentation.increment(fontSize)` instead of `presentation.incrementFontSize()` or `presentation.fontSize.increment()`, for several reasons:

* The value of `fontSize` is an immutable object, to make it safer to use.
* To avoid confusing the users, we want to increase the font size from the last value displayed in the view instead of the actual current value, if it was changed in the meantime.


### Persisting User Settings

The `PresentationSettings` object holds a simple map which can be serialized into a JSON object. Reading apps are responsible for storing and retrieving the JSON when needed.

When using the `PresentationController` helper class, you can observe the list of user settings to save any changes.

```typescript
presentationController.userSettings.observe { settings ->
    userSettingsStorage.save(settings.toJSON())
}
```


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
* `publisherDefaults: Observable<SwitchProperty?>`
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

#### `SwitchProperty` Class (implements `PresentationProperty<Boolean>`)

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
* `toggle(setting: PresentationController.SwitchSetting)`
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
* `publisherDefaults: Observable<PresentationController.SwitchSetting?>`
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

#### `PresentationController.SwitchSetting` Class (implements `PresentationController.Setting<Boolean>`)

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
| `hyphenation`           | `Switch`                                         | Indicates whether the text should be hyphenated                                                       |
| `ligature`              | `Switch`                                         | Indicates whether ligatures should be enabled                                                         |
| `fontFamily`            | `Enum`                                           | Font family stack used for the text content                                                           |
| `fontSize`              | `Range`                                          | Font size used for the text content                                                                   |
| `lineHeight`            | `Range`                                          | Height of a text line                                                                                 |
| `paragraphIndent`       | `Range`                                          | Indent of the first line of a paragraph                                                               |
| `paragraphSpacing`      | `Range`                                          | Spacing between paragraphs                                                                            |
| `wordSpacing`           | `Range`                                          | Spacing between words                                                                                 |
| `letterSpacing`         | `Range`                                          | Spacing between letters                                                                               |
| `publisherDefaults`     | `Switch`                                         | Indicates whether the publisher's styles should be honored                                            |
| `readingProgression`    | `Enum` (`ltr`, `rtl`, `ttb`, `btt`, `auto`)      | Direction in which resources are laid out                                                             |
| `doublePageSpread`      | `Enum` (`landscape`, `portrait`, `both`, `auto`) | Indicates the condition to be met for the publication to be rendered with synthetic spreads           |
| `columns`               | `Range`                                          | Number of columns displayed in a reflowable publication                                               |
| `overflow`              | `Enum` (`paginated`, `scrolled`, `auto`)         | Indicates if the overflow of the content from should be handled using dynamic pagination or scrolling |
| `continuous`            | `Switch`                                         | Indicates if consecutive resources should be handled in a continuous or discontinuous way             |
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
    * Switch (boolean, e.g. continuous)
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
        * With a Switch, we need to know if it's on or off by default, otherwise toggling the Switch might not produce any effect.
        * With a Range, we need to know the starting step when increasing/decreasing the value.


All settings are optional. When not set, the actual value is automatically determined by the navigator.


> It is important to note that the list of user settings you may provide users with can change depending on the primary language of the publication.
> 
> Indeed, it doesn’t make sense to have some user settings in some languages, and they would do more harm than good e.g. hyphens in CJK. Ideally, those settings should therefore be removed from the UI, or at least disabled, if needed.
> https://github.com/readium/readium-css/blob/master/docs/CSS12-user_prefs.md#user-settings-can-be-language-specific
