ln -s . zh_tw
ln -s . en
ln -s ../html/css
ln -s ../html/img

LANG=$1
if [[ -z "$LANG" ]]; then
LANG=en
fi

jade -w . -O lang/$LANG.json
