/* Handle basic navigation using taps */

(function() {

  var page = 0;
  var hash = location.hash;

  if (hash=="#last") document.body.scrollLeft = document.body.scrollWidth-window.innerWidth;

  window.addEventListener("click", (function(e) {        
    var clickX = e.pageX;
    console.log("Click detected at: "+clickX);
    //console.log((window.innerWidth*page)+(window.innerWidth/2));
    if (clickX > (window.innerWidth*page)+(window.innerWidth/2)) {
      console.log("Current position: " + document.body.scrollLeft);
      if (document.body.scrollLeft+window.innerWidth == document.body.scrollWidth) {
        //window.scrollTo(0,0);
        page = 0;
      } else {
        page = page+1;
        //document.body.scrollLeft = page*(window.innerWidth);
      }
    } else {
      if (document.body.scrollLeft == 0) {
        page = document.body.scrollWidth/window.innerWidth;
        //document.body.scrollLeft = page*(window.innerWidth);
      } else {
        if (page>0) page = page-1;
        //document.body.scrollLeft = page*(window.innerWidth);
      }
    }
    document.body.scrollLeft = page*(window.innerWidth);
  }));

  //window.addEventListener("scroll", (function(e) {        
  //  document.body.scrollLeft = page*(window.outerWidth);
  //}));

}());