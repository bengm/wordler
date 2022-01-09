// Set up base word list
// const allWords = ['first', 'lasts', 'blast', 'great', 'bleat'];
document.allWords = [];
document.matchWords = [];

writeResults = () => {
  const resultsEl = document.getElementById('matches');
  let formattedResults = document.matchWords.join(", ");
  resultsEl.innerHTML = formattedResults;
}

getAllWords = () => {
  var wordFile = new XMLHttpRequest();
    wordFile.open("GET","5_letter_words.txt",true);
    wordFile.send();
    wordFile.onreadystatechange = function() {
        if (wordFile.readyState== 4 && wordFile.status == 200) {
          document.allWords = wordFile.responseText.split("\n");
        }
     }
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

  writeResults();
}

massageInputText = (t) => {
  t = t.toLowerCase();
  return t;
}

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

getAllWords();


