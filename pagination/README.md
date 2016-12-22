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

In addition to supporting a fragment identifier, JS implementation of a module should also expose the following method: `goToPage(pageNumber)`.


## Get Specific Pagination Info

To get the total number of pages, current page number or number of pages left, the pagination module should also expose the following methods:

* `totalNumberOfPages()`
* `currentPageNumber()`
* `numberOfPagesLeft()`

## Open Questions

* How do we handle interactions between the locator and pagination modules?
* What's the most convenient info that we can use to locate an element on a page and then calculate the current page for it?
* Is the pagination module also in charge of synthetic pages? Do we treat them as locators instead?
* Is the pagination module also in charge of handling FXL content? If so, how?

