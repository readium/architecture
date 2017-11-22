# CSS/JS Injection API

Injecting CSS or Javascript is a very common requirement for a reading app for a number of reasons:

* user styles and pagination are handled using CSS that is external to the publication (Readium CSS in our case)
* specific interactions (like taps) require that we inject JS
* polyfills are necessary on some platforms to support specific EPUB 3 features

While packaged publications such as EPUB could mostly rely on injection at a streamer level, Web Publications require support for injection at a navigator level.

The goal of this document is to list all the requirements tied to CSS/JS injection and figure out how an API and/or a configuration document could cover them.

## 1. Requirements

For all requirements, the headline indicates if the requirement is strictly for the streamer, the navigator or for both.

### 1.1. Locating the resource (both)

When CSS/JS is injected in HTML, the first thing that we need to know is the location of the resource that will be injected. 

This will usually be a local path of the current device running the streamer/navigator.

### 1.2. Identifying the nature of the resource (both)

CSS and Javascript are not necessarily injected the same way or in the same place in a document.

We need to make sure that we alway identify the nature of the resource that we need to inject.

While this could be a simple token (`js` or `css`), using media types is a more flexible option that opens the door to future extensions.

### 1.3. Target a specific resource type for injection (both)

In EPUB, the only target currently is XHTML (`application/xhtml+xml`) but with the addition of HTML (`text/html`) in Web Publications, we'll need the ability to target only specific media types in which a resource should be injected.

A list of media types could be well suited for this requirement.

### 1.4. Target a specific property (both)

In the Readium Web Publication Manifest, Link Objects can contain properties that indicate the nature of the resource or the presence of specific things.

For example, an XHTML document that contains MathML will use the following property: `"contains": ["mathml"]`.

We need the ability to only target specific properties, such as `contains` or `layout` to trigger the injection of a resource.

### 1.5. Preloading (streamer)

In order to optimize performance, the HTTP server used in the streamer can provide a hint using the `Link` HTTP header and the `preload` rel value.

We'll need the ability to flag which resource should rely on this preload hint.

### 1.6. Target a specific position in the document (both)

Due to the cascading nature of CSS or performance tricks for Javascript, we need to ability to specify where the resource will be injected in the document.

To support this requirement, we need at least the ability to specify a few keypositions in a document.

## 2. Configuration File

> TODO: this is just a quick proposal of a YAML-based config file based on the requirements listed above.

```yaml
--- 
location: /path/polyfill.js
position: header
preload: true
property: 
  contains: mathml
target-type: text/html
type: application/javascript
```

## 3. API

The configuration file should be ingested in the streamer/navigator using a native API that is fairly consistent with the suggested syntax.

This way, in addition to using configuration files, reading apps built on top of Readium-2 could also rely on these APIs to add/remove rules for CSS/JS injection.
