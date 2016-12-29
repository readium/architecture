# Architecture for Pagination Module

The main goal of the pagination module is to pagine reflowable resources in a Web Publication (XHTML or HTML). In addition to that task, it also provides a number of API in order to:

* access a specific page
* get the total number of pages for a given resource
* get the current page number
* get the number of pages left

## Accessing a Page

In order to access a specific page, the pagination module should detect specific fragment identifiers in the URI of the current resource and move the viewport to the right page accordingly:

`chapter1.html#readium-page=23`

`chapter1.html#readium-page=last`

In addition to navigating to a page based on a fragment identifier, all implementations of the pagination module will also offer the ability to navigate to a specific page using the `goToPage(pageNumber)` method.


## Get Specific Pagination Info

To get the total number of pages, current page number or number of pages left, the pagination module should also expose the following methods:

* `totalNumberOfPages()`
* `currentPageNumber()`
* `numberOfPagesLeft()`

## Calculate a Page Number

The pagination module should also have APIs that behave like the [locators module](../locators/):

* resolve a page number to a DOM range
* resolve a page number to an interchange format (TBD)
* calculate a page number from a DOM range
* calculate a page number from an interchange format (TBD)

While the pagination and locators modules won't interact directly with one another, using either a DOM range or the interchange format, a reading application can easily build multiple features (export locators for the last read position in a book and sync that information for example).

## Prefetch & Prerender

All the platforms that we target for Readium-2 offer an option to prefetch & prerender resources using a `<link>` element.

While prefetching can be triggered at any time and could actually be handled by the streamer too (using an HTTP header), prerendering can be trickier.

In Chrome for instance:

* prerendered pages are only kept for up to 5mn
* and they can't use more than 150 MB in memory

For these reasons, it's best to trigger prerendering when the user reaches the end of the current resource.

Since the pagination module is aware of the position of the user (page number), it could be a good place to handle prerendering. This could be for instance handled when the user reaches the last page of the current resource by injecting a link to the next resource in the spine. 

## Open Questions

* How do we handle interactions between the locator and pagination modules?
* What's the most convenient info that we can use to locate an element on a page and then calculate the current page for it?
* Is the pagination module also in charge of synthetic pages? Do we treat them as locators instead?
* Is the pagination module also in charge of handling FXL content? If so, how?

