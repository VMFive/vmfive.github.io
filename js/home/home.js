(function () {
  var $vimeoIntro = $('#vimeoIntro'),
      iframe,
      player;

  if ($vimeoIntro !== []){
    iframe = $('#vimeoIntro')[0];
    player = $f(iframe);

    player.addEvent('ready', function() {
      player.api('setVolume', 100);
    });
  }
}());
