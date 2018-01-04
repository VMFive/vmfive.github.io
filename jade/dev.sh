ln -s . zh_tw
ln -s . en

LANG=$1
if [[ -z "$LANG" ]]; then
LANG=en
fi

jade -w . -O lang/$LANG.json
