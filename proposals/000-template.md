# Proposal Title

* Authors: [Author A](https://github.com/author-a), [Author B](https://github.com/author-b) (*sorted alphabetically*)
* Review PR: [#26](https://github.com/readium/architecture/pull/26) (*added by maintainers, after merging the PR*)
* Implementation PRs: (*added by implementers, for reference*)
  * Swift: [r2-shared-swift#34](https://github.com/readium/r2-shared-swift/pull/34), [r2-navigator-swift#18](https://github.com/readium/r2-navigator-swift/pull/18)
* Related Issues: (*ordered by relevancy, feel free to link to direct comments*)
  * [#120 First issue title](https://github.com/readium/architecture/issues/120)
  * [other-repo#35 Second issue title](https://github.com/readium/other-repo/issues/35)


## Summary

One paragraph description of what the proposal is.


## Motivation

Describe the problems that this proposal seeks to address. How this new functionality would help Readium developers create better reading apps?


## Developer Guide

Explain the proposal as if it was already included in the toolkit and you were teaching it to another Readium developer.

* Introduce new named concepts and types.
* Illustrate the feature with examples and use cases.
* Explain how it will concretely impact the way Readium developers use the toolkit.

### Backward Compatibility and Migration
(*if relevant*)

Explain how this proposal will impact existing reading apps, compared to new Readium users.

* Which types will be deprecated, and with which warning and alias.
* Which migration steps must developers follow, and what changes will be needed in their codebase.

If possible, add one section per platform. Other maintainers are welcome to complete this section upon review, by commenting on the review PR.


## Reference Guide

Describe the design of the solution in detail.

* If it's a new API, show the full API and its documentation comments.
* If applicable, provide sample error messages.

The detail in this section should be enough for someone who is not one of the authors to be able to implement the feature.

### `AClass` Class (implements `AnInterface`)

(*type can be: class, interface or enum*)

Short description of the purpose of this type, which will be added to the documentation comments.

Additional implementation notes. Everything is assumed immutable, unless mentioned otherwise.

#### Properties

* (tags) `prop1: Type`
  * Documentation comment for this property.
  * Additional notes.

*tags can be:*
  * ***writable**: if ommited the property is assumed read-only*
  * ***lazy**: if the property should be computed lazily*
  * ***static**: if the property is on the type itself, and not on instances*
  * ***optional**: for properties of an interface with a default implementation*

#### Methods

* (tags) `method(param: String) -> Boolean`
  * Documentation comment for this method.
  * `param: String`
    * Documentation comment for this param.
    * Additional notes.
  * Returns something.
  * Additional notes.

*tags can be:*
  * ***static**: if the method is on the type itself, and not on instances*
  * ***optional**: for methods of an interface with a default implementation*


## Rationale and Alternatives

What other designs have been considered, and why you chose this approach instead.


## Drawbacks and Limitations

Why should we *not* do this? Are there any unresolved questions?


## Future Possibilities
(*if relevant*)

Think about what the natural extension and evolution of your proposal would be. This is also a good place to "dump ideas", if they are out of scope for the proposal but otherwise related.


## Implementation Notes
(*after implementing the feature on a platform*)

Any implementer can submit an amendment PR to offer insights for other platforms.
