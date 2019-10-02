# Best Practices for Locators per Format

## EPUB

### 1. Progression

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `progression` in `location`

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`
- `position` in `location`
- a CSS Selector, DOM Range or CFI ?

The Locator Object <strong class="rfc">may</strong> contain:

- `title`

### 2. Bookmarks

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `progression` in `location`

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`
- `text`
- `position` in `location`
- a CSS Selector, DOM Range or CFI ?

The Locator Object <strong class="rfc">may</strong> contain:

- `title`

### 3. Highlights/Annotations

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `text`
- `progression` in `location`
- a CSS Selector, DOM Range or CFI

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`
- `position` in `location`

The Locator Object <strong class="rfc">may</strong> contain:

- `title`

## PDF

### 1. Progression

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `progression` in `location`
- `position` in `location`
- a `page` fragment for `fragments` in `location`

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`

The Locator Object <strong class="rfc">may</strong> contain:

- `title`

### 2. Bookmarks

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `progression` in `location`
- `position` in `location`
- a `page` fragment for `fragments` in `location`

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`
- `text`

The Locator Object <strong class="rfc">may</strong> contain:

- `title`

### 3. Highlights/Annotations

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `text`
- a `page` fragment for `fragments` in `location`
- a `viewrect` fragment for `fragments` in `location`
- `progression` in `location`
- `position` in `location`

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`

The Locator Object <strong class="rfc">may</strong> contain:

- `title`

## Audiobooks

### Progression and Bookmarks

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `progression` in `location`
- a `t` fragment for `fragments` in `location`

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`

The Locator Object <strong class="rfc">may</strong> contain:

- `title`

## Comics

### Progression and Bookmarks

The Locator Object <strong class="rfc">must</strong> contain:

- `href`
- `type`
- `position` in `location`

The Locator Object <strong class="rfc">should</strong> contain:

- `totalProgression` in `location`

The Locator Object <strong class="rfc">may</strong> contain:

- `title`
- an `xywh` fragment for `fragments` in `location`


<style>
.rfc {
    color: #d55;
    font-variant: small-caps;
    font-style: normal;
    font-weight: normal;
}
</style>
