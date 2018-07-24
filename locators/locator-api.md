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

## Test Location in Page

The term "page" will refer here to the notion of synthetic page in the current resource.

The function takes as arguments the number of pages in the current resource, the current page number in the resource and an array of Locator objects (e.g. the list of bookmarks in the resource). 

Returns the subset of the array of Locator objects that fits with the page, or nil if no Locator fits. 



