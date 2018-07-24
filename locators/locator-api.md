# Locator API 

These functions are called by the application.

## Get Current Location

Returns a Locator object where all available location keys are set.

## Go To Location

The function takes as an argument a Locator object where at least one location key is set.

## Get Synthetic Page List

Returns an array of Locator objects, where each Locator object references a synthetic page. Each Locator object contains all available location keys.

The function takes as an optional argument the URI of a resource in the publication. If the resource URI is nil, the function returns information about every synthetic page of the publication. If the resource URI corresponds to an existing resource in the publication, the function only returns information about this resource. 

## Get Bookmarks

Returns an array of Locator objects, where each Locator object references a bookmark. Each Locator object contains all available location keys.

The function takes as an optional argument the URI of a resource in the publication.  

## Get Annotations

Returns an array of Locator objects, where each Locator object references an annotation. Each Locator object contains all available location keys.

The function takes as an optional argument the URI of a resource in the publication. 

## Get Printed Page List

The term "page" refers here to the notion of printed page, as optionally specified in an EPUB publication.

Returns an array of Locator objects, where each Locator object references a printed page. Each Locator object contains all available location keys.

## Test Locations in Page

The term "page" will refer here to the notion of synthetic page in the current resource.

The function takes as arguments the number of pages in the current resource, the current page number in the resource and an array of Locator objects (e.g. the list of bookmarks in the resource). 

Returns the subset of the array of Locator objects that fits with the page, or nil if no Locator fits. 



# Testing Locations in a Page

This is particularly useful for checking if a bookmark icon should be activated in the current page.

The app is aware of the current page number and the number of pages in the current resource. It easily get the list of bookmarks in the resource via Get Bookmarks. 

The function transforms each progression in the list of bookmarks to a page reference, via int(bookmark-progression * number-of-pages)+1 (page numbers start at 1).
It return the array of bookmark Locators for which the page reference is equal to the current page number. 

Note: A page may contain two bookmarks (or more) if they were set with different user settings or device characteristics.

A simple example: Let's take a resource with 10 pages (1 to 10). We are on page 4. Bookmark progressions in the resource are [15.111%, 17.222%, 35.333%, 50.444%]. It is clear that the only bookmark in the page is the third. 
