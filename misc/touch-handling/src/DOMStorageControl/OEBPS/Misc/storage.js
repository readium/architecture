if (localStorage) {
  var setLcl = document.getElementById("set-local"),
      getLcl = document.getElementById("get-local"),
      getAll = document.getElementById("get-all"),
      clearLcl = document.getElementById("clear-local");

  setLcl.addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.setItem("rth-control-item", "Howdy!");
    console.log("rth-control-item has been set.");
  }, false);
  getLcl.addEventListener("click", function(e) {
    e.preventDefault();
    var lclValue = localStorage.getItem("rth-control-item");
    lclValue ?
      console.log("The value for rth-control-item is “" + lclValue + "”.")
    : console.log("There is no rth-control-item set.");
  }, false);
  getAll.addEventListener("click", function(e) {
    e.preventDefault();
    if (localStorage.length > 0) {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        var value = localStorage.getItem(key);
        console.log("Key: " + key + ", Value: " + value);  
      }
    } else {
       console.log("There is no localStorage item set.");
    }
  }, false);
  clearLcl.addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.clear();
    console.log("localStorage has been cleared.")
  }, false);
} else {
  console.log("Sorry, it seems the DOM Storage API is not supported.");
}