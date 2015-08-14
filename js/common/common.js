(function () {
  var $header = $('.header'),
      $firstSection = $('.header ~ section.section').first();

  if (!$firstSection.hasClass('slider')) {
    $firstSection.css('padding-top', parseInt($firstSection.css('padding-top')) + $header.height());
  }
}());
