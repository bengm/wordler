# Wordler

## Word Lists

### Current Method

I grabbed the 5 letter scrabble words from [Jordan's repo](https://github.com/jakerella/guessle/blob/main/lists/scrabble_5.json) (slightly massaged to plain text).

### Old Method

I grabbed the overall word list from the system, then filtered that down to a list of 5-letter words. See `generate_5_letter_words.sh` for the details.

## HTML/CSS Framework

[Terminal CSS](https://terminalcss.xyz/) is the base for the HTML/CSS.

## JS Frameworks

None! I wanted to try it using plain old JS. So far, so good.

## Feature Roadmap

* ~~Capture 'include' as aligned to the 5 slots vs. as a general bucket.~~
* ~~Basic Word Scoring - score all possible match words as to how similar they are to other remaining match words.~~ 
* Advanced word scoring, including scoring words that are *not* similar in order to cover more 'new' letters and learn to more quickly narrow the universe.
* Play as Bot - actually play the game driven from the app.
