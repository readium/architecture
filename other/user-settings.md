# User Settings Model

The goal of this document is to describe a model along with potential implementations for a generic support for user settings.

This model is meant to work with CSS Custom Properties as well as any other variable based implementation of user settings.

## Abstract Model

The User Setting object has the following properties:

| Name  | Description |
| ----- | ----------- |
| ref   | A string that can identify the user setting (e.g. font-size). |
| name   | Contains the name of the CSS custom property (e.g. `--font-size`). |
| value   | Contains the value of the CSS custom property (e.g. `11px`). |

Each publication object (based on the Readium Web Publication Manifest) should contain an array of user settings.

## Injecting CSS Custom Properties

For an optimal user experience, we need to make sure that CSS Custom Properties for user settings are set before the document is rendered for the first time.

Injecting these properties from the streamer will be the best option most of the time.

### Separate Stylesheet

CSS Custom Properties for User Settings can be served as a separate stylesheet, that will be injected in the document using a `link`.

In this case, each streamer implementation should:

1. create a separate route per publication for user settings
2. return a stylesheet based on the current user settings (name + value pairs)
3. make sure that the HTTP response for that stylesheet is not heavily cached (avoid `Cache-Control` but `ETag` is fine)


### HTML Element

As an alternative, the streamer can also inject these CSS Custom Properties for user settings directly in the `style` attribute of the `html` element.

