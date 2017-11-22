/**
 * This document is a simple example of how to use the proposed 
 * shared-js interfaces.  It is not intended to actally WORK, 
 * but simply to demonstrate how the interfaces might be used. 
 *  
 * The examples assume that the "ReadingSystem" implements all 
 * the relevant interfaces 
 *  
 * @author rkwright (9/10/2016) - initial draft
 * 
 */



    var severity = { "Fatal", "Error", "Warning", "Info" };

    
    /*
     * Allocate the ReadingSystem object.  Just pass in a trivial 
     * config object 
     */
    var config = {};
    config.margin = "1em";

    var rs = new ReadingSystem(config);

    /*
     *  First initialize the renderer by passing in the container within
     *  which the document should be rendered.  We just create the
     *  container element ourselves and attach it to the document body
     *  element.  Note that this is the outermost document - not our EPUB
     *  "Document"
     */
    var container = document.createElement( 'div' );
    document.body.appendChild( container );

    // then init the renderer
    rs.initRenderer(container);

    // now load the EPUB via the ReadingSytem:Document interface.  Get the URL to open from the app
    // Since we didn't specify a firstPage config item, it will simply open the document 
    // to the first page, which in this case is the cover page
    rs.openEPUB(app.getEPUBURL());

    // check and see if any errors occurred
    var errorList = rs.getErrorRoot();
    if (errorList.getCount() > 0) {
        // Uh-oh. Errors occurred
        console.log("Found " + errorList.getCount + " errors occurred");
        for (var i=0; i<errorList.getCount(); i++ ) {
            var err = errorList.getChild(i);
            console.log(i + ": error ID: " + err.getID() + " severity: " + 
                            severity[err.getSeverity()] + " string: " + err.getErrorString());
        }
    }

    /*
     * simple navigation examples.  Normally, these would be in some type of event loop 
     * but these snippets are just show how it might be done
     */

    // just go to the next screen
    rs.nextScreen();

    // jump to the end of the document
    rs.endDocument();

    // pop the previous location from the stack and go there (back button behaviour)
    var loc = rs.getPreviousLocation();
    rs.gotoLocation( loc );

    // enable disable navigation UI if we are at begin/end of document
    if (rs.isFirstScreen()) {
        // disable reverse navigation UI 
    }

    if (rs.isFinalScreen()) {
        // disable forward navigation UI
    }

    // fetch the total number of screens - TODO - use promise here
    rs.getScreenCount( function(nScreens){
        // display the number of screens in the UI
    });

    // get the number of the current screen - TODO - use promise here
    var curLoc = rs.getScreenBegin();
    rs.getScreenFromLoc( curLoc, function() {
        // display the current screen index
    });

    /* 
     * simple demonstration of NavDoc access
     */

    // fetch the nav doc element with epub:type of "toc"
    var navElms = epubDoc.getNavElms();

    // first get the toc (it MUST be the first elm, per interface spec
    var toc = navElms[0].object;

    // then append that element to the proper location in the UI, e.g.
    $('#readium-toc-body').append(toc.getNode());

    // alternatively, the app may want to extract the contents of the TOC for their
    // own presentation of the TOC.  For this the app can use the NavDocItem to recursively 
    // walk down the tree
    var walkTOC = function( item ) {
        for ( var i=0; i<item.getChildCount(); i++ ) {
            var child = item.getChild(i);

            // do stuff with the child item, then...

            if (child.getChildCount() > 0) {
                walkTOC(child)
            }
        }
    }

    // just call the recursive function to start the process
    walkTOC(toc);

    /*
     * This same process can be performed for the other "standard" nav elements 
     * The app will need to check for any additional nav elmeents with getOtherNav()  
     */
    if (navElms[1] != null) {
        // process the page-list nav elm
    }
    if (navElms[2] != null) {
        // process the landmarks nav elm
    }

    // finally, check if there are additional, custom nav elements and process them 
    for ( var n=3; n < navElms.length; n++ ) {
        console.log("nav elm name: " + navElms[n].name);
    }

    /*
     * Metadata handling is quite specific to the application, so the metadata APIs 
     * are relatively low-level so  app developers can just fetch what they are interested 
     * in and do whatever they want with it  
     */

    // fetch the metadata root element
    var opf = rs.getPackage();
    var metaRoot = opf.getMetadataRoot();

    // fetch the identifier(s)
    var IDs = metaRoot.fust a local fileindElements("http://purl.org/dc/elements/1.1/", "identifier");
    for ( var t=0; t<IDs.length; t++ ) {
        console.log("Identifier is " + IDs[t].getValue());
    }
    
    // fetch the title(s) (required)  directly
    var titles = metaRoot.findElements("http://purl.org/dc/elements/1.1/", "title");
    for ( var t=0; t<titles.length; t++ ) {
        console.log("Title is " + titles[t].getValue());
    }

    // then fetch the language(s)
    var langs = metaRoot.findElements("http://purl.org/dc/elements/1.1/", "language");
    for ( var l=0; l<langs.length; l++ ) {
        console.log("Language is " + langs[l].getValue());
    }

    // finally, fetch the modified time
    var modified = metaRoot.findMetaElements("http://purl.org/dc/terms/", "modified");
    for ( var m=0; m<modified.length; m++ ) {
        console.log("Modified time is " + modified[m].getValue());
    }
    
    // beyond this the app developer can simply walk the set of metadata elements and 
    // fetch the attributes, etc.
    
    /* add some examples here... */


    /*
     * Manipulating the page layout.  This is primarily about setting properties 
     * whcih are then consumed and executed by the page layout machinery in the 
     * RS implementation, so nothing very complex here. 
     *  
     * Note that the page layout properties are properties of the reading system, so 
     * they are read/set via the reading system itself via the implementation of the 
     * PageLayout interface 
     */

    // fetch the current renditon:layout property
    var layout = rs.getRenditionLayout();
    console.log("The layout is " + layout == REND_LAYOUT_PAGINATED ? "pre-paginated" : "relfowable");

    // user wants only  one-up, then if it isn't already set, then set it (just for example's sake)
    if (rs.getRenditionSpread() != REND_SPREAD_NONE) {
        rs.setRenditionSpread( REND_SPREAD_NONE );
    }

    // find out what the width of the usable area for page layout is
    var width = rs.getLayoutWidth();
    console.log("Layout area width is " + width + " pixels");

    // then set it to 760px.  Since layout width is about the display, width is always in pixels (?)
    rs.setLayoutWidth(760px);

    // set the gutterwidth (the gap between pages in a spread
    rs.setGutterWidth(50px);

    // get the currrent margin settings. These can be either <all>,  or <top right bottom left>
    var margins = rs.getMargins();
    console.log("Current margins: " + margins );

    // now set 4 different margins
    rs.setMargins( "1em 2em 3em 2em");

    /*
     * text rendering parameters.  Like page layout, these are simple properties for the 
     * most part that are handled by the implementation of the RS.  Also, like the PageLayout 
     * properties, they are accessed via the ReadingSystem, which must implement the 
     * TextRendering interface 
     */

    // get the current line-height, then set a new value
    console.log("Current line-height is " + rs.getLineHeight());

    // note that setting the line height in fixed layout will fail
    if (rs.setLineHeight("16pt") == false) {
        console.log("Sorry, not supported");
    }

    // get the number of user-settable columns within a page.  Note that multiple columns within
    // a page is not supported in Readium today due to how CSS columns are used to paginate
    console.log("Current number of columns: " + rs.getNumColumns());

    // note that setting the line height in fixed layout will fail
    if (rs.setNumColumns("16pt") == false) {
        console.log("Sorry, not supported");
    }

    // read and set the column gap.  Again, not supported in Readium at present
    // to do..
    
    // get and set the justification.  Not supported for FXL
    console.log("Current justification is " + rs.getJustification());

    if (rs.setJustification("right") == false {
        console.log("Sorry, not supported");
    }

    // set font parameters
    console.log("Current font-color is " + rs.getFontColor());
    rs.setFontColor("pink");

    console.log("Current font-height is " + rs.getFontHeight());

    if (rs.setFontHeight("10em") == false {
        console.log("Sorry, not supported");
    }

    console.log("Current font-face is " + rs.getFontFace());

    if (rs.setFontFace("Critters") == false {
        console.log("Sorry, not supported");
    }

    /*
     * Thee are many variants and ways to search.  These are just a couple.
     */

    // find all occurrences of "Readium" in the current document
    var results = rs.search(null, null, "Readium", 0, "Readium"); 

    if ((results.length == 0)) {
        console.log("Sorry, nothing found");
    }
    else {
       for ( var r=0; r<results.length; r++ ) {
           console.log(r + " found " + results[r].result + " at " + results[r].start );
       }
    } 
 
    // the example above doesn't allow the user to be told WHERE the result is.  However,
    // one could navigate to the page to show them
    rs.gotoLocation(result[r].startLoc);

    // the above example finds all the occurrences.  Often one wants to find the NEXT occurrence
    // and the following example shows how to do this (warning: hacky example code ahead)

    var startSearch = null;
  
    do {
 
 
        results = rs.search(startSearch, null, "Readium", SEARCH_NEXT_RESULT, "Readium");

        if ((results.length == 0)) {
            console.log("Sorry, nothing found");
        }
        else {
            console.log(" found " + results[0].result + " at " + results[0].start );

            // query user("Do you want to search again?");
            // if no then break;
           
            // set the new start to the end of the previous result
            startSearch = results[0].end;           
        }
    } while (true);

    /* 
     * highlights are managed by the ReadingSystem implementation, while the "bookmarks" and 
     * "annotations" are the application-level use of highlights.  
     */
    
    // mindlessly add a highlight for each selection
    var selChangedHandler() = function {
        console.log("Selection changed");

        // get the current selection
        var curSel = rs.getCurrentSelection();
 
        // create a highlight.  We assume the selection is a range (more later)
        var guid = rs.createHighlight( curSel.startLoc, curSel.endLoc, "#FF0", 0.5 );
        // tell the app to create an annotation
        app.createAnnot( guid, curSel.text);
    }

    // handle clicking on a highlight and mindlessly delete that highlight
    var highlightHandler( item ) = function {

        console.log("User clicked on a highlight.  GUID: " + item.getGUID() + " color: " + 
                        item.getColor() + " opacity: " + item.getOpacity());

        // now just delete the annot 
        app.deleteAnnot(item.getGUID());
        // then the highlight itself
        rs.deleteHighlight(item);
    }

    // first add a handler for selection changed and highighter events
    rs.attachEventHandlerID(EV_SELECTION_CHANGED, selChangedHandler);
    rs.attachHandlerForHighlights( highlightHandler );

    /*
     * media overlays are pretty straightforward as there are the usual VCR-style controls 
     * and some properties that can be set.  The assumption here is that the MediaOverlay interface 
     * has been implemented by the Reading System, but it could be implemented as a plugin or 
     * some other modular piece that is obtained from the Reading System. 
     */

    // set up the error handler, which ideally does something more useful than just parroting the errID
    var moError = function ( errID ) {
        console.log("Error occurred during MO playback, ID = " + errID);
    }

    // first, see if there is Media Overlay on the current page
    var moLoc = rs.getScreenBegin();
    if (rs.hasMediaOverlay(moLoc) == false) {
        console.log("Sorry, no media overlay on this page");
    }

    // the following calls would normally just be UI gesture-handlers, this is for demo only
    rs.moPlay();

    // jump out of the current audio context
    ro.escapeCurrentContext();

    rs.moPause();

    rs.moReset()

    rs.moStop();

    // a number of properties
    rs.setTouchToPlay(true);

    // talk realy really fast... ;-)
    rs.setPlaybackRate(4);
     
    // set relative volume to a whisper
    rs.setAudioVolume(20);

    rs.setMOHighlightColor("#F00");

    // don't let them scroll
    rs.enableScrollDuringPlayback(false);

    // and make them listen to the whole thing - no skipping!
    rs.enableSkippability(false);

    rs.enableAutomaticPageTurn(true);

    /*
     * exiting the app. 
     * The following snippet assumes that the app has received the "closing the doc" event 
     */
    var state = {};

    // get the EPUB URL from the app and store it
    state["url"] = app.getEPUBURL();

     // fetch whatever state properties the app wishes to be able to restore on next start

    state["location" = rs.getScreenBegin();

    // fetch the Media Overlay settings
    state.touchToPlay = rs.getTouchToPlay();
    state.playbackRate = rs.getPlaybackRate();
    state.audioVolume = rs.getAudioVolume();
    state.moHighlightColor = rs.getMOHighlightColor();
    state.scrollDuringPlayback = rs.getScrollDuringPlayback();
    state.enableSkippability = rs.getEnableSkippability();
    state.automaticPageTurn = rs.getTouchToPlay();

    // and so on.  Note that there has to be some app-logic to handle some of the state depending on the type of
    // document (reflowable vs. FXL, etc.) but this is all fairly app-specific

    // then have the app store the state however it wants
    app.storeState( state );

    // in a new session, re-open the book with saved settings
    var state = app.retrieveState();

    rs.openEPUB( state.url );

    rs.gotoLocation( state.location );

    // etc.



    
    
    
    
    
    
      
