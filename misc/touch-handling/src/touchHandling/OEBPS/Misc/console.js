// console.log EPUB polyfill

// Get the inline console
var logger = document.getElementById('console');

// Pass logs, (explicit) warnings and (explicit) errors to the inline console
['log','warn','error'].forEach(function (verb) {
  console[verb] = (function (method, verb, log) {
    return function (text) {
      method(text);
      var msg = document.createElement('span');
      msg.classList.add(verb);
      msg.textContent = verb + ': ' + text;
      logger.appendChild(msg);
    };
  })(console[verb].bind(console), verb, logger);
});

var consoleStyles = document.createElement("style");

consoleStyles.type = "text/css";
consoleStyles.id = "consoleStyles";
consoleStyles.textContent = "#console{white-space:pre-wrap;word-wrap:break-word;-webkit-tab-size:2;-moz-tab-size:2;-ms-tab-size:2;tab-size:2;}#console span{display:block;margin-top:16px;}";

document.head.appendChild(consoleStyles);