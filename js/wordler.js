// Set up base word lists
document.allWords = [];
document.matchWords = [];
document.matchWordsData = [];

// function to get the entire word list to start things off
getAllWords = () => {
  var wordFile = new XMLHttpRequest();
    wordFile.open("GET","words/scrabble5.txt",true);
    wordFile.send();
    wordFile.onreadystatechange = function() {
        if (wordFile.readyState== 4 && wordFile.status == 200) {
          // split results by newline; convert to lower case
          document.allWords = wordFile.responseText.split("\n").map(w => w.toLowerCase());
          // trigger the input change to refresh ui
          inputChange();
        }
     }
}

// handle form changes and filter the list accordingly
submitForm = (event) => {
  event.preventDefault();
  event.stopPropagation();
  inputChange();
}

inputChange = () => {
  let words = document.allWords;
  
  let p1 = massageInputText(document.getElementById('p1').value);
  let p2 = massageInputText(document.getElementById('p2').value);
  let p3 = massageInputText(document.getElementById('p3').value);
  let p4 = massageInputText(document.getElementById('p4').value);
  let p5 = massageInputText(document.getElementById('p5').value);
  let unknown_position = massageInputText(document.getElementById('unknown_position').value);
  let excluded = massageInputText(document.getElementById('excluded').value);

  words = filterByPosition(words, 1, p1);
  words = filterByPosition(words, 2, p2);
  words = filterByPosition(words, 3, p3);
  words = filterByPosition(words, 4, p4);
  words = filterByPosition(words, 5, p5);
  words = filterByIncludedLetters(words, unknown_position);
  words = filterByExcludedLetters(words, excluded);

  document.matchWords = words;

  // only score if filtered TODO currently hacked at 1000 for dev/testing
  console.log(document.matchWords.length);
  if (document.matchWords.length < 1000) {
    document.matchWordsData = scoreAllWords(words);
  }
  writeResults();
  
}

massageInputText = (t) => {
  t = t.toLowerCase();
  return t;
}

// Functions to filter to matching words

filterByPosition = (wordlist, position, letter) => {
  if (position && letter) {
    wordlist = wordlist.filter(word => word[position-1] == letter );
  }
  return wordlist;
}

filterByIncludedLetters = (wordlist, letters) => {
  var letters = letters.split("");
  letters.forEach(letter => {
    wordlist = wordlist.filter(word => word.includes(letter));
  });
  return wordlist;
}

filterByExcludedLetters = (wordlist, letters) => {
  var letters = letters.split("");
  letters.forEach(letter => {
    wordlist = wordlist.filter(word => !word.includes(letter));
  });
  return wordlist;
}

// Logic for scoring potential matches

scoreAllWords = (wordlist) => {
  let t0 = performance.now();
  let result = wordlist.map(word => {
    return {word: word, distance: scoreWordToMatchList(wordlist, word)};
  }).sort((a,b) => b.distance - a.distance);
  console.log("Exec Time: ", performance.now()-t0);
  return result;
}

scoreWordToMatchList = (wordlist, word) => {
  return wordlist.map( w => wordDistance(word,w) ).reduce((total,el) => total + el);
}

wordDistance = (word1, word2) => {
  let score = 0;
  let a1 = word1.split("");
  let a2 = word2.split("");
  let u1 = unique(a1);
  // position-match
  a1.forEach( (letter, i) => {
    if ( a2[i] == letter ) {
      // bump score if match
      score+= 3;
      // remove from the u1 list to not double count
      u1 = u1.filter(e => e !== letter)
    }
  });
  // general match
  u1.forEach( letter => {
    if ( word2.includes(letter) ) {
      score +=1;
    }
  });
  return score;
}

unique = (array) => {
  return array.filter( (value, index, self) => {
    return self.indexOf(value) === index;
  } );
}

// write the results to the doc
writeResults = () => {
  const resultsEl = document.getElementById('matches');
  const numResultsEl = document.getElementById('num_matches');
  let formattedResults = document.matchWordsData.map(wd => `<span>${wd.word} [${wd.distance}]</span>`).join("<br>");
  numResultsEl.innerHTML = "(" + document.matchWords.length + ")";
  resultsEl.innerHTML = formattedResults;
}

// start us off by listening for for submit,then building up the whole word list
document.getElementById('wordForm').addEventListener("submit",submitForm,false);
getAllWords();
