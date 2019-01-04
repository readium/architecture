# Location Resolver

The locator resolver is a service provided by the streamer that can take a location as an input and resolve it by providing a [Locator Object](/locators#the-locator-object) as its output.

It is based on the list of locations [as defined in the main locators document on this repo](/locators).

## Manifest

The service is exposed in the manifest using a Link Object. 

It can be identified by:

- its media-type: `application/vnd.readium.locator-resolver+json`
- its relationship: `http://readium.org/locator-resolver`


```json
{
  "href": "https://example.com/resolve{?href,fragment,position,progression}",
  "type": "application/vnd.readium.locator-resolver+json",
  "rel": "http://readium.org/locator-resolver",
  "templated": true
}
```

## Usage

In order to use the location resolver, a client must send a location to the service using the appropriate query parameters.

Locations can be broken down into two categories:

- global locations (`position`) for which a single query parameter is required
- local locations (`fragment` and `progression`) for which the request must include a reference to the resource (`href`) along with a location

If the location can be resolved, the service returns a [Locator Object](/locators#the-locator-object).

```
GET https://example.com/resolver?position=27

{
  "href": "http://example.com/chapter2",
  "type": "application/xhtml+xml",
  "locations": {
    "fragment": "partialcfi(/4[body01])",
    "position": 27,
    "progression": 0.07289
  },
  "text": {
    "before": "This is the text before the position",
    "after": "and this is the text after it."
  }
}
```

If the service can't locate the location requested by a client, it returns a 404 status code.
