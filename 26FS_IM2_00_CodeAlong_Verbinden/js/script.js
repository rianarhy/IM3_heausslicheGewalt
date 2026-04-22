console.log("Javascript verbunden!");

let dozent = "Nick";
console.log(dozent);

let x = 2; /* number */ 
let y = "2"; /* text wegen gänsefüsse */

console.log(x==y); /* true, Wert mit Umwandlung */
console.log(x===y); /* false, Wert + Typ ohne Umwandlung */

let bohnen = 500;
let wasser = 1000;
let isReady = false;
let coffee = "Espresso";

let myCoffee = makeCoffee(bohnen, wasser, isReady);
console.log(myCoffee);

function makeCoffee(bohnen, wasser, isReady) {
  if (bohnen > 10 && wasser > 100 &&isReady == true){
    return("we can make a coffee");
  } else {
    return("not enough ingredients");
  }
}
