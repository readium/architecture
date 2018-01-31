if (localStorage) {
var setSsn = document.getElementById("set-session"),
    setLcl = document.getElementById("set-local"),
    getSsn = document.getElementById("get-session"),
    getLcl = document.getElementById("get-local"),
    changeLcl = document.getElementById("change-local"),
    clearLcl = document.getElementById("clear-local");

  setSsn.addEventListener("click", function(e) {
    e.preventDefault();
    sessionStorage.setItem("rth-session-item", "Hey!");
    console.log("rth-session-item has been set.");
  }, false);

  setLcl.addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.setItem("rth-local-item", "Hello!");
    console.log("rth-local-item has been set.");
  }, false);

  getSsn.addEventListener("click", function(e) {
    e.preventDefault();
    var lclValue = sessionStorage.getItem("rth-session-item");
    lclValue ?
      console.log("The value for rth-session-item is “" + lclValue + "”.")
    : console.log("There is no rth-session-item set.");
  }, false);

  getLcl.addEventListener("click", function(e) {
    e.preventDefault();
    var lclValue = localStorage.getItem("rth-local-item");
    lclValue ?
      console.log("The value for rth-local-item is “" + lclValue + "”.")
    : console.log("There is no rth-local-item set.");
  }, false);

  changeLcl.addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.setItem("rth-local-item", "I’ve been changed!");
    console.log("rth-local-item has been changed.");
  }, false);

  clearLcl.addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.clear();
    console.log("localStorage has been cleared.")
  }, false);
} else {
  console.log("Sorry, it seems the DOM Storage API is not supported.");
}