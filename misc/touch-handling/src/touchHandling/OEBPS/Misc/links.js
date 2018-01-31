var hook = document.getElementById("anchor-hook"),
    prog = document.getElementById("anchor-programmatic"),
    note = document.getElementById("note");

hook.addEventListener("click", function(e) {
  e.preventDefault();
  if (note.style.display === "none") {
    note.style.display = "block";
  } else {
	note.style.display = "none";
  }
}, false);

prog.addEventListener("click", function(e) {
  e.preventDefault();
  window.location = "../Text/test-007.xhtml";
}, false);