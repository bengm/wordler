// READ in results file
let resultData;
var resFile = new XMLHttpRequest();
resFile.open("GET", "js/sim_results.json", false);
resFile.send(null);
if (resFile.status === 200) {
  resultData = JSON.parse(resFile.responseText);
}

// Analysis
let counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) => resultData.filter((r) => r.guesses.length == i).length
);
let counts1g = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) =>
    resultData.filter(
      (r) => r.guesses[0].filter((g) => g.status == "green").length == 1 && r.guesses.length == i
    ).length
);
let counts2g = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) =>
    resultData.filter(
      (r) => r.guesses[0].filter((g) => g.status == "green").length == 2 && r.guesses.length == i
    ).length
);
let countsAg = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) =>
    resultData.filter(
      (r) => r.guesses[0].filter((g) => g.status == "green").length > 0 && r.guesses.length == i
    ).length
);
let counts2h = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) =>
    resultData.filter(
      (r) => r.guesses[0].filter((g) => g.status !== "gray").length == 2 && r.guesses.length == i
    ).length
);
let counts3h = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) =>
    resultData.filter(
      (r) => r.guesses[0].filter((g) => g.status !== "gray").length == 3 && r.guesses.length == i
    ).length
);
let counts4h = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) =>
    resultData.filter(
      (r) => r.guesses[0].filter((g) => g.status !== "gray").length == 4 && r.guesses.length == i
    ).length
);

// overall avg
let avgCount = resultData.map(r=>r.guesses.length).reduce((x,y)=> x+y) / resultData.length;
document.getElementById("avg-guesses").innerHTML = avgCount;

// histogram
let max = Math.max(...counts);
console.log(max);
let histHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map((i) => {
    let spanWidth = Math.round((400 * counts[i - 1]) / max);
    return `
  <tr>
    <td>${i}</td>
    <td>${counts[i - 1]}</td>
    <td><span style="width: ${spanWidth}px; background-color: black; color: white; display: inline-block;">&nbsp;</span></td>
  </tr>`;
  })
  .join("\n");
document.getElementById("hist-table").innerHTML = histHTML;


let slicesHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map((i) => {
    let totalCt = counts.reduce((x,y)=> x+y);
    let total1g = counts1g.reduce((x,y)=> x+y);
    let total2g = counts2g.reduce((x,y)=> x+y);
    let totalAg = countsAg.reduce((x,y)=> x+y);
    let total2h = counts2h.reduce((x,y)=> x+y);
    let total3h = counts3h.reduce((x,y)=> x+y);
    let total4h = counts4h.reduce((x,y)=> x+y);
    let ct = Math.round(100 * counts[i - 1]/totalCt)
    let ct1g = Math.round(100 * counts1g[i - 1]/total1g)
    let ct2g = Math.round(100 * counts2g[i - 1]/total2g)
    let ctAg = Math.round(100 * countsAg[i - 1]/totalAg)
    let ct2h = Math.round(100 * counts2h[i - 1]/total2h)
    let ct3h = Math.round(100 * counts3h[i - 1]/total3h)
    let ct4h = Math.round(100 * counts4h[i - 1]/total4h)
    return `
  <tr>
    <td>${i}</td>
    <td style="text-align: right;">${ct}%</td>
    <td style="text-align: right;">${ct1g}%</td>
    <td style="text-align: right;">${ct2g}%</td>
    <td style="text-align: right;">${ctAg}%</td>
    <td style="text-align: right;">${ct2h}%</td>
    <td style="text-align: right;">${ct3h}%</td>
    <td style="text-align: right;">${ct4h}%</td>
  </tr>`;
  })
  .join("\n");
document.getElementById('slices-table').innerHTML = slicesHTML;

const formatGuess = (g) => {
  return g.map(formatLetter).join("");
};
const formatLetter = (l) => {
  return `<span class="res-${l.status}">${l.letter}</span>`;
};
let listHTML = resultData
  .map((r,i) => {
    let navAnchor = '';
    let differentFirstLetter = i == 0 || resultData[i-1].targetWord[0] !== r.targetWord[0];
    if (differentFirstLetter) {
      navAnchor = `<h3 id="start-letter-${r.targetWord[0]}">${r.targetWord[0].toUpperCase()} (<a href="#letter-nav">top</a>)</h3>`
    }
    return `
  ${navAnchor}
  <div class="sim-guess-word">
    ${r.guesses.map(formatGuess).join("<br />")}
  </div>`;
  })
  .join("\n");
document.getElementById("raw-guesses").innerHTML = listHTML;
let letterNav = "abcdefghijklmnopqrstuvwxyz".split("").map(l=>{
  return `
  <a href="#start-letter-${l}">${l.toUpperCase()}</a>`
}).join(" ");
document.getElementById("letter-nav").innerHTML = letterNav;

// {"targetWord":"aargh","guesses":[[{"position":0,"letter":"t","status":"gray"},{"position":1,"letter":"a","status":"green"},{"position":2,"letter":"r","status":"green"},{"position":3,"letter":"e","status":"gray"},{"position":4,"letter":"s","status":"gray"}],[{"position":0,"letter":"c","status":"gray"},{"position":1,"letter":"o","status":"gray"},{"position":2,"letter":"r","status":"green"},{"position":3,"letter":"k","status":"gray"},{"position":4,"letter":"y","status":"gray"}],[{"position":0,"letter":"a","status":"green"},{"position":1,"letter":"a","status":"green"},{"position":2,"letter":"r","status":"green"},{"position":3,"letter":"g","status":"green"},{"position":4,"letter":"h","status":"green"}]]}

// <tr>
//   <th>word</th>
//   <td>3</td>
//   <td>
//     <span class="res-green">T</span><span class="res-gray">A</span><span class="res-gray">R</span><span class="res-yellow">E</span><span class="res-gray">S</span><br />

//   </td>
// </tr>
