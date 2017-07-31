# Architecture for Locators Module

Locators are meant to provide a precise location in a publication in a format that can be shared outside of the publication.

There are many different use cases for locators:

* bookmarks
* notes and highlights
* current position in a publication
* human-readable (and shareable) reference to a fragment

Locators can also be divided into two different groups:

* locators that are tied to the structure of a resource, such as CFI or XPath
* and those that are not related to any particular resource

While locators that are tied to the structure of a resource provide a much more fine grained information, there are also more likely to break when the resource is updated.

That's one of the reason why Readium-2 recommends using a mix of different locators when implementing some of the use cases listed above.


## Usage

The locators module can be used both within the streamer (for instance, to handle search) or in the context of a webview.

This means that unlike other modules, a reading app may need to rely on two versions of the locators module: one in JS and another one in a native language.

For each type of locator, the following methods need to be available:

* resolve a locator to a DOM range
* resolve a locator to an interchange format (TBD)
* calculate a locator from a DOM range
* calculate a locator from an interchange format (TBD)


## Shared Context

Whenever a list of locators is provided, a shared context should also be included.

The context is meant to make a locator:

* useful for a human-being, even if a locator can't be anchored back to the publication
* but also useful for a machine, if a publication has been updated and additional information is required

A shared context contains:

* an identifier for the publication
* the title of the publication (optional, but recommended)
* a URI to the resource of the publication where the locator points to
* the text before and after the position that the locator points to

Internally, this can be expressed using a simple JSON document, but whenever a locator is shared, this document recommends using a standard such as [the Web Annotation Model](https://www.w3.org/TR/annotation-model).

## Interchange Locator Format

Since we won't be able to manipulate the DOM at all time, an interchange locator format is also necessary.

This is TBD and needs to be a high priority item to discuss in the upcoming weeks.

## List of Locators

The exact list of locators is still TBD, but the current candidates are:

### Document Based Locators

* CFI (right-most part)
* XPath

### Publication Level Locators

* Synthetic Page
* Position

## Using Locators in Other Modules

Here's an example of what a search API could return:

```
{
  "query": "Laurent"
  "hits": 256
  "results":
  [
    {
       "resource": "chapter1.html",
       "title": "Chapitre 1",
       "match": "Laurentides",
       "text-before": "Lors de ses vacances dans les ",
       "text-after": "il a décidé de réecrire Readium SDK",
       "locators": 
    	{
    	  "cfi": "...",
    	  "xpath": "...",
    	  "page": 147,
    	  "position": 0.1267
    	}
    }
  ]
}
```


