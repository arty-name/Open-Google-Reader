#!/bin/bash

echo 'function getStyles(){ return (' > 27styles
sed 's/^/"/;s/$/" +/;' src/styles.css >> 27styles
sed 's/^/"/;s/$/" +/;' src/styles.custom.css >> 27styles
echo '"");}' >> 27styles

echo "(function(){" >> 20prefix;
echo '})();' >> 70postfix;

cat \
  src/10meta.js \
	20prefix \
	src/25settings.js \
	27styles \
	src/30ui.js \
	src/40lib.js \
	src/45proxy.js \
	src/50onload.js \
	src/60killDefault.js \
	70postfix \
	> build/open-google-reader.js

cp build/open-google-reader.js build/open-google-reader.user.js

rm 20prefix 27styles 70postfix
