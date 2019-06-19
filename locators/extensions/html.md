# Locations for HTML Documents

## Additional properties for the `location` Object

This extends the [main definition](../README.md#the-location-object) of the `location` object with constructs specific to HTML documents.

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| `cssSelector` | A [CSS Selector](https://www.w3.org/TR/selectors-3/) | String | No |
| `partialCfi` | See full description below | String | No |
| `domRange` | See full description in the next separate section | Object | No |

`partialCfi` is an expression conforming to the "right-hand" side of the [EPUB CFI](http://www.idpf.org/epub/linking/cfi/epub-cfi.html) syntax, that is to say: without the EPUB-specific OPF spine item reference that precedes the first `!` exclamation mark (which denotes the "step indirection" into a publication document). Note that the wrapping `epubcfi(***)` syntax is not used for the `partialCfi` string, i.e. the ["fragment" part](http://www.idpf.org/epub/linking/cfi/epub-cfi.html#epubcfi.ebnf.fragment) of the CFI grammar is ignored.

## The `domRange` Object

This construct enables a serializable representation of a [DOM Range](https://dom.spec.whatwg.org/#ranges).

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| `start` | A serializable representation of the "start" [boundary point](https://dom.spec.whatwg.org/#concept-range-bp) of the DOM Range | Object (see below) | Yes |
| `end` | A serializable representation of the "end" [boundary point](https://dom.spec.whatwg.org/#concept-range-bp) of the DOM Range | Object (see below) | No |

Note that `end` field is optional. When only the `start` field is specified, the `domRange` object represents a "collapsed" range that has identical "start" and "end" boundary points.

### The `start` and `end` Object

| Key  | Definition | Format | Required |
| ---- | ---------- | ------ | -------- |
| `cssSelector`  | A [CSS Selector](https://www.w3.org/TR/selectors-3/) to a DOM element | String | Yes |
| `textNodeIndex`  | See full description below | integer, starting at zero ([0, n]) | Yes |
| `charOffset`  | See full description below  | integer, starting at zero ([0, n]) | No |

In a DOM Range object, the `startContainer` + `startOffset` tuple represents the "start" boundary point. Similarly, the the `endContainer` + `endOffset` tuple represents the "end" boundary point. In both cases, the `start/endContainer` property is a pointer to either a DOM text node, or a DOM element (this typically depends on the mechanism from which the DOM Range instance originates, for example when obtaining the current selected document fragment using the `window.selection` API). In the case of a DOM text node, the `start/endOffset` corresponds to a position within the character data. In the case of a DOM element node, the `start/endOffset` corresponds to a position that designates a child text node.

Note that a recommended implementation feature is to "normalize" DOM Ranges so that the `start/endContainer` property always references a DOM text node (i.e. not an DOM element). On mobile devices where touch interaction is used, browser engines may perform a normalization step. On desktop platforms where interaction is mouse-driven (or other accurate pointing device), the user selection may not be normalized. Either way, the DOM Range serialization model described herein supports the element use-case.

The `cssSelector` field always references a DOM element. If the original DOM Range `start/endContainer` property references a DOM text node, the `textNodeIndex` field is used to complement the CSS Selector; thereby providing a pointer to a child DOM text node; and `charOffset` is used to tell a position within the character data of that DOM text node (just as the DOM Range `start/endOffset` does). If the original DOM Range `start/endContainer` property references a DOM Element, then the `textNodeIndex` field is used to designate the child Text node (just as the DOM Range `start/endOffset` does), and the optional `charOffset` field is not used (as there is no explicit position within the character data of the text node).

### Impact on the `text` object

The [definition](../README.md#the-text-object) of the `locator`'s `text` object includes `highlight`, `before` and `after`. When specified in the context of a "range" `location`, this textual information <strong class="rfc">must</strong> be populated using the "raw" DOM character data (as opposed to a normalized / trimmed form), which typically includes insignificant leading/trailing/interspersed whitespaces. This is so that consuming APIs have the option to match the `locator.text` information with the original DOM text. It is therefore advised that the text should be "cleaned-up" before being presented to end users.
