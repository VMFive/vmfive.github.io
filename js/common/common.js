(function () {
  var $header = $('.header'),
      $firstSection = $('.header ~ section.section').first(),
      $newsDescription = $('.news .news-desc');

  if ($newsDescription.length) {
    $newsDescription.each(function () {
      console.log($(this));
      $(this).dotdotdot();
    });
  }

  if (!$firstSection.hasClass('slider')) {
    $firstSection.css('padding-top', parseInt($firstSection.css('padding-top')) + $header.height());
  }
}());
