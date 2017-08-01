# Locators Resolver

The locators resolver is a service provided by the streamer that can take a locator as an input and resolve it with an array of one or more locators.

It is based on the list of locators [as defined in the main locators document on this repo](/locators).

## Manifest

The service is exposed in the manifest using a Link Object. 

It can be identified by:

- its media-type: `application/vnd.readium.locator-resolver+json`
- its relationship: `http://readium.org/locator-resolver`


```json
{
  "href": "https://example.com/resolve{?href,cfi,id,position,progression}",
  "type": "application/vnd.readium.locator-resolver+json",
  "rel": "http://readium.org/locator-resolver",
  "templated": true
}
```

## Usage

In order to use the locator resolver, a client must send a locator to the service using the appropriate query parameters.

Locators can be broken down into two categories:

- global locators (`position` and `progression`) for which a single query parameter is required
- local locators (`cfi` and `id`) for which the request must include both a reference to the resource (`href`) along with a locator

If the locator can be resolved, the service returns a [Locator Object](/locators#the-locator-object).

```
GET https://example.com/resolver?position=27

{
  "href": "http://example.com/chapter2",
  "locators": [
    "cfi": "/4[body01]",
    "position": 27,
    "progression": 0.07289
  ]
}
```

If the service can't locate the position requested by a client, it returns a 404 status code.
