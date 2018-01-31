var root = document.getElementsByTagName("html")[0],
    select = document.getElementById("language"),
    styleContent = document.createTextNode("*{}");

function updateStyles() {
  var style = document.createElement("style");
  style.appendChild(styleContent);
  document.head.appendChild(style);
  document.head.removeChild(style);
}

select.addEventListener("change", function(e) {
  var newLang = this.value;
  var currentIndex = this.selectedIndex;
  root.setAttribute("xml:lang", newLang);
  updateStyles();
  this.selectedIndex = currentIndex;
}, false);