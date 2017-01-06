//
Package {
    isFixedLayout: ()
    isReflowable: ()
    media_overlay: MediaOverlay
    rendition_flow: ""
    rendition_layout: ""
    rendition_orientation: ""
    rendition_spread: ""
    rendition_viewport: ""
    resolveRelativeUrl: (relativeUrl)
    resolveRelativeUrlMO: (relativeUrl)
    rootUrl: "http://localhost:8080/epub_content/moby_dick-mo/OPS"
    rootUrlMO: undefined
    spine: Spine
}
//
Metadata {
    author: "Herman Melville"
    cover_href: "images/9780316000000.jpg"
    description: ""
    eachMediaItem: (iteratorCallback)
    epub_version: "3.0"
    getMediaItemByRefinesId: (id)
    id: "urn:isbn:9780316000000"
    language: "en-US"
    mediaItems: [{
        "refines": "#chapter_001_overlay",
        "duration": 860.5
    }, {
        "refines": "#chapter_002_overlay",
        "duration": 543
    }]
    media_overlay: MediaOverlay
    modified_date: "2012-01-13T01:13:00Z"
    ncx: ""
    pubdate: ""
    publisher: "Harper & Brothers, Publishers"
    rendition_flow: ""
    rendition_layout: ""
    rendition_orientation: ""
    rendition_spread: ""
    rendition_viewport: ""
    rendition_viewports: []
    rights: ""
    setMoMap: (mediaOverlaysMap)
    title: "Moby-Dick"
}
//
Spine {
    direction: "ltr"
    first: ()
    getItemByHref: (href)
    getItemById: (idref)
    getItemUrl: (item)
    handleLinear: (handleLinear)
    isFirstItem: (item)
    isLastItem: (item)
    isLeftToRight: ()
    isRightToLeft: ()
    isValidLinearItem: (index)
    item: (index)
    items: SpineItem[144]
    last: ()
    nextItem: (item)
    package: Package
    prevItem: (item)
}
// Spine Item Sample 1
SpineItem {
    getRenditionFlow: ()
    getRenditionLayout: ()
    getRenditionOrientation: ()
    getRenditionSpread: ()
    getRenditionViewport: ()
    href: "cover.xhtml"
    idref: "cover"
    index: 0
    isCenterPage: ()
    isFixedLayout: ()
    isFlowScrolledContinuous: ()
    isFlowScrolledDoc: ()
    isLeftPage: ()
    isReflowable: ()
    isRenditionSpreadAllowed: ()
    isRightPage: ()
    linear: "no"
    media_overlay_id: ""
    media_type: "application/xhtml+xml"
    page_spread: "page-spread-right"
    rendition_flow: undefined
    rendition_layout: undefined
    rendition_orientation: undefined
    rendition_spread: undefined
    rendition_viewport: undefined
    setSpread: (spread)
    spine: Spine
}
// Spine Item Sample 2
SpineItem {
    getRenditionFlow: ()
    getRenditionLayout: ()
    getRenditionOrientation: ()
    getRenditionSpread: ()
    getRenditionViewport: ()
    href: "chapter_001.xhtml"
    idref: "xchapter_001"
    index: 6
    isCenterPage: ()
    isFixedLayout: ()
    isFlowScrolledContinuous: ()
    isFlowScrolledDoc: ()
    isLeftPage: ()
    isReflowable: ()
    isRenditionSpreadAllowed: ()
    isRightPage: ()
    linear: "yes"
    media_overlay_id: "chapter_001_overlay"
    media_type: "application/xhtml+xml"
    page_spread: "page-spread-right"
    paginationInfo: PaginationInfo // "runtime" attribute
    rendition_flow: undefined
    rendition_layout: undefined
    rendition_orientation: undefined
    rendition_spread: undefined
    rendition_viewport: undefined
    setSpread: (spread)
    spine: Spine
}
// For the currently paginatined spine item
PaginationInfo {
    columnCount: 3
    columnGap: 44
    columnMaxWidth: 700
    columnMinWidth: 400
    columnWidth: 812
    currentPageIndex: 0
    currentSpreadIndex: 0
    isVerticalWritingMode: false
    pageOffset: 0
    rightToLeft: false
    spreadCount: 2
    visibleColumnCount: 2
}
//
MediaOverlay {
    DEBUG: false
    activeClass: "-epub-media-overlay-active"
    duration: 1403.5
    durationMilliseconds_Calculated: ()
    escapables: ["sidebar", "bibliography", "toc", "loi", "appendix", "landmarks", "lot", "index", "colophon", "epigraph", "conclusion", "afterword", "warning", "epilogue", "foreword", "introduction", "prologue", "preface", "preamble", "notice", "errata", "copyright-page", "acknowledgments", "other-credits", "titlepage", "imprimatur", "contributors", "halftitlepage", "dedication", "help", "annotation", "marginalia", "practice", "note", "footnote", "rearnote", "footnotes", "rearnotes", "bridgehead", "page-list", "table", "table-row", "table-cell", "list", "list-item", "glossary"],
    getNextSmil: (smil)
    getPreviousSmil: (smil)
    getSmilBySpineItem: (spineItem)
    narrator: "Stuart Wills"
    package: Package
    parallelAt: (timeMilliseconds)
    percentToPosition: (percent, smilData, par, milliseconds)
    playbackActiveClass: ""
    positionToPercent: (smilIndex, parIndex, milliseconds)
    skippables: ["sidebar", "practice", "marginalia", "annotation", "help", "note", "footnote", "rearnote", "table", "table-row", "table-cell", "list", "list-item", "pagebreak"]
    smilAt: (smilIndex)
    smil_models: SmilModel[144]
}
//
SmilModel {
    addSync: (epubtypes)
    children: SmilSeqNode_1[1]
    clipOffset: (par)
    duration: undefined
    durationMilliseconds_Calculated: ()
    hasSync: (epubtype)
    href: "chapter_001_overlay.smil"
    id: "chapter_001_overlay"
    mo: MediaOverlay
    nthParallel: (index)
    parallelAt: (timeMilliseconds)
    parent: undefined
    smilVersion: "3.0"
    spineItemId: "xchapter_001"
}
//
SmilSeqNode_1 {
    children: SmilSeqNode_2[1]
    clipOffset: (offset, par)
    durationMilliseconds: ()
    index: 0
    nodeType: "seq"
    nthParallel: (index, count)
    parallelAt: (timeMilliseconds)
    parent: SmilModel
    textref: ""
}
//
SmilSeqNode_2 {
    children: SmilParNode[27]
    clipOffset: (offset, par)
    durationMilliseconds: ()
    epubtype: "bodymatter chapter"
    id: "id1"
    index: 0
    nodeType: "seq"
    nthParallel: (index, count)
    parallelAt: (timeMilliseconds)
    parent: SmilSeqNode_1
    textref: "chapter_001.xhtml"
}
//
SmilParNode {
    audio: SmilAudioNode
    children: [SmilAudioNode, SmilTextNode]
    element: undefined
    getFirstSeqAncestorWithEpubType: (epubtype, includeSelf)
    index: 0
    nodeType: "par"
    parent: SmilSeqNode
    text: SmilTextNode
}
//
SmilAudioNode {
    MAX: 1234567890.1
    clipBegin: 24.5
    clipDurationMilliseconds: ()
    clipEnd: 29.268
    index: 1
    nodeType: "audio"
    parent: SmilParNode
    src: "audio/mobydick_001_002_melville.mp4"
}
//
SmilTextNode {
    index: 0
    manifestItemId: "xchapter_001"
    nodeType: "text"
    parent: SmilParNode
    src: "chapter_001.xhtml#c01h01"
    srcFile: "chapter_001.xhtml"
    srcFragmentId: "c01h01"
    updateMediaManifestItemId: ()
}
