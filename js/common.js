$(document).ready(function () {
  var $allVideos = $("iframe[src^='https://player.vimeo.com'], iframe[src^='https://www.youtube.com']"),

      // The element that is fluid width
      $fluidEl = $("body");

  console.log($allVideos);

  // Figure out and save aspect ratio for each video
  $allVideos.each(function() {
      $(this)
          .data('aspectRatio', this.height / this.width)
          .width($(window).width())
          .height($(window).height() - $('.header').height());
  });

  // When the window is resized
  $(window).resize(function() {

      var newWidth = $fluidEl.width();

      // Resize all videos according to their own aspect ratio
      $allVideos.each(function() {

          var $el = $(this);
          $el
              .width(newWidth)
              .height(newWidth * $el.data('aspectRatio'));

      });

  // Kick off one resize to fix all videos on page load
  });
})
