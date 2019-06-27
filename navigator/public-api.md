# Navigator Public API

This document specifies the interfaces and classes made public in `r2-navigator`. These APIs will be used by host apps to create and interact with a navigator.

Note that each platform should adapt the API names to follow the target language's idioms.

## References:

- [Initial working document with comments](https://docs.google.com/document/d/1xqx_WJ28OAHAHODrMKZBj0wV1dcqM4420yBXVjZVx8w)
- [Locator Best Practices](https://github.com/readium/architecture/tree/master/locators/best-practices)


## Navigator Concerns

A few points to keep in mind when implementing this API in `r2-navigator`.

- **The navigator should have a minimal UX** and be focused only on browsing and interacting with the document. However, it offers a rich API to build a user interface around it.
- **The last read page (progression) should not be persisted and restored by the navigator**. Instead, the host app will save the `Locator` sent by the navigator in the `locationChanged` event, and provide the initial location when initializing the navigator.
- **User accessibility settings should override the behavior when needed** (eg. disabling animated transition, even when requested by the caller).
- **The navigator is the single source of truth for the current location**. So for example, the TTS should observe the position from the navigator instead of having the host app move manually both the navigator and the TTS reader when the user skips forward.
- **The navigator should only provide a minimal gestures/interactions set**. For example, scrolling through a web view or zooming a fixed image is expected from the user. But additional interactions such as tapping/clicking the edge of the page to skip to the next one should be implemented by the host app, and not the navigator.


## `Navigator` Interface

The following describes a main `Navigator` interface that should be implemented by the different format navigators (eg. `PDFNavigator`, `HTMLNavigator`, etc.). It contains the features shared by all the formats and allows the host app to have a generic implementation.

Several sub-interfaces extend `Navigator` to cater to specific format needs. For example, `VisualNavigator` should be implemented for formats that are rendered visually on the screen and handle user interactions.

Each implementation can have additional APIs to cater to specific needs of the platform or the format. But before adding them, please consider if the feature is not generic enough to be discussed and eventually added to this specification.


### Required Initialization Parameters

- **publication**: `Publication`
- **initialLocation**: `Locator`
  - Initial position to render in the publication. Used to restore the last read page.

### Navigation APIs

Please refer to the [Locator Best Practices](https://github.com/readium/architecture/tree/master/locators/best-practices) document to know how to create the `Locators`.

#### Events

- **locationChanged**(location: `Locator`)
  - Called every time the current location changes.
The host app should save the last read position here (probably in their own `Publication` persistence model, to provide additional feedback in the library, such as percentage of progression and current page)
The associated `Locator` is of type [progression](https://github.com/readium/architecture/tree/master/locators/best-practices), so with a limited context.

#### Properties

- **currentLocation**: `Locator`
  - Returns the most complete `Locator` for the current position in the document. It can be used to store a [bookmark](https://github.com/readium/architecture/tree/master/locators/best-practices), therefore, the more context we have, the better.

#### Methods

- **goTo**(`Locator`)
  - Used to jump to a bookmark/annotation's locator, a position locator.
- **goTo**(`Link`)
  - Used to jump to a specific reading order, navigation item, etc.
- **goForward**() / **goBackward**()
  - Moves by one step (eg. a page) in the reading progression direction. Used to implement previous/next buttons.
  - Forward/Backward is used instead of Next/PreviousPage to be format-agnostic. (eg. for an audio book, it could skip _n_ seconds)


_Note_: All the previous `goTo` methods:

- Return whether the navigation is allowed (not out of bounds) and will proceed.
- Take the following optional parameters (should be adapted to fit the target platform's idioms)
  - **animated**: `Bool` (default: false)
    - Whether the caller wishes the transition to be animated. This may be ignored in certain conditions by the navigator implementation (not compatible with the format, or accessibility settings overriding it).
  - **completion**: `() -> Void`
    - A closure (or any other way) of notifying the caller that the transition is complete, and the target location is visible on-screen. Thanks to that, a host app can add a loading indicator to the navigator, or disable specific actions until the navigator moved to the destination.
This will not be called if false was returned (invalid navigation).


### UX Delegation

Sometimes the navigator needs to delegate some UX requests to the host app. Depending on the platform's idioms, it could be implemented as events, or as delegate functions to be implemented by the host app, like described here.

- **presentError**(`NavigatorError`)
  - Called when an error that needs to be notified to the user occured (eg. the copy was forbidden). We don’t present it ourselves to let the host app decide on the look of the alert. Or eventually, to recover from it.
    ```
    enum NavigatorError {
      copyForbidden
    }
    ```
- **presentExternalURL**(`URL`)
  - Called when the user tapped on an external link in the publication. This delegate is optional and the default implementation opens the system browser. The host app may choose to override it to present a browser inside the app.


## `VisualNavigator` Interface

A navigator rendering the publication visually on the screen, and allowing user interactions.

### Events

- **tapped/clicked**(at point: `Point`)
  - Called when the user tapped or clicked the content, but nothing handled the event internally (eg. by following an internal link). Can be used in the host app to toggle the navigation bars, or switch to the previous/next page if the event occured on the edges of the page.

### Properties

- **readingProgression**: `NavigatorReadingProgression`
  - The current reading progression calculated from the one described in the `Publication` metadata, the current language, etc. _Warning_: This is a different enum from the `ReadingProgression` in `r2-shared`, because it can't be `auto`.
     ```
     enum ReadingProgression {
        case ltr, rtl
     }
     ```
  - This could potentially be customized by the User through the Rendition settings

### Methods

- **goLeft**() / **goRight**()
  - Same as `goForward/Backward`, but in the screen direction instead of the `readingProgression`. This can be used to implement left/right edge taps by the host app.


## What’s Missing?

Other areas that might be worth getting specified:

- User appearance settings
- Rendition settings
  - Including a way to customize the current `readingProgression`
- CSS/JS injection
- Selection actions (copy, share, print)
- Footnotes
- TTS
- Relationships between alternate revisions (translations, adaptations, etc)
