#!/bin/bash

cp src/styles.css 27styles.tmp
sed -i 's/^/"/' 27styles.tmp
sed -i 's/$/" +/' 27styles.tmp

cp src/styles.custom.css 28styles.tmp
sed -i 's/^/"/' 28styles.tmp
sed -i 's/$/" +/' 28styles.tmp

echo 'settings.css =' > 27styles
cat 27styles.tmp >> 27styles
cat 28styles.tmp >> 27styles
echo '"";' >> 27styles

cat src/10meta.js > build/open-google-reader.js
cat src/20prefix >> build/open-google-reader.js
cat src/25settings.js >> build/open-google-reader.js
cat 27styles >> build/open-google-reader.js
cat src/30ui.js >> build/open-google-reader.js
cat src/40lib.js >> build/open-google-reader.js
cat src/50onload.js >> build/open-google-reader.js
cat src/60killDefault.js >> build/open-google-reader.js
cat src/70postfix >> build/open-google-reader.js

cp build/open-google-reader.js build/open-google-reader.user.js

rm 27styles
rm 27styles.tmp
rm 28styles.tmp
