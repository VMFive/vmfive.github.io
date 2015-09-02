/*

◄------------------------------------------------------------►
This file includes all cusomized javascript and all plugins libraries options
◄------------------------------------------------------------►

*/

(function ()
{
  //-- Enable Use Strict Mode --
  "use strict";

  //--Preloaing Effect --
  jQuery(window).load(function(){
    jQuery('.loadingContainer').css({'opacity' : 0 , 'display' : 'none'});
    jQuery('.allWrapper').css({'opacity' : 1 , 'visibility' : 'visible'});
    jQuery('.switcher').css({'opacity' : 1 , 'visibility' : 'visible'});
    jQuery('.back-to-top').css({'opacity' : 1 , 'visibility' : 'visible'});
    jQuery('body').css({'overflow' : 'visible'});
  });

  //--------------------------------------------------------------------------------------------


  //-- Customizing some elements css according to windows size --
  var jQuerywindow = jQuery(window),
      kvHeight = $(window).height(),
      navbarHeight = $('.header').height(),
      deviceWidth = window.screen.availWidth;

  if (deviceWidth < 768) {
    jQuery('#slider , .slider .item > img , #banner , #banner .item').css({ 'height' : kvHeight });
    jQuery('#awards').css({ 'height': kvHeight - navbarHeight });
  } else {
    jQuerywindow.resize(function(){
      //-- fixed heights for some slider elements --
      kvHeight = $(window).height();
      navbarHeight = $('.header').height();
      jQuery('#slider , .slider .item > img , #banner , #banner .item').css({ 'height' : kvHeight });
      jQuery('#awards').css({ 'height': kvHeight - navbarHeight });
    });

    jQuerywindow.trigger('resize');
  }
  //--------------------------------------------------------------------------------------------

  //-- customizing position of loading container --
  var jQueryloadingContainer = jQuery('.loadingContainer');

  jQueryloadingContainer.resize(function(){
    jQuery('.loadingContainer').css({
      'margin-left' : - jQueryloadingContainer.width() / 2 ,
      'margin-top' : - jQueryloadingContainer.height()  / 2
    });
  });

  jQueryloadingContainer.trigger('resize');
  //--------------------------------------------------------------------------------------------

  //-- Making the header fixed --
  // var jQueryheader = jQuery('header#header');
  // var jQueryheaderTop = jQueryheader.offset().top;
  var $slider = $('section#slider'),
      $homeHeader = $('.header'),
      $homeHeaderResponsiveNav = $('.header .responsiveMainNav'),
      threshold = 120,
      scrollTop,
      sliderBottom;

  if($slider.length){
    $(window).scroll(function () {
      // sliderBottom = $('section#slider').offset().top + $slider.height() - 100;
      scrollTop = $(window).scrollTop();
      if (scrollTop > threshold && $homeHeader.hasClass('transparent')){
        $homeHeader.removeClass('transparent');
        $homeHeaderResponsiveNav.removeClass('transparent');
      } else if (scrollTop < threshold && !$homeHeader.hasClass('transparent')) {
        $homeHeader.addClass('transparent');
        $homeHeaderResponsiveNav.addClass('transparent');
      }
      // if(scrollTop > sliderBottom && $homeHeader.hasClass('transparent')) {
      //   $homeHeader.removeClass('transparent');
      //   $homeHeaderResponsiveNav.removeClass('transparent');
      //   console.log($('.header .responsiveMainNav'));
      // } else if(scrollTop < sliderBottom && !$homeHeader.hasClass('transparent')) {
      //   $homeHeader.addClass('transparent');
      //   $homeHeaderResponsiveNav.addClass('transparent');
      // }
    });
  }

  var $sliderTriangle = $('section#slider .triangle-down');

  $sliderTriangle.on('click', function (e) {
      e.preventDefault();

      var $features = $('section#features'),
          $navbar = $('.header');

      $('html, body').stop().animate({
        'scrollTop': $features.offset().top - $navbar.height()
      }, 800, 'swing', function () {
        window.location.hash = '#features';
      });
  })

  // jQuery('.offset').height( jQueryheader.outerHeight() )

  //-- Window Scroll Functions --

  // jQuery(window).scroll(function(){
  //   (jQuery(window).scrollTop() > jQueryheaderTop) ? jQuery('.header').addClass('fixedHeader') && jQuery('.headerFill').addClass('show').removeClass('hide') : jQuery('.header').removeClass('fixedHeader') && jQuery('.headerFill').addClass('hide').removeClass('show');
  // });
  //--------------------------------------------------------------------------------------------



  //-- customizing the height of horizontal tabs --
  var jQuerysingleTab = jQuery('.tabsVr .singleTab');

  jQuerysingleTab.resize(function(){
    jQuery('.tabsVr .etabs').css({ 'height' : jQuerysingleTab.height() });
  });

  jQuerysingleTab.trigger('resize');
  //--------------------------------------------------------------------------------------------



  //-- Tooltip --
  jQuery(document).ready(function(){
    jQuery('.tooltip-h').tooltip();
  });
  //--------------------------------------------------------------------------------------------


  //-- Alert Custom closing effect --
  jQuery('.alert-general .close').click(function () {
    jQuery('.alert-general').slideToggle(500);
  });

  jQuery('.alert-success .close').click(function () {
    jQuery('.alert-success').slideToggle(500);
  });

  jQuery('.alert-warning .close').click(function () {
    jQuery('.alert-warning').slideToggle(500);
  });


  jQuery('.alert-info .close').click(function () {
    jQuery('.alert-info').slideToggle(500);
  });

  jQuery('.alert-error .close').click(function () {
    jQuery('.alert-error').slideToggle(500);
  });

  jQuery('.alert-attention .close').click(function () {
    jQuery('.alert-attention').slideToggle(500);
  });
  //--------------------------------------------------------------------------------------------


  //-- Closing message --
  jQuery('.messagePanel4 .close').click(function () {
    jQuery('.messagePanel4').fadeOut(500);
  });
  //--------------------------------------------------------------------------------------------


   //-- Scroll Spy --
  jQuery('.scrollTo').on('click', function( e ) {

      var scrollAnchor = jQuery(this).attr('data-scroll'),
          scrollPoint = jQuery('.scrollAnchor[data-anchor="' + scrollAnchor + '"]').offset().top - 28;

      jQuery('body,html').animate({
          scrollTop: scrollPoint
      }, 1500);

      window.location.hash = jQuery(this).attr('href').replace('#','');
      e.preventDefault();
  })
  //--------------------------------------------------------------------------------------------


  //-- Language filter (facny select) --
  jQuery(document).ready(function() {
    jQuery('#language').fancySelect();
  });
  //--------------------------------------------------------------------------------------------


  /* ◄------ All Carousels Init al over the template -------------------------------► */

  //-- homeSlider_1 and postSlider --
  jQuery(document).ready(function() {

    //Init the carousel
    jQuery(".homeSlider_1 , .postSlider").owlCarousel({
      animateOut: 'fadeOut',
      items:1,
      margin:0,
      loop:true,
      autoplay:true,
      autoplayTimeout:8000,
      autoplayHoverPause:false,
      nav: true,
      dots: false,
      stagePadding:0,
      smartSpeed:1000,
      responsive:{
        0:{
          items:1
        },
        768:{
          items:1
        },
        1000:{
          items:1
        }
      }
    });

  });
  //--------------------------------------------------------------------------------------------

  //-- homeSlider_2 --
  jQuery(document).ready(function() {

    var owl = jQuery(".homeSlider_2");

    owl.owlCarousel({
      animateOut: 'fadeOut',
      items:1,
      margin:0,
      loop:true,
      autoplay:true,
      autoplayTimeout:8000,
      autoplayHoverPause:false,
      nav: true,
      dots : true,
      responsive:{
          0:{
              items:1
          },
          768:{
              items:1
          },
          1000:{
              items:1
          }
        }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- homeSlider_4 --
  jQuery(document).ready(function() {

    var owl = jQuery(".homeSlider_4");

    owl.owlCarousel({
      animateOut: 'fadeOut',
      dots : true,
      responsive:{
        0:{
            items:1
        },
        768:{
            items:1
        },
        1000:{
            items:1
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------



  //-- carousel --
  jQuery(document).ready(function() {

    var owl = jQuery(".carousel");

    owl.owlCarousel({
      nav : false,
      dots : true,
      loop:true,
      autoplay: true,
      items:4,
      responsive:{
        0:{
            items:1,
            slideBy: 1
        },
        768:{
            items:3,
            slideBy: 3
        },
        1000:{
            items:4,
            slideBy: 4
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- testmonialsCarousel --
  jQuery(document).ready(function() {

    var owl = jQuery(".testmonialsCarousel");

    owl.owlCarousel({
      nav : false,
      dots : true,
      loop:true,
      autoplay : true,
      items : 3,
      responsive:{
        0:{
            items:1,
            slideBy: 1
        },
        768:{
            items:2,
            slideBy: 2
        },
        1000:{
            items:3,
            slideBy: 3
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- testmonialsCarousel2 --
  jQuery(document).ready(function() {

    var owl = jQuery(".testmonialsCarousel2");

    owl.owlCarousel({
      nav : true,
      dots : false,
      animateOut : 'fadeOut',
      animateIn: 'flipInX',
      loop:true,
      autoplay : true,
      items : 1,
      responsive:{
        0:{
            items:1
        },
        768:{
            items:1
        },
        1000:{
            items:1
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- testmonialsCarousel3 --
  jQuery(document).ready(function() {

    var owl = jQuery(".testmonialsCarousel3");

    owl.owlCarousel({
      nav : true,
      dots : false,
      autoplay : true,
      loop:true,
      items : 2,
      responsive:{
        0:{
            items:1,
            slideBy: 1
        },
        768:{
            items:2,
            slideBy: 2
        },
        1000:{
            items:2,
            slideBy: 2
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- clientsCarousel --
  jQuery(document).ready(function() {

    var owl = jQuery(".clientsCarousel");

    owl.owlCarousel({
      nav : true,
      dots : false,
      loop:true,
      autoplay : true,
      items : 6,
      responsive:{
        0:{
            items:1,
            slideBy: 1
        },
        480:{
            items:2,
            slideBy: 2
        },
        768:{
            items:4,
            slideBy: 4
        },
        1000:{
            items:6,
            slideBy: 6
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- servicesCarousel2 and featuresCarousel2  --
  jQuery(document).ready(function() {

    var owl = jQuery(".servicesCarousel2 , .featuresCarousel2");

    owl.owlCarousel({
      nav : false,
      dots : true,
      loop:true,
      autoplay : true,
      items : 3,
      responsive:{
        0:{
            items:1,
            slideBy: 1
        },
        768:{
            items:2,
            slideBy: 2
        },
        1000:{
            items:3,
            slideBy: 3
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------



  //-- .aboutBoxBody and testmonialsCarousel3 --
  jQuery(document).ready(function() {

    var owl = jQuery(".aboutBoxBody.owl-carousel , .testmonials4 .testmonialsCarousel3");

    owl.owlCarousel({
      nav : true,
      dots : false,
      loop:true,
      autoplay : false,
      items : 1,
      responsive:{
        0:{
            items:1
        },
        768:{
            items:1
        },
        1000:{
            items:1
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- testmonialsCarousel4 --
  jQuery(document).ready(function() {

    var owl = jQuery(".testmonials4 .testmonialsCarousel4");

    owl.owlCarousel({
      nav : false,
      dots : true,
      loop:true,
      autoplay : true,
      items : 1,
      responsive:{
        0:{
            items:1
        },
        768:{
            items:1
        },
        1000:{
            items:1
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- carousel3 --
  jQuery(document).ready(function() {

    var owl = jQuery(".carousel3");

    owl.owlCarousel({
      nav : true,
      dots : false,
      animateOut : 'slideUpSlow',
      animateIn: 'fadeOutUp',
      autoplay:true,
      loop:true,
      items : 1,
      responsive:{
        0:{
            items:1
        },
        768:{
            items:1
        },
        1000:{
            items:1
        }
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  /* ◄------ Accordion & Toggle -------------------------------► */

  //-- Accordion 1 --
  jQuery(document).ready(function(){
    jQuery("#accordianShortCode .accordionRow > a").on("click", function(e){
      if(jQuery(this).parent().has("div")) {
        e.preventDefault();
      }

      if(!jQuery(this).hasClass("activeLine")) {
        // hide any open menus and remove all other classes
        jQuery("#accordianShortCode .accordionRow > a").removeClass("activeLine");
        jQuery("#accordianShortCode .accordionRow > .accordion-content").removeClass("opened");
        jQuery("#accordianShortCode .accordionRow > .accordion-content").slideUp(500);

        // open our new menu and add the activeLine class
        jQuery(this).addClass("activeLine");
        jQuery("#accordianShortCode .accordionRow > .accordion-content").addClass("opened");
        jQuery(this).next(".accordion-content").slideDown(500);
      }

      else if(jQuery(this).hasClass("activeLine")) {
        jQuery(this).removeClass("activeLine");
        jQuery("#accordianShortCode .accordionRow > .accordion-content").removeClass("opened");
        jQuery(this).next(".accordion-content").slideUp(500);
      }
    });
  });
  //--------------------------------------------------------------------------------------------

  //-- Accordion 2 --
  jQuery(document).ready(function(){
    jQuery("#accordianShortCode2 .accordionRow > a").on("click", function(e){
      if(jQuery(this).parent().has("div")) {
        e.preventDefault();
      }

      if(!jQuery(this).hasClass("activeLine")) {
        // hide any open menus and remove all other classes
        jQuery("#accordianShortCode2 .accordionRow > a").removeClass("activeLine");
        jQuery("#accordianShortCode2 .accordionRow > .accordion-content").removeClass("opened");
        jQuery("#accordianShortCode2 .accordionRow > .accordion-content").slideUp(500);

        // open our new menu and add the activeLine class
        jQuery(this).addClass("activeLine");
        jQuery("#accordianShortCode2 .accordionRow > .accordion-content").addClass("opened");
        jQuery(this).next(".accordion-content").slideDown(500);
      }

      else if(jQuery(this).hasClass("activeLine")) {
        jQuery(this).removeClass("activeLine");
        jQuery("#accordianShortCode2 .accordionRow > .accordion-content").removeClass("opened");
        jQuery(this).next(".accordion-content").slideUp(500);
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  /* ◄------ Foucs and Blur for textarea -------------------------------► */

  //-- comment --
  jQuery(document).ready(function() {

    var watermark = 'Comment';

    //init, set watermark text and class
    jQuery('#commentArea').val(watermark).addClass('inputBar');

    //if blur and no value inside, set watermark text and class again.
    jQuery('#commentArea').blur(function(){
        if (jQuery(this).val().length == 0){
          jQuery(this).val(watermark).addClass('inputBar');
      }
    });

    //if focus and text is watermrk, set it to empty and remove the watermark class
    jQuery('#commentArea').focus(function(){
        if (jQuery(this).val() == watermark){
          jQuery(this).val('').removeClass('inputBar');
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- message --
  jQuery(document).ready(function() {

    var watermark = 'Message';

    //init, set watermark text and class
    jQuery('#messageArea').val(watermark).addClass('inputBar');

    //if blur and no value inside, set watermark text and class again.
    jQuery('#messageArea').blur(function(){
        if (jQuery(this).val().length == 0){
          jQuery(this).val(watermark).addClass('inputBar');
      }
    });

    //if focus and text is watermrk, set it to empty and remove the watermark class
    jQuery('#messageArea').focus(function(){
        if (jQuery(this).val() == watermark){
          jQuery(this).val('').removeClass('inputBar');
      }
    });
  });
  //--------------------------------------------------------------------------------------------


  //-- Domain Ex selection --

  jQuery(document).ready(function(e) {
    jQuery("#domainEx").msDropdown({visibleRows:4});
  });
  //--------------------------------------------------------------------------------------------



  //-- tabs --

  jQuery(document).ready( function() {
    jQuery('.tabsContainer').easytabs();
  });
  //--------------------------------------------------------------------------------------------





  //-- Creating back to top btn --
  jQuery(document).ready(function() {
    jQuery('body').append(
      "<a href='#' class='back-to-top'>"+
        "<i class='fa fa-chevron-up'></i>"+
      "</a>"
    );
  });
  //-- scroll to top --
  jQuery(document).ready(function() {
    var offset = 600;
    var duration = 1500;
    jQuery(window).scroll(function() {
        if (jQuery(this).scrollTop() > offset) {
            jQuery('.back-to-top').addClass('fadeInup');
        } else {
            jQuery('.back-to-top').removeClass('fadeInup');
        }
    });

    jQuery('.back-to-top').click(function(e) {
        e.stopPropagation();
        jQuery('body,html').animate({
        scrollTop: 0
    }, duration);
        return false;
    })
  });
  //--------------------------------------------------------------------------------------------




  /* ◄------ Scroll Animation -------------------------------► */

  //-- Progressbar --
  jQuery(document).scroll(function() {
    jQuery('.progress-bar').each(function(){
    var imagePos = jQuery(this).offset().top;

    var topOfWindow = jQuery(document).scrollTop();
      if (imagePos < topOfWindow+jQuery(window).height() * 0.8) {
        jQuery(this).addClass("animated slideRightSlow");
      }
    });
  });
  //--------------------------------------------------------------------------------------------

  /* ◄------ Media Nav -------------------------------► */
  jQuery(document).ready(function () {
    $('.mediaNav').click(function (event) {
      event.preventDefault();
      console.log($(this).find('.mediaSubNav'));
      $(this).find('.mediaSubNav').toggleClass('active');
    })
  });


  /* ◄------ Responsive Nav -------------------------------► */

  jQuery(document).ready(function () {

    //-- Including the main nav contents in responsive main nav DIV --
    $('.responsiveMainNav').css('top', $('.header').height());
    jQuery('.mainNav .navTabs').clone().appendTo('.responsiveMainNav');

    //-- Show and Hide responsive nav --
    jQuery('#responsiveMainNavToggler').click(function(event){
      event.preventDefault();
      jQuery('#responsiveMainNavToggler').toggleClass('opened');
      jQuery('.responsiveMainNav').slideToggle(300);

      if ( jQuery('#responsiveMainNavToggler i').hasClass('fa-bars') )
      {
          jQuery('#responsiveMainNavToggler i').removeClass('fa-bars');
          jQuery('#responsiveMainNavToggler i').addClass('fa-close');
      }else
      {
          jQuery('#responsiveMainNavToggler i').removeClass('fa-close');
          jQuery('#responsiveMainNavToggler i').addClass('fa-bars');
      }

    });

    // dropdown level 1
    if(jQuery(".responsiveMainNav .navTabs > li > a").parent().has("ul")) {
      jQuery(".responsiveMainNav .navTabs > li > a:first-child").addClass("toggleResponsive");
      jQuery(".responsiveMainNav .navTabs > li > a:last-child").removeClass("toggleResponsive");
    }

    jQuery(".responsiveMainNav .navTabs > li > .toggleResponsive").on("click", function(e){
      if(jQuery(this).parent().has("ul")) {
        e.preventDefault();
      }

      if(!jQuery(this).hasClass("activeLine")) {
        // hide any open menus and remove all other classes
        jQuery(".responsiveMainNav .navTabs > li > .toggleResponsive").removeClass("activeLine");
        jQuery(".responsiveMainNav .navTabs > li > .dropDown").slideUp(300);

        // open our new menu and add the activeLine class
        jQuery(this).addClass("activeLine");
        jQuery(this).next(".responsiveMainNav .navTabs > li > .dropDown").slideDown(300);
      }

      else if(jQuery(this).hasClass("activeLine")) {
        jQuery(this).removeClass("activeLine");
        jQuery(this).next(".responsiveMainNav .navTabs > li > .dropDown").slideUp(300);
      }
    });


    // dropdown level 2
    if(jQuery(".responsiveMainNav .navTabs > li > .dropDown > li > a").parent().has("ul")) {
      jQuery(".responsiveMainNav .navTabs > li > .dropDown > li > a:first-child").addClass("toggleResponsive");
      jQuery(".responsiveMainNav .navTabs > li > .dropDown > li > a:last-child").removeClass("toggleResponsive");
    }


    jQuery(".responsiveMainNav .navTabs > li > .dropDown > li > .toggleResponsive").on("click", function(e){
      if(jQuery(this).parent().has("ul")) {
        e.preventDefault();
      }

      if(!jQuery(this).hasClass("activeLine")) {
        // hide any open menus and remove all other classes
        jQuery(".responsiveMainNav .navTabs > li > .dropDown > li > .toggleResponsive").removeClass("activeLine");
        jQuery(".responsiveMainNav .navTabs > li > .dropDown li .dropDown").slideUp(300);

        // open our new menu and add the activeLine class
        jQuery(this).addClass("activeLine");
        jQuery(this).next(".responsiveMainNav .navTabs > li > .dropDown li .dropDown").slideDown(300);
      }

      else if(jQuery(this).hasClass("activeLine")) {
        jQuery(this).removeClass("activeLine");
        jQuery(this).next(".responsiveMainNav .navTabs > li > .dropDown li .dropDown").slideUp(300);
      }
    });

  });

  /* ◄------ Custom JS for Homepage Partners -------------------------------► */

  jQuery(document).ready(function(){
    jQuery('#partner-1').on('click', function(){
      jQuery('.partner').removeClass('active');
      jQuery('#partner-1').addClass('active');

      jQuery('.wrapper-2').addClass('hide');
      jQuery('#partner-1-desc').removeClass('hide');
    });

    jQuery('#partner-2').on('click', function(){
      jQuery('.partner').removeClass('active');
      jQuery('#partner-2').addClass('active');

      jQuery('.wrapper-2').addClass('hide');
      jQuery('#partner-2-desc').removeClass('hide');
    });

    jQuery('#partner-3').on('click', function(){
      jQuery('.partner').removeClass('active');
      jQuery('#partner-3').addClass('active');

      jQuery('.wrapper-2').addClass('hide');
      jQuery('#partner-3-desc').removeClass('hide');
    });

    jQuery('#partner-4').on('click', function(){
      jQuery('.partner').removeClass('active');
      jQuery('#partner-4').addClass('active');

      jQuery('.wrapper-2').addClass('hide');
      jQuery('#partner-4-desc').removeClass('hide');
    });

  });

})();//end of use strict
