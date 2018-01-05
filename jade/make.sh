OUT=../html

find $OUT -name '*.html' -exec rm {} +

jade . -O lang/zh_tw.json
mkdir $OUT/zh_tw
cp -R ./* $OUT/zh_tw

jade . -O lang/en.json
mkdir $OUT/en
cp -R ./* $OUT/en

# Leave an index
cp ./index.html.default $OUT/index.html
# find . -name '*.html' -exec rm {} +

cd $OUT
find . -name '*.jade' -exec rm {} +
find . -name '*.sh' -exec rm {} +
rm -rf comp
