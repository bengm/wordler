const Data = {
  guesses: [],
  allWords: [],
  allWordsData: [],
  popularWords: [],
  matchedWords: [],
  matchedWordsData: [],
  resultValues: ["gray", "yellow", "green"],
  defaultGuesses: () => {
    [0, 1, 2, 3, 4, 5].forEach((g) => {
      Data.guesses[g] = [];
      [0, 1, 2, 3, 4].forEach((l) => {
        Data.guesses[g][l] = {
          guessNum: g,
          letterPosition: l,
          letter: "",
          result: "gray",
        };
      });
    });
  },
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
  },
  clone: (original) => {
    return JSON.parse(JSON.stringify(original));
  },
};

// Functions to filter to matching words
const Filter = {
  all: (wordList, guesses) => {
    guesses.forEach((g) => {
      g.forEach((l) => {
        if (l.letter.length > 0) {
          wordList = Filter[l.result](wordList, l.letterPosition, l.letter);
        }
      });
    });
    return wordList;
  },
  green: (wordlist, position, letter) => {
    if (letter) {
      wordlist = wordlist.filter((word) => word[position] == letter);
    }
    return wordlist;
  },
  yellow: (wordlist, position, letter) => {
    if (letter) {
      wordlist = wordlist.filter(
        (word) => word.includes(letter) && word[position] !== letter
      );
    }
    return wordlist;
  },
  gray: (wordlist, position, letter) => {
    if (letter) {
      wordlist = wordlist.filter((word) => !word.includes(letter));
    }
    return wordlist;
  },
};

const Form = {
  writeInputs: () => {
    document.getElementById("guessFields").innerHTML = Form.wordInputs();
    Form.setResultListeners();
    console.log("START");
  },
  wordInputs: () => {
    return Data.guesses
      .map((g, gi) => {
        let fields = g.map((l, li) => Form.letterInput(gi, li, l)).join(" ");
        return `<div class="tight-grid"> ${fields} </div>`;
      })
      .join(" ");
  },
  letterInput: (guessNum, letterPosition, state) => {
    let lTabIndex = 1 + guessNum * 2;
    let bTabIndex = lTabIndex + 1;
    return `
      <div class="letter">
        <div class="form-group">
          <label for="letter_${guessNum}_${letterPosition}"></label>
          <input  id="letter_${guessNum}_${letterPosition}" value="${state.letter}" type="text" tabindex="${lTabIndex}" maxlength="1" class="letter" />
          <button id="result_${guessNum}_${letterPosition}" value="${state.result}" type="text" tabindex="${bTabIndex}" class="btn result gray">gray</button>
        </div>
      </div>
    `;
  },
  updateLetter: (e) => {
    console.log(e);
    let g = Number(e.target.id[7]);
    let l = Number(e.target.id[9]);
    if (e.key == "ArrowLeft") {
      if (l !== 0) {
        document.getElementById(`letter_${g}_${l - 1}`).focus();
        document.getElementById(`letter_${g}_${l - 1}`).select();
      }
      return;
    }
    if (e.key == "Backspace") {
      if (l !== 0) {
        document.getElementById(`letter_${g}_${l - 1}`).value = "";
        document.getElementById(`letter_${g}_${l - 1}`).focus();
        document.getElementById(`letter_${g}_${l - 1}`).select();
      }
      return;
    }
    if (e.target.value.length == 0) {
      return;
    }

    e.target.value = e.target.value.toUpperCase();
    Data.guesses[g][l].letter = e.target.value.toLowerCase();
    // tab to the next letter or the first result when the last letter
    if (l == 4) {
      document.getElementById(`result_${g}_0`).focus();
    } else {
      document.getElementById(`letter_${g}_${l + 1}`).focus();
      document.getElementById(`letter_${g}_${l + 1}`).select();
    }
  },
  toggleResult: (e) => {
    e.preventDefault();
    e.stopPropagation();
    let g = Number(e.target.id[7]);
    let l = Number(e.target.id[9]);
    switch (e.target.innerHTML) {
      case "gray":
        e.target.setAttribute("class", "btn result yellow");
        e.target.innerHTML = "yellow";
        Data.guesses[g][l].result = "yellow";
        break;
      case "yellow":
        e.target.setAttribute("class", "btn result green");
        e.target.innerHTML = "green";
        Data.guesses[g][l].result = "green";
        break;
      case "green":
        e.target.setAttribute("class", "btn result gray");
        e.target.innerHTML = "gray";
        Data.guesses[g][l].result = "gray";
        break;
    }
  },
  processSubmit: (e) => {
    e.preventDefault();
    e.stopPropagation();
    Data.allWordsData = Data.allWords.map((word) => {
      return { word };
    });
    Data.matchedWords = Filter.all(Data.popularWords, Data.guesses);
    Data.letterFrequency = Score.letterFrequency(Data.matchedWords);
    UI.writeLF(Data.letterFrequency);
    Score.byLetterFrequency(
      Data.matchedWords,
      Data.allWordsData,
      Data.letterFrequency,
      Data.guesses
    );
    Data.matchedWordsData = Data.clone(
      Data.allWordsData.filter((w) => w.possibleMatch)
    );
    UI.writeMatches(Data.matchedWordsData);
    UI.writeGuesses(Data.allWordsData);
  },
  setResultListeners: () => {
    document
      .getElementById(`submit`)
      .addEventListener("click", Form.processSubmit, false);
    Data.guesses.forEach((g) => {
      g.forEach((l) => {
        document
          .getElementById(`result_${l.guessNum}_${l.letterPosition}`)
          .addEventListener("click", Form.toggleResult, false);
        document
          .getElementById(`letter_${l.guessNum}_${l.letterPosition}`)
          .addEventListener("keyup", Form.updateLetter, false);
      });
    });
  },
};

const UI = {
  writeNum: (number) => {
    return isNaN(number) ? "" : Math.round(number);
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
          <th>${k.toUpperCase()}</th>
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
      .map(
        (wd) =>
          `<span>${wd.word} | ${UI.writeNum(wd.lfGuessScore)} | ${UI.writeNum(
            wd.filterPowerScore
          )}</span>`
      )
      .join("<br>");
    guessResultsEl.innerHTML = formattedGuesses;
  },
};

const Score = {
  byLetterFrequency: (matchedWords, allWords, letterFreq, guesses) => {
    let knownLetters = guesses.flat().map((l) => l.letter);
    allWords.forEach((w) => {
      w.possibleMatch = matchedWords.includes(w.word);
      w.letters = w.word.split("").map((l, i) => {
        return {
          letter: l,
          freqInPos: letterFreq[l][i],
          freqAtAny: letterFreq[l].atAny,
        };
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
          const matchingLetters = w.letters.filter(
            (wl) => wl.letter == l.letter
          );
          const maxScore = matchingLetters.sort(
            (a, b) => b.freqInPos - a.freqInPos
          )[0];
          if (matchingLetters.length == 1 || l.freqInPos == maxScore) {
            w.lfGuessScore += l.freqAtAny + l.freqInPos * 10;
          }
        });
      if (w.possibleMatch) {
        w.lfGuessScore = w.lfGuessScore * 1.1;
      }
    });
    allWords.sort((a, b) => b.lfGuessScore - a.lfGuessScore);
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
};

// START UP
Data.defaultGuesses();
Data.getData();
Form.writeInputs();
