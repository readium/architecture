var track = document.getElementById("track"),
    controls = document.getElementById("controls"),
    wrap = document.getElementById("wrap"),
    bar = document.createElement("div");

track.removeAttribute("controls");
controls.style.display = "block";

bar.id = "bar";
wrap.insertBefore(bar, wrap.firstChild);

/* We’re using Event Propagation for this one */

controls.addEventListener("click", function(event) {
  var el = event.target;
  event.preventDefault();
  if (el.id === "Play") {
    track.play();
  } 
  else if (el.id === "Pause") {
    track.pause();
  } 
  else if (el.id === "Stop") {
    track.pause();
    track.currentTime = 0;
  } 
  else {
    return;
  }
});

track.addEventListener("timeupdate", function(e) {
  bar.style.width = parseInt(((track.currentTime / track.duration) * 100), 10) + "%";
});