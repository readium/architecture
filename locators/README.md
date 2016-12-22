# Architecture for Locators Module

The main goal of the pagination module is to pagine reflowable resources in a Web Publication (XHTML or HTML). In addition to that task, it also provides a number of API in order to:

* access a specific page
* get the total number of pages for a given resource
* get the current page number
* get the number of pages left

## Locator Resolver

### Resource-level Resolver

### Publication-level Resolver

## Calculating a Locator

## Using Locators in Other Modules

```
{
  "query": "Laurent"
  "hits": 256
  "results":
  [
    {
    	"found": "Laurentides",
    	"before": "Lors de ses vacances dans les ",
    	"after": "il a décidé de réecrire Readium SDK",
    	"locators": 
    	{
    	  "cfi": "...",
    	  "xpath": "...",
    	  "page": 147,
    	  "position": 12.67
    	}
    }
  ]
}
```

## Open Questions

* How do we handle interactions between the locator and pagination modules?
* What's the most convenient info that we can use to locate an element on a page and then calculate the current page for it?
* Is the pagination module also in charge of synthetic pages? Do we treat them as locators instead?
* Is the pagination module also in charge of handling FXL content? If so, how?

