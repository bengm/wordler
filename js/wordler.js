// Set up base word lists
document.allWords = [];
document.allScoredWords = [];
document.matchWords = [];
document.matchWordsData = [];
document.altWordsData = [];

// function to get the entire word list to start things off
// core word list
getAllWords = () => {
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

// handle form changes and filter the list accordingly
submitForm = (event) => {
  event.preventDefault();
  event.stopPropagation();
  inputChange();
};

inputChange = () => {
  let words = document.allWords;
  let altWords = document.allWords;
  let green = [];
  let yellow = [];

  // Grab the values for the 5 green & yellow inputs, then the gray
  for (let i = 0; i < 5; i++) {
    // translate 0-index to 1-index used form field numbering
    let fieldNum = i + 1;
    green[i] = massageInputText(document.getElementById("g" + fieldNum).value);
    yellow[i] = massageInputText(document.getElementById("y" + fieldNum).value);
  }
  let gray = massageInputText(document.getElementById("excluded").value);

  // Apply the filters
  for (let i = 0; i < 5; i++) {
    words = filterGreen(words, i, green[i]);
    words = filterYellow(words, i, yellow[i]);
  }
  words = filterGray(words, gray);
  document.matchWords = words;

  // only score if filtered TODO currently hacked at 1000 for dev/testing
  // filtering all at ~10k words takes about 1 minute
  console.log(document.matchWords.length);
  if (document.matchWords.length < 1000) {
    document.matchWordsData = scoreAllWords(words);
    document.altWordsData = scoreAlternateWords(words, green, yellow, gray);
    letterFrequency(words);
  }

  // update the UI
  writeResults();
};

massageInputText = (t) => {
  t = t.toLowerCase();
  return t;
};

// Functions to filter to matching words

filterGreen = (wordlist, position, letter) => {
  if (position && letter) {
    wordlist = wordlist.filter((word) => word[position] == letter);
  }
  return wordlist;
};

filterYellow = (wordlist, position, letters) => {
  var letters = letters.split("");
  letters.forEach((letter) => {
    // word both has the letter somewhere, but does NOT have the letter in the 'yellow' position
    wordlist = wordlist.filter(
      (word) => word.includes(letter) && word[position] !== letter
    );
  });
  return wordlist;
};

filterGray = (wordlist, letters) => {
  var letters = letters.split("");
  letters.forEach((letter) => {
    wordlist = wordlist.filter((word) => !word.includes(letter));
  });
  return wordlist;
};

// Logic for scoring potential matches

scoreAlternateWords = (matchedWords, green, yellow, gray) => {
  var knownLetters = [];
  var scoredWords = document.allScoredWords;
  // merge all known letters into one array
  knownLetters.push(green);
  knownLetters.push(yellow.map((y) => y.split("")));
  knownLetters.push(gray.split(""));
  knownLetters = knownLetters.flat(4);
  knownLetters = unique(knownLetters.filter((letter) => letter.length > 0));
  // knownLetters.forEach((letter) => {
  //   scoredWords = scoredWords.filter((e) => !e.word.includes(letter));
  // });
  // what letters are even possible in the remaining word match list?
  // possibleLetters = unique(matchedWords.join("").split(""));
  // scoredWords = scoredWords.filter((e) => possibleLetters.includes(e.word[0],e.word[1],e.word[2],e.word[3],e.word[4]));
  var lf = letterFrequency(matchedWords);
  scoredWords.forEach((sw) => {
    var score = 0;
    var knownCount = 0;
    var letters = unique(sw.word.split(""));
    letters.forEach((letter) => {
      score += lf[letter];
      if (knownLetters.includes(letter)) {
        knownCount += 1;
      }
    });
    sw.letterFreqScore = score;
    sw.knownLetterCount = knownCount;
  });
  return scoredWords
    .sort((a, b) => b.letterFreqScore - a.letterFreqScore)
    .sort((a, b) => a.knownLetterCount - b.knownLetterCount);
};

letterFrequency = (words) => {
  lf = {};
  az = "abcdefghijklmnopqrstuvwxyz".split("");
  az.forEach((letter) => {
    lf[letter] = words.filter((word) => word.includes(letter)).length;
  });
  return lf;
};

scoreAllWords = (wordlist) => {
  let t0 = performance.now();
  let result = wordlist
    .map((word) => {
      return { word: word, distance: scoreWordToMatchList(wordlist, word) };
    })
    .sort((a, b) => b.distance - a.distance);
  console.log("Exec Time: ", performance.now() - t0);
  return result;
};

scoreWordToMatchList = (wordlist, word) => {
  return wordlist
    .map((w) => wordDistance(word, w))
    .reduce((total, el) => total + el);
};

wordDistance = (word1, word2) => {
  let score = 0;
  let a1 = word1.split("");
  let a2 = word2.split("");
  let u1 = unique(a1);
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
};

unique = (array) => {
  return array.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
};

// write the results to the doc
writeResults = () => {
  const resultsEl = document.getElementById("matches");
  const numResultsEl = document.getElementById("numMatches");
  const altResultsEl = document.getElementById("altMatches");
  const altNumResultsEl = document.getElementById("numAltMatches");
  let formattedResults = document.matchWordsData
    .map((wd) => `<span>${wd.word} | ${wd.distance}</span>`)
    .join("<br>");
  let formattedAlt = document.altWordsData
    .map(
      (wd) => `<span>${wd.word} | ${wd.distance} | ${wd.letterFreqScore} | ${wd.knownLetterCount}</span>`
    )
    .join("<br>");
  numResultsEl.innerHTML = "(" + document.matchWords.length + ")";
  altNumResultsEl.innerHTML = "(" + document.altWordsData.length + ")";
  resultsEl.innerHTML = formattedResults;
  altResultsEl.innerHTML = formattedAlt;
};

// start us off by listening for for submit,then building up the whole word list
document
  .getElementById("wordForm")
  .addEventListener("submit", submitForm, false);
getAllWords();
