window.addEventListener("storage", function (event) {
  if (event.key === "rth-local-item" && event.newValue) {
	console.log("The localStorage key " + event.key + " has been change. Its new value is " + event.newValue);
  }
}, false);

var getSsn = document.getElementById("get-session"),
    getLcl = document.getElementById("get-local");

  getSsn.addEventListener("click", function(e) {
    e.preventDefault();
    var lclValue = sessionStorage.getItem("rth-session-item");
    lclValue ?
      console.log("The value for rth-session-item is “" + lclValue + "”.")
    : console.log("There is no rth-session-item set.");
  }, false);

  getLcl.addEventListener("click", function(e) {
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