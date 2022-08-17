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

* `ValueSetting<V>` - a setting holding an arbitrary value of type `V`.
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

:warning: THE REST OF THE DOCUMENT IS OBSOLETE, PLEASE IGNORE FOR NOW.

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
