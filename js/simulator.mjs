import { Data, Filter, Score } from "./common.mjs";
import { Game } from "./game.mjs";
import * as fs from "fs";

let outfile = "sim_results.json";
let allWords = fs
  .readFileSync("./../words/popular5.txt")
  .toString()
  .split("\n");
let resultData = [];
let targets = fs.readFileSync("./../words/popular5.txt").toString().split("\n");
targets.forEach((tWord) => {
  console.log(tWord);
  let thisGuess = "tares";
  let roundData = { targetWord: tWord, guesses: [] };
  Game.targetWord = tWord;
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].every((i) => {
    if (i > 0) {
      let allWordsData = allWords.map((word) => {
        return { word };
      });
      let remainingMatches = Filter.all(targets, roundData.guesses);
      // Determine next guess word
      if (remainingMatches.length < 3) {
        thisGuess = remainingMatches[0];
      } else {
        let lf = Score.letterFrequency(remainingMatches);
        Score.byLetterFrequency(
          remainingMatches,
          allWordsData,
          lf,
          roundData.guesses
        );
        thisGuess = allWordsData[0].word;
      }
    }
    let result = Game.scoreGuess(thisGuess);
    roundData.guesses.push(result);
    let numGreen = result.filter((e) => e.status == "green").length;
    // Stop when word is guessed. Returning false breaks the every() loop
    return numGreen < 5;
  });
  resultData.push(roundData);
  // let lastString = JSON.stringify(resultData[resultData.length - 1]);
  console.log(roundData.guesses.length);
});

// write out results
fs.writeFileSync(outfile,JSON.stringify(resultData));
