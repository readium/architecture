# Requirement when protecting a Readium Web Publication

## Access control over the publication

* Restrict access to the manifest and the resources of a publication
* Require the user to be authenticated at all times
* Restrict access to publications based on rights associated to the user
* Restrict concurrent access based on IP address and user identifier

## Serving resources

* All resources must be served over HTTPS
* Whenever possible, resources should be obfuscated
* Resources must use non-predictable URIs (for example: avoid auto-incremented integers)

## Caching

* Minimize the use of caching to use cases where it's truly needed (offline access)
* Resources should be obfuscated when cached
* Do not use well-known file extensions when caching resources

## Expressing rights in a manifest

* The manifest may contain rights that regulates its usage
* Whenever the manifest contains such rights, it must be signed
* Any compatible user agents should validate that signature
* In addition to the rights expressed in the manifest itself, access control should be regulated by an external document, controlled by the licensor