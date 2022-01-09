# generate_5_letter_words.sh

# Grab all words from system
cat /usr/share/dict/words > all_words.txt

# initiate output file
echo > 5_letter_words.txt 

# read through all words, only write 5-letter words to output file
while IFS= read -r line; do
  length=${#line}
  if [ "$length" == "5" ]; then
     echo "$line" >> 5_letter_words.txt
  fi
done < all_words.txt