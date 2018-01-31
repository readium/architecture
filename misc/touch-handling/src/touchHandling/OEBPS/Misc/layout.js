var button = document.getElementById("load"),
    app = document.getElementById("app"),
    frag = document.createDocumentFragment(),
    list = document.createElement("ol"),
    heading = document.createElement("h3"),
    array = ["Cuocete gli spaghetti", "Tagliate a dadini la pancetta", "Lasciando sciogliere in un tegame con un poco di olio", "Sbattete i quattro tuorli ed aggiungete il pecorino ed un buon pizzico di pepe nero", "Versate la pasta scolata in una terrina capiente e aggiungetevi la pancetta o il guanciale preparati con l'unto bollente", "Mescolate gli ingredienti delicatamente e unite le uova preparate col formaggio"];
    
heading.textContent = "Spaghetti alla carbonara";
frag.appendChild(heading);

list.id = "ricetta";

for (var i = 0; i < array.length; i++) {
  var passo = array[i],
      listItem = document.createElement("li");

  if (passo === array[array.length - 1]) {
    var listItemText = document.createTextNode(passo + ".");
  } 
  else {
    var listItemText = document.createTextNode(passo + " ;");
  }

  listItem.appendChild(listItemText);
  list.appendChild(listItem);
}
frag.appendChild(list);

button.addEventListener("click", function(e) {
  e.preventDefault();
  app.appendChild(frag);
  this.textContent = "Recipe Loaded!";
  this.disabled = true;
});