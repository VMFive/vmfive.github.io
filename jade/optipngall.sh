find ../html/img -iname '*.png' -print0 | xargs -0 -n 1 -P 4 optipng -o7
