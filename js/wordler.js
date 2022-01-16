const Data = {
  allWords: [],
  allWordsData: [],
  popularWords: [],
  matchWords: [],
  matchWordsData: [],
  guessWordsData: [],
  getData: () => {
    // whole word list
    var wordFile = new XMLHttpRequest();
    wordFile.open("GET", "words/scrabble5.txt", true);
    wordFile.send();
    wordFile.onreadystatechange = function () {
      if (wordFile.readyState == 4 && wordFile.status == 200) {
        // split results by newline; convert to lower case
        Data.allWords = wordFile.responseText
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
        Data.popularWords = popWordFile.responseText
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
        Data.allWordsData = JSON.parse(scoreFile.responseText);
        // trigger the input change to refresh ui
        inputChange();
      }
    };
  },
  clone: (original) => {
    return JSON.parse(JSON.stringify(original));
  }
};

// Update the analysis & guess stats
inputChange = () => {
  let formData = UI.getFormData();
  // Apply the filters
  Data.matchWords = Filter.all(
    Data.popularWords,
    formData.green,
    formData.yellow,
    formData.gray
  );
  // Do Analysis
  let t0 = performance.now();
  Data.letterFrequency = Score.letterFrequency(Data.matchWords);
  UI.writeLF(Data.letterFrequency);
  Score.byLetterFrequency(
    Data.matchWords,
    Data.allWordsData,
    formData.green,
    formData.yellow,
    formData.gray
  );
  Data.matchWordsData = Data.clone(Data.allWordsData.filter((w) => w.possibleMatch));
  UI.writeMatches(Data.matchWordsData);
  Score.byFilterPotential(Data.matchWords, Data.allWordsData);
  UI.writeGuesses(Data.allWordsData);
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
    // For each possible target/guess word combo, how many possible matches would remain?
    // A resulting low matchCount means that it would narrow the list down to few words
    // Currently limiting it to top 15k comparisons
    // 3000 -> 10 = 15000
    // 15000 / 3000 = 5
    // 15000 / 200 = 
    let iterations = Math.min(13000 / matchedWords.length, allWords.length)
    console.log(iterations)
    for (let g=0; g < iterations; g+= 1) {
      // update UI progress along the way
      if (g % 100 == 0) {
        UI.writeProgress(Math.round((100 * g) / allWords.length));
      }
      // score this possible guess/target combo, normalized as portion of matched words
      let guessWord = allWords[g].word;
      let matchCount = 0;
      for (let m=0; m < matchedWords.length; m++) {
        let targetWord = matchedWords[m];
        matchCount += Score.countRemainingMatches(
          guessWord,
          targetWord,
          matchedWords
        );
      }
      allWords[g].filterPowerScore = matchCount / matchedWords.length;
    }
    allWords.sort(
      (a, b) => a.filterPowerScore - b.filterPowerScore
    );
  },
  countRemainingMatches: (guessWord, targetWord, possibleMatches) => {
    let matches = Data.clone(possibleMatches);
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
  byLetterFrequency: (matchedWords, allWords, green, yellow, gray) => {
    let knownLetters = [green.join(""), yellow.join(""), gray]
      .join("")
      .split("");
    let lf = Score.letterFrequency(matchedWords);
    allWords.forEach((w) => {
      w.possibleMatch = matchedWords.includes(w.word);
      w.letters = w.word.split("").map( (l,i) => {
        return {letter: l, freqInPos: lf[l][i], freqAtAny: lf[l].atAny} ;
      });
      // Match Score
      // score possible match quality by weighting exact letters lots and any-position letters a bit
      w.lfMatchScore = w.letters
        .map((l, i) => {
          return l.freqAtAny + l.freqInPos * 10;
        })
        .reduce((total, num) => {
          return (total += num);
        });
      // Guess Score
      w.lfGuessScore = 0;
      w.letters
        .filter((l) => !knownLetters.includes(l.letter))
        .forEach((l, i) => {
          // If there is a duplicate letter, only count the instance that scores highest
          const matchingLetters = w.letters.filter(wl=> wl.letter == l.letter);
          const maxScore = matchingLetters.sort((a,b) => b.freqInPos - a.freqInPos)[0];
          if (matchingLetters.length == 1 || l.freqInPos == maxScore) {
            w.lfGuessScore+= l.freqAtAny + l.freqInPos * 10;
          } 
        });
      if (w.possibleMatch) {
        w.lfGuessScore = w.lfGuessScore * 1.1;
      }
    });
    allWords.sort((a,b) => b.lfGuessScore - a.lfGuessScore);
  },
  letterFrequency: (words) => {
    lf = {};
    az = "abcdefghijklmnopqrstuvwxyz".split("");
    az.forEach((letter) => {
      lf[letter] = {};
      lf[letter]["atAny"] =
        (words.filter((word) => word.includes(letter)).length * 100) /
        words.length;
      for (let i = 0; i < 5; i++) {
        lf[letter][i] =
          (words.filter((word) => word[i] == letter).length * 100) /
          words.length;
      }
    });
    return lf;
  },
  byDistance: (wordlist) => {
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
  getFormData: () => {
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
    return { green, yellow, gray };
  },
  writeNum: (number) => {
    return (isNaN(number)) ? "" : Math.round(number);
  },
  writeMatches: (matchWordsData) => {
    const matchesEl = document.getElementById("matches");
    const numResultsEl = document.getElementById("numMatches");
    let formatted = matchWordsData
      .sort((a, b) => b.lfMatchScore - a.lfMatchScore)
      .slice(0, 100)
      .map((wd) => `<span>${wd.word}</span> | ${UI.writeNum(wd.lfMatchScore)}`)
      .join("<br>");
    numResultsEl.innerHTML = "(" + matchWordsData.length + ")";
    matchesEl.innerHTML = formatted;
  },
  writeLF: (lf) => {
    const lfEl = document.getElementById("letterFrequency");
    let lfKeys = Object.keys(lf).sort((ka, kb) => lf[kb].atAny - lf[ka].atAny);
    let formatted = lfKeys
      .map(
        (k) => `
        <tr>
          <th>${k}</th>
          <td><strong>${UI.writeNum(lf[k].atAny)}%</strong></td>
          <td>${UI.writeNum(lf[k][0])}</td>
          <td>${UI.writeNum(lf[k][1])}</td>
          <td>${UI.writeNum(lf[k][2])}</td>
          <td>${UI.writeNum(lf[k][3])}</td>
          <td>${UI.writeNum(lf[k][4])}</td>
        </tr>`
      )
      .join(`\n`);
    lfEl.innerHTML = formatted;
  },
  writeGuesses: (guessWordsData) => {
    const guessResultsEl = document.getElementById("guesses");
    let formattedGuesses = guessWordsData
      .sort((a, b) => b.lfGuessScore - a.lfGuessScore)
      .slice(0, 100)
      .map((wd) => `<span>${wd.word} | ${UI.writeNum(wd.lfGuessScore)} | ${UI.writeNum(wd.filterPowerScore)}</span>`)
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
Data.getData();
