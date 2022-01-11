# generate_5_letter_words.sh

# Grab all words from system
# cat /usr/share/dict/words > all_words.txt
# infile = all_words.txt 
infile=popular.txt

# initiate output file
outfile=popular5.txt
# echo > 5_letter_words.txt 
echo > $outfile

# read through all words, only write 5-letter words to output file
while IFS= read -r line; do
  length=${#line}
  if [ "$length" == "5" ]; then
     echo "$line" >> $outfile
  fi
done < $infile

