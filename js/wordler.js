// Set up base word lists
document.allWords = [];
// document.allScoredWords = [];
document.popularWords = [];
document.matchWords = [];
document.matchWordsData = [];
document.guessWordsData = [];

// function to get the entire word list to start things off
// core word list
getData = () => {
  var wordFile = new XMLHttpRequest();
  wordFile.open("GET", "words/scrabble5.txt", true);
  wordFile.send();
  wordFile.onreadystatechange = function () {
    if (wordFile.readyState == 4 && wordFile.status == 200) {
      // split results by newline; convert to lower case
      document.allWords = wordFile.responseText
        .split("\n")
        .map((w) => w.toLowerCase());
      // trigger the input change to refresh ui
    }
  };
  var popWordFile = new XMLHttpRequest();
  popWordFile.open("GET", "words/popular5.txt", true);
  popWordFile.send();
  popWordFile.onreadystatechange = function () {
    if (popWordFile.readyState == 4 && popWordFile.status == 200) {
      // split results by newline; convert to lower case
      document.popularWords = popWordFile.responseText
        .split("\n")
        .map((w) => w.toLowerCase());
      // trigger the input change to refresh ui
    }
  };
  // pre-analyzed word list
  var scoreFile = new XMLHttpRequest();
  scoreFile.open("GET", "words/scored_words.json", true);
  scoreFile.send();
  scoreFile.onreadystatechange = function () {
    if (scoreFile.readyState == 4 && scoreFile.status == 200) {
      // split results by newline; convert to lower case
      document.allScoredWords = JSON.parse(scoreFile.responseText);
      // trigger the input change to refresh ui
      inputChange();
    }
  };
};

// Update the analysis & guess stats
inputChange = () => {
  let possibleMatches = document.popularWords;
  // Grab the values for the 5 green & yellow inputs, then the gray
  let green = [];
  let yellow = [];
  for (let i = 0; i < 5; i++) {
    // translate 0-index to 1-index used form field numbering
    let fieldNum = i + 1;
    green[i] = document.getElementById("g" + fieldNum).value.toLowerCase();
    yellow[i] = document.getElementById("y" + fieldNum).value.toLowerCase();
  }
  let gray = document.getElementById("excluded").value.toLowerCase();
  // Apply the filters
  document.matchWords = Filter.all(possibleMatches, green, yellow, gray);
  // only score if filtered TODO currently hacked at 1000 for dev/testing
  // filtering all at ~10k words takes about 1 minute
  let t0 = performance.now();
  // Get Letter Frequency
  document.letterFrequency = Score.letterFrequency(possibleMatches);
  UI.writeLF(document.letterFrequency);
  document.matchWordsData = document.allScoredWords.slice(0,100);
  UI.writeMatches(document.matchWordsData);
  console.log("matchData",document.matchWordsData)
  console.log("document.matchWordsData (short) DONE");
  if (document.matchWords.length < 50) {
    document.matchWordsData = Score.scoreAllWords(possibleMatches);
    UI.writeMatches(document.matchWordsData);
    console.log("document.matchWordsData scoreAllWords DONE");
    document.guessWordsData = Score.byFilterPotential(
      possibleMatches.slice(0,100),
      document.allWords.slice(0,100)
    );
    console.log("document.guessWordsData DONE");
    UI.writeGuesses(document.guessWordsData);
  }
  console.log("Exec Time: ", performance.now() - t0);
};

// Functions to filter to matching words
const Filter = {
  all: (wordList, green, yellow, gray) => {
    for (let i = 0; i < 5; i++) {
      wordList = Filter.green(wordList, i, green[i]);
      wordList = Filter.yellow(wordList, i, yellow[i]);
    }
    wordList = Filter.gray(wordList, gray);
    return wordList;
  },
  green: (wordlist, position, letter) => {
    if (letter) {
      wordlist = wordlist.filter((word) => word[position] == letter);
    }
    return wordlist;
  },
  yellow: (wordlist, position, letters) => {
    var letters = letters.split("");
    letters.forEach((letter) => {
      // word both has the letter somewhere, but does NOT have the letter in the 'yellow' position
      wordlist = wordlist.filter(
        (word) => word.includes(letter) && word[position] !== letter
      );
    });
    return wordlist;
  },
  gray: (wordlist, letters) => {
    var letters = letters.split("");
    letters.forEach((letter) => {
      wordlist = wordlist.filter((word) => !word.includes(letter));
    });
    return wordlist;
  },
};

// Logic for scoring potential matches and other analysis
const Score = {
  byFilterPotential: (matchedWords, allWords) => {
    let scoredSet = [];
    UI.writeProgress(0);
    console.log("... starting filter ...", matchedWords.length,allWords.length);
    // For each possible target/guess word combo, how many possible matches would remain?
    // A resulting low matchCount means that it would narrow the list down to few words
    allWords.forEach((guessWord, g) => {
      // update UI progress along the way
      if (g % 100 == 0) {
        console.log(g);
        UI.writeProgress(Math.round((100 * g) / allWords.length));
      }
      let matchCount = 0;
      matchedWords.forEach((targetWord) => {
        matchCount += Score.countRemainingMatches(
          guessWord,
          targetWord,
          matchedWords
        );
      });
      // score this possible guess/target combo
      scoredSet.push({
        word: guessWord,
        remainingMatchCount: matchCount,
      });
    });
    return scoredSet.sort(
      (a, b) => a.remainingMatchCount - b.remainingMatchCount
    );
  },
  countRemainingMatches: (guessWord, targetWord, possibleMatches) => {
    let matches = possibleMatches;
    Game.scoreGuess(guessWord, targetWord).forEach((scoredLetter) => {
      switch (scoredLetter.status) {
        case "green":
          matches = Filter.green(
            matches,
            scoredLetter.position,
            scoredLetter.letter
          );
          break;
        case "yellow":
          matches = Filter.yellow(
            matches,
            scoredLetter.position,
            scoredLetter.letter
          );
          break;
        case "gray":
          matches = Filter.gray(matches, scoredLetter.letter);
      }
    });
    return matches.length;
  },
  byLetterFrequency: (matchedWords, allWordsData, green, yellow, gray) => {
    var knownLetters = [];
    // merge all known letters into one array
    knownLetters.push(green);
    knownLetters.push(yellow.map((y) => y.split("")));
    knownLetters.push(gray.split(""));
    knownLetters = knownLetters.flat(4);
    knownLetters = Score.unique(
      knownLetters.filter((letter) => letter.length > 0)
    );
    // knownLetters.forEach((letter) => {
    //   allWordsData = allWordsData.filter((e) => !e.word.includes(letter));
    // });
    // what letters are even possible in the remaining word match list?
    // possibleLetters = unique(matchedWords.join("").split(""));
    // allWordsData = allWordsData.filter((e) => possibleLetters.includes(e.word[0],e.word[1],e.word[2],e.word[3],e.word[4]));
    var lf = letterFrequency(matchedWords);
    allWordsData.forEach((sw) => {
      var score = 0;
      var knownCount = 0;
      var letters = Score.unique(sw.word.split(""));
      letters.forEach((letter) => {
        score += lf[letter];
        if (knownLetters.includes(letter)) {
          knownCount += 1;
        }
      });
      sw.letterFreqScore = score;
      sw.knownLetterCount = knownCount;
    });
    return allWordsData
      .sort((a, b) => b.letterFreqScore - a.letterFreqScore)
      .sort((a, b) => a.knownLetterCount - b.knownLetterCount);
  },
  letterFrequency: (words) => {
    lf = {};
    az = "abcdefghijklmnopqrstuvwxyz".split("");
    az.forEach((letter) => {
      lf[letter] = words.filter((word) => word.includes(letter)).length;
    });
    return lf;
  },
  scoreAllWords: (wordlist) => {
    let result = wordlist
      .map((word) => {
        return { word: word, distance: Score.wordToList(wordlist, word) };
      })
      .sort((a, b) => b.distance - a.distance);
    return result;
  },

  wordToList: (wordlist, word) => {
    return wordlist
      .map((w) => Score.wordDistance(word, w))
      .reduce((total, el) => total + el);
  },

  wordDistance: (word1, word2) => {
    let score = 0;
    let a1 = word1.split("");
    let a2 = word2.split("");
    let u1 = Score.unique(a1);
    // position-match
    a1.forEach((letter, i) => {
      if (a2[i] == letter) {
        // bump score if match
        score += 3;
        // remove from the u1 list to not double count
        u1 = u1.filter((e) => e !== letter);
      }
    });
    // general match
    u1.forEach((letter) => {
      if (word2.includes(letter)) {
        score += 1;
      }
    });
    return score;
  },
  unique: (array) => {
    return array.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  },
};

const Game = {
  scoreGuess: (guessWord, targetWord) => {
    let scored = [];
    guessWord.split("").forEach((letter, i) => {
      let lscore = { position: i, letter: letter, status: "gray" };
      lscore.letter = letter;
      if (letter == targetWord[i]) {
        lscore.status = "green";
      } else if (targetWord.includes(letter)) {
        lscore.status = "yellow";
      }
      scored.push(lscore);
    });
    return scored;
  },
};

// write the results to the doc, interact w/ doc
const UI = {
  submitForm: (event) => {
    // handle form changes and filter the list accordingly
    event.preventDefault();
    event.stopPropagation();
    inputChange();
  },
  setFormListener: () => {
    document
      .getElementById("wordForm")
      .addEventListener("submit", UI.submitForm, false);
  },
  writeMatches: (matchWordsData) => {
    const matchesEl = document.getElementById("matches");
    const numResultsEl = document.getElementById("numMatches");
    let formatted = matchWordsData
      .slice(0, 100)
      .map((wd) => `<span>${wd.word}</span>`)
      .join("<br>");
    numResultsEl.innerHTML = "(" + matchWordsData.length + ")";
    matchesEl.innerHTML = formatted;
  },
  writeLF: (lf) => {
    const lfEl = document.getElementById("letterFrequency");
    let lfKeys = Object.keys(lf);
    let formatted = lfKeys
      .map((k) => k + ":" + lf[k] + "<br>")
      .join(" ");
      lfEl.innerHTML = formatted;
  },
  writeGuesses: (guessWordsData) => {    
    const guessResultsEl = document.getElementById("guesses");
    let formattedGuesses = guessWordsData
      .slice(0, 100)
      .map((wd) => `<span>${wd.word} | ${wd.remainingMatchCount}</span>`)
      .join("<br>");
    guessResultsEl.innerHTML = formattedGuesses;
  },
  writeProgress: (pct) => {
    const progEl = document.getElementById("progressBar");
    progEl.setAttribute("style", `width: ${pct}%`);
    progEl.setAttribute("data-filled", `Calculating ${pct}%`);
  },
};

// start us off by listening for for submit,then building up the whole word list
UI.setFormListener();
getData();
