# Wordler

## Word Lists

### Current Method

I grabbed the 5 letter scrabble words from [Jordan's repo](https://github.com/jakerella/guessle/blob/main/lists/scrabble_5.json) (slightly massaged to plain text).

### Other Sources

Popular words are here: https://github.com/dolph/dictionary and saved in this repo as `popular.txt`. This repo has other helpful jumping off points to word frequency count from different sources.

### Old Method

I grabbed the overall word list from the system, then filtered that down to a list of 5-letter words. See `generate_5_letter_words.sh` for the details.

## HTML/CSS Framework

[Terminal CSS](https://terminalcss.xyz/) is the base for the HTML/CSS.

## JS Frameworks

None! I wanted to try it using plain old JS. So far, so good.

## Feature Roadmap

* ~~Capture 'include' as aligned to the 5 slots vs. as a general bucket.~~
* ~~Basic Word Scoring - score all possible match words as to how similar they are to other remaining match words.~~
* ~~Advanced word scoring, including scoring words that are *not* similar in order to cover more 'new' letters and learn to more quickly narrow the universe.~~
* Switch processing to async/promises
* ~~Update letter frequency to also count general frequency plus specific position frequencies.~~
* ~~Improve recommendations to bump/highlight guess words that are also possible matches~~
* ~~Play as Bot - play the game as an algorithm in repeated simulations.~~
* Strip out non-letter characters from form inputs.
* ~~Better keyboard navigation - auto advance across greens, allow arrow key nav~~
