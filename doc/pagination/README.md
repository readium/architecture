# Architecture for Pagination Module

The goal of this document is to describe an architecture for the pagination module that:

* can be independent from any pagination strategy
* won't be affected whereas the module is written in JS or native to a platform

## Overall Design

Through the [streamer architecture](https://github.com/readium/readium-2/blob/master/doc/streamer/README.md), each resource of a publication is accessible through HTTP.

In terms of API, what the pagination module does is actually provide the ability to reach specific fragments of a resource, which means that these APIs could behave like fragment identifiers.

The risk though, is to have a conflict between an element with a specific `id` in the resource and the APIs that we've designed, which is why we should prefix these APIS with "readium". 

## Accessing a Page

> For this API, a page is basically a single screen of content.

`chapter1.html#readium-page=23`

`chapter1.html#readium-page=last`

In addition to supporting a fragment identifier, JS implementation of a module should also expose the following method:

* goToPage(pageNumber)

## Accessing a Synthetic Page

> For this API, a page is something constant no matter what the device and layout options are, for example 1024 characters.

`chapter1.html#readium-spage=23`

In addition to supporting a fragment identifier, JS implementation of a module should also expose the following method:

* goToSyntheticPage(pageNumber)


## Using a Locator

> The API should support a number of locators, through a combination of parameters sent as fragments identiers. The pagination module could call a different module to figure that out and then move the viewport accordingly.

