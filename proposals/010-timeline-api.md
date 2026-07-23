# Timeline API

* Author: [Jiminy Panoz](https://github.com/JayPanoz)
* Contributors: [Hadrien Gardeur](https://github.com/HadrienGardeur), [Mickaël Menu](https://github.com/mickael-menu)
* Review PR: [196](https://github.com/readium/architecture/pull/196)

## Summary

The Timeline is a media-type-agnostic model of a publication's structure, built from its reading order and table of contents, with locations filled in from whatever format-specific data is available — a Positions List for EPUB, native page numbers for PDF, track durations for audio — and refined further as a navigator feeds in whatever format-specific data it itself holds. It exposes a single API to locate, traverse, and inspect that structure regardless of format.

## Motivation

Reading apps constantly need to tell the user *where they are*: the chapter title in a running header, the previous and next section names in a navigation bar, the chapter a search result or bookmark falls in. This is structural context, and users expect it everywhere.

Today every app rebuilds it by reconciling information scattered across several differently-shaped pieces — the reading order, the table of contents, and whatever format-specific data is needed to pin down an actual location, such as a Positions List for EPUB or track durations for audio — none of which was designed on its own to answer "which entry covers a given location?". And how a location is expressed depends on the format: a time offset for audio, an anchor or progression for reflowable text, a page for PDF. So the same reconciliation logic gets written again and again, per format and per platform.

The Timeline does that reconciliation in the toolkit instead of in every app: built from the reading order and table of contents, with locations filled in from whatever format-specific data is on hand and refined further as better data shows up, it gives an app a single structural view of the publication against which to ask a few simple questions and get the same kind of answer regardless of format.

### Use cases

* A running header showing the current chapter title.
* Previous/next navigation labelled with the adjacent section names.
* A progress bar divided into chapter segments, naming the chapter under the cursor.
* Search results, bookmarks, and highlights grouped under the chapter they fall in.
* Breadcrumbs from the publication down to the current section.
* A dedicated table-of-contents panel that highlights the entry matching the current reading position, with a position, page number, or timestamp next to each entry.

## Developer Guide

A **Timeline** is a publication's structure in reading order: its resources and the sections within them, each one a **TimelineItem** carrying the means to locate where it starts, and a title when one could be derived.

A publication exposes a timeline directly — `publication.timeline`, the only instance there is — already carrying whatever an item's resolvable fields — `position`, `scroll`, `role` — a Positions List, native page numbers, or track durations could fill in: enough for anything that does not depend on rendered content, e.g. a table-of-contents view or a chapter list. While reading, a navigator operating on that same `Publication` notifies a listener whenever the active item changes, and can feed in or refine any of those fields with whatever format-specific data it itself has access to.

An app passes a locator, or a plain fraction; it never passes a format. Deciding how to interpret a locator — by time, by anchor, by progression — is the timeline's responsibility, and is precisely what keeps the rest of the app free of per-format branching.

### Refining the timeline with format-specific data

A `TimelineItem`'s resolvable fields — `position`, `scroll`, `role` — start out at whatever a Positions List, native page numbers, track durations, or other structural data already resolved for them, wherever that's attached to the publication. A navigator feeds fields into the timeline the same way, calling `augment` with a mapper from item and manifest `Link` to whichever fields it has data for — the same publication-level data, or, when nothing resolved a field yet, its own parsing of the format. Each call overwrites the fields it returns, so a later call always reflects the latest data; fields a mapper doesn't return keep whatever value they already had, whatever gave them that value.

```swift
publication.timeline.augment { item, link in
    guard let entry = positionsList.first(where: { $0.href == link.href }) else { return TimelineItem() }
    return TimelineItem(position: entry.locations.position, scroll: entry.locations.progression)
}
```

A field that no service ever resolved and no navigator ever fed in stays unset, and features that depend on it — a page number next to a TOC entry, a scroll offset for a mid-resource entry — have nothing to show.

### Which item covers this locator?

Given a locator, the timeline returns the most specific item containing it. This is the heart of the API and the only operation that must understand format-specific locations. Everything an app builds on top — running headers, grouped search results, annotated bookmarks — is this same question asked at different moments.

```swift
// Running header: the title of the chapter the user is in.
let item = timeline.locate(currentLocator)
header.title = item?.title

// Grouping bookmarks under their chapter.
let groups = Dictionary(grouping: bookmarks) { bookmark in
    timeline.locate(bookmark.locator)?.title ?? "Unknown"
}
```

`locate` returns nothing when the locator falls outside the structure.

### What comes before and after an item?

For previous/next navigation, and for reaching the manifest entry needed to actually go there:

```swift
if let here = timeline.locate(currentLocator) {
    let adjacency = timeline.navigableFrom(here)
    prevButton.title = adjacency.previous?.title
    nextButton.title = adjacency.next?.title

    // Hand the manifest Link to the navigator to actually navigate.
    if let next = adjacency.next {
        navigator.go(to: timeline.linkFor(next))
    }
}
```

### What lies inside a resource, and where?

For drawing chapter segments on a progress bar and naming the one at a given point as the user scrubs:

```swift
// One segment per section in the current resource.
for segment in timeline.segmentsForHref(currentHref) {
    drawSegment(title: segment.title ?? "", at: segment.scroll ?? 0)
}

// While scrubbing, name the section under the cursor: build a locator for the
// hovered fraction and ask `locate` the same question it always answers.
let locator = Locator(href: currentHref, locations: Locator.Locations(progression: fraction))
let item = timeline.locate(locator)
tooltip.title = item?.title
```

### The table of contents, contextualized

`contextualizedToc` returns the publication's authored table-of-contents hierarchy, each entry carrying a formatted label: a Positions List position for EPUB, a page number for PDF, a timestamp for audio. When the publication has no table of contents, the timeline synthesizes one flat entry per reading-order item instead.

```swift
// Render the authored TOC hierarchy, each entry labelled with its
// position (EPUB), page number (PDF), or formatted time (audiobook).
func renderTocPanel(_ entries: [ContextualizedTocEntry]) {
    for entry in entries {
        addRow(title: entry.link.title, label: entry.position ?? entry.timestamp)
        if let children = entry.children {
            renderTocPanel(children)
        }
    }
}
```

Highlighting the entry matching the current reading position is a common companion need, so the timeline can also map a `TimelineItem` back into that hierarchy:

```swift
class TocPanelObserver: TimelineObserver {
    func onActiveItemChanged(item: TimelineItem?) {
        guard let item = item else { return clearHighlight() }
        let entry = publication.timeline.tocEntryFor(item)
        highlight(entry?.link)
    }
}
```

When the reading position falls between two authored TOC entries — a mid-resource audio position between chapter markers, say — `tocEntryFor` resolves to the nearest preceding entry for that resource rather than returning nothing, so the panel always has something sensible to highlight while inside a resource that has a TOC entry.

When a publication has no table of contents at all, `contextualizedToc` falls back to one flat entry per reading-order item, so a TOC panel never has to special-case its absence.

### While reading: the active-item listener

While reading, a navigator notifies a registered observer whenever the active `TimelineItem` changes — only on a change, not on every location update, and reporting no item when the current location falls outside the structure. An app registers one to keep a running header, breadcrumb, or any structural display in sync with the reading position:

```swift
class HeaderObserver: TimelineObserver {
    func onActiveItemChanged(item: TimelineItem?) {
        // Update the running header for `item`, or clear it when none.
    }
}

navigator.registerTimelineObserver(observer: HeaderObserver())
```

### Backward Compatibility and Migration

This is a new API with no prior Readium equivalent to deprecate, so there is nothing to migrate for existing Timeline consumers.

Reading apps that hand-roll their own reconciliation between the reading order and the table of contents — matching hrefs, formatting NPT time fragments, walking the TOC tree to find "what am I in" — are free to replace that code with the Timeline, but are not required to; nothing in the reading order or table-of-contents models themselves changes.

## Reference Guide

### `TimelineItem` Class

The unit of structure: a title and the means to locate where the entry starts.

Everything is assumed immutable, unless mentioned otherwise.

#### Properties

* `title: String?`
  * Display title of the entry, when one could be derived.
* `references: List<String>`
  * One or more hrefs, with optional fragments, marking where the entry starts — a time offset for audio (`track1.mp3#t=1620`), an anchor for reflowable text (`chapter3.html#section-2`), a page for PDF (`#page=42`).
* `role: List<String>?`
  * Structural roles of the entry, e.g. `chapter`, `part`.
* `position: Double?`
  * A raw value — a book-global time offset for audio, a Positions List position for EPUB, a page number for PDF. Use `Timeline.tocEntryFor(item)` to get a formatted label instead.
* `scroll: Double?`
  * The progression (0–1) at which the entry begins within its resource, for entries that start partway through it.
* `children: List<TimelineItem>?`
  * Flat child entries collected from TOC fragments referencing this resource, in TOC declaration order. Does not reconstruct the authored TOC hierarchy; see `Timeline.contextualizedToc` for that.

### `Timeline` Class

The structural view itself, and the questions it answers. Built once from a publication's reading order and table of contents, then cached.

#### Properties

* `items: List<TimelineItem>`
  * The top-level entries, in reading order.
* (writable) `depth: Int?`
  * Limits how many levels of structure are visible; every query, including `contextualizedToc`, respects it.
  * Can be set at build time or changed later; a later change applies immediately.
* (lazy) `contextualizedToc: List<ContextualizedTocEntry>`
  * The publication's authored table-of-contents hierarchy, each entry contextualized with a position (EPUB), page number (PDF), or timestamp (audio).
  * Falls back to one flat entry per reading-order item when the publication has no table of contents.

#### Methods

* `augment(mapper: (TimelineItem, Link) -> Partial<TimelineItem>)`
  * Applies `mapper` to every item, refining whichever of its resolvable fields — `position`, `scroll`, `role` — the mapper has data for, whether or not something already resolved them. Other fields returned by `mapper` are ignored.
  * Each field the mapper returns overwrites the item's current value, whatever its source; calling `augment` again refreshes it with the latest data.
* `locate(locator: Locator) -> TimelineItem?`
  * The most specific item covering `locator`, or none when it falls outside the structure.
* `navigableFrom(item: TimelineItem) -> Adjacency`
  * The previous and next items in reading order; either may be absent at a boundary.
  * A Navigator may resolve `item` against its own live rendering state before calling this, e.g. to step past a fragment that only duplicates its container's own starting position.
* `segmentsForHref(href: String) -> List<TimelineItem>`
  * The entries within a resource — its sections, or the resource itself when it has none.
* `ancestors(item: TimelineItem) -> List<TimelineItem>`
  * The path from the top level down to an item's parent; empty for a top-level item.
* `linkFor(item: TimelineItem) -> Link?`
  * The manifest `Link` an item corresponds to, for handing to a navigator.
* `tocEntryFor(item: TimelineItem) -> ContextualizedTocEntry?`
  * Maps `item` — typically the result of `locate()` or a `TimelineObserver` notification — to its entry in `contextualizedToc`.
  * Falls back to the nearest preceding TOC entry for the item's resource when there is no exact match, e.g. a mid-resource audio position between chapter markers.

#### `Adjacency` Class

The result of `navigableFrom`, a named pair so it carries across platforms rather than relying on a structural return type.

##### Properties

* `previous: TimelineItem?`
  * The preceding item, or none at the start.
* `next: TimelineItem?`
  * The following item, or none at the end.

### `ContextualizedTocEntry` Class

A table-of-contents entry mirroring the publication's authored `toc` hierarchy, contextualized with a position, page number, or timestamp.

#### Properties

* `link: Link`
  * The manifest `Link` this entry was built from.
* `position: String?`
  * For EPUB, the entry's Positions List position (`"42"`). For PDF, its native page number (`"42"`).
* `timestamp: String?`
  * Formatted time for audiobooks (`"27:27"`).
  * Exactly one of `position`/`timestamp` is populated, depending on the publication's profile; neither is populated if the underlying item has no resolved position yet.
* `children: List<ContextualizedTocEntry>?`
  * Nested entries, mirroring the source TOC hierarchy and respecting `Timeline.depth`.

### `Publication` Helpers

* (lazy) `timeline: Timeline`
  * The publication's timeline, built once from its reading order and table of contents, with each item's resolvable fields (`position`, `scroll`, `role`) already filled in from whatever attached services (a Positions List, native page numbers, track durations) could resolve.
  * Enough for anything that does not depend on rendered content, e.g. a chapter list shown before a book is opened in a navigator.

### Navigator

A navigator operates on the `Publication` it's navigating — there is only one `Timeline`, `publication.timeline`; a navigator calls `augment` on it directly, and lets an app register an observer for the active item.

#### Methods

* `registerTimelineObserver(observer: TimelineObserver)`
  * Registers an observer notified when the active item changes.
* `unregisterTimelineObserver(observer: TimelineObserver)`
  * Removes a previously registered observer.

#### `TimelineObserver` Interface

Receives notifications when the active item changes.

##### Methods

* `onActiveItemChanged(item: TimelineItem?)`
  * Called with the new active item — or none — whenever the reading location crosses into a different entry.
  * Fires on change, not on every location update.

## Drawbacks and Limitations

The Timeline is a best-effort model: every operation returns the best available answer given whatever structural and positional data exists, never a guaranteed or verified one. Three consequences follow from that:

* Collapsing a time offset, a Positions List position, and a page number into a single `position` value keeps the rest of the API format-agnostic, but a consumer that wants to interpret the value rather than just display it still needs to know the publication's profile — the abstraction doesn't fully hide the format for that use case.
* The reading-order-anchored `TimelineItem` tree and the authored `contextualizedToc` hierarchy can diverge. A location falling between two authored TOC entries has no exact counterpart in the second view, only a nearest-preceding one.
* Structure and an item's resolvable fields are resolved independently, so a `Timeline` can be fully built with none of `position`, `scroll`, or `role` populated at all if no service resolved any and no navigator has refined any either. The API has no way to signal that difference to a consumer: an unset field looks the same whether nothing has run yet or the data genuinely doesn't exist.

## Future Possibilities

### Landmarks and Page-List as Structural Sources

`Timeline` is built only from the reading order and the `toc`. EPUB's manifest model also carries `landmarks` (curated jump points such as the cover, the start of content, or a glossary) and `page-list` (a separately authored page mapping, distinct from a synthesized Positions List), neither of which this proposal consumes. A landmarks-based quick-jump panel is the same shape of feature as the TOC panel this proposal already supports, built on a structural source the current model doesn't see at all.

### Read/Visited Tracking per Item

The Timeline is purely structural and stateless: it has no notion of which items a reader has already been through. Feeding that state back into a TOC or landmarks panel — a checkmark on a finished chapter, a progress dot on one partially read — would need a way to record and query visited items, which nothing in this proposal provides.

### Time Remaining in an Item or the Book

Positions and durations already flow into `Timeline` through services and `augment`, but no member of `Timeline` or `TimelineItem` turns that into an estimate of time left in the current chapter or the book as a whole — a very common reading-app affordance that this proposal, as it stands, cannot answer.
