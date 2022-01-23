

export const Game = {
  targetWord: '',
  scoreGuess: (guessWord) => {
    let scored = [];
    guessWord.split("").forEach((letter, i) => {
      let lscore = { position: i, letter: letter, status: "gray" };
      lscore.letter = letter;
      if (letter == Game.targetWord[i]) {
        lscore.status = "green";
      } else if (Game.targetWord.includes(letter)) {
        lscore.status = "yellow";
      }
      scored.push(lscore);
    });
    return scored;
  },
};

