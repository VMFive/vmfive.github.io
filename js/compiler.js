/*
all java scritpts compiler
*/


/* ---------------------- 
  owl carousel plugin
---------------------- */

/**
 * Owl carousel
 * @version 2.0.0
 * @author Bartosz Wojciechowski
 * @license The MIT License (MIT)
 * @todo Lazy Load Icon
 * @todo prevent animationend bubling
 * @todo itemsScaleUp
 * @todo Test Zepto
 * @todo stagePadding calculate wrong active classes
 */
;(function($, window, document, undefined) {

  var drag, state, e;

  /**
   * Template for status information about drag and touch events.
   * @private
   */
  drag = {
    start: 0,
    startX: 0,
    startY: 0,
    current: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
    distance: null,
    startTime: 0,
    endTime: 0,
    updatedX: 0,
    targetEl: null
  };

  /**
   * Template for some status informations.
   * @private
   */
  state = {
    isTouch: false,
    isScrolling: false,
    isSwiping: false,
    direction: false,
    inMotion: false
  };

  /**
   * Event functions references.
   * @private
   */
  e = {
    _onDragStart: null,
    _onDragMove: null,
    _onDragEnd: null,
    _transitionEnd: null,
    _resizer: null,
    _responsiveCall: null,
    _goToLoop: null,
    _checkVisibile: null
  };

  /**
   * Creates a carousel.
   * @class The Owl Carousel.
   * @public
   * @param {HTMLElement|jQuery} element - The element to create the carousel for.
   * @param {Object} [options] - The options
   */
  function Owl(element, options) {

    /**
     * Current settings for the carousel.
     * @public
     */
    this.settings = null;

    /**
     * Current options set by the caller including defaults.
     * @public
     */
    this.options = $.extend({}, Owl.Defaults, options);

    /**
     * Plugin element.
     * @public
     */
    this.$element = $(element);

    /**
     * Caches informations about drag and touch events.
     */
    this.drag = $.extend({}, drag);

    /**
     * Caches some status informations.
     * @protected
     */
    this.state = $.extend({}, state);

    /**
     * @protected
     * @todo Must be documented
     */
    this.e = $.extend({}, e);

    /**
     * References to the running plugins of this carousel.
     * @protected
     */
    this._plugins = {};

    /**
     * Currently suppressed events to prevent them from beeing retriggered.
     * @protected
     */
    this._supress = {};

    /**
     * Absolute current position.
     * @protected
     */
    this._current = null;

    /**
     * Animation speed in milliseconds.
     * @protected
     */
    this._speed = null;

    /**
     * Coordinates of all items in pixel.
     * @todo The name of this member is missleading.
     * @protected
     */
    this._coordinates = [];

    /**
     * Current breakpoint.
     * @todo Real media queries would be nice.
     * @protected
     */
    this._breakpoint = null;

    /**
     * Current width of the plugin element.
     */
    this._width = null;

    /**
     * All real items.
     * @protected
     */
    this._items = [];

    /**
     * All cloned items.
     * @protected
     */
    this._clones = [];

    /**
     * Merge values of all items.
     * @todo Maybe this could be part of a plugin.
     * @protected
     */
    this._mergers = [];

    /**
     * Invalidated parts within the update process.
     * @protected
     */
    this._invalidated = {};

    /**
     * Ordered list of workers for the update process.
     * @protected
     */
    this._pipe = [];

    $.each(Owl.Plugins, $.proxy(function(key, plugin) {
      this._plugins[key[0].toLowerCase() + key.slice(1)]
        = new plugin(this);
    }, this));

    $.each(Owl.Pipe, $.proxy(function(priority, worker) {
      this._pipe.push({
        'filter': worker.filter,
        'run': $.proxy(worker.run, this)
      });
    }, this));

    this.setup();
    this.initialize();
  }

  /**
   * Default options for the carousel.
   * @public
   */
  Owl.Defaults = {
    items: 3,
    loop: false,
    center: false,

    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    freeDrag: false,

    margin: 0,
    stagePadding: 0,

    merge: false,
    mergeFit: true,
    autoWidth: false,

    startPosition: 0,
    rtl: false,

    smartSpeed: 250,
    fluidSpeed: false,
    dragEndSpeed: false,

    responsive: {},
    responsiveRefreshRate: 200,
    responsiveBaseElement: window,
    responsiveClass: false,

    fallbackEasing: 'swing',

    info: false,

    nestedItemSelector: false,
    itemElement: 'div',
    stageElement: 'div',

    // Classes and Names
    themeClass: 'owl-theme',
    baseClass: 'owl-carousel',
    itemClass: 'owl-item',
    centerClass: 'center',
    activeClass: 'active'
  };

  /**
   * Enumeration for width.
   * @public
   * @readonly
   * @enum {String}
   */
  Owl.Width = {
    Default: 'default',
    Inner: 'inner',
    Outer: 'outer'
  };

  /**
   * Contains all registered plugins.
   * @public
   */
  Owl.Plugins = {};

  /**
   * Update pipe.
   */
  Owl.Pipe = [ {
    filter: [ 'width', 'items', 'settings' ],
    run: function(cache) {
      cache.current = this._items && this._items[this.relative(this._current)];
    }
  }, {
    filter: [ 'items', 'settings' ],
    run: function() {
      var cached = this._clones,
        clones = this.$stage.children('.cloned');

      if (clones.length !== cached.length || (!this.settings.loop && cached.length > 0)) {
        this.$stage.children('.cloned').remove();
        this._clones = [];
      }
    }
  }, {
    filter: [ 'items', 'settings' ],
    run: function() {
      var i, n,
        clones = this._clones,
        items = this._items,
        delta = this.settings.loop ? clones.length - Math.max(this.settings.items * 2, 4) : 0;

      for (i = 0, n = Math.abs(delta / 2); i < n; i++) {
        if (delta > 0) {
          this.$stage.children().eq(items.length + clones.length - 1).remove();
          clones.pop();
          this.$stage.children().eq(0).remove();
          clones.pop();
        } else {
          clones.push(clones.length / 2);
          this.$stage.append(items[clones[clones.length - 1]].clone().addClass('cloned'));
          clones.push(items.length - 1 - (clones.length - 1) / 2);
          this.$stage.prepend(items[clones[clones.length - 1]].clone().addClass('cloned'));
        }
      }
    }
  }, {
    filter: [ 'width', 'items', 'settings' ],
    run: function() {
      var rtl = (this.settings.rtl ? 1 : -1),
        width = ($(window).width() / this.settings.items).toFixed(3),
        coordinate = 0, merge, i, n;

      this._coordinates = [];
      for (i = 0, n = this._clones.length + this._items.length; i < n; i++) {
        merge = this._mergers[this.relative(i)];
        merge = (this.settings.mergeFit && Math.min(merge, this.settings.items)) || merge;
        coordinate += (this.settings.autoWidth ? this._items[this.relative(i)].width() + this.settings.margin : width * merge) * rtl;

        this._coordinates.push(coordinate);
      }
    }
  }, {
    filter: [ 'width', 'items', 'settings' ],
    run: function() {
      var i, n, width = ($(window).width() / this.settings.items).toFixed(3), css = {
        'width': Math.abs(this._coordinates[this._coordinates.length - 1]) + this.settings.stagePadding * 2,
        'padding-left': this.settings.stagePadding || '',
        'padding-right': this.settings.stagePadding || ''
      };

      this.$stage.css(css);

      css = { 'width': this.settings.autoWidth ? 'auto' : width - this.settings.margin };
      css[this.settings.rtl ? 'margin-left' : 'margin-right'] = this.settings.margin;

      if (!this.settings.autoWidth && $.grep(this._mergers, function(v) { return v > 1 }).length > 0) {
        for (i = 0, n = this._coordinates.length; i < n; i++) {
          css.width = Math.abs(this._coordinates[i]) - Math.abs(this._coordinates[i - 1] || 0) - this.settings.margin;
          this.$stage.children().eq(i).css(css);
        }
      } else {
        this.$stage.children().css(css);
      }
    }
  }, {
    filter: [ 'width', 'items', 'settings' ],
    run: function(cache) {
      cache.current && this.reset(this.$stage.children().index(cache.current));
    }
  }, {
    filter: [ 'position' ],
    run: function() {
      this.animate(this.coordinates(this._current));
    }
  }, {
    filter: [ 'width', 'position', 'items', 'settings' ],
    run: function() {
      var rtl = this.settings.rtl ? 1 : -1,
        padding = this.settings.stagePadding * 2,
        begin = this.coordinates(this.current()) + padding,
        end = begin + $(window).width() * rtl,
        inner, outer, matches = [], i, n;

      for (i = 0, n = this._coordinates.length; i < n; i++) {
        inner = this._coordinates[i - 1] || 0;
        outer = Math.abs(this._coordinates[i]) + padding * rtl;

        if ((this.op(inner, '<=', begin) && (this.op(inner, '>', end)))
          || (this.op(outer, '<', begin) && this.op(outer, '>', end))) {
          matches.push(i);
        }
      }

      this.$stage.children('.' + this.settings.activeClass).removeClass(this.settings.activeClass);
      this.$stage.children(':eq(' + matches.join('), :eq(') + ')').addClass(this.settings.activeClass);

      if (this.settings.center) {
        this.$stage.children('.' + this.settings.centerClass).removeClass(this.settings.centerClass);
        this.$stage.children().eq(this.current()).addClass(this.settings.centerClass);
      }
    }
  } ];

  /**
   * Initializes the carousel.
   * @protected
   */
  Owl.prototype.initialize = function() {
    this.trigger('initialize');

    this.$element
      .addClass(this.settings.baseClass)
      .addClass(this.settings.themeClass)
      .toggleClass('owl-rtl', this.settings.rtl);

    // check support
    this.browserSupport();

    if (this.settings.autoWidth && this.state.imagesLoaded !== true) {
      var imgs, nestedSelector, width;
      imgs = this.$element.find('img');
      nestedSelector = this.settings.nestedItemSelector ? '.' + this.settings.nestedItemSelector : undefined;
      width = this.$element.children(nestedSelector).width();

      if (imgs.length && width <= 0) {
        this.preloadAutoWidthImages(imgs);
        return false;
      }
    }

    this.$element.addClass('owl-loading');

    // create stage
    this.$stage = $('<' + this.settings.stageElement + ' class="owl-stage"/>')
      .wrap('<div class="owl-stage-outer">');

    // append stage
    this.$element.append(this.$stage.parent());

    // append content
    this.replace(this.$element.children().not(this.$stage.parent()));

    // set view width
    this._width = this.$element.width();

    // update view
    this.refresh();

    this.$element.removeClass('owl-loading').addClass('owl-loaded');

    // attach generic events
    this.eventsCall();

    // attach generic events
    this.internalEvents();

    // attach custom control events
    this.addTriggerableEvents();

    this.trigger('initialized');
  };

  /**
   * Setups the current settings.
   * @todo Remove responsive classes. Why should adaptive designs be brought into IE8?
   * @todo Support for media queries by using `matchMedia` would be nice.
   * @public
   */
  Owl.prototype.setup = function() {
    var viewport = this.viewport(),
      overwrites = this.options.responsive,
      match = -1,
      settings = null;

    if (!overwrites) {
      settings = $.extend({}, this.options);
    } else {
      $.each(overwrites, function(breakpoint) {
        if (breakpoint <= viewport && breakpoint > match) {
          match = Number(breakpoint);
        }
      });

      settings = $.extend({}, this.options, overwrites[match]);
      delete settings.responsive;

      // responsive class
      if (settings.responsiveClass) {
        this.$element.attr('class', function(i, c) {
          return c.replace(/\b owl-responsive-\S+/g, '');
        }).addClass('owl-responsive-' + match);
      }
    }

    if (this.settings === null || this._breakpoint !== match) {
      this.trigger('change', { property: { name: 'settings', value: settings } });
      this._breakpoint = match;
      this.settings = settings;
      this.invalidate('settings');
      this.trigger('changed', { property: { name: 'settings', value: this.settings } });
    }
  };

  /**
   * Updates option logic if necessery.
   * @protected
   */
  Owl.prototype.optionsLogic = function() {
    // Toggle Center class
    this.$element.toggleClass('owl-center', this.settings.center);

    // if items number is less than in body
    if (this.settings.loop && this._items.length < this.settings.items) {
      this.settings.loop = false;
    }

    if (this.settings.autoWidth) {
      this.settings.stagePadding = false;
      this.settings.merge = false;
    }
  };

  /**
   * Prepares an item before add.
   * @todo Rename event parameter `content` to `item`.
   * @protected
   * @returns {jQuery|HTMLElement} - The item container.
   */
  Owl.prototype.prepare = function(item) {
    var event = this.trigger('prepare', { content: item });

    if (!event.data) {
      event.data = $('<' + this.settings.itemElement + '/>')
        .addClass(this.settings.itemClass).append(item)
    }

    this.trigger('prepared', { content: event.data });

    return event.data;
  };

  /**
   * Updates the view.
   * @public
   */
  Owl.prototype.update = function() {
    var i = 0,
      n = this._pipe.length,
      filter = $.proxy(function(p) { return this[p] }, this._invalidated),
      cache = {};

    while (i < n) {
      if (this._invalidated.all || $.grep(this._pipe[i].filter, filter).length > 0) {
        this._pipe[i].run(cache);
      }
      i++;
    }

    this._invalidated = {};
  };

  /**
   * Gets the width of the view.
   * @public
   * @param {Owl.Width} [dimension=Owl.Width.Default] - The dimension to return.
   * @returns {Number} - The width of the view in pixel.
   */
  Owl.prototype.width = function(dimension) {
    dimension = dimension || Owl.Width.Default;
    switch (dimension) {
      case Owl.Width.Inner:
      case Owl.Width.Outer:
        return this._width;
      default:
        return this._width - this.settings.stagePadding * 2 + this.settings.margin;
    }
  };

  /**
   * Refreshes the carousel primarily for adaptive purposes.
   * @public
   */
  Owl.prototype.refresh = function() {
    if (this._items.length === 0) {
      return false;
    }

    var start = new Date().getTime();

    this.trigger('refresh');

    this.setup();

    this.optionsLogic();

    // hide and show methods helps here to set a proper widths,
    // this prevents scrollbar to be calculated in stage width
    this.$stage.addClass('owl-refresh');

    this.update();

    this.$stage.removeClass('owl-refresh');

    this.state.orientation = window.orientation;

    this.watchVisibility();

    this.trigger('refreshed');
  };

  /**
   * Save internal event references and add event based functions.
   * @protected
   */
  Owl.prototype.eventsCall = function() {
    // Save events references
    this.e._onDragStart = $.proxy(function(e) {
      this.onDragStart(e);
    }, this);
    this.e._onDragMove = $.proxy(function(e) {
      this.onDragMove(e);
    }, this);
    this.e._onDragEnd = $.proxy(function(e) {
      this.onDragEnd(e);
    }, this);
    this.e._onResize = $.proxy(function(e) {
      this.onResize(e);
    }, this);
    this.e._transitionEnd = $.proxy(function(e) {
      this.transitionEnd(e);
    }, this);
    this.e._preventClick = $.proxy(function(e) {
      this.preventClick(e);
    }, this);
  };

  /**
   * Checks window `resize` event.
   * @protected
   */
  Owl.prototype.onThrottledResize = function() {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(this.e._onResize, this.settings.responsiveRefreshRate);
  };

  /**
   * Checks window `resize` event.
   * @protected
   */
  Owl.prototype.onResize = function() {
    if (!this._items.length) {
      return false;
    }

    if (this._width === this.$element.width()) {
      return false;
    }

    if (this.trigger('resize').isDefaultPrevented()) {
      return false;
    }

    this._width = this.$element.width();

    this.invalidate('width');

    this.refresh();

    this.trigger('resized');
  };

  /**
   * Checks for touch/mouse drag event type and add run event handlers.
   * @protected
   */
  Owl.prototype.eventsRouter = function(event) {
    var type = event.type;

    if (type === "mousedown" || type === "touchstart") {
      this.onDragStart(event);
    } else if (type === "mousemove" || type === "touchmove") {
      this.onDragMove(event);
    } else if (type === "mouseup" || type === "touchend") {
      this.onDragEnd(event);
    } else if (type === "touchcancel") {
      this.onDragEnd(event);
    }
  };

  /**
   * Checks for touch/mouse drag options and add necessery event handlers.
   * @protected
   */
  Owl.prototype.internalEvents = function() {
    var isTouch = isTouchSupport(),
      isTouchIE = isTouchSupportIE();

    if (this.settings.mouseDrag){
      this.$stage.on('mousedown', $.proxy(function(event) { this.eventsRouter(event) }, this));
      this.$stage.on('dragstart', function() { return false });
      this.$stage.get(0).onselectstart = function() { return false };
    } else {
      this.$element.addClass('owl-text-select-on');
    }

    if (this.settings.touchDrag && !isTouchIE){
      this.$stage.on('touchstart touchcancel', $.proxy(function(event) { this.eventsRouter(event) }, this));
    }

    // catch transitionEnd event
    if (this.transitionEndVendor) {
      this.on(this.$stage.get(0), this.transitionEndVendor, this.e._transitionEnd, false);
    }

    // responsive
    if (this.settings.responsive !== false) {
      this.on(window, 'resize', $.proxy(this.onThrottledResize, this));
    }
  };

  /**
   * Handles touchstart/mousedown event.
   * @protected
   * @param {Event} event - The event arguments.
   */
  Owl.prototype.onDragStart = function(event) {
    var ev, isTouchEvent, pageX, pageY, animatedPos;

    ev = event.originalEvent || event || window.event;

    // prevent right click
    if (ev.which === 3 || this.state.isTouch) {
      return false;
    }

    if (ev.type === 'mousedown') {
      this.$stage.addClass('owl-grab');
    }

    this.trigger('drag');
    this.drag.startTime = new Date().getTime();
    this.speed(0);
    this.state.isTouch = true;
    this.state.isScrolling = false;
    this.state.isSwiping = false;
    this.drag.distance = 0;

    pageX = getTouches(ev).x;
    pageY = getTouches(ev).y;

    // get stage position left
    this.drag.offsetX = this.$stage.position().left;
    this.drag.offsetY = this.$stage.position().top;

    if (this.settings.rtl) {
      this.drag.offsetX = this.$stage.position().left + this.$stage.width() - $(window).width()
        + this.settings.margin;
    }

    // catch position // ie to fix
    if (this.state.inMotion && this.support3d) {
      animatedPos = this.getTransformProperty();
      this.drag.offsetX = animatedPos;
      this.animate(animatedPos);
      this.state.inMotion = true;
    } else if (this.state.inMotion && !this.support3d) {
      this.state.inMotion = false;
      return false;
    }

    this.drag.startX = pageX - this.drag.offsetX;
    this.drag.startY = pageY - this.drag.offsetY;

    this.drag.start = pageX - this.drag.startX;
    this.drag.targetEl = ev.target || ev.srcElement;
    this.drag.updatedX = this.drag.start;

    // to do/check
    // prevent links and images dragging;
    if (this.drag.targetEl.tagName === "IMG" || this.drag.targetEl.tagName === "A") {
      this.drag.targetEl.draggable = false;
    }

    $(document).on('mousemove.owl.dragEvents mouseup.owl.dragEvents touchmove.owl.dragEvents touchend.owl.dragEvents', $.proxy(function(event) {this.eventsRouter(event)},this));
  };

  /**
   * Handles the touchmove/mousemove events.
   * @todo Simplify
   * @protected
   * @param {Event} event - The event arguments.
   */
  Owl.prototype.onDragMove = function(event) {
    var ev, isTouchEvent, pageX, pageY, minValue, maxValue, pull;

    if (!this.state.isTouch) {
      return;
    }

    if (this.state.isScrolling) {
      return;
    }

    ev = event.originalEvent || event || window.event;

    pageX = getTouches(ev).x;
    pageY = getTouches(ev).y;

    // Drag Direction
    this.drag.currentX = pageX - this.drag.startX;
    this.drag.currentY = pageY - this.drag.startY;
    this.drag.distance = this.drag.currentX - this.drag.offsetX;

    // Check move direction
    if (this.drag.distance < 0) {
      this.state.direction = this.settings.rtl ? 'right' : 'left';
    } else if (this.drag.distance > 0) {
      this.state.direction = this.settings.rtl ? 'left' : 'right';
    }
    // Loop
    if (this.settings.loop) {
      if (this.op(this.drag.currentX, '>', this.coordinates(this.minimum())) && this.state.direction === 'right') {
        this.drag.currentX -= (this.settings.center && this.coordinates(0)) - this.coordinates(this._items.length);
      } else if (this.op(this.drag.currentX, '<', this.coordinates(this.maximum())) && this.state.direction === 'left') {
        this.drag.currentX += (this.settings.center && this.coordinates(0)) - this.coordinates(this._items.length);
      }
    } else {
      // pull
      minValue = this.settings.rtl ? this.coordinates(this.maximum()) : this.coordinates(this.minimum());
      maxValue = this.settings.rtl ? this.coordinates(this.minimum()) : this.coordinates(this.maximum());
      pull = this.settings.pullDrag ? this.drag.distance / 5 : 0;
      this.drag.currentX = Math.max(Math.min(this.drag.currentX, minValue + pull), maxValue + pull);
    }

    // Lock browser if swiping horizontal

    if ((this.drag.distance > 8 || this.drag.distance < -8)) {
      if (ev.preventDefault !== undefined) {
        ev.preventDefault();
      } else {
        ev.returnValue = false;
      }
      this.state.isSwiping = true;
    }

    this.drag.updatedX = this.drag.currentX;

    // Lock Owl if scrolling
    if ((this.drag.currentY > 16 || this.drag.currentY < -16) && this.state.isSwiping === false) {
      this.state.isScrolling = true;
      this.drag.updatedX = this.drag.start;
    }

    this.animate(this.drag.updatedX);
  };

  /**
   * Handles the touchend/mouseup events.
   * @protected
   */
  Owl.prototype.onDragEnd = function(event) {
    var compareTimes, distanceAbs, closest;

    if (!this.state.isTouch) {
      return;
    }

    if (event.type === 'mouseup') {
      this.$stage.removeClass('owl-grab');
    }

    this.trigger('dragged');

    // prevent links and images dragging;
    this.drag.targetEl.removeAttribute("draggable");

    // remove drag event listeners

    this.state.isTouch = false;
    this.state.isScrolling = false;
    this.state.isSwiping = false;

    // to check
    if (this.drag.distance === 0 && this.state.inMotion !== true) {
      this.state.inMotion = false;
      return false;
    }

    // prevent clicks while scrolling

    this.drag.endTime = new Date().getTime();
    compareTimes = this.drag.endTime - this.drag.startTime;
    distanceAbs = Math.abs(this.drag.distance);

    // to test
    if (distanceAbs > 3 || compareTimes > 300) {
      this.removeClick(this.drag.targetEl);
    }

    closest = this.closest(this.drag.updatedX);

    this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed);
    this.current(closest);
    this.invalidate('position');
    this.update();

    // if pullDrag is off then fire transitionEnd event manually when stick
    // to border
    if (!this.settings.pullDrag && this.drag.updatedX === this.coordinates(closest)) {
      this.transitionEnd();
    }

    this.drag.distance = 0;

    $(document).off('.owl.dragEvents');
  };

  /**
   * Attaches `preventClick` to disable link while swipping.
   * @protected
   * @param {HTMLElement} [target] - The target of the `click` event.
   */
  Owl.prototype.removeClick = function(target) {
    this.drag.targetEl = target;
    $(target).on('click.preventClick', this.e._preventClick);
    // to make sure click is removed:
    window.setTimeout(function() {
      $(target).off('click.preventClick');
    }, 300);
  };

  /**
   * Suppresses click event.
   * @protected
   * @param {Event} ev - The event arguments.
   */
  Owl.prototype.preventClick = function(ev) {
    if (ev.preventDefault) {
      ev.preventDefault();
    } else {
      ev.returnValue = false;
    }
    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
    $(ev.target).off('click.preventClick');
  };

  /**
   * Catches stage position while animate (only CSS3).
   * @protected
   * @returns
   */
  Owl.prototype.getTransformProperty = function() {
    var transform, matrix3d;

    transform = window.getComputedStyle(this.$stage.get(0), null).getPropertyValue(this.vendorName + 'transform');
    // var transform = this.$stage.css(this.vendorName + 'transform')
    transform = transform.replace(/matrix(3d)?\(|\)/g, '').split(',');
    matrix3d = transform.length === 16;

    return matrix3d !== true ? transform[4] : transform[12];
  };

  /**
   * Gets absolute position of the closest item for a coordinate.
   * @todo Setting `freeDrag` makes `closest` not reusable. See #165.
   * @protected
   * @param {Number} coordinate - The coordinate in pixel.
   * @return {Number} - The absolute position of the closest item.
   */
  Owl.prototype.closest = function(coordinate) {
    var position = -1, pull = 30, width = $(window).width(), coordinates = this.coordinates();

    if (!this.settings.freeDrag) {
      // check closest item
      $.each(coordinates, $.proxy(function(index, value) {
        if (coordinate > value - pull && coordinate < value + pull) {
          position = index;
        } else if (this.op(coordinate, '<', value)
          && this.op(coordinate, '>', coordinates[index + 1] || value - width)) {
          position = this.state.direction === 'left' ? index + 1 : index;
        }
        return position === -1;
      }, this));
    }

    if (!this.settings.loop) {
      // non loop boundries
      if (this.op(coordinate, '>', coordinates[this.minimum()])) {
        position = coordinate = this.minimum();
      } else if (this.op(coordinate, '<', coordinates[this.maximum()])) {
        position = coordinate = this.maximum();
      }
    }

    return position;
  };

  /**
   * Animates the stage.
   * @public
   * @param {Number} coordinate - The coordinate in pixels.
   */
  Owl.prototype.animate = function(coordinate) {
    this.trigger('translate');
    this.state.inMotion = this.speed() > 0;

    if (this.support3d) {
      this.$stage.css({
        '-webkit-transform': 'translate3d(' + coordinate + 'px,0px,0px)',
        '-webkit-transition': (this.speed() / 1000) + 's',
        transform: 'translate3d(' + coordinate + 'px' + ',0px, 0px)',
        transition: (this.speed() / 1000) + 's'
      });
    } else if (this.state.isTouch) {
      this.$stage.css({
        left: coordinate + 'px'
      });
    } else {
      this.$stage.animate({
        left: coordinate
      }, this.speed() / 1000, this.settings.fallbackEasing, $.proxy(function() {
        if (this.state.inMotion) {
          this.transitionEnd();
        }
      }, this));
    }
  };

  /**
   * Sets the absolute position of the current item.
   * @public
   * @param {Number} [position] - The new absolute position or nothing to leave it unchanged.
   * @returns {Number} - The absolute position of the current item.
   */
  Owl.prototype.current = function(position) {
    if (position === undefined) {
      return this._current;
    }

    if (this._items.length === 0) {
      return undefined;
    }

    position = this.normalize(position);

    if (this._current !== position) {
      var event = this.trigger('change', { property: { name: 'position', value: position } });

      if (event.data !== undefined) {
        position = this.normalize(event.data);
      }

      this._current = position;

      this.invalidate('position');

      this.trigger('changed', { property: { name: 'position', value: this._current } });
    }

    return this._current;
  };

  /**
   * Invalidates the given part of the update routine.
   * @param {String} part - The part to invalidate.
   */
  Owl.prototype.invalidate = function(part) {
    this._invalidated[part] = true;
  }

  /**
   * Resets the absolute position of the current item.
   * @public
   * @param {Number} position - The absolute position of the new item.
   */
  Owl.prototype.reset = function(position) {
    position = this.normalize(position);

    if (position === undefined) {
      return;
    }

    this._speed = 0;
    this._current = position;

    this.suppress([ 'translate', 'translated' ]);

    this.animate(this.coordinates(position));

    this.release([ 'translate', 'translated' ]);
  };

  /**
   * Normalizes an absolute or a relative position for an item.
   * @public
   * @param {Number} position - The absolute or relative position to normalize.
   * @param {Boolean} [relative=false] - Whether the given position is relative or not.
   * @returns {Number} - The normalized position.
   */
  Owl.prototype.normalize = function(position, relative) {
    var n = (relative ? this._items.length : this._items.length + this._clones.length);

    if (!$.isNumeric(position) || n < 1) {
      return undefined;
    }

    if (this._clones.length) {
      position = ((position % n) + n) % n;
    } else {
      position = Math.max(this.minimum(relative), Math.min(this.maximum(relative), position));
    }

    return position;
  };

  /**
   * Converts an absolute position for an item into a relative position.
   * @public
   * @param {Number} position - The absolute position to convert.
   * @returns {Number} - The converted position.
   */
  Owl.prototype.relative = function(position) {
    position = this.normalize(position);
    position = position - this._clones.length / 2;
    return this.normalize(position, true);
  };

  /**
   * Gets the maximum position for an item.
   * @public
   * @param {Boolean} [relative=false] - Whether to return an absolute position or a relative position.
   * @returns {Number}
   */
  Owl.prototype.maximum = function(relative) {
    var maximum, width, i = 0, coordinate,
      settings = this.settings;

    if (relative) {
      return this._items.length - 1;
    }

    if (!settings.loop && settings.center) {
      maximum = this._items.length - 1;
    } else if (!settings.loop && !settings.center) {
      maximum = this._items.length - settings.items;
    } else if (settings.loop || settings.center) {
      maximum = this._items.length + settings.items;
    } else if (settings.autoWidth || settings.merge) {
      revert = settings.rtl ? 1 : -1;
      width = this.$stage.width() - this.$element.width();
      while (coordinate = this.coordinates(i)) {
        if (coordinate * revert >= width) {
          break;
        }
        maximum = ++i;
      }
    } else {
      throw 'Can not detect maximum absolute position.'
    }

    return maximum;
  };

  /**
   * Gets the minimum position for an item.
   * @public
   * @param {Boolean} [relative=false] - Whether to return an absolute position or a relative position.
   * @returns {Number}
   */
  Owl.prototype.minimum = function(relative) {
    if (relative) {
      return 0;
    }

    return this._clones.length / 2;
  };

  /**
   * Gets an item at the specified relative position.
   * @public
   * @param {Number} [position] - The relative position of the item.
   * @return {jQuery|Array.<jQuery>} - The item at the given position or all items if no position was given.
   */
  Owl.prototype.items = function(position) {
    if (position === undefined) {
      return this._items.slice();
    }

    position = this.normalize(position, true);
    return this._items[position];
  };

  /**
   * Gets an item at the specified relative position.
   * @public
   * @param {Number} [position] - The relative position of the item.
   * @return {jQuery|Array.<jQuery>} - The item at the given position or all items if no position was given.
   */
  Owl.prototype.mergers = function(position) {
    if (position === undefined) {
      return this._mergers.slice();
    }

    position = this.normalize(position, true);
    return this._mergers[position];
  };

  /**
   * Gets the absolute positions of clones for an item.
   * @public
   * @param {Number} [position] - The relative position of the item.
   * @returns {Array.<Number>} - The absolute positions of clones for the item or all if no position was given.
   */
  Owl.prototype.clones = function(position) {
    var odd = this._clones.length / 2,
      even = odd + this._items.length,
      map = function(index) { return index % 2 === 0 ? even + index / 2 : odd - (index + 1) / 2 };

    if (position === undefined) {
      return $.map(this._clones, function(v, i) { return map(i) });
    }

    return $.map(this._clones, function(v, i) { return v === position ? map(i) : null });
  };

  /**
   * Sets the current animation speed.
   * @public
   * @param {Number} [speed] - The animation speed in milliseconds or nothing to leave it unchanged.
   * @returns {Number} - The current animation speed in milliseconds.
   */
  Owl.prototype.speed = function(speed) {
    if (speed !== undefined) {
      this._speed = speed;
    }

    return this._speed;
  };

  /**
   * Gets the coordinate of an item.
   * @todo The name of this method is missleanding.
   * @public
   * @param {Number} position - The absolute position of the item within `minimum()` and `maximum()`.
   * @returns {Number|Array.<Number>} - The coordinate of the item in pixel or all coordinates.
   */
  Owl.prototype.coordinates = function(position) {
    var coordinate = null;

    if (position === undefined) {
      return $.map(this._coordinates, $.proxy(function(coordinate, index) {
        return this.coordinates(index);
      }, this));
    }

    if (this.settings.center) {
      coordinate = this._coordinates[position];
      coordinate += ($(window).width() - coordinate + (this._coordinates[position - 1] || 0)) / 2 * (this.settings.rtl ? -1 : 1);
    } else {
      coordinate = this._coordinates[position - 1] || 0;
    }

    return coordinate;
  };

  /**
   * Calculates the speed for a translation.
   * @protected
   * @param {Number} from - The absolute position of the start item.
   * @param {Number} to - The absolute position of the target item.
   * @param {Number} [factor=undefined] - The time factor in milliseconds.
   * @returns {Number} - The time in milliseconds for the translation.
   */
  Owl.prototype.duration = function(from, to, factor) {
    return Math.min(Math.max(Math.abs(to - from), 1), 6) * Math.abs((factor || this.settings.smartSpeed));
  };

  /**
   * Slides to the specified item.
   * @public
   * @param {Number} position - The position of the item.
   * @param {Number} [speed] - The time in milliseconds for the transition.
   */
  Owl.prototype.to = function(position, speed) {
    if (this.settings.loop) {
      var distance = position - this.relative(this.current()),
        revert = this.current(),
        before = this.current(),
        after = this.current() + distance,
        direction = before - after < 0 ? true : false,
        items = this._clones.length + this._items.length;

      if (after < this.settings.items && direction === false) {
        revert = before + this._items.length;
        this.reset(revert);
      } else if (after >= items - this.settings.items && direction === true) {
        revert = before - this._items.length;
        this.reset(revert);
      }
      window.clearTimeout(this.e._goToLoop);
      this.e._goToLoop = window.setTimeout($.proxy(function() {
        this.speed(this.duration(this.current(), revert + distance, speed));
        this.current(revert + distance);
        this.update();
      }, this), 30);
    } else {
      this.speed(this.duration(this.current(), position, speed));
      this.current(position);
      this.update();
    }
  };

  /**
   * Slides to the next item.
   * @public
   * @param {Number} [speed] - The time in milliseconds for the transition.
   */
  Owl.prototype.next = function(speed) {
    speed = speed || false;
    this.to(this.relative(this.current()) + 1, speed);
  };

  /**
   * Slides to the previous item.
   * @public
   * @param {Number} [speed] - The time in milliseconds for the transition.
   */
  Owl.prototype.prev = function(speed) {
    speed = speed || false;
    this.to(this.relative(this.current()) - 1, speed);
  };

  /**
   * Handles the end of an animation.
   * @protected
   * @param {Event} event - The event arguments.
   */
  Owl.prototype.transitionEnd = function(event) {

    // if css2 animation then event object is undefined
    if (event !== undefined) {
      event.stopPropagation();

      // Catch only owl-stage transitionEnd event
      if ((event.target || event.srcElement || event.originalTarget) !== this.$stage.get(0)) {
        return false;
      }
    }

    this.state.inMotion = false;
    this.trigger('translated');
  };

  /**
   * Gets viewport width.
   * @protected
   * @return {Number} - The width in pixel.
   */
  Owl.prototype.viewport = function() {
    var width;
    if (this.options.responsiveBaseElement !== window) {
      width = $(this.options.responsiveBaseElement).width();
    } else if (window.innerWidth) {
      width = window.innerWidth;
    } else if (document.documentElement && document.documentElement.clientWidth) {
      width = document.documentElement.clientWidth;
    } else {
      throw 'Can not detect viewport width.';
    }
    return width;
  };

  /**
   * Replaces the current content.
   * @public
   * @param {HTMLElement|jQuery|String} content - The new content.
   */
  Owl.prototype.replace = function(content) {
    this.$stage.empty();
    this._items = [];

    if (content) {
      content = (content instanceof jQuery) ? content : $(content);
    }

    if (this.settings.nestedItemSelector) {
      content = content.find('.' + this.settings.nestedItemSelector);
    }

    content.filter(function() {
      return this.nodeType === 1;
    }).each($.proxy(function(index, item) {
      item = this.prepare(item);
      this.$stage.append(item);
      this._items.push(item);
      this._mergers.push(item.find('[data-merge]').andSelf('[data-merge]').attr('data-merge') * 1 || 1);
    }, this));

    this.reset($.isNumeric(this.settings.startPosition) ? this.settings.startPosition : 0);

    this.invalidate('items');
  };

  /**
   * Adds an item.
   * @todo Use `item` instead of `content` for the event arguments.
   * @public
   * @param {HTMLElement|jQuery|String} content - The item content to add.
   * @param {Number} [position] - The relative position at which to insert the item otherwise the item will be added to the end.
   */
  Owl.prototype.add = function(content, position) {
    position = position === undefined ? this._items.length : this.normalize(position, true);

    this.trigger('add', { content: content, position: position });

    if (this._items.length === 0 || position === this._items.length) {
      this.$stage.append(content);
      this._items.push(content);
      this._mergers.push(content.find('[data-merge]').andSelf('[data-merge]').attr('data-merge') * 1 || 1);
    } else {
      this._items[position].before(content);
      this._items.splice(position, 0, content);
      this._mergers.splice(position, 0, content.find('[data-merge]').andSelf('[data-merge]').attr('data-merge') * 1 || 1);
    }

    this.invalidate('items');

    this.trigger('added', { content: content, position: position });
  };

  /**
   * Removes an item by its position.
   * @todo Use `item` instead of `content` for the event arguments.
   * @public
   * @param {Number} position - The relative position of the item to remove.
   */
  Owl.prototype.remove = function(position) {
    position = this.normalize(position, true);

    if (position === undefined) {
      return;
    }

    this.trigger('remove', { content: this._items[position], position: position });

    this._items[position].remove();
    this._items.splice(position, 1);
    this._mergers.splice(position, 1);

    this.invalidate('items');

    this.trigger('removed', { content: null, position: position });
  };

  /**
   * Adds triggerable events.
   * @protected
   */
  Owl.prototype.addTriggerableEvents = function() {
    var handler = $.proxy(function(callback, event) {
      return $.proxy(function(e) {
        if (e.relatedTarget !== this) {
          this.suppress([ event ]);
          callback.apply(this, [].slice.call(arguments, 1));
          this.release([ event ]);
        }
      }, this);
    }, this);

    $.each({
      'next': this.next,
      'prev': this.prev,
      'to': this.to,
      'destroy': this.destroy,
      'refresh': this.refresh,
      'replace': this.replace,
      'add': this.add,
      'remove': this.remove
    }, $.proxy(function(event, callback) {
      this.$element.on(event + '.owl.carousel', handler(callback, event + '.owl.carousel'));
    }, this));

  };

  /**
   * Watches the visibility of the carousel element.
   * @protected
   */
  Owl.prototype.watchVisibility = function() {

    // test on zepto
    if (!isElVisible(this.$element.get(0))) {
      this.$element.addClass('owl-hidden');
      window.clearInterval(this.e._checkVisibile);
      this.e._checkVisibile = window.setInterval($.proxy(checkVisible, this), 500);
    }

    function isElVisible(el) {
      return el.offsetWidth > 0 && el.offsetHeight > 0;
    }

    function checkVisible() {
      if (isElVisible(this.$element.get(0))) {
        this.$element.removeClass('owl-hidden');
        this.refresh();
        window.clearInterval(this.e._checkVisibile);
      }
    }
  };

  /**
   * Preloads images with auto width.
   * @protected
   * @todo Still to test
   */
  Owl.prototype.preloadAutoWidthImages = function(imgs) {
    var loaded, that, $el, img;

    loaded = 0;
    that = this;
    imgs.each(function(i, el) {
      $el = $(el);
      img = new Image();

      img.onload = function() {
        loaded++;
        $el.attr('src', img.src);
        $el.css('opacity', 1);
        if (loaded >= imgs.length) {
          that.state.imagesLoaded = true;
          that.initialize();
        }
      };

      img.src = $el.attr('src') || $el.attr('data-src') || $el.attr('data-src-retina');
    });
  };

  /**
   * Destroys the carousel.
   * @public
   */
  Owl.prototype.destroy = function() {

    if (this.$element.hasClass(this.settings.themeClass)) {
      this.$element.removeClass(this.settings.themeClass);
    }

    if (this.settings.responsive !== false) {
      $(window).off('resize.owl.carousel');
    }

    if (this.transitionEndVendor) {
      this.off(this.$stage.get(0), this.transitionEndVendor, this.e._transitionEnd);
    }

    for ( var i in this._plugins) {
      this._plugins[i].destroy();
    }

    if (this.settings.mouseDrag || this.settings.touchDrag) {
      this.$stage.off('mousedown touchstart touchcancel');
      $(document).off('.owl.dragEvents');
      this.$stage.get(0).onselectstart = function() {};
      this.$stage.off('dragstart', function() { return false });
    }

    // remove event handlers in the ".owl.carousel" namespace
    this.$element.off('.owl');

    this.$stage.children('.cloned').remove();
    this.e = null;
    this.$element.removeData('owlCarousel');

    this.$stage.children().contents().unwrap();
    this.$stage.children().unwrap();
    this.$stage.unwrap();
  };

  /**
   * Operators to calculate right-to-left and left-to-right.
   * @protected
   * @param {Number} [a] - The left side operand.
   * @param {String} [o] - The operator.
   * @param {Number} [b] - The right side operand.
   */
  Owl.prototype.op = function(a, o, b) {
    var rtl = this.settings.rtl;
    switch (o) {
      case '<':
        return rtl ? a > b : a < b;
      case '>':
        return rtl ? a < b : a > b;
      case '>=':
        return rtl ? a <= b : a >= b;
      case '<=':
        return rtl ? a >= b : a <= b;
      default:
        break;
    }
  };

  /**
   * Attaches to an internal event.
   * @protected
   * @param {HTMLElement} element - The event source.
   * @param {String} event - The event name.
   * @param {Function} listener - The event handler to attach.
   * @param {Boolean} capture - Wether the event should be handled at the capturing phase or not.
   */
  Owl.prototype.on = function(element, event, listener, capture) {
    if (element.addEventListener) {
      element.addEventListener(event, listener, capture);
    } else if (element.attachEvent) {
      element.attachEvent('on' + event, listener);
    }
  };

  /**
   * Detaches from an internal event.
   * @protected
   * @param {HTMLElement} element - The event source.
   * @param {String} event - The event name.
   * @param {Function} listener - The attached event handler to detach.
   * @param {Boolean} capture - Wether the attached event handler was registered as a capturing listener or not.
   */
  Owl.prototype.off = function(element, event, listener, capture) {
    if (element.removeEventListener) {
      element.removeEventListener(event, listener, capture);
    } else if (element.detachEvent) {
      element.detachEvent('on' + event, listener);
    }
  };

  /**
   * Triggers an public event.
   * @protected
   * @param {String} name - The event name.
   * @param {*} [data=null] - The event data.
   * @param {String} [namespace=.owl.carousel] - The event namespace.
   * @returns {Event} - The event arguments.
   */
  Owl.prototype.trigger = function(name, data, namespace) {
    var status = {
      item: { count: this._items.length, index: this.current() }
    }, handler = $.camelCase(
      $.grep([ 'on', name, namespace ], function(v) { return v })
        .join('-').toLowerCase()
    ), event = $.Event(
      [ name, 'owl', namespace || 'carousel' ].join('.').toLowerCase(),
      $.extend({ relatedTarget: this }, status, data)
    );

    if (!this._supress[name]) {
      $.each(this._plugins, function(name, plugin) {
        if (plugin.onTrigger) {
          plugin.onTrigger(event);
        }
      });

      this.$element.trigger(event);

      if (this.settings && typeof this.settings[handler] === 'function') {
        this.settings[handler].apply(this, event);
      }
    }

    return event;
  };

  /**
   * Suppresses events.
   * @protected
   * @param {Array.<String>} events - The events to suppress.
   */
  Owl.prototype.suppress = function(events) {
    $.each(events, $.proxy(function(index, event) {
      this._supress[event] = true;
    }, this));
  }

  /**
   * Releases suppressed events.
   * @protected
   * @param {Array.<String>} events - The events to release.
   */
  Owl.prototype.release = function(events) {
    $.each(events, $.proxy(function(index, event) {
      delete this._supress[event];
    }, this));
  }

  /**
   * Checks the availability of some browser features.
   * @protected
   */
  Owl.prototype.browserSupport = function() {
    this.support3d = isPerspective();

    if (this.support3d) {
      this.transformVendor = isTransform();

      // take transitionend event name by detecting transition
      var endVendors = [ 'transitionend', 'webkitTransitionEnd', 'transitionend', 'oTransitionEnd' ];
      this.transitionEndVendor = endVendors[isTransition()];

      // take vendor name from transform name
      this.vendorName = this.transformVendor.replace(/Transform/i, '');
      this.vendorName = this.vendorName !== '' ? '-' + this.vendorName.toLowerCase() + '-' : '';
    }

    this.state.orientation = window.orientation;
  };

  /**
   * Get touch/drag coordinats.
   * @private
   * @param {event} - mousedown/touchstart event
   * @returns {object} - Contains X and Y of current mouse/touch position
   */

  function getTouches(event) {
    if (event.touches !== undefined) {
      return {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY
      };
    }

    if (event.touches === undefined) {
      if (event.pageX !== undefined) {
        return {
          x: event.pageX,
          y: event.pageY
        };
      }

    if (event.pageX === undefined) {
      return {
          x: event.clientX,
          y: event.clientY
        };
      }
    }
  }

  /**
   * Checks for CSS support.
   * @private
   * @param {Array} array - The CSS properties to check for.
   * @returns {Array} - Contains the supported CSS property name and its index or `false`.
   */
  function isStyleSupported(array) {
    var p, s, fake = document.createElement('div'), list = array;
    for (p in list) {
      s = list[p];
      if (typeof fake.style[s] !== 'undefined') {
        fake = null;
        return [ s, p ];
      }
    }
    return [ false ];
  }

  /**
   * Checks for CSS transition support.
   * @private
   * @todo Realy bad design
   * @returns {Number}
   */
  function isTransition() {
    return isStyleSupported([ 'transition', 'WebkitTransition', 'MozTransition', 'OTransition' ])[1];
  }

  /**
   * Checks for CSS transform support.
   * @private
   * @returns {String} The supported property name or false.
   */
  function isTransform() {
    return isStyleSupported([ 'transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform' ])[0];
  }

  /**
   * Checks for CSS perspective support.
   * @private
   * @returns {String} The supported property name or false.
   */
  function isPerspective() {
    return isStyleSupported([ 'perspective', 'webkitPerspective', 'MozPerspective', 'OPerspective', 'MsPerspective' ])[0];
  }

  /**
   * Checks wether touch is supported or not.
   * @private
   * @returns {Boolean}
   */
  function isTouchSupport() {
    return 'ontouchstart' in window || !!(navigator.msMaxTouchPoints);
  }

  /**
   * Checks wether touch is supported or not for IE.
   * @private
   * @returns {Boolean}
   */
  function isTouchSupportIE() {
    return window.navigator.msPointerEnabled;
  }

  /**
   * The jQuery Plugin for the Owl Carousel
   * @public
   */
  $.fn.owlCarousel = function(options) {
    return this.each(function() {
      if (!$(this).data('owlCarousel')) {
        $(this).data('owlCarousel', new Owl(this, options));
      }
    });
  };

  /**
   * The constructor for the jQuery Plugin
   * @public
   */
  $.fn.owlCarousel.Constructor = Owl;

})(window.Zepto || window.jQuery, window, document);

/**
 * Lazy Plugin
 * @version 2.0.0
 * @author Bartosz Wojciechowski
 * @license The MIT License (MIT)
 */
;(function($, window, document, undefined) {

  /**
   * Creates the lazy plugin.
   * @class The Lazy Plugin
   * @param {Owl} carousel - The Owl Carousel
   */
  var Lazy = function(carousel) {

    /**
     * Reference to the core.
     * @protected
     * @type {Owl}
     */
    this._core = carousel;

    /**
     * Already loaded items.
     * @protected
     * @type {Array.<jQuery>}
     */
    this._loaded = [];

    /**
     * Event handlers.
     * @protected
     * @type {Object}
     */
    this._handlers = {
      'initialized.owl.carousel change.owl.carousel': $.proxy(function(e) {
        if (!e.namespace) {
          return;
        }

        if (!this._core.settings || !this._core.settings.lazyLoad) {
          return;
        }

        if ((e.property && e.property.name == 'position') || e.type == 'initialized') {
          var settings = this._core.settings,
            n = (settings.center && Math.ceil(settings.items / 2) || settings.items),
            i = ((settings.center && n * -1) || 0),
            position = ((e.property && e.property.value) || this._core.current()) + i,
            clones = this._core.clones().length,
            load = $.proxy(function(i, v) { this.load(v) }, this);

          while (i++ < n) {
            this.load(clones / 2 + this._core.relative(position));
            clones && $.each(this._core.clones(this._core.relative(position++)), load);
          }
        }
      }, this)
    };

    // set the default options
    this._core.options = $.extend({}, Lazy.Defaults, this._core.options);

    // register event handler
    this._core.$element.on(this._handlers);
  }

  /**
   * Default options.
   * @public
   */
  Lazy.Defaults = {
    lazyLoad: false
  }

  /**
   * Loads all resources of an item at the specified position.
   * @param {Number} position - The absolute position of the item.
   * @protected
   */
  Lazy.prototype.load = function(position) {
    var $item = this._core.$stage.children().eq(position),
      $elements = $item && $item.find('.owl-lazy');

    if (!$elements || $.inArray($item.get(0), this._loaded) > -1) {
      return;
    }

    $elements.each($.proxy(function(index, element) {
      var $element = $(element), image,
        url = (window.devicePixelRatio > 1 && $element.attr('data-src-retina')) || $element.attr('data-src');

      this._core.trigger('load', { element: $element, url: url }, 'lazy');

      if ($element.is('img')) {
        $element.one('load.owl.lazy', $.proxy(function() {
          $element.css('opacity', 1);
          this._core.trigger('loaded', { element: $element, url: url }, 'lazy');
        }, this)).attr('src', url);
      } else {
        image = new Image();
        image.onload = $.proxy(function() {
          $element.css({
            'background-image': 'url(' + url + ')',
            'opacity': '1'
          });
          this._core.trigger('loaded', { element: $element, url: url }, 'lazy');
        }, this);
        image.src = url;
      }
    }, this));

    this._loaded.push($item.get(0));
  }

  /**
   * Destroys the plugin.
   * @public
   */
  Lazy.prototype.destroy = function() {
    var handler, property;

    for (handler in this.handlers) {
      this._core.$element.off(handler, this.handlers[handler]);
    }
    for (property in Object.getOwnPropertyNames(this)) {
      typeof this[property] != 'function' && (this[property] = null);
    }
  }

  $.fn.owlCarousel.Constructor.Plugins.Lazy = Lazy;

})(window.Zepto || window.jQuery, window, document);

/**
 * AutoHeight Plugin
 * @version 2.0.0
 * @author Bartosz Wojciechowski
 * @license The MIT License (MIT)
 */
;(function($, window, document, undefined) {

  /**
   * Creates the auto height plugin.
   * @class The Auto Height Plugin
   * @param {Owl} carousel - The Owl Carousel
   */
  var AutoHeight = function(carousel) {
    /**
     * Reference to the core.
     * @protected
     * @type {Owl}
     */
    this._core = carousel;

    /**
     * All event handlers.
     * @protected
     * @type {Object}
     */
    this._handlers = {
      'initialized.owl.carousel': $.proxy(function() {
        if (this._core.settings.autoHeight) {
          this.update();
        }
      }, this),
      'changed.owl.carousel': $.proxy(function(e) {
        if (this._core.settings.autoHeight && e.property.name == 'position'){
          this.update();
        }
      }, this),
      'loaded.owl.lazy': $.proxy(function(e) {
        if (this._core.settings.autoHeight && e.element.closest('.' + this._core.settings.itemClass)
          === this._core.$stage.children().eq(this._core.current())) {
          this.update();
        }
      }, this)
    };

    // set default options
    this._core.options = $.extend({}, AutoHeight.Defaults, this._core.options);

    // register event handlers
    this._core.$element.on(this._handlers);
  };

  /**
   * Default options.
   * @public
   */
  AutoHeight.Defaults = {
    autoHeight: false,
    autoHeightClass: 'owl-height'
  };

  /**
   * Updates the view.
   */
  AutoHeight.prototype.update = function() {
    this._core.$stage.parent()
      .height(this._core.$stage.children().eq(this._core.current()).height())
      .addClass(this._core.settings.autoHeightClass);
  };

  AutoHeight.prototype.destroy = function() {
    var handler, property;

    for (handler in this._handlers) {
      this._core.$element.off(handler, this._handlers[handler]);
    }
    for (property in Object.getOwnPropertyNames(this)) {
      typeof this[property] != 'function' && (this[property] = null);
    }
  };

  $.fn.owlCarousel.Constructor.Plugins.AutoHeight = AutoHeight;

})(window.Zepto || window.jQuery, window, document);

/**
 * Video Plugin
 * @version 2.0.0
 * @author Bartosz Wojciechowski
 * @license The MIT License (MIT)
 */
;(function($, window, document, undefined) {

  /**
   * Creates the video plugin.
   * @class The Video Plugin
   * @param {Owl} carousel - The Owl Carousel
   */
  var Video = function(carousel) {
    /**
     * Reference to the core.
     * @protected
     * @type {Owl}
     */
    this._core = carousel;

    /**
     * Cache all video URLs.
     * @protected
     * @type {Object}
     */
    this._videos = {};

    /**
     * Current playing item.
     * @protected
     * @type {jQuery}
     */
    this._playing = null;

    /**
     * Whether this is in fullscreen or not.
     * @protected
     * @type {Boolean}
     */
    this._fullscreen = false;

    /**
     * All event handlers.
     * @protected
     * @type {Object}
     */
    this._handlers = {
      'resize.owl.carousel': $.proxy(function(e) {
        if (this._core.settings.video && !this.isInFullScreen()) {
          e.preventDefault();
        }
      }, this),
      'refresh.owl.carousel changed.owl.carousel': $.proxy(function(e) {
        if (this._playing) {
          this.stop();
        }
      }, this),
      'prepared.owl.carousel': $.proxy(function(e) {
        var $element = $(e.content).find('.owl-video');
        if ($element.length) {
          $element.css('display', 'none');
          this.fetch($element, $(e.content));
        }
      }, this)
    };

    // set default options
    this._core.options = $.extend({}, Video.Defaults, this._core.options);

    // register event handlers
    this._core.$element.on(this._handlers);

    this._core.$element.on('click.owl.video', '.owl-video-play-icon', $.proxy(function(e) {
      this.play(e);
    }, this));
  };

  /**
   * Default options.
   * @public
   */
  Video.Defaults = {
    video: false,
    videoHeight: false,
    videoWidth: false
  };

  /**
   * Gets the video ID and the type (YouTube/Vimeo only).
   * @protected
   * @param {jQuery} target - The target containing the video data.
   * @param {jQuery} item - The item containing the video.
   */
  Video.prototype.fetch = function(target, item) {

    var type = target.attr('data-vimeo-id') ? 'vimeo' : 'youtube',
      id = target.attr('data-vimeo-id') || target.attr('data-youtube-id'),
      width = target.attr('data-width') || this._core.settings.videoWidth,
      height = target.attr('data-height') || this._core.settings.videoHeight,
      url = target.attr('href');

    if (url) {
      id = url.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);

      if (id[3].indexOf('youtu') > -1) {
        type = 'youtube';
      } else if (id[3].indexOf('vimeo') > -1) {
        type = 'vimeo';
      } else {
        throw new Error('Video URL not supported.');
      }
      id = id[6];
    } else {
      throw new Error('Missing video URL.');
    }

    this._videos[url] = {
      type: type,
      id: id,
      width: width,
      height: height
    };

    item.attr('data-video', url);

    this.thumbnail(target, this._videos[url]);
  };

  /**
   * Creates video thumbnail.
   * @protected
   * @param {jQuery} target - The target containing the video data.
   * @param {Object} info - The video info object.
   * @see `fetch`
   */
  Video.prototype.thumbnail = function(target, video) {

    var tnLink,
      icon,
      path,
      dimensions = video.width && video.height ? 'style="width:' + video.width + 'px;height:' + video.height + 'px;"' : '',
      customTn = target.find('img'),
      srcType = 'src',
      lazyClass = '',
      settings = this._core.settings,
      create = function(path) {
        icon = '<div class="owl-video-play-icon"></div>';

        if (settings.lazyLoad) {
          tnLink = '<div class="owl-video-tn ' + lazyClass + '" ' + srcType + '="' + path + '"></div>';
        } else {
          tnLink = '<div class="owl-video-tn" style="opacity:1;background-image:url(' + path + ')"></div>';
        }
        target.after(tnLink);
        target.after(icon);
      };

    // wrap video content into owl-video-wrapper div
    target.wrap('<div class="owl-video-wrapper"' + dimensions + '></div>');

    if (this._core.settings.lazyLoad) {
      srcType = 'data-src';
      lazyClass = 'owl-lazy';
    }

    // custom thumbnail
    if (customTn.length) {
      create(customTn.attr(srcType));
      customTn.remove();
      return false;
    }

    if (video.type === 'youtube') {
      path = "http://img.youtube.com/vi/" + video.id + "/hqdefault.jpg";
      create(path);
    } else if (video.type === 'vimeo') {
      $.ajax({
        type: 'GET',
        url: 'http://vimeo.com/api/v2/video/' + video.id + '.json',
        jsonp: 'callback',
        dataType: 'jsonp',
        success: function(data) {
          path = data[0].thumbnail_large;
          create(path);
        }
      });
    }
  };

  /**
   * Stops the current video.
   * @public
   */
  Video.prototype.stop = function() {
    this._core.trigger('stop', null, 'video');
    this._playing.find('.owl-video-frame').remove();
    this._playing.removeClass('owl-video-playing');
    this._playing = null;
  };

  /**
   * Starts the current video.
   * @public
   * @param {Event} ev - The event arguments.
   */
  Video.prototype.play = function(ev) {
    this._core.trigger('play', null, 'video');

    if (this._playing) {
      this.stop();
    }

    var target = $(ev.target || ev.srcElement),
      item = target.closest('.' + this._core.settings.itemClass),
      video = this._videos[item.attr('data-video')],
      width = video.width || '100%',
      height = video.height || this._core.$stage.height(),
      html, wrap;

    if (video.type === 'youtube') {
      html = '<iframe width="' + width + '" height="' + height + '" src="http://www.youtube.com/embed/'
        + video.id + '?autoplay=1&v=' + video.id + '" frameborder="0" allowfullscreen></iframe>';
    } else if (video.type === 'vimeo') {
      html = '<iframe src="http://player.vimeo.com/video/' + video.id + '?autoplay=1" width="' + width
        + '" height="' + height
        + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
    }

    item.addClass('owl-video-playing');
    this._playing = item;

    wrap = $('<div style="height:' + height + 'px; width:' + width + 'px" class="owl-video-frame">'
      + html + '</div>');
    target.after(wrap);
  };

  /**
   * Checks whether an video is currently in full screen mode or not.
   * @todo Bad style because looks like a readonly method but changes members.
   * @protected
   * @returns {Boolean}
   */
  Video.prototype.isInFullScreen = function() {

    // if Vimeo Fullscreen mode
    var element = document.fullscreenElement || document.mozFullScreenElement
      || document.webkitFullscreenElement;

    if (element && $(element).parent().hasClass('owl-video-frame')) {
      this._core.speed(0);
      this._fullscreen = true;
    }

    if (element && this._fullscreen && this._playing) {
      return false;
    }

    // comming back from fullscreen
    if (this._fullscreen) {
      this._fullscreen = false;
      return false;
    }

    // check full screen mode and window orientation
    if (this._playing) {
      if (this._core.state.orientation !== window.orientation) {
        this._core.state.orientation = window.orientation;
        return false;
      }
    }

    return true;
  };

  /**
   * Destroys the plugin.
   */
  Video.prototype.destroy = function() {
    var handler, property;

    this._core.$element.off('click.owl.video');

    for (handler in this._handlers) {
      this._core.$element.off(handler, this._handlers[handler]);
    }
    for (property in Object.getOwnPropertyNames(this)) {
      typeof this[property] != 'function' && (this[property] = null);
    }
  };

  $.fn.owlCarousel.Constructor.Plugins.Video = Video;

})(window.Zepto || window.jQuery, window, document);

/**
 * Animate Plugin
 * @version 2.0.0
 * @author Bartosz Wojciechowski
 * @license The MIT License (MIT)
 */
;(function($, window, document, undefined) {

  /**
   * Creates the animate plugin.
   * @class The Navigation Plugin
   * @param {Owl} scope - The Owl Carousel
   */
  var Animate = function(scope) {
    this.core = scope;
    this.core.options = $.extend({}, Animate.Defaults, this.core.options);
    this.swapping = true;
    this.previous = undefined;
    this.next = undefined;

    this.handlers = {
      'change.owl.carousel': $.proxy(function(e) {
        if (e.property.name == 'position') {
          this.previous = this.core.current();
          this.next = e.property.value;
        }
      }, this),
      'drag.owl.carousel dragged.owl.carousel translated.owl.carousel': $.proxy(function(e) {
        this.swapping = e.type == 'translated';
      }, this),
      'translate.owl.carousel': $.proxy(function(e) {
        if (this.swapping && (this.core.options.animateOut || this.core.options.animateIn)) {
          this.swap();
        }
      }, this)
    };

    this.core.$element.on(this.handlers);
  };

  /**
   * Default options.
   * @public
   */
  Animate.Defaults = {
    animateOut: false,
    animateIn: false
  };

  /**
   * Toggles the animation classes whenever an translations starts.
   * @protected
   * @returns {Boolean|undefined}
   */
  Animate.prototype.swap = function() {

    if (this.core.settings.items !== 1 || !this.core.support3d) {
      return;
    }

    this.core.speed(0);

    var left,
      clear = $.proxy(this.clear, this),
      previous = this.core.$stage.children().eq(this.previous),
      next = this.core.$stage.children().eq(this.next),
      incoming = this.core.settings.animateIn,
      outgoing = this.core.settings.animateOut;

    if (this.core.current() === this.previous) {
      return;
    }

    if (outgoing) {
      left = this.core.coordinates(this.previous) - this.core.coordinates(this.next);
      previous.css( { 'left': left + 'px' } )
        .addClass('animated owl-animated-out')
        .addClass(outgoing)
        .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', clear);
    }

    if (incoming) {
      next.addClass('animated owl-animated-in')
        .addClass(incoming)
        .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', clear);
    }
  };

  Animate.prototype.clear = function(e) {
    $(e.target).css( { 'left': '' } )
      .removeClass('animated owl-animated-out owl-animated-in')
      .removeClass(this.core.settings.animateIn)
      .removeClass(this.core.settings.animateOut);
    this.core.transitionEnd();
  }

  /**
   * Destroys the plugin.
   * @public
   */
  Animate.prototype.destroy = function() {
    var handler, property;

    for (handler in this.handlers) {
      this.core.$element.off(handler, this.handlers[handler]);
    }
    for (property in Object.getOwnPropertyNames(this)) {
      typeof this[property] != 'function' && (this[property] = null);
    }
  };

  $.fn.owlCarousel.Constructor.Plugins.Animate = Animate;

})(window.Zepto || window.jQuery, window, document);

/**
 * Autoplay Plugin
 * @version 2.0.0
 * @author Bartosz Wojciechowski
 * @license The MIT License (MIT)
 */
;(function($, window, document, undefined) {

  /**
   * Creates the autoplay plugin.
   * @class The Autoplay Plugin
   * @param {Owl} scope - The Owl Carousel
   */
  var Autoplay = function(scope) {
    this.core = scope;
    this.core.options = $.extend({}, Autoplay.Defaults, this.core.options);

    this.handlers = {
      'translated.owl.carousel refreshed.owl.carousel': $.proxy(function() {
        this.autoplay();
      }, this),
      'play.owl.autoplay': $.proxy(function(e, t, s) {
        this.play(t, s);
      }, this),
      'stop.owl.autoplay': $.proxy(function() {
        this.stop();
      }, this),
      'mouseover.owl.autoplay': $.proxy(function() {
        if (this.core.settings.autoplayHoverPause) {
          this.pause();
        }
      }, this),
      'mouseleave.owl.autoplay': $.proxy(function() {
        if (this.core.settings.autoplayHoverPause) {
          this.autoplay();
        }
      }, this)
    };

    this.core.$element.on(this.handlers);
  };

  /**
   * Default options.
   * @public
   */
  Autoplay.Defaults = {
    autoplay: false,
    autoplayTimeout: 5000,
    autoplayHoverPause: false,
    autoplaySpeed: false
  };

  /**
   * @protected
   * @todo Must be documented.
   */
  Autoplay.prototype.autoplay = function() {
    if (this.core.settings.autoplay && !this.core.state.videoPlay) {
      window.clearInterval(this.interval);

      this.interval = window.setInterval($.proxy(function() {
        this.play();
      }, this), this.core.settings.autoplayTimeout);
    } else {
      window.clearInterval(this.interval);
    }
  };

  /**
   * Starts the autoplay.
   * @public
   * @param {Number} [timeout] - ...
   * @param {Number} [speed] - ...
   * @returns {Boolean|undefined} - ...
   * @todo Must be documented.
   */
  Autoplay.prototype.play = function(timeout, speed) {
    // if tab is inactive - doesnt work in <IE10
    if (document.hidden === true) {
      return;
    }

    if (this.core.state.isTouch || this.core.state.isScrolling
      || this.core.state.isSwiping || this.core.state.inMotion) {
      return;
    }

    if (this.core.settings.autoplay === false) {
      window.clearInterval(this.interval);
      return;
    }

    this.core.next(this.core.settings.autoplaySpeed);
  };

  /**
   * Stops the autoplay.
   * @public
   */
  Autoplay.prototype.stop = function() {
    window.clearInterval(this.interval);
  };

  /**
   * Pauses the autoplay.
   * @public
   */
  Autoplay.prototype.pause = function() {
    window.clearInterval(this.interval);
  };

  /**
   * Destroys the plugin.
   */
  Autoplay.prototype.destroy = function() {
    var handler, property;

    window.clearInterval(this.interval);

    for (handler in this.handlers) {
      this.core.$element.off(handler, this.handlers[handler]);
    }
    for (property in Object.getOwnPropertyNames(this)) {
      typeof this[property] != 'function' && (this[property] = null);
    }
  };

  $.fn.owlCarousel.Constructor.Plugins.autoplay = Autoplay;

})(window.Zepto || window.jQuery, window, document);

/**
 * Navigation Plugin
 * @version 2.0.0
 * @author Artus Kolanowski
 * @license The MIT License (MIT)
 */
;(function($, window, document, undefined) {
  'use strict';

  /**
   * Creates the navigation plugin.
   * @class The Navigation Plugin
   * @param {Owl} carousel - The Owl Carousel.
   */
  var Navigation = function(carousel) {
    /**
     * Reference to the core.
     * @protected
     * @type {Owl}
     */
    this._core = carousel;

    /**
     * Indicates whether the plugin is initialized or not.
     * @protected
     * @type {Boolean}
     */
    this._initialized = false;

    /**
     * The current paging indexes.
     * @protected
     * @type {Array}
     */
    this._pages = [];

    /**
     * All DOM elements of the user interface.
     * @protected
     * @type {Object}
     */
    this._controls = {};

    /**
     * Markup for an indicator.
     * @protected
     * @type {Array.<String>}
     */
    this._templates = [];

    /**
     * The carousel element.
     * @type {jQuery}
     */
    this.$element = this._core.$element;

    /**
     * Overridden methods of the carousel.
     * @protected
     * @type {Object}
     */
    this._overrides = {
      next: this._core.next,
      prev: this._core.prev,
      to: this._core.to
    };

    /**
     * All event handlers.
     * @protected
     * @type {Object}
     */
    this._handlers = {
      'prepared.owl.carousel': $.proxy(function(e) {
        if (this._core.settings.dotsData) {
          this._templates.push($(e.content).find('[data-dot]').andSelf('[data-dot]').attr('data-dot'));
        }
      }, this),
      'add.owl.carousel': $.proxy(function(e) {
        if (this._core.settings.dotsData) {
          this._templates.splice(e.position, 0, $(e.content).find('[data-dot]').andSelf('[data-dot]').attr('data-dot'));
        }
      }, this),
      'remove.owl.carousel prepared.owl.carousel': $.proxy(function(e) {
        if (this._core.settings.dotsData) {
          this._templates.splice(e.position, 1);
        }
      }, this),
      'change.owl.carousel': $.proxy(function(e) {
        if (e.property.name == 'position') {
          if (!this._core.state.revert && !this._core.settings.loop && this._core.settings.navRewind) {
            var current = this._core.current(),
              maximum = this._core.maximum(),
              minimum = this._core.minimum();
            e.data = e.property.value > maximum
              ? current >= maximum ? minimum : maximum
              : e.property.value < minimum ? maximum : e.property.value;
          }
        }
      }, this),
      'changed.owl.carousel': $.proxy(function(e) {
        if (e.property.name == 'position') {
          this.draw();
        }
      }, this),
      'refreshed.owl.carousel': $.proxy(function() {
        if (!this._initialized) {
          this.initialize();
          this._initialized = true;
        }
        this._core.trigger('refresh', null, 'navigation');
        this.update();
        this.draw();
        this._core.trigger('refreshed', null, 'navigation');
      }, this)
    };

    // set default options
    this._core.options = $.extend({}, Navigation.Defaults, this._core.options);

    // register event handlers
    this.$element.on(this._handlers);
  }

  /**
   * Default options.
   * @public
   * @todo Rename `slideBy` to `navBy`
   */
  Navigation.Defaults = {
    nav: false,
    navRewind: true,
    navText: [ '', '' ],
    navSpeed: false,
    navElement: 'div',
    navContainer: false,
    navContainerClass: 'owl-nav',
    navClass: [ 'owl-prev', 'owl-next' ],
    slideBy: 1,
    dotClass: 'owl-dot',
    dotsClass: 'owl-dots',
    dots: true,
    dotsEach: false,
    dotData: false,
    dotsSpeed: false,
    dotsContainer: false,
    controlsClass: 'owl-controls'
  }

  /**
   * Initializes the layout of the plugin and extends the carousel.
   * @protected
   */
  Navigation.prototype.initialize = function() {
    var $container, override,
      options = this._core.settings;

    // create the indicator template
    if (!options.dotsData) {
      this._templates = [ $('<div>')
        .addClass(options.dotClass)
        .append($('<span>'))
        .prop('outerHTML') ];
    }

    // create controls container if needed
    if (!options.navContainer || !options.dotsContainer) {
      this._controls.$container = $('<div>')
        .addClass(options.controlsClass)
        .appendTo(this.$element);
    }

    // create DOM structure for absolute navigation
    this._controls.$indicators = options.dotsContainer ? $(options.dotsContainer)
      : $('<div>').hide().addClass(options.dotsClass).appendTo(this._controls.$container);

    this._controls.$indicators.on('click', 'div', $.proxy(function(e) {
      var index = $(e.target).parent().is(this._controls.$indicators)
        ? $(e.target).index() : $(e.target).parent().index();

      e.preventDefault();

      this.to(index, options.dotsSpeed);
    }, this));

    // create DOM structure for relative navigation
    $container = options.navContainer ? $(options.navContainer)
      : $('<div>').addClass(options.navContainerClass).prependTo(this._controls.$container);

    this._controls.$next = $('<' + options.navElement + '>');
    this._controls.$previous = this._controls.$next.clone();

    this._controls.$previous
      .addClass(options.navClass[0])
      .html(options.navText[0])
      .hide()
      .prependTo($container)
      .on('click', $.proxy(function(e) {
        this.prev(options.navSpeed);
      }, this));
    this._controls.$next
      .addClass(options.navClass[1])
      .html(options.navText[1])
      .hide()
      .appendTo($container)
      .on('click', $.proxy(function(e) {
        this.next(options.navSpeed);
      }, this));

    // override public methods of the carousel
    for (override in this._overrides) {
      this._core[override] = $.proxy(this[override], this);
    }
  }

  /**
   * Destroys the plugin.
   * @protected
   */
  Navigation.prototype.destroy = function() {
    var handler, control, property, override;

    for (handler in this._handlers) {
      this.$element.off(handler, this._handlers[handler]);
    }
    for (control in this._controls) {
      this._controls[control].remove();
    }
    for (override in this.overides) {
      this._core[override] = this._overrides[override];
    }
    for (property in Object.getOwnPropertyNames(this)) {
      typeof this[property] != 'function' && (this[property] = null);
    }
  }

  /**
   * Updates the internal state.
   * @protected
   */
  Navigation.prototype.update = function() {
    var i, j, k,
      options = this._core.settings,
      lower = this._core.clones().length / 2,
      upper = lower + this._core.items().length,
      size = options.center || options.autoWidth || options.dotData
        ? 1 : options.dotsEach || options.items;

    if (options.slideBy !== 'page') {
      options.slideBy = Math.min(options.slideBy, options.items);
    }

    if (options.dots || options.slideBy == 'page') {
      this._pages = [];

      for (i = lower, j = 0, k = 0; i < upper; i++) {
        if (j >= size || j === 0) {
          this._pages.push({
            start: i - lower,
            end: i - lower + size - 1
          });
          j = 0, ++k;
        }
        j += this._core.mergers(this._core.relative(i));
      }
    }
  }

  /**
   * Draws the user interface.
   * @todo The option `dotData` wont work.
   * @protected
   */
  Navigation.prototype.draw = function() {
    var difference, i, html = '',
      options = this._core.settings,
      $items = this._core.$stage.children(),
      index = this._core.relative(this._core.current());

    if (options.nav && !options.loop && !options.navRewind) {
      this._controls.$previous.toggleClass('disabled', index <= 0);
      this._controls.$next.toggleClass('disabled', index >= this._core.maximum());
    }

    this._controls.$previous.toggle(options.nav);
    this._controls.$next.toggle(options.nav);

    if (options.dots) {
      difference = this._pages.length - this._controls.$indicators.children().length;

      if (options.dotData && difference !== 0) {
        for (i = 0; i < this._controls.$indicators.children().length; i++) {
          html += this._templates[this._core.relative(i)];
        }
        this._controls.$indicators.html(html);
      } else if (difference > 0) {
        html = new Array(difference + 1).join(this._templates[0]);
        this._controls.$indicators.append(html);
      } else if (difference < 0) {
        this._controls.$indicators.children().slice(difference).remove();
      }

      this._controls.$indicators.find('.active').removeClass('active');
      this._controls.$indicators.children().eq($.inArray(this.current(), this._pages)).addClass('active');
    }

    this._controls.$indicators.toggle(options.dots);
  }

  /**
   * Extends event data.
   * @protected
   * @param {Event} event - The event object which gets thrown.
   */
  Navigation.prototype.onTrigger = function(event) {
    var settings = this._core.settings;

    event.page = {
      index: $.inArray(this.current(), this._pages),
      count: this._pages.length,
      size: settings && (settings.center || settings.autoWidth || settings.dotData
        ? 1 : settings.dotsEach || settings.items)
    };
  }

  /**
   * Gets the current page position of the carousel.
   * @protected
   * @returns {Number}
   */
  Navigation.prototype.current = function() {
    var index = this._core.relative(this._core.current());
    return $.grep(this._pages, function(o) {
      return o.start <= index && o.end >= index;
    }).pop();
  }

  /**
   * Gets the current succesor/predecessor position.
   * @protected
   * @returns {Number}
   */
  Navigation.prototype.getPosition = function(successor) {
    var position, length,
      options = this._core.settings;

    if (options.slideBy == 'page') {
      position = $.inArray(this.current(), this._pages);
      length = this._pages.length;
      successor ? ++position : --position;
      position = this._pages[((position % length) + length) % length].start;
    } else {
      position = this._core.relative(this._core.current());
      length = this._core.items().length;
      successor ? position += options.slideBy : position -= options.slideBy;
    }
    return position;
  }

  /**
   * Slides to the next item or page.
   * @public
   * @param {Number} [speed=false] - The time in milliseconds for the transition.
   */
  Navigation.prototype.next = function(speed) {
    $.proxy(this._overrides.to, this._core)(this.getPosition(true), speed);
  }

  /**
   * Slides to the previous item or page.
   * @public
   * @param {Number} [speed=false] - The time in milliseconds for the transition.
   */
  Navigation.prototype.prev = function(speed) {
    $.proxy(this._overrides.to, this._core)(this.getPosition(false), speed);
  }

  /**
   * Slides to the specified item or page.
   * @public
   * @param {Number} position - The position of the item or page.
   * @param {Number} [speed] - The time in milliseconds for the transition.
   * @param {Boolean} [standard=false] - Whether to use the standard behaviour or not.
   */
  Navigation.prototype.to = function(position, speed, standard) {
    var length;

    if (!standard) {
      length = this._pages.length;
      $.proxy(this._overrides.to, this._core)(this._pages[((position % length) + length) % length].start, speed);
    } else {
      $.proxy(this._overrides.to, this._core)(position, speed);
    }
  }

  $.fn.owlCarousel.Constructor.Plugins.Navigation = Navigation;

})(window.Zepto || window.jQuery, window, document);

/**
 * Hash Plugin
 * @version 2.0.0
 * @author Artus Kolanowski
 * @license The MIT License (MIT)
 */
;(function($, window, document, undefined) {
  'use strict';

  /**
   * Creates the hash plugin.
   * @class The Hash Plugin
   * @param {Owl} carousel - The Owl Carousel
   */
  var Hash = function(carousel) {
    /**
     * Reference to the core.
     * @protected
     * @type {Owl}
     */
    this._core = carousel;

    /**
     * Hash table for the hashes.
     * @protected
     * @type {Object}
     */
    this._hashes = {};

    /**
     * The carousel element.
     * @type {jQuery}
     */
    this.$element = this._core.$element;

    /**
     * All event handlers.
     * @protected
     * @type {Object}
     */
    this._handlers = {
      'initialized.owl.carousel': $.proxy(function() {
        if (this._core.settings.startPosition == 'URLHash') {
          $(window).trigger('hashchange.owl.navigation');
        }
      }, this),
      'prepared.owl.carousel': $.proxy(function(e) {
        var hash = $(e.content).find('[data-hash]').andSelf('[data-hash]').attr('data-hash');
        this._hashes[hash] = e.content;
      }, this)
    };

    // set default options
    this._core.options = $.extend({}, Hash.Defaults, this._core.options);

    // register the event handlers
    this.$element.on(this._handlers);

    // register event listener for hash navigation
    $(window).on('hashchange.owl.navigation', $.proxy(function() {
      var hash = window.location.hash.substring(1),
        items = this._core.$stage.children(),
        position = this._hashes[hash] && items.index(this._hashes[hash]) || 0;

      if (!hash) {
        return false;
      }

      this._core.to(position, false, true);
    }, this));
  }

  /**
   * Default options.
   * @public
   */
  Hash.Defaults = {
    URLhashListener: false
  }

  /**
   * Destroys the plugin.
   * @public
   */
  Hash.prototype.destroy = function() {
    var handler, property;

    $(window).off('hashchange.owl.navigation');

    for (handler in this._handlers) {
      this._core.$element.off(handler, this._handlers[handler]);
    }
    for (property in Object.getOwnPropertyNames(this)) {
      typeof this[property] != 'function' && (this[property] = null);
    }
  }

  $.fn.owlCarousel.Constructor.Plugins.Hash = Hash;

})(window.Zepto || window.jQuery, window, document);

//--------------------------------------------------------------------------------------------

/* ---------------------- 
  smooth scroller
---------------------- */

function ssc_init() {
    if (!document.body) return;
    var e = document.body;
    var t = document.documentElement;
    var n = window.innerHeight;
    var r = e.scrollHeight;
    ssc_root = document.compatMode.indexOf("CSS") >= 0 ? t : e;
    ssc_activeElement = e;
    ssc_initdone = true;
    if (top != self) {
        ssc_frame = true
    }
    else if (r > n && (e.offsetHeight <= n || t.offsetHeight <= n)) {
        ssc_root.style.height = "auto";
        if (ssc_root.offsetHeight <= n) {
            var i = document.createElement("div");
            i.style.clear = "both";
            e.appendChild(i)
        }
    }
    if (!ssc_fixedback) {
        e.style.backgroundAttachment = "scroll";
        t.style.backgroundAttachment = "scroll"
    }
    if (ssc_keyboardsupport) {
        ssc_addEvent("keydown", ssc_keydown)
    }
}

function ssc_scrollArray(e, t, n, r) {
    r || (r = 1e3);
    ssc_directionCheck(t, n);
    ssc_que.push({
        x: t,
        y: n,
        lastX: t < 0 ? .99 : -.99,
        lastY: n < 0 ? .99 : -.99,
        start: +(new Date)
    });
    if (ssc_pending) {
        return
    }
    var i = function () {
        var s = +(new Date);
        var o = 0;
        var u = 0;
        for (var a = 0; a < ssc_que.length; a++) {
            var f = ssc_que[a];
            var l = s - f.start;
            var c = l >= ssc_animtime;
            var h = c ? 1 : l / ssc_animtime;
            if (ssc_pulseAlgorithm) {
                h = ssc_pulse(h)
            }
            var p = f.x * h - f.lastX >> 0;
            var d = f.y * h - f.lastY >> 0;
            o += p;
            u += d;
            f.lastX += p;
            f.lastY += d;
            if (c) {
                ssc_que.splice(a, 1);
                a--
            }
        }
        if (t) {
            var v = e.scrollLeft;
            e.scrollLeft += o;
            if (o && e.scrollLeft === v) {
                t = 0
            }
        }
        if (n) {
            var m = e.scrollTop;
            e.scrollTop += u;
            if (u && e.scrollTop === m) {
                n = 0
            }
        }
        if (!t && !n) {
            ssc_que = []
        }
        if (ssc_que.length) {
            setTimeout(i, r / ssc_framerate + 1)
        }
        else {
            ssc_pending = false
        }
    };
    setTimeout(i, 0);
    ssc_pending = true
}

function ssc_wheel(e) {
    if (!ssc_initdone) {
        init()
    }
    var t = e.target;
    var n = ssc_overflowingAncestor(t);
    if (!n || e.defaultPrevented || ssc_isNodeName(ssc_activeElement, "embed") || ssc_isNodeName(t, "embed") && /\.pdf/i.test(t.src)) {
        return true
    }
    var r = e.wheelDeltaX || 0;
    var i = e.wheelDeltaY || 0;
    if (!r && !i) {
        i = e.wheelDelta || 0
    }
    if (Math.abs(r) > 1.2) {
        r *= ssc_stepsize / 120
    }
    if (Math.abs(i) > 1.2) {
        i *= ssc_stepsize / 120
    }
    ssc_scrollArray(n, -r, -i);
    e.preventDefault()
}

function ssc_keydown(e) {
    var t = e.target;
    var n = e.ctrlKey || e.altKey || e.metaKey;
    if (/input|textarea|embed/i.test(t.nodeName) || t.isContentEditable || e.defaultPrevented || n) {
        return true
    }
    if (ssc_isNodeName(t, "button") && e.keyCode === ssc_key.spacebar) {
        return true
    }
    var r, i = 0,
        s = 0;
    var o = ssc_overflowingAncestor(ssc_activeElement);
    var u = o.clientHeight;
    if (o == document.body) {
        u = window.innerHeight
    }
    switch (e.keyCode) {
    case ssc_key.up:
        s = -ssc_arrowscroll;
        break;
    case ssc_key.down:
        s = ssc_arrowscroll;
        break;
    case ssc_key.spacebar:
        r = e.shiftKey ? 1 : -1;
        s = -r * u * .9;
        break;
    case ssc_key.pageup:
        s = -u * .9;
        break;
    case ssc_key.pagedown:
        s = u * .9;
        break;
    case ssc_key.home:
        s = -o.scrollTop;
        break;
    case ssc_key.end:
        var a = o.scrollHeight - o.scrollTop - u;
        s = a > 0 ? a + 10 : 0;
        break;
    case ssc_key.left:
        i = -ssc_arrowscroll;
        break;
    case ssc_key.right:
        i = ssc_arrowscroll;
        break;
    default:
        return true
    }
    ssc_scrollArray(o, i, s);
    e.preventDefault()
}

function ssc_mousedown(e) {
    ssc_activeElement = e.target
}

function ssc_setCache(e, t) {
    for (var n = e.length; n--;) ssc_cache[ssc_uniqueID(e[n])] = t;
    return t
}

function ssc_overflowingAncestor(e) {
    var t = [];
    var n = ssc_root.scrollHeight;
    do {
        var r = ssc_cache[ssc_uniqueID(e)];
        if (r) {
            return ssc_setCache(t, r)
        }
        t.push(e);
        if (n === e.scrollHeight) {
            if (!ssc_frame || ssc_root.clientHeight + 10 < n) {
                return ssc_setCache(t, document.body)
            }
        }
        else if (e.clientHeight + 10 < e.scrollHeight) {
            overflow = getComputedStyle(e, "").getPropertyValue("overflow");
            if (overflow === "scroll" || overflow === "auto") {
                return ssc_setCache(t, e)
            }
        }
    } while (e = e.parentNode)
}

function ssc_addEvent(e, t, n) {
    window.addEventListener(e, t, n || false)
}

function ssc_removeEvent(e, t, n) {
    window.removeEventListener(e, t, n || false)
}

function ssc_isNodeName(e, t) {
    return e.nodeName.toLowerCase() === t.toLowerCase()
}

function ssc_directionCheck(e, t) {
    e = e > 0 ? 1 : -1;
    t = t > 0 ? 1 : -1;
    if (ssc_direction.x !== e || ssc_direction.y !== t) {
        ssc_direction.x = e;
        ssc_direction.y = t;
        ssc_que = []
    }
}

function ssc_pulse_(e) {
    var t, n, r;
    e = e * ssc_pulseScale;
    if (e < 1) {
        t = e - (1 - Math.exp(-e))
    }
    else {
        n = Math.exp(-1);
        e -= 1;
        r = 1 - Math.exp(-e);
        t = n + r * (1 - n)
    }
    return t * ssc_pulseNormalize
}

function ssc_pulse(e) {
    if (e >= 1) return 1;
    if (e <= 0) return 0;
    if (ssc_pulseNormalize == 1) {
        ssc_pulseNormalize /= ssc_pulse_(1)
    }
    return ssc_pulse_(e)
}
var ssc_framerate = 150;
var ssc_animtime = 500;
var ssc_stepsize = 150;
var ssc_pulseAlgorithm = true;
var ssc_pulseScale = 6;
var ssc_pulseNormalize = 1;
var ssc_keyboardsupport = true;
var ssc_arrowscroll = 50;
var ssc_frame = false;
var ssc_direction = {
    x: 0,
    y: 0
};
var ssc_initdone = false;
var ssc_fixedback = true;
var ssc_root = document.documentElement;
var ssc_activeElement;
var ssc_key = {
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    spacebar: 32,
    pageup: 33,
    pagedown: 34,
    end: 35,
    home: 36
};
var ssc_que = [];
var ssc_pending = false;
var ssc_cache = {};
setInterval(function () {
    ssc_cache = {}
}, 10 * 1e3);
var ssc_uniqueID = function () {
    var e = 0;
    return function (t) {
        return t.ssc_uniqueID || (t.ssc_uniqueID = e++)
    }
}();
var browser =  /chrome/.test(navigator.userAgent.toLowerCase()); 
if (browser) {
    ssc_addEvent("mousedown", ssc_mousedown);
    ssc_addEvent("mousewheel", ssc_wheel);
    ssc_addEvent("load", ssc_init)
}

//--------------------------------------------------------------------------------------------

/* ---------------------- 
  for classic ie
---------------------- */
/*!
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false */

( function( window ) {

'use strict';

// class helper functions from bonzo https://github.com/ded/bonzo

function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

// classList support for class management
// altho to be fair, the api sucks because it won't accept multiple classes at once
var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {
  // full names
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  // short names
  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( classie );
} else {
  // browser global
  window.classie = classie;
}

})( window );

//--------------------------------------------------------------------------------------------

/* ---------------------- 
  modernizer
---------------------- */

/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-borderradius-boxshadow-flexbox-hsla-multiplebgs-opacity-rgba-textshadow-cssanimations-csscolumns-generatedcontent-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-applicationcache-canvas-canvastext-draganddrop-hashchange-history-audio-video-indexeddb-input-inputtypes-localstorage-postmessage-sessionstorage-websockets-websqldatabase-webworkers-geolocation-inlinesvg-smil-svg-svgclippaths-touch-webgl-shiv-cssclasses-addtest-prefixed-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-load
 */
;

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.6.2',

    Modernizr = {},

    enableClasses = true,

    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  = document.createElement('input')  ,

    smile = ':)',

    toString = {}.toString,

    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),



    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),

    ns = {'svg': 'http://www.w3.org/2000/svg'},

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, 


    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
                body = document.body,
                fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
                      while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

                style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
          (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
                fakeBody.style.background = '';
                fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
        if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },



    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

            var isSupported = eventName in element;

        if ( !isSupported ) {
                if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

                    if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),


    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { 
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }

    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }

    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

            if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

            } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };



    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };


    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };



    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    tests['rgba'] = function() {
        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
            setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
                setCss('background:url(https://),url(https://),red url(https://)');

            return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };



    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
                setCssAll('opacity:.55');

                    return (/^0.55$/).test(mStyle.opacity);
    };


    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
                       (str1 + '-webkit- '.split(' ').join(str2 + str1) +
                       prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

                        if ( ret && 'webkitPerspective' in docElement.style ) {

                      injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };



    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };

    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };
    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

            try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                            bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                                                    bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };


    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    function webforms() {
                                            Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
                                  attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
                            Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                                                    if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                                        bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                                                                                  (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                                                                                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                                        bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                                        bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        }
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    Modernizr.input || webforms();


     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
                                              return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; 
     };


    setCss('');
    modElem = inputElem = null;

    ;(function(window, document) {
        var options = window.html5 || {};

        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        var supportsHtml5Styles;

        var expando = '_html5shiv';

        var expanID = 0;

        var expandoData = {};

        var supportsUnknownElements;

      (function() {
        try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
                    supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
                        (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
        } catch(e) {
          supportsHtml5Styles = true;
          supportsUnknownElements = true;
        }

      }());        function addStyleSheet(ownerDocument, cssText) {
        var p = ownerDocument.createElement('p'),
            parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

        p.innerHTML = 'x<style>' + cssText + '</style>';
        return parent.insertBefore(p.lastChild, parent.firstChild);
      }

        function getElements() {
        var elements = html5.elements;
        return typeof elements == 'string' ? elements.split(' ') : elements;
      }

          function getExpandoData(ownerDocument) {
        var data = expandoData[ownerDocument[expando]];
        if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
        }
        return data;
      }

        function createElement(nodeName, ownerDocument, data){
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
        }
        if (!data) {
            data = getExpandoData(ownerDocument);
        }
        var node;

        if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
        } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
        } else {
            node = data.createElem(nodeName);
        }

                                    return node.canHaveChildren && !reSkip.test(nodeName) ? data.frag.appendChild(node) : node;
      }

        function createDocumentFragment(ownerDocument, data){
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
        }
        data = data || getExpandoData(ownerDocument);
        var clone = data.frag.cloneNode(),
            i = 0,
            elems = getElements(),
            l = elems.length;
        for(;i<l;i++){
            clone.createElement(elems[i]);
        }
        return clone;
      }

        function shivMethods(ownerDocument, data) {
        if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
        }


        ownerDocument.createElement = function(nodeName) {
                if (!html5.shivMethods) {
              return data.createElem(nodeName);
          }
          return createElement(nodeName, ownerDocument, data);
        };

        ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
          'var n=f.cloneNode(),c=n.createElement;' +
          'h.shivMethods&&(' +
                    getElements().join().replace(/\w+/g, function(nodeName) {
              data.createElem(nodeName);
              data.frag.createElement(nodeName);
              return 'c("' + nodeName + '")';
            }) +
          ');return n}'
        )(html5, data.frag);
      }        function shivDocument(ownerDocument) {
        if (!ownerDocument) {
            ownerDocument = document;
        }
        var data = getExpandoData(ownerDocument);

        if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
          data.hasCSS = !!addStyleSheet(ownerDocument,
                    'article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}' +
                    'mark{background:#FF0;color:#000}'
          );
        }
        if (!supportsUnknownElements) {
          shivMethods(ownerDocument, data);
        }
        return ownerDocument;
      }        var html5 = {

            'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video',

            'shivCSS': (options.shivCSS !== false),

            'supportsUnknownElements': supportsUnknownElements,

            'shivMethods': (options.shivMethods !== false),

            'type': 'default',

            'shivDocument': shivDocument,

            createElement: createElement,

            createDocumentFragment: createDocumentFragment
      };        window.html5 = html5;

        shivDocument(document);

    }(this, document));

    Modernizr._version      = version;

    Modernizr._prefixes     = prefixes;
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;


    Modernizr.hasEvent      = isEventSupported;

    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };

    Modernizr.testAllProps  = testPropsAll;


    Modernizr.testStyles    = injectElementWithStyles;
    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
            return testPropsAll(prop, obj, elem);
      }
    };


    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                                                    (enableClasses ? ' js ' + classes.join(' ') : '');

    return Modernizr;

})(this, this.document);
/*yepnope1.5.4|WTFPL*/
(function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}})(this,document);
Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0));};
;
//--------------------------------------------------------------------------------------------

/* ---------------------- 
  retina
---------------------- */

(function(){var root=(typeof exports=='undefined'?window:exports);var config={check_mime_type:true,force_original_dimensions:true};root.Retina=Retina;function Retina(){}
Retina.configure=function(options){if(options===null)options={};for(var prop in options)config[prop]=options[prop];};Retina.init=function(context){if(context===null)context=root;var existing_onload=context.onload||function(){};context.onload=function(){var images=document.getElementsByTagName("img"),retinaImages=[],i,image;for(i=0;i<images.length;i++){image=images[i];retinaImages.push(new RetinaImage(image));}
existing_onload();};};Retina.isRetina=function(){var mediaQuery="(-webkit-min-device-pixel-ratio: 1.5),\
(min--moz-device-pixel-ratio: 1.5),\
(-o-min-device-pixel-ratio: 3/2),\
(min-resolution: 1.5dppx)";if(root.devicePixelRatio>1)
return true;if(root.matchMedia&&root.matchMedia(mediaQuery).matches)
return true;return false;};root.RetinaImagePath=RetinaImagePath;function RetinaImagePath(path,at_2x_path){this.path=path;if(typeof at_2x_path!=="undefined"&&at_2x_path!==null){this.at_2x_path=at_2x_path;this.perform_check=false;}else{this.at_2x_path=path.replace(/\.\w+$/,function(match){return"@2x"+ match;});this.perform_check=true;}}
RetinaImagePath.confirmed_paths=[];RetinaImagePath.prototype.is_external=function(){return!!(this.path.match(/^https?\:/i)&&!this.path.match('//'+ document.domain));};RetinaImagePath.prototype.check_2x_variant=function(callback){var http,that=this;if(this.is_external()){return callback(false);}else if(!this.perform_check&&typeof this.at_2x_path!=="undefined"&&this.at_2x_path!==null){return callback(true);}else if(this.at_2x_path in RetinaImagePath.confirmed_paths){return callback(true);}else{http=new XMLHttpRequest();http.open('HEAD',this.at_2x_path);http.onreadystatechange=function(){if(http.readyState!=4){return callback(false);}
if(http.status>=200&&http.status<=399){if(config.check_mime_type){var type=http.getResponseHeader('Content-Type');if(type===null||!type.match(/^image/i)){return callback(false);}}
RetinaImagePath.confirmed_paths.push(that.at_2x_path);return callback(true);}else{return callback(false);}};http.send();}};function RetinaImage(el){this.el=el;this.path=new RetinaImagePath(this.el.getAttribute('src'),this.el.getAttribute('data-at2x'));var that=this;this.path.check_2x_variant(function(hasVariant){if(hasVariant)that.swap();});}
root.RetinaImage=RetinaImage;RetinaImage.prototype.swap=function(path){if(typeof path=='undefined')path=this.path.at_2x_path;var that=this;function load(){if(!that.el.complete){setTimeout(load,5);}else{if(config.force_original_dimensions){that.el.setAttribute('width',that.el.offsetWidth);that.el.setAttribute('height',that.el.offsetHeight);}
that.el.setAttribute('src',path);}}
load();};if(Retina.isRetina()){Retina.init(root);}})();
//--------------------------------------------------------------------------------------------

/* ---------------------- 
  way point
---------------------- */
/*
jQuery Waypoints - v2.0.4
Copyright (c) 2011-2014 Caleb Troughton
Dual licensed under the MIT license and GPL license.
https://github.com/imakewebthings/jquery-waypoints/blob/master/licenses.txt
*/


(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define('waypoints', ['jquery'], function($) {
        return factory($, root);
      });
    } else {
      return factory(root.jQuery, root);
    }
  })(this, function($, window) {
    var $w, Context, Waypoint, allWaypoints, contextCounter, contextKey, contexts, isTouch, jQMethods, methods, resizeEvent, scrollEvent, waypointCounter, waypointKey, wp, wps;

    $w = $(window);
    isTouch = __indexOf.call(window, 'ontouchstart') >= 0;
    allWaypoints = {
      horizontal: {},
      vertical: {}
    };
    contextCounter = 1;
    contexts = {};
    contextKey = 'waypoints-context-id';
    resizeEvent = 'resize.waypoints';
    scrollEvent = 'scroll.waypoints';
    waypointCounter = 1;
    waypointKey = 'waypoints-waypoint-ids';
    wp = 'waypoint';
    wps = 'waypoints';
    Context = (function() {
      function Context($element) {
        var _this = this;

        this.$element = $element;
        this.element = $element[0];
        this.didResize = false;
        this.didScroll = false;
        this.id = 'context' + contextCounter++;
        this.oldScroll = {
          x: $element.scrollLeft(),
          y: $element.scrollTop()
        };
        this.waypoints = {
          horizontal: {},
          vertical: {}
        };
        this.element[contextKey] = this.id;
        contexts[this.id] = this;
        $element.bind(scrollEvent, function() {
          var scrollHandler;

          if (!(_this.didScroll || isTouch)) {
            _this.didScroll = true;
            scrollHandler = function() {
              _this.doScroll();
              return _this.didScroll = false;
            };
            return window.setTimeout(scrollHandler, $[wps].settings.scrollThrottle);
          }
        });
        $element.bind(resizeEvent, function() {
          var resizeHandler;

          if (!_this.didResize) {
            _this.didResize = true;
            resizeHandler = function() {
              $[wps]('refresh');
              return _this.didResize = false;
            };
            return window.setTimeout(resizeHandler, $[wps].settings.resizeThrottle);
          }
        });
      }

      Context.prototype.doScroll = function() {
        var axes,
          _this = this;

        axes = {
          horizontal: {
            newScroll: this.$element.scrollLeft(),
            oldScroll: this.oldScroll.x,
            forward: 'right',
            backward: 'left'
          },
          vertical: {
            newScroll: this.$element.scrollTop(),
            oldScroll: this.oldScroll.y,
            forward: 'down',
            backward: 'up'
          }
        };
        if (isTouch && (!axes.vertical.oldScroll || !axes.vertical.newScroll)) {
          $[wps]('refresh');
        }
        $.each(axes, function(aKey, axis) {
          var direction, isForward, triggered;

          triggered = [];
          isForward = axis.newScroll > axis.oldScroll;
          direction = isForward ? axis.forward : axis.backward;
          $.each(_this.waypoints[aKey], function(wKey, waypoint) {
            var _ref, _ref1;

            if ((axis.oldScroll < (_ref = waypoint.offset) && _ref <= axis.newScroll)) {
              return triggered.push(waypoint);
            } else if ((axis.newScroll < (_ref1 = waypoint.offset) && _ref1 <= axis.oldScroll)) {
              return triggered.push(waypoint);
            }
          });
          triggered.sort(function(a, b) {
            return a.offset - b.offset;
          });
          if (!isForward) {
            triggered.reverse();
          }
          return $.each(triggered, function(i, waypoint) {
            if (waypoint.options.continuous || i === triggered.length - 1) {
              return waypoint.trigger([direction]);
            }
          });
        });
        return this.oldScroll = {
          x: axes.horizontal.newScroll,
          y: axes.vertical.newScroll
        };
      };

      Context.prototype.refresh = function() {
        var axes, cOffset, isWin,
          _this = this;

        isWin = $.isWindow(this.element);
        cOffset = this.$element.offset();
        this.doScroll();
        axes = {
          horizontal: {
            contextOffset: isWin ? 0 : cOffset.left,
            contextScroll: isWin ? 0 : this.oldScroll.x,
            contextDimension: this.$element.width(),
            oldScroll: this.oldScroll.x,
            forward: 'right',
            backward: 'left',
            offsetProp: 'left'
          },
          vertical: {
            contextOffset: isWin ? 0 : cOffset.top,
            contextScroll: isWin ? 0 : this.oldScroll.y,
            contextDimension: isWin ? $[wps]('viewportHeight') : this.$element.height(),
            oldScroll: this.oldScroll.y,
            forward: 'down',
            backward: 'up',
            offsetProp: 'top'
          }
        };
        return $.each(axes, function(aKey, axis) {
          return $.each(_this.waypoints[aKey], function(i, waypoint) {
            var adjustment, elementOffset, oldOffset, _ref, _ref1;

            adjustment = waypoint.options.offset;
            oldOffset = waypoint.offset;
            elementOffset = $.isWindow(waypoint.element) ? 0 : waypoint.$element.offset()[axis.offsetProp];
            if ($.isFunction(adjustment)) {
              adjustment = adjustment.apply(waypoint.element);
            } else if (typeof adjustment === 'string') {
              adjustment = parseFloat(adjustment);
              if (waypoint.options.offset.indexOf('%') > -1) {
                adjustment = Math.ceil(axis.contextDimension * adjustment / 100);
              }
            }
            waypoint.offset = elementOffset - axis.contextOffset + axis.contextScroll - adjustment;
            if ((waypoint.options.onlyOnScroll && (oldOffset != null)) || !waypoint.enabled) {
              return;
            }
            if (oldOffset !== null && (oldOffset < (_ref = axis.oldScroll) && _ref <= waypoint.offset)) {
              return waypoint.trigger([axis.backward]);
            } else if (oldOffset !== null && (oldOffset > (_ref1 = axis.oldScroll) && _ref1 >= waypoint.offset)) {
              return waypoint.trigger([axis.forward]);
            } else if (oldOffset === null && axis.oldScroll >= waypoint.offset) {
              return waypoint.trigger([axis.forward]);
            }
          });
        });
      };

      Context.prototype.checkEmpty = function() {
        if ($.isEmptyObject(this.waypoints.horizontal) && $.isEmptyObject(this.waypoints.vertical)) {
          this.$element.unbind([resizeEvent, scrollEvent].join(' '));
          return delete contexts[this.id];
        }
      };

      return Context;

    })();
    Waypoint = (function() {
      function Waypoint($element, context, options) {
        var idList, _ref;

        options = $.extend({}, $.fn[wp].defaults, options);
        if (options.offset === 'bottom-in-view') {
          options.offset = function() {
            var contextHeight;

            contextHeight = $[wps]('viewportHeight');
            if (!$.isWindow(context.element)) {
              contextHeight = context.$element.height();
            }
            return contextHeight - $(this).outerHeight();
          };
        }
        this.$element = $element;
        this.element = $element[0];
        this.axis = options.horizontal ? 'horizontal' : 'vertical';
        this.callback = options.handler;
        this.context = context;
        this.enabled = options.enabled;
        this.id = 'waypoints' + waypointCounter++;
        this.offset = null;
        this.options = options;
        context.waypoints[this.axis][this.id] = this;
        allWaypoints[this.axis][this.id] = this;
        idList = (_ref = this.element[waypointKey]) != null ? _ref : [];
        idList.push(this.id);
        this.element[waypointKey] = idList;
      }

      Waypoint.prototype.trigger = function(args) {
        if (!this.enabled) {
          return;
        }
        if (this.callback != null) {
          this.callback.apply(this.element, args);
        }
        if (this.options.triggerOnce) {
          return this.destroy();
        }
      };

      Waypoint.prototype.disable = function() {
        return this.enabled = false;
      };

      Waypoint.prototype.enable = function() {
        this.context.refresh();
        return this.enabled = true;
      };

      Waypoint.prototype.destroy = function() {
        delete allWaypoints[this.axis][this.id];
        delete this.context.waypoints[this.axis][this.id];
        return this.context.checkEmpty();
      };

      Waypoint.getWaypointsByElement = function(element) {
        var all, ids;

        ids = element[waypointKey];
        if (!ids) {
          return [];
        }
        all = $.extend({}, allWaypoints.horizontal, allWaypoints.vertical);
        return $.map(ids, function(id) {
          return all[id];
        });
      };

      return Waypoint;

    })();
    methods = {
      init: function(f, options) {
        var _ref;

        if (options == null) {
          options = {};
        }
        if ((_ref = options.handler) == null) {
          options.handler = f;
        }
        this.each(function() {
          var $this, context, contextElement, _ref1;

          $this = $(this);
          contextElement = (_ref1 = options.context) != null ? _ref1 : $.fn[wp].defaults.context;
          if (!$.isWindow(contextElement)) {
            contextElement = $this.closest(contextElement);
          }
          contextElement = $(contextElement);
          context = contexts[contextElement[0][contextKey]];
          if (!context) {
            context = new Context(contextElement);
          }
          return new Waypoint($this, context, options);
        });
        $[wps]('refresh');
        return this;
      },
      disable: function() {
        return methods._invoke.call(this, 'disable');
      },
      enable: function() {
        return methods._invoke.call(this, 'enable');
      },
      destroy: function() {
        return methods._invoke.call(this, 'destroy');
      },
      prev: function(axis, selector) {
        return methods._traverse.call(this, axis, selector, function(stack, index, waypoints) {
          if (index > 0) {
            return stack.push(waypoints[index - 1]);
          }
        });
      },
      next: function(axis, selector) {
        return methods._traverse.call(this, axis, selector, function(stack, index, waypoints) {
          if (index < waypoints.length - 1) {
            return stack.push(waypoints[index + 1]);
          }
        });
      },
      _traverse: function(axis, selector, push) {
        var stack, waypoints;

        if (axis == null) {
          axis = 'vertical';
        }
        if (selector == null) {
          selector = window;
        }
        waypoints = jQMethods.aggregate(selector);
        stack = [];
        this.each(function() {
          var index;

          index = $.inArray(this, waypoints[axis]);
          return push(stack, index, waypoints[axis]);
        });
        return this.pushStack(stack);
      },
      _invoke: function(method) {
        this.each(function() {
          var waypoints;

          waypoints = Waypoint.getWaypointsByElement(this);
          return $.each(waypoints, function(i, waypoint) {
            waypoint[method]();
            return true;
          });
        });
        return this;
      }
    };
    $.fn[wp] = function() {
      var args, method;

      method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (methods[method]) {
        return methods[method].apply(this, args);
      } else if ($.isFunction(method)) {
        return methods.init.apply(this, arguments);
      } else if ($.isPlainObject(method)) {
        return methods.init.apply(this, [null, method]);
      } else if (!method) {
        return $.error("jQuery Waypoints needs a callback function or handler option.");
      } else {
        return $.error("The " + method + " method does not exist in jQuery Waypoints.");
      }
    };
    $.fn[wp].defaults = {
      context: window,
      continuous: true,
      enabled: true,
      horizontal: false,
      offset: 0,
      triggerOnce: false
    };
    jQMethods = {
      refresh: function() {
        return $.each(contexts, function(i, context) {
          return context.refresh();
        });
      },
      viewportHeight: function() {
        var _ref;

        return (_ref = window.innerHeight) != null ? _ref : $w.height();
      },
      aggregate: function(contextSelector) {
        var collection, waypoints, _ref;

        collection = allWaypoints;
        if (contextSelector) {
          collection = (_ref = contexts[$(contextSelector)[0][contextKey]]) != null ? _ref.waypoints : void 0;
        }
        if (!collection) {
          return [];
        }
        waypoints = {
          horizontal: [],
          vertical: []
        };
        $.each(waypoints, function(axis, arr) {
          $.each(collection[axis], function(key, waypoint) {
            return arr.push(waypoint);
          });
          arr.sort(function(a, b) {
            return a.offset - b.offset;
          });
          waypoints[axis] = $.map(arr, function(waypoint) {
            return waypoint.element;
          });
          return waypoints[axis] = $.unique(waypoints[axis]);
        });
        return waypoints;
      },
      above: function(contextSelector) {
        if (contextSelector == null) {
          contextSelector = window;
        }
        return jQMethods._filter(contextSelector, 'vertical', function(context, waypoint) {
          return waypoint.offset <= context.oldScroll.y;
        });
      },
      below: function(contextSelector) {
        if (contextSelector == null) {
          contextSelector = window;
        }
        return jQMethods._filter(contextSelector, 'vertical', function(context, waypoint) {
          return waypoint.offset > context.oldScroll.y;
        });
      },
      left: function(contextSelector) {
        if (contextSelector == null) {
          contextSelector = window;
        }
        return jQMethods._filter(contextSelector, 'horizontal', function(context, waypoint) {
          return waypoint.offset <= context.oldScroll.x;
        });
      },
      right: function(contextSelector) {
        if (contextSelector == null) {
          contextSelector = window;
        }
        return jQMethods._filter(contextSelector, 'horizontal', function(context, waypoint) {
          return waypoint.offset > context.oldScroll.x;
        });
      },
      enable: function() {
        return jQMethods._invoke('enable');
      },
      disable: function() {
        return jQMethods._invoke('disable');
      },
      destroy: function() {
        return jQMethods._invoke('destroy');
      },
      extendFn: function(methodName, f) {
        return methods[methodName] = f;
      },
      _invoke: function(method) {
        var waypoints;

        waypoints = $.extend({}, allWaypoints.vertical, allWaypoints.horizontal);
        return $.each(waypoints, function(key, waypoint) {
          waypoint[method]();
          return true;
        });
      },
      _filter: function(selector, axis, test) {
        var context, waypoints;

        context = contexts[$(selector)[0][contextKey]];
        if (!context) {
          return [];
        }
        waypoints = [];
        $.each(context.waypoints[axis], function(i, waypoint) {
          if (test(context, waypoint)) {
            return waypoints.push(waypoint);
          }
        });
        waypoints.sort(function(a, b) {
          return a.offset - b.offset;
        });
        return $.map(waypoints, function(waypoint) {
          return waypoint.element;
        });
      }
    };
    $[wps] = function() {
      var args, method;

      method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (jQMethods[method]) {
        return jQMethods[method].apply(null, args);
      } else {
        return jQMethods.aggregate.call(null, method);
      }
    };
    $[wps].settings = {
      resizeThrottle: 100,
      scrollThrottle: 30
    };
    return $w.load(function() {
      return $[wps]('refresh');
    });
  });

}).call(this);

//--------------------------------------------------------------------------------------------



/* ---------------------- 
  fancySelect
---------------------- */
// Generated by CoffeeScript 1.4.0
(function() {
  var $;

  $ = window.jQuery || window.Zepto || window.$;

  $.fn.fancySelect = function(opts) {
    var isiOS, settings;
    if (opts == null) {
      opts = {};
    }
    settings = $.extend({
      forceiOS: false,
      includeBlank: false
    }, opts);
    isiOS = !!navigator.userAgent.match(/iP(hone|od|ad)/i);
    return this.each(function() {
      var copyOptionsToList, disabled, options, sel, trigger, updateTriggerText, wrapper;
      sel = $(this);
      if (sel.hasClass('fancified') || sel[0].tagName !== 'SELECT') {
        return;
      }
      sel.addClass('fancified');
      sel.css({
        width: 1,
        height: 1,
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0
      });
      sel.wrap('<div class="fancy-select">');
      wrapper = sel.parent();
      if (sel.data('class')) {
        wrapper.addClass(sel.data('class'));
      }
      wrapper.append('<div class="trigger">');
      if (!(isiOS && !settings.forceiOS)) {
        wrapper.append('<ul class="options">');
      }
      trigger = wrapper.find('.trigger');
      options = wrapper.find('.options');
      disabled = sel.prop('disabled');
      if (disabled) {
        wrapper.addClass('disabled');
      }
      updateTriggerText = function() {
        return trigger.text(sel.find(':selected').text());
      };
      sel.on('blur', function() {
        if (trigger.hasClass('open')) {
          return setTimeout(function() {
            return trigger.trigger('close');
          }, 120);
        }
      });
      trigger.on('close', function() {
        trigger.removeClass('open');
        return options.removeClass('open');
      });
      trigger.on('click', function() {
        var offParent, parent;
        if (!disabled) {
          trigger.toggleClass('open');
          if (isiOS && !settings.forceiOS) {
            if (trigger.hasClass('open')) {
              return sel.focus();
            }
          } else {
            if (trigger.hasClass('open')) {
              parent = trigger.parent();
              offParent = parent.offsetParent();
              if ((parent.offset().top + parent.outerHeight() + options.outerHeight() + 20) > $(window).height() + $(window).scrollTop()) {
                options.addClass('overflowing');
              } else {
                options.removeClass('overflowing');
              }
            }
            options.toggleClass('open');
            if (!isiOS) {
              return sel.focus();
            }
          }
        }
      });
      sel.on('enable', function() {
        sel.prop('disabled', false);
        wrapper.removeClass('disabled');
        disabled = false;
        return copyOptionsToList();
      });
      sel.on('disable', function() {
        sel.prop('disabled', true);
        wrapper.addClass('disabled');
        return disabled = true;
      });
      sel.on('change', function(e) {
        if (e.originalEvent && e.originalEvent.isTrusted) {
          return e.stopPropagation();
        } else {
          return updateTriggerText();
        }
      });
      sel.on('keydown', function(e) {
        var hovered, newHovered, w;
        w = e.which;
        hovered = options.find('.hover');
        hovered.removeClass('hover');
        if (!options.hasClass('open')) {
          if (w === 13 || w === 32 || w === 38 || w === 40) {
            e.preventDefault();
            return trigger.trigger('click');
          }
        } else {
          if (w === 38) {
            e.preventDefault();
            if (hovered.length && hovered.index() > 0) {
              hovered.prev().addClass('hover');
            } else {
              options.find('li:last-child').addClass('hover');
            }
          } else if (w === 40) {
            e.preventDefault();
            if (hovered.length && hovered.index() < options.find('li').length - 1) {
              hovered.next().addClass('hover');
            } else {
              options.find('li:first-child').addClass('hover');
            }
          } else if (w === 27) {
            e.preventDefault();
            trigger.trigger('click');
          } else if (w === 13 || w === 32) {
            e.preventDefault();
            hovered.trigger('click');
          } else if (w === 9) {
            if (trigger.hasClass('open')) {
              trigger.trigger('close');
            }
          }
          newHovered = options.find('.hover');
          if (newHovered.length) {
            options.scrollTop(0);
            return options.scrollTop(newHovered.position().top - 12);
          }
        }
      });
      options.on('click', 'li', function(e) {
        sel.val($(this).data('value'));
        if (!isiOS) {
          sel.trigger('blur').trigger('focus');
        }
        options.find('.selected').removeClass('selected');
        $(e.currentTarget).addClass('selected');
        return sel.val($(this).data('value')).trigger('change').trigger('blur').trigger('focus');
      });
      options.on('mouseenter', 'li', function() {
        var hovered, nowHovered;
        nowHovered = $(this);
        hovered = options.find('.hover');
        hovered.removeClass('hover');
        return nowHovered.addClass('hover');
      });
      options.on('mouseleave', 'li', function() {
        return options.find('.hover').removeClass('hover');
      });
      copyOptionsToList = function() {
        var selOpts;
        updateTriggerText();
        if (isiOS && !settings.forceiOS) {
          return;
        }
        selOpts = sel.find('option');
        return sel.find('option').each(function(i, opt) {
          opt = $(opt);
          if (!opt.prop('disabled') && (opt.val() || settings.includeBlank)) {
            if (opt.prop('selected')) {
              return options.append("<li data-value=\"" + (opt.val()) + "\" class=\"selected\">" + (opt.text()) + "</li>");
            } else {
              return options.append("<li data-value=\"" + (opt.val()) + "\">" + (opt.text()) + "</li>");
            }
          }
        });
      };
      sel.on('update', function() {
        wrapper.find('.options').empty();
        return copyOptionsToList();
      });
      return copyOptionsToList();
    });
  };

}).call(this);

//--------------------------------------------------------------------------------------------


/* ---------------------- 
  drop down menu
---------------------- */
//-- dorop down menu --
// MSDropDown - jquery.dd.js
// author: Marghoob Suleman - http://www.marghoobsuleman.com/
// Date: 10 Nov, 2012 
// Version: 3.5.2
// Revision: 27
// web: www.marghoobsuleman.com
/*
// msDropDown is free jQuery Plugin: you can redistribute it and/or modify
// it under the terms of the either the MIT License or the Gnu General Public License (GPL) Version 2
*/ 
;eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('4 1E=1E||{};(9($){1E={3Y:{2o:\'3.5.2\'},3Z:"5D 5E",3q:20,41:9(v){6(v!==14){$(".2X").1m({1w:\'3r\',2b:\'4L\'})}1d{$(".2X").1m({1w:\'4M\',2b:\'3s\'})}},3t:\'\',3u:9(a,b,c){c=c||"42";4 d;25(c.2p()){1i"42":1i"4N":d=$(a).2o(b).1b("1V");1j}15 d}};$.3v={};$.2o={};$.2Y(11,$.3v,1E);$.2Y(11,$.2o,1E);6($.1P.1M===1B){$.1P.1M=$.1P.5F}6($.1P.18===1B){$.1P.18=$.1P.5G;$.1P.1x=$.1P.5H}6(1y $.3w.4O===\'9\'){$.3w[\':\'].43=$.3w.4O(9(b){15 9(a){15 $(a).1p().3x().3y(b.3x())>=0}})}1d{$.3w[\':\'].43=9(a,i,m){15 $(a).1p().3x().3y(m[3].3x())>=0}}9 1V(q,t){4 t=$.2Y(11,{1N:{1b:1g,1n:0,3z:1g,2c:0,1Q:14,2Z:5I},3A:\'1V\',1w:5J,1W:7,3B:0,30:11,1J:5K,26:14,3C:\'5L\',2q:\'1X\',3D:\'3r\',2d:11,1C:\'\',3E:0.7,44:11,3F:0,1u:14,3G:\'5M\',2e:\'\',2f:\'\',2g:11,1F:11,2r:11,18:{3u:1g,2G:1g,3H:1g,28:1g,1G:1g,2H:1g,2I:1g,1X:1g,45:1g,48:1g,2s:1g,2J:1g,31:1g,2t:1g,2u:1g}},t);4 u=1a;4 x={49:\'5N\',1R:\'5O\',4a:\'5P\',2h:\'5Q\',1l:\'5R\'};4 y={1V:t.3A,32:\'32\',4P:\'5S 5T\',4b:\'4b\',3I:\'3I\',2K:\'2K\',1q:\'1q\',2X:\'2X\',4Q:\'4Q\',4R:\'4R\',19:\'19\',4c:\'4c\',3J:"3J",4d:"4d",1h:"1h",33:"5U",34:\'34\',3K:\'3K\'};4 z={12:\'5V\',2v:\'2v\',4S:\'5W 4T\',3L:"3L"};4 A=14,1Y=14,1k=14,3M={},q,35={},36=14;4 B=40,4e=38,4f=37,4g=39,4U=27,4h=13,3a=47,4i=16,4j=17,4V=8,4W=46;4 C=14,2i=14,3b=1g,2L=14,3c,5X=14;4 D=3d,3e=4k.5Y.5Z,4X=3e.60(/61/i);t.2g=t.2g.2j();t.1F=t.1F.2j();4 E=9(a){15(62.4Y.2j.4Z(a)=="[50 51]")?11:14};4 F=9(){4 a=3e.3y("63");6(a>0){15 2w(3e.64(a+5,3e.3y(".",a)))}1d{15 0}};4 G=9(){t.3A=$("#"+q).1b("65")||t.3A;t.1W=$("#"+q).1b("66")||t.1W;6($("#"+q).1b("52")==14){t.30=$("#"+q).1b("52")};t.26=$("#"+q).1b("53")||t.26;t.3C=$("#"+q).1b("67")||t.3C;t.2q=$("#"+q).1b("2q")||t.2q;t.3D=$("#"+q).1b("68")||t.3D;t.2d=$("#"+q).1b("69")||t.2d;t.3E=$("#"+q).1b("6a")||t.3E;t.3F=$("#"+q).1b("54")||t.3F;t.1u=$("#"+q).1b("6b")||t.1u;t.3G=$("#"+q).1b("6c")||t.3G;t.2e=$("#"+q).1b("2e")||t.2e;t.2f=$("#"+q).1b("2f")||t.2f;t.2g=$("#"+q).1b("6d")||t.2g;t.1F=$("#"+q).1b("6e")||t.1F;t.2r=$("#"+q).1b("6f")||t.2r;t.2g=t.2g.2j();t.1F=t.1F.2j();t.2r=t.2r.2j()};4 H=9(a){6(3M[a]===1B){3M[a]=D.6g(a)}15 3M[a]};4 I=9(a){4 b=L("1l");15 $("#"+b+" 12."+z.12).1o(a)};4 J=9(){6(t.1N.1b){4 a=["1h","1D","1r"];2M{6(!q.1H){q.1H="42"+1E.3q};t.1N.1b=55(t.1N.1b);4 b="6h"+(1E.3q++);4 c={};c.1H=b;c.3z=t.1N.3z||q.1H;6(t.1N.2c>0){c.2c=t.1N.2c};c.1Q=t.1N.1Q;4 d=O("4N",c);1Z(4 i=0;i<t.1N.1b.1c;i++){4 f=t.1N.1b[i];4 g=3N 4l(f.1p,f.1f);1Z(4 p 3O f){6(p.2p()!=\'1p\'){4 h=($.6i(p.2p(),a)!=-1)?"1b-":"";g.6j(h+p,f[p])}};d.1K[i]=g};H(q.1H).1s(d);d.1n=t.1N.1n;$(d).1m({2Z:t.1N.2Z+\'2N\'});q=d}2O(e){6k"6l 6m 6n 6o 3O 6p 1b.";}}};4 K=9(){J();6(!q.1H){q.1H="6q"+(1E.3q++)};q=q.1H;u.6r=q;G();1k=H(q).2K;4 a=t.1u;6(a.2j()==="11"){H(q).1Q=11;t.1u=11};A=(H(q).2c>1||H(q).1Q==11)?11:14;6(A){1Y=H(q).1Q};56();57();1v("58",2k());1v("59",$("#"+q+" 1S:19"));4 b=L("1l");3c=$("#"+b+" 12."+y.19);6(t.2g==="11"){$("#"+q).18("2H",9(){21(1a.1n)})};H(q).4m=9(e){$("#"+q).2o().1b("1V").4m()}};4 L=9(a){15 q+x[a]};4 M=9(a){4 s=(a.1C===1B)?"":a.1C.5a;15 s};4 N=9(a){4 b=\'\',1r=\'\',1h=\'\',1f=-1,1p=\'\',1e=\'\',1z=\'\',1o;6(a!==1B){4 c=a.1r||"";6(c!=""){4 d=/^\\{.*\\}$/;4 e=d.6s(c);6(e&&t.2d){4 f=55("["+c+"]")};1r=(e&&t.2d)?f[0].1r:1r;1h=(e&&t.2d)?f[0].1h:1h;b=(e&&t.2d)?f[0].1D:c;1z=(e&&t.2d)?f[0].1z:1z;1o=a.1o};1p=a.1p||\'\';1f=a.1f||\'\';1e=a.1e||"";1r=$(a).1M("1b-1r")||$(a).1b("1r")||(1r||"");1h=$(a).1M("1b-1h")||$(a).1b("1h")||(1h||"");b=$(a).1M("1b-1D")||$(a).1b("1D")||(b||"");1z=$(a).1M("1b-1z")||$(a).1b("1z")||(1z||"");1o=$(a).1o()};4 o={1D:b,1r:1r,1h:1h,1f:1f,1p:1p,1e:1e,1z:1z,1o:1o};15 o};4 O=9(a,b,c){4 d=D.6t(a);6(b){1Z(4 i 3O b){25(i){1i"1C":d.1C.5a=b[i];1j;2P:d[i]=b[i];1j}}};6(c){d.6u=c};15 d};4 P=9(){4 a=L("49");6($("#"+a).1c==0){4 b={1C:\'1w: 4M;4n: 2x;2b: 3s;\',1e:y.2X};b.1H=a;4 c=O("2Q",b);$("#"+q).5b(c);$("#"+q).6v($("#"+a))}1d{$("#"+a).1m({1w:0,4n:\'2x\',2b:\'3s\'})};H(q).3f=-1};4 Q=9(){4 a=(t.1F=="11")?" 2R":"";4 b={1e:y.1V+" 5c"+a};4 c=M(H(q));4 w=$("#"+q).6w();b.1C="2Z: "+w+"2N;";6(c.1c>0){b.1C=b.1C+""+c};b.1H=L("1R");b.3f=H(q).3f;4 d=O("2Q",b);15 d};4 R=9(){4 a;6(H(q).1n>=0){a=H(q).1K[H(q).1n]}1d{a={1f:\'\',1p:\'\'}}4 b="",4o="";4 c=$("#"+q).1b("53");6(c){t.26=c};6(t.26!=14){b=" "+t.26;4o=" "+a.1e};4 d=(t.1F=="11")?" "+z.2v:"";4 e=O("2Q",{1e:y.32+b+d});4 f=O("2l",{1e:y.4c});4 g=O("2l",{1e:y.4P});4 h=L("4a");4 i=O("2l",{1e:y.3I+4o,1H:h});4 j=N(a);4 k=j.1D;4 l=j.1p||"";6(k!=""&&t.30){4 m=O("3P");m.4p=k;6(j.1z!=""){m.1e=j.1z+" "}};4 n=O("2l",{1e:y.33},l);e.1s(f);e.1s(g);6(m){i.1s(m)};i.1s(n);e.1s(i);4 o=O("2l",{1e:y.1h},j.1h);i.1s(o);15 e};4 S=9(){4 a=L("2h");4 b=(t.1F=="11")?"2R":"";4 c=O("2y",{1H:a,5d:\'1p\',1f:\'\',6x:\'1x\',1e:\'1p 4T \'+b,1C:\'22: 2z\'});15 c};4 T=9(a){4 b={};4 c=M(a);6(c.1c>0){b.1C=c};4 d=(a.2K)?y.2K:y.1q;d=(a.19)?(d+" "+y.19):d;d=d+" "+z.12;b.1e=d;6(t.26!=14){b.1e=d+" "+a.1e};4 e=O("12",b);4 f=N(a);6(f.1r!=""){e.1r=f.1r};4 g=f.1D;6(g!=""&&t.30){4 h=O("3P");h.4p=g;6(f.1z!=""){h.1e=f.1z+" "}};6(f.1h!=""){4 i=O("2l",{1e:y.1h},f.1h)};4 j=a.1p||"";4 k=O("2l",{1e:y.33},j);6(t.1u===11){4 l=O("2y",{5d:\'3g\',3z:q+t.3G+\'[]\',1f:a.1f||"",1e:"3g"});e.1s(l);6(t.1u===11){l.29=(a.19)?11:14}};6(h){e.1s(h)};e.1s(k);6(i){e.1s(i)}1d{6(h){h.1e=h.1e+z.3L}};4 m=O("2Q",{1e:\'6y\'});e.1s(m);15 e};4 U=9(){4 a=L("1l");4 b={1e:y.4b+" 6z "+z.4S,1H:a};6(A==14){b.1C="z-1o: "+t.1J}1d{b.1C="z-1o:1"};4 c=$("#"+q).1b("54")||t.3F;6(c){b.1C=(b.1C||"")+";2Z:"+c};4 d=O("2Q",b);4 e=O("4q");6(t.26!=14){e.1e=t.26};4 f=H(q).23;1Z(4 i=0;i<f.1c;i++){4 g=f[i];4 h;6(g.4r.2p()=="3J"){h=O("12",{1e:y.3J});4 k=O("2l",{1e:y.4d},g.33);h.1s(k);4 l=g.23;4 m=O("4q");1Z(4 j=0;j<l.1c;j++){4 n=T(l[j]);m.1s(n)};h.1s(m)}1d{h=T(g)};e.1s(h)};d.1s(e);15 d};4 V=9(a){4 b=L("1l");6(a){6(a==-1){$("#"+b).1m({1w:"3r",4n:"3r"})}1d{$("#"+b).1m("1w",a+"2N")};15 14};4 c;4 d=H(q).1K.1c;6(d>t.1W||t.1W){4 e=$("#"+b+" 12:6A");4 f=2w(e.1m("5e-6B"))+2w(e.1m("5e-2a"));6(t.3B===0){$("#"+b).1m({5f:\'2x\',22:\'3Q\'});t.3B=3h.6C(e.1w());$("#"+b).1m({5f:\'1T\'});6(!A||t.1u===11){$("#"+b).1m({22:\'2z\'})}};c=((t.3B+f)*3h.5g(t.1W,d))+3}1d 6(A){c=$("#"+q).1w()};15 c};4 W=9(){4 j=L("1l");$("#"+j).18("1X",9(e){6(1k===11)15 14;e.1U();e.2m();6(A){3R()}});$("#"+j+" 12."+y.1q).18("1X",9(e){6(e.5h.4r.2p()!=="2y"){2A(1a)}});$("#"+j+" 12."+y.1q).18("2t",9(e){6(1k===11)15 14;3c=$("#"+j+" 12."+y.19);3b=1a;e.1U();e.2m();6(t.1u===11){6(e.5h.4r.2p()==="2y"){2i=11}};6(A===11){6(1Y){6(C===11){$(1a).1t(y.19);4 a=$("#"+j+" 12."+y.19);4 b=I(1a);6(a.1c>1){4 c=$("#"+j+" 12."+z.12);4 d=I(a[0]);4 f=I(a[1]);6(b>f){d=(b);f=f+1};1Z(4 i=3h.5g(d,f);i<=3h.6D(d,f);i++){4 g=c[i];6($(g).3S(y.1q)){$(g).1t(y.19)}}}}1d 6(2i===11){$(1a).6E(y.19);6(t.1u===11){4 h=1a.4s[0];h.29=!h.29}}1d{$("#"+j+" 12."+y.19).1I(y.19);$("#"+j+" 2y:3g").1M("29",14);$(1a).1t(y.19);6(t.1u===11){1a.4s[0].29=11}}}1d{$("#"+j+" 12."+y.19).1I(y.19);$(1a).1t(y.19)}}1d{$("#"+j+" 12."+y.19).1I(y.19);$(1a).1t(y.19)}});$("#"+j+" 12."+y.1q).18("3i",9(e){6(1k===11)15 14;e.1U();e.2m();6(3b!=1g){6(1Y){$(1a).1t(y.19);6(t.1u===11){1a.4s[0].29=11}}}});$("#"+j+" 12."+y.1q).18("2s",9(e){6(1k===11)15 14;$(1a).1t(y.34)});$("#"+j+" 12."+y.1q).18("2J",9(e){6(1k===11)15 14;$("#"+j+" 12."+y.34).1I(y.34)});$("#"+j+" 12."+y.1q).18("2u",9(e){6(1k===11)15 14;e.1U();e.2m();6(t.1u===11){2i=14};4 a=$("#"+j+" 12."+y.19).1c;2L=(3c.1c!=a||a==0)?11:14;3j();3k();3R();3b=1g});6(t.44==14){$("#"+j+" 12."+z.12).18("1X",9(e){6(1k===11)15 14;2B(1a,"1X")});$("#"+j+" 12."+z.12).18("3i",9(e){6(1k===11)15 14;2B(1a,"3i")});$("#"+j+" 12."+z.12).18("2s",9(e){6(1k===11)15 14;2B(1a,"2s")});$("#"+j+" 12."+z.12).18("2J",9(e){6(1k===11)15 14;2B(1a,"2J")});$("#"+j+" 12."+z.12).18("2t",9(e){6(1k===11)15 14;2B(1a,"2t")});$("#"+j+" 12."+z.12).18("2u",9(e){6(1k===11)15 14;2B(1a,"2u")})}};4 X=9(){4 a=L("1l");$("#"+a).1x("1X");$("#"+a+" 12."+y.1q).1x("3i");$("#"+a+" 12."+y.1q).1x("1X");$("#"+a+" 12."+y.1q).1x("2s");$("#"+a+" 12."+y.1q).1x("2J");$("#"+a+" 12."+y.1q).1x("2t");$("#"+a+" 12."+y.1q).1x("2u")};4 Y=9(a,b,c){$("#"+a).1x(b,c);$("#"+a).4t(b);$("#"+a).18(b,c)};4 Z=9(){4 a=L("1R");4 b=L("2h");4 c=L("1l");$("#"+a).18(t.2q,9(e){6(1k===11)15 14;1O(t.2q);e.1U();e.2m();3T(e)});$("#"+a).18("2S",9(e){4 k=e.6F;6(!36&&(k==4h||k==4e||k==B||k==4f||k==4g||(k>=3a&&!A))){3T(e);6(k>=3a){4u()}1d{e.1U();e.6G()}}});$("#"+a).18("31",4v);$("#"+a).18("2I",4w);$("#"+b).18("2I",9(e){Y(a,"31",4v)});W();$("#"+a).18("45",5i);$("#"+a).18("48",5j);$("#"+a).18("3i",5k);$("#"+a).18("6H",5l);$("#"+a).18("2t",5m);$("#"+a).18("2u",5n)};4 4v=9(e){1O("31")};4 4w=9(e){1O("2I")};4 3U=9(){4 a=L("1R");4 b=L("1l");6(A===11&&t.1u===14){$("#"+a+" ."+y.32).3l();$("#"+b).1m({22:\'3Q\',2b:\'4L\'})}1d{6(t.1u===14){1Y=14};$("#"+a+" ."+y.32).2C();$("#"+b).1m({22:\'2z\',2b:\'3s\'});4 c=$("#"+b+" 12."+y.19)[0];$("#"+b+" 12."+y.19).1I(y.19);4 d=I($(c).1t(y.19));21(d)};V(V())};4 4x=9(){4 a=L("1R");4 b=(1k==11)?t.3E:1;6(1k===11){$("#"+a).1t(y.3K)}1d{$("#"+a).1I(y.3K)}};4 5o=9(){4 a=L("2h");6(t.2r=="11"){$("#"+a).18("2T",5p)};3U();4x()};4 57=9(){4 a=Q();4 b=R();a.1s(b);4 c=S();a.1s(c);4 d=U();a.1s(d);$("#"+q).5b(a);P();5o();Z();4 e=L("1l");6(t.2e!=\'\'){$("#"+e).2e(t.2e)};6(t.2f!=\'\'){$("#"+e).2f(t.2f)};6(1y t.18.3u=="9"){t.18.3u.24(u,1A)}};4 4y=9(b){4 c=L("1l");$("#"+c+" 12."+z.12).1I(y.19);6(t.1u===11){$("#"+c+" 12."+z.12+" 2y.3g").1M("29",14)};6(E(b)===11){1Z(4 i=0;i<b.1c;i++){4z(b[i])}}1d{4z(b)};9 4z(a){$($("#"+c+" 12."+z.12)[a]).1t(y.19);6(t.1u===11){$($("#"+c+" 12."+z.12)[a]).3m("2y.3g").1M("29","29")}}};4 4A=9(a,b){4 c=L("1l");4 d=a||$("#"+c+" 12."+y.19);1Z(4 i=0;i<d.1c;i++){4 e=(b===11)?d[i]:I(d[i]);H(q).1K[e].19="19"};21(d)};4 3j=9(){4 a=L("1l");4 b=$("#"+a+" 12."+y.19);6(1Y&&(C||2i)||2L){H(q).1n=-1};4 c;6(b.1c==0){c=-1}1d 6(b.1c>1){4A(b)}1d{c=I($("#"+a+" 12."+y.19))};6((H(q).1n!=c||2L)&&b.1c<=1){2L=14;4 e=3n("2H");H(q).1n=c;21(c);6(1y t.18.2H=="9"){4 d=2k();t.18.2H(d.1b,d.1L)};$("#"+q).4t("2H")}};4 21=9(a,b){6(a!==1B){4 c,1f,2D;6(a==-1){c=-1;1f="";2D="";2E(-1)}1d{6(1y a!="50"){4 d=H(q).1K[a];H(q).1n=a;c=a;1f=N(d);2D=(a>=0)?H(q).1K[a].1p:"";2E(1B,1f);1f=1f.1f}1d{c=(b&&b.1o)||H(q).1n;1f=(b&&b.1f)||H(q).1f;2D=(b&&b.1p)||H(q).1K[H(q).1n].1p||"";2E(c)}};1v("1n",c);1v("1f",1f);1v("2D",2D);1v("23",H(q).23);1v("58",2k());1v("59",$("#"+q+" 1S:19"))}};4 3n=9(a){4 b={2U:14,2V:14,2n:14};4 c=$("#"+q);2M{6(c.1M("18"+a)!==1g){b.2n=11;b.2U=11}}2O(e){}4 d;6(1y $.5q=="9"){d=$.5q(c[0],"4B")}1d{d=c.1b("4B")};6(d&&d[a]){b.2n=11;b.2V=11};15 b};4 3R=9(){3k();$("5r").18("1X",2A);$(3d).18("2S",4C);$(3d).18("2T",4D)};4 3k=9(){$("5r").1x("1X",2A);$(3d).1x("2S",4C);$(3d).1x("2T",4D)};4 5p=9(e){6(e.2W<3a&&e.2W!=4V&&e.2W!=4W){15 14};4 a=L("1l");4 b=L("2h");4 c=H(b).1f;6(c.1c==0){$("#"+a+" 12:2x").2C();V(V())}1d{$("#"+a+" 12").3l();4 d=$("#"+a+" 12:43(\'"+c+"\')").2C();6($("#"+a+" 12:1T").1c<=t.1W){V(-1)};6(d.1c>0&&!A||!1Y){$("#"+a+" ."+y.19).1I(y.19);$(d[0]).1t(y.19)}};6(!A){3o()}};4 4u=9(){6(t.2r=="11"){4 a=L("1R");4 b=L("2h");6($("#"+b+":2x").1c>0&&2i==14){$("#"+b+":2x").2C().6I("");Y(a,"2I",4w);H(b).31()}}};4 5s=9(){4 a=L("2h");6($("#"+a+":1T").1c>0){$("#"+a+":1T").3l();H(a).2I()}};4 4C=9(a){4 b=L("2h");4 c=L("1l");25(a.2W){1i B:1i 4g:a.1U();a.2m();5t();1j;1i 4e:1i 4f:a.1U();a.2m();5u();1j;1i 4U:1i 4h:a.1U();a.2m();2A();4 d=$("#"+c+" 12."+y.19).1c;2L=(3c.1c!=d||d==0)?11:14;3j();3k();3b=1g;1j;1i 4i:C=11;1j;1i 4j:2i=11;1j;2P:6(a.2W>=3a&&A===14){4u()};1j};6(1k===11)15 14;1O("2S")};4 4D=9(a){25(a.2W){1i 4i:C=14;1j;1i 4j:2i=14;1j};6(1k===11)15 14;1O("2T")};4 5i=9(a){6(1k===11)15 14;1O("45")};4 5j=9(a){6(1k===11)15 14;1O("48")};4 5k=9(a){6(1k===11)15 14;a.1U();1O("2s")};4 5l=9(a){6(1k===11)15 14;a.1U();1O("2J")};4 5m=9(a){6(1k===11)15 14;1O("2t")};4 5n=9(a){6(1k===11)15 14;1O("2u")};4 3V=9(a,b){4 c={2U:14,2V:14,2n:14};6($(a).1M("18"+b)!=1B){c.2n=11;c.2U=11};4 d=$(a).1b("4B");6(d&&d[b]){c.2n=11;c.2V=11};15 c};4 2B=9(a,b){6(t.44==14){4 c=H(q).1K[I(a)];6(3V(c,b).2n===11){6(3V(c,b).2U===11){c["18"+b]()};6(3V(c,b).2V===11){25(b){1i"2S":1i"2T":1j;2P:$(c).4t(b);1j}};15 14}}};4 1O=9(a){6(1y t.18[a]=="9"){t.18[a].24(1a,1A)};6(3n(a).2n===11){6(3n(a).2U===11){H(q)["18"+a]()}1d 6(3n(a).2V===11){25(a){1i"2S":1i"2T":1j;2P:$("#"+q).6J(a);1j}};15 14}};4 3W=9(a){4 b=L("1l");a=(a!==1B)?a:$("#"+b+" 12."+y.19);6(a.1c>0){4 c=2w(($(a).2b().2a));4 d=2w($("#"+b).1w());6(c>d){4 e=c+$("#"+b).3p()-(d/2);$("#"+b).5v({3p:e},5w)}}};4 5t=9(){4 b=L("1l");4 c=$("#"+b+" 12:1T."+z.12);4 d=$("#"+b+" 12:1T."+y.19);d=(d.1c==0)?c[0]:d;4 e=$("#"+b+" 12:1T."+z.12).1o(d);6((e<c.1c-1)){e=4E(e);6(e<c.1c){6(!C||!A||!1Y){$("#"+b+" ."+y.19).1I(y.19)};$(c[e]).1t(y.19);2E(e);6(A==11){3j()};3W($(c[e]))};6(!A){3o()}};9 4E(a){a=a+1;6(a>c.1c){15 a};6($(c[a]).3S(y.1q)===11){15 a};15 a=4E(a)}};4 5u=9(){4 b=L("1l");4 c=$("#"+b+" 12:1T."+y.19);4 d=$("#"+b+" 12:1T."+z.12);4 e=$("#"+b+" 12:1T."+z.12).1o(c[0]);6(e>=0){e=4F(e);6(e>=0){6(!C||!A||!1Y){$("#"+b+" ."+y.19).1I(y.19)};$(d[e]).1t(y.19);2E(e);6(A==11){3j()};6(2w(($(d[e]).2b().2a+$(d[e]).1w()))<=0){4 f=($("#"+b).3p()-$("#"+b).1w())-$(d[e]).1w();$("#"+b).5v({3p:f},5w)}};6(!A){3o()}};9 4F(a){a=a-1;6(a<0){15 a};6($(d[a]).3S(y.1q)===11){15 a};15 a=4F(a)}};4 3o=9(){4 a=L("1R");4 b=L("1l");4 c=$("#"+a).5x();4 d=$("#"+a).1w();4 e=$(4k).1w();4 f=$(4k).3p();4 g=$("#"+b).1w();4 h=$("#"+a).1w();4 i=t.3D.2p();6(((e+f)<3h.6K(g+d+c.2a)||i==\'6L\')&&i!=\'6M\'){h=g;$("#"+b).1m({2a:"-"+h+"2N",22:\'3Q\',1J:t.1J});6(t.1F=="11"){$("#"+a).1I("2R 2v").1t("3X")};4 h=$("#"+b).5x().2a;6(h<-10){$("#"+b).1m({2a:(2w($("#"+b).1m("2a"))-h+20+f)+"2N",1J:t.1J});6(t.1F=="11"){$("#"+a).1I("3X 2v").1t("2R")}}}1d{$("#"+b).1m({2a:h+"2N",1J:t.1J});6(t.1F=="11"){$("#"+a).1I("2R 3X").1t("2v")}};6(4X){6(F()<=7){$(\'2Q.5c\').1m("1J",t.1J-10);$("#"+a).1m("1J",t.1J+5)}}};4 3T=9(e){6(1k===11)15 14;4 a=L("1R");4 b=L("1l");6(!36){36=11;6(1E.3t!=\'\'){$("#"+1E.3t).1m({22:"2z"})};1E.3t=b;$("#"+b+" 12:2x").2C();3o();4 c=t.3C;6(c==""||c=="2z"){$("#"+b).1m({22:"3Q"});3W();6(1y t.18.2G=="9"){4 d=2k();t.18.2G(d.1b,d.1L)}}1d{$("#"+b)[c]("6N",9(){3W();6(1y t.18.2G=="9"){4 d=2k();t.18.2G(d.1b,d.1L)}})};3R()}1d{6(t.2q!==\'2s\'){2A()}}};4 2A=9(e){36=14;4 a=L("1R");4 b=L("1l");6(A===14||t.1u===11){$("#"+b).1m({22:"2z"});6(t.1F=="11"){$("#"+a).1I("2v 3X").1t("2R")}};3k();6(1y t.18.3H=="9"){4 d=2k();t.18.3H(d.1b,d.1L)};5s();V(V());$("#"+b).1m({1J:1});2E(H(q).1n)};4 56=9(){2M{35=$.2Y(11,{},H(q));1Z(4 i 3O 35){6(1y 35[i]!="9"){u[i]=35[i]}}}2O(e){};u.2D=(H(q).1n>=0)?H(q).1K[H(q).1n].1p:"";u.3Y=1E.3Y.2o;u.3Z=1E.3Z};4 4G=9(a){6(a!=1g&&1y a!="1B"){4 b=L("1l");4 c=N(a);4 d=$("#"+b+" 12."+z.12+":4H("+(a.1o)+")");15{1b:c,1L:d,1S:a,1o:a.1o}};15 1g};4 2k=9(){4 a=L("1l");4 b=H(q);4 c,1L,1S,1o;6(b.1n==-1){c=1g;1L=1g;1S=1g;1o=-1}1d{1L=$("#"+a+" 12."+y.19);6(1L.1c>1){4 d=[],4I=[],6O=[];1Z(4 i=0;i<1L.1c;i++){4 e=I(1L[i]);d.5y(e);4I.5y(b.1K[e])};c=d;1S=4I;1o=d}1d{1S=b.1K[b.1n];c=N(1S);1o=b.1n}};15{1b:c,1L:1L,1o:1o,1S:1S}};4 2E=9(a,b){4 c=L("4a");4 d={};6(a==-1){d.1p="&6P;";d.1e="";d.1h="";d.1D=""}1d 6(1y a!="1B"){4 e=H(q).1K[a];d=N(e)}1d{d=b};$("#"+c).3m("."+y.33).4J(d.1p);H(c).1e=y.3I+" "+d.1e;6(d.1h!=""){$("#"+c).3m("."+y.1h).4J(d.1h).2C()}1d{$("#"+c).3m("."+y.1h).4J("").3l()};4 f=$("#"+c).3m("3P");6(f.1c>0){$(f).1G()};6(d.1D!=""&&t.30){f=O("3P",{4p:d.1D});$("#"+c).2f(f);6(d.1z!=""){f.1e=d.1z+" "};6(d.1h==""){f.1e=f.1e+z.3L}}};4 1v=9(p,v){u[p]=v};4 4K=9(a,b,i){4 c=L("1l");4 d=14;25(a){1i"28":4 e=T(b||H(q).1K[i]);4 f;6(1A.1c==3){f=i}1d{f=$("#"+c+" 12."+z.12).1c-1};6(f<0||!f){$("#"+c+" 4q").2e(e)}1d{4 g=$("#"+c+" 12."+z.12)[f];$(g).6Q(e)};X();W();6(t.18.28!=1g){t.18.28.24(1a,1A)};1j;1i"1G":d=$($("#"+c+" 12."+z.12)[i]).3S(y.19);$("#"+c+" 12."+z.12+":4H("+i+")").1G();4 h=$("#"+c+" 12."+y.1q);6(d==11){6(h.1c>0){$(h[0]).1t(y.19);4 j=$("#"+c+" 12."+z.12).1o(h[0]);21(j)}};6(h.1c==0){21(-1)};6($("#"+c+" 12."+z.12).1c<t.1W&&!A){V(-1)};6(t.18.1G!=1g){t.18.1G.24(1a,1A)};1j}};1a.6R=9(){4 a=1A[0];51.4Y.6S.4Z(1A);25(a){1i"28":u.28.24(1a,1A);1j;1i"1G":u.1G.24(1a,1A);1j;2P:2M{H(q)[a].24(H(q),1A)}2O(e){};1j}};1a.28=9(){4 a,1f,1r,1D,1h;4 b=1A[0];6(1y b=="6T"){a=b;1f=a;2F=3N 4l(a,1f)}1d{a=b.1p||\'\';1f=b.1f||a;1r=b.1r||\'\';1D=b.1D||\'\';1h=b.1h||\'\';2F=3N 4l(a,1f);$(2F).1b("1h",1h);$(2F).1b("1D",1D);$(2F).1b("1r",1r)};1A[0]=2F;H(q).28.24(H(q),1A);1v("23",H(q)["23"]);1v("1c",H(q).1c);4K("28",2F,1A[1])};1a.1G=9(i){H(q).1G(i);1v("23",H(q)["23"]);1v("1c",H(q).1c);4K("1G",1B,i)};1a.5z=9(a,b){6(1y a=="1B"||1y b=="1B")15 14;a=a.2j();2M{1v(a,b)}2O(e){};25(a){1i"2c":H(q)[a]=b;6(b==0){H(q).1Q=14};A=(H(q).2c>1||H(q).1Q==11)?11:14;3U();1j;1i"1Q":H(q)[a]=b;A=(H(q).2c>1||H(q).1Q==11)?11:14;1Y=H(q).1Q;3U();1v(a,b);1j;1i"2K":H(q)[a]=b;1k=b;4x();1j;1i"1n":1i"1f":6(a=="1n"&&E(b)===11){$("#"+q+" 1S").1M("19",14);4A(b,11);4y(b)}1d{H(q)[a]=b;4y(H(q).1n);21(H(q).1n)};1j;1i"1c":4 c=L("1l");6(b<H(q).1c){H(q)[a]=b;6(b==0){$("#"+c+" 12."+z.12).1G();21(-1)}1d{$("#"+c+" 12."+z.12+":6U("+(b-1)+")").1G();6($("#"+c+" 12."+y.19).1c==0){$("#"+c+" 12."+y.1q+":4H(0)").1t(y.19)}};1v(a,b);1v("23",H(q)["23"])};1j;1i"1H":1j;2P:2M{H(q)[a]=b;1v(a,b)}2O(e){};1j}};1a.6V=9(a){15 u[a]||H(q)[a]};1a.1T=9(a){4 b=L("1R");6(a===11){$("#"+b).2C()}1d 6(a===14){$("#"+b).3l()}1d{15($("#"+b).1m("22")=="2z")?14:11}};1a.41=9(v){1E.41(v)};1a.3H=9(){2A()};1a.2G=9(){3T()};1a.5A=9(r){6(1y r=="1B"||r==0){15 14};t.1W=r;V(V())};1a.1W=1a.5A;1a.18=9(a,b){$("#"+q).18(a,b)};1a.1x=9(a,b){$("#"+q).1x(a,b)};1a.6W=1a.18;1a.6X=9(){15 2k()};1a.5B=9(){4 a=H(q).5B.24(H(q),1A);15 4G(a)};1a.5C=9(){4 a=H(q).5C.24(H(q),1A);15 4G(a)};1a.6Y=9(a){1a.5z("1f",a)};1a.6Z=9(){4 a=L("49");4 b=L("1R");$("#"+b+", #"+b+" *").1x();H(q).3f=H(b).3f;$("#"+b).1G();$("#"+q).70().71($("#"+q));$("#"+q).1b("1V",1g)};1a.4m=9(){21(H(q).1n)};K()};$.1P.2Y({3v:9(b){15 1a.72(9(){6(!$(1a).1b(\'1V\')){4 a=3N 1V(1a,b);$(1a).1b(\'1V\',a)}})}});$.1P.2o=$.1P.3v})(73);',62,438,'||||var||if|||function||||||||||||||||||||||||||||||||||||||||||||||||||||||true|li||false|return|||on|selected|this|data|length|else|className|value|null|description|case|break|isDisabled|postChildID|css|selectedIndex|index|text|enabled|title|appendChild|addClass|enableCheckbox|cy|height|off|typeof|imagecss|arguments|undefined|style|image|msBeautify|roundedCorner|remove|id|removeClass|zIndex|options|ui|prop|byJson|cn|fn|multiple|postID|option|visible|preventDefault|dd|visibleRows|click|isMultiple|for||bW|display|children|apply|switch|useSprite||add|checked|top|position|size|jsonTitle|append|prepend|reverseMode|postTitleTextID|controlHolded|toString|cw|span|stopPropagation|hasEvent|msDropdown|toLowerCase|event|enableAutoFilter|mouseover|mousedown|mouseup|borderRadiusTp|parseInt|hidden|input|none|ct|cm|show|selectedText|cx|opt|open|change|blur|mouseout|disabled|forcedTrigger|try|px|catch|default|div|borderRadius|keydown|keyup|byElement|byJQuery|keyCode|ddOutOfVision|extend|width|showIcon|focus|ddTitle|label|hover|orginial|isOpen||||ALPHABETS_START|lastTarget|oldSelected|document|ua|tabIndex|checkbox|Math|mouseenter|bV|bZ|hide|find|bX|cr|scrollTop|counter|auto|absolute|oldDiv|create|msDropDown|expr|toUpperCase|indexOf|name|mainCSS|rowHeight|animStyle|openDirection|disabledOpacity|childWidth|checkboxNameSuffix|close|ddTitleText|optgroup|disabledAll|fnone|cacheElement|new|in|img|block|bY|hasClass|cs|bP|cl|co|borderRadiusBtm|version|author||debug|dropdown|Contains|disabledOptionEvents|dblclick|||mousemove|postElementHolder|postTitleID|ddChild|divider|optgroupTitle|UP_ARROW|LEFT_ARROW|RIGHT_ARROW|ENTER|SHIFT|CONTROL|window|Option|refresh|overflow|selectedClass|src|ul|nodeName|childNodes|trigger|cb|bN|bO|bQ|bT|updateNow|bU|events|cd|ce|getNext|getPrev|cv|eq|op|html|cz|relative|0px|select|createPseudo|arrow|borderTop|noBorderTop|ddChildMore|shadow|ESCAPE|BACKSPACE|DELETE|isIE|prototype|call|object|Array|showicon|usesprite|childwidth|eval|cu|bS|uiData|selectedOptions|cssText|after|ddcommon|type|padding|visibility|min|target|cf|cg|ch|ci|cj|ck|bR|ca|_data|body|cc|cp|cq|animate|500|offset|push|set|showRows|namedItem|item|Marghoob|Suleman|attr|bind|unbind|250|120|9999|slideDown|_mscheck|_msddHolder|_msdd|_title|_titleText|_child|ddArrow|arrowoff|ddlabel|_msddli_|border|isCreated|navigator|userAgent|match|msie|Object|MSIE|substring|maincss|visiblerows|animstyle|opendirection|jsontitle|disabledopacity|enablecheckbox|checkboxnamesuffix|reversemode|roundedcorner|enableautofilter|getElementById|msdropdown|inArray|setAttribute|throw|There|is|an|error|json|msdrpdd|element|test|createElement|innerHTML|appendTo|outerWidth|autocomplete|clear|ddchild_|first|bottom|ceil|max|toggleClass|which|stopImmediatePropagation|mouseleave|val|triggerHandler|floor|alwaysup|alwaysdown|fast|ind|nbsp|before|act|shift|string|gt|get|addMyEvent|getData|setIndexByValue|destroy|parent|replaceWith|each|jQuery'.split('|'),0,{}));
//--------------------------------------------------------------------------------------------



/* ---------------------- 
  Ticker
---------------------- */
//-- Ticker --
/*
    JQuery Advanced News Ticker 1.0.11 (20/02/14)
    created by risq
    website (docs & demos) : http://risq.github.io/jquery-advanced-news-ticker/
*/
(function(b,k,l,m){function g(a,f){this.element=a;this.$el=b(a);this.options=b.extend({},c,f);this._defaults=c;this._name=d;this.moveInterval;this.moving=this.paused=this.state=0;(this.$el.is("ul")||this.$el.is("ol"))&&this.init()}var d="newsTicker",c={row_height:20,max_rows:3,speed:400,duration:2500,direction:"up",autostart:1,pauseOnHover:1,nextButton:null,prevButton:null,startButton:null,stopButton:null,hasMoved:function(){},movingUp:function(){},movingDown:function(){},start:function(){},stop:function(){},
pause:function(){},unpause:function(){}};g.prototype={init:function(){this.$el.height(this.options.row_height*this.options.max_rows-15).css({overflow:"hidden"});this.checkSpeed();this.options.nextButton&&"undefined"!==typeof this.options.nextButton[0]&&this.options.nextButton.click(function(a){this.moveNext();this.resetInterval()}.bind(this));this.options.prevButton&&"undefined"!==typeof this.options.prevButton[0]&&this.options.prevButton.click(function(a){this.movePrev();this.resetInterval()}.bind(this));
this.options.stopButton&&"undefined"!==typeof this.options.stopButton[0]&&this.options.stopButton.click(function(a){this.stop()}.bind(this));this.options.startButton&&"undefined"!==typeof this.options.startButton[0]&&this.options.startButton.click(function(a){this.start()}.bind(this));this.options.pauseOnHover&&this.$el.hover(function(){this.state&&this.pause()}.bind(this),function(){this.state&&this.unpause()}.bind(this));this.options.autostart&&this.start()},start:function(){this.state||(this.state=
1,this.resetInterval(),this.options.start())},stop:function(){this.state&&(clearInterval(this.moveInterval),this.state=0,this.options.stop())},resetInterval:function(){this.state&&(clearInterval(this.moveInterval),this.moveInterval=setInterval(function(){this.move()}.bind(this),this.options.duration))},move:function(){this.paused||this.moveNext()},moveNext:function(){"down"===this.options.direction?this.moveDown():"up"===this.options.direction&&this.moveUp()},movePrev:function(){"down"===this.options.direction?
this.moveUp():"up"===this.options.direction&&this.moveDown()},pause:function(){this.paused||(this.paused=1);this.options.pause()},unpause:function(){this.paused&&(this.paused=0);this.options.unpause()},moveDown:function(){this.moving||(this.moving=1,this.options.movingDown(),this.$el.children("li:last").detach().prependTo(this.$el).css("marginTop","-"+this.options.row_height+"px").animate({marginTop:"0px"},this.options.speed,function(){this.moving=0;this.options.hasMoved()}.bind(this)))},moveUp:function(){if(!this.moving){this.moving=
1;this.options.movingUp();var a=this.$el.children("li:first");a.animate({marginTop:"-"+this.options.row_height+"px"},this.options.speed,function(){a.detach().css("marginTop","0").appendTo(this.$el);this.moving=0;this.options.hasMoved()}.bind(this))}},updateOption:function(a,b){"undefined"!==typeof this.options[a]&&(this.options[a]=b,"duration"==a||"speed"==a)&&(this.checkSpeed(),this.resetInterval())},add:function(a){this.$el.append(b("<li>").html(a))},getState:function(){return paused?2:this.state},
checkSpeed:function(){this.options.duration<this.options.speed+25&&(this.options.speed=this.options.duration-25)},destroy:function(){this._destroy()}};b.fn[d]=function(a){var f=arguments;return this.each(function(){var c=b(this),e=b.data(this,"plugin_"+d),h="object"===typeof a&&a;e||c.data("plugin_"+d,e=new g(this,h));"string"===typeof a&&e[a].apply(e,Array.prototype.slice.call(f,1))})}})(jQuery,window,document);
//--------------------------------------------------------------------------------------------




/* ---------------------- 
  Social Sharing Buttons
---------------------- */
/*
 Ridiculously Responsive Social Sharing Buttons
 Team: @dbox, @seagoat
 Site: http://www.kurtnoble.com/labs/rrssb
 Twitter: @therealkni
*/
(function(e,t,n){"use strict";var r=function(){t(".rrssb-buttons").each(function(e){var n=t(this),r=t("li",n).length,i=100/r;t("li",n).css("width",i+"%").attr("data-initwidth",i)})},i=function(){t(".rrssb-buttons").each(function(e){var n=t(this),r=parseFloat(t(n).width()),i=t("li",n).not(".small").first().width(),s=t("li.small",n).length;i>170&&s<1?t(n).addClass("large-format"):t(n).removeClass("large-format");r<200?t(n).removeClass("small-format").addClass("tiny-format"):t(n).removeClass("tiny-format")})},s=function(){t(".rrssb-buttons").each(function(e){var n=t(this),r=0,i=0,s,o,a=t("li.small",n).length;if(a===t("li",n).length){var f=a*42,l=parseFloat(t(n).width());s=t("li.small",n).first();o=parseFloat(t(s).attr("data-size"))+55;if(f+o<l){t(n).removeClass("small-format");t("li.small",n).first().removeClass("small");u()}}else{t("li",n).not(".small").each(function(e){var n=parseFloat(t(this).attr("data-size"))+55,s=parseFloat(t(this).width());r+=s;i+=n});var c=r-i;s=t("li.small",n).first();o=parseFloat(t(s).attr("data-size"))+55;if(o<c){t(s).removeClass("small");u()}}})},o=function(e){t(".rrssb-buttons").each(function(e){var n=t(this),r=t("li",n).nextAll(),i=r.length;t(t("li",n).get().reverse()).each(function(e,r){if(t(this).hasClass("small")===!1){var i=parseFloat(t(this).attr("data-size"))+55,o=parseFloat(t(this).width());if(i>o){var a=t("li",n).not(".small").last();t(a).addClass("small");u()}}--r||s()})});e===!0&&f(u)},u=function(){t(".rrssb-buttons").each(function(e){var n=t(this),i,s,o,u,a,f=t("li.small",n).length;if(f>0&&f!==t("li",n).length){t(n).removeClass("small-format");t("li.small",n).css("width","42px");o=f*42;i=t("li",n).not(".small").length;s=100/i;a=o/i;navigator.userAgent.indexOf("Chrome")>=0||navigator.userAgent.indexOf("Safari")>=0?u="-webkit-calc("+s+"% - "+a+"px)":navigator.userAgent.indexOf("Firefox")>=0?u="-moz-calc("+s+"% - "+a+"px)":u="calc("+s+"% - "+a+"px)";t("li",n).not(".small").css("width",u)}else if(f===t("li",n).length){t(n).addClass("small-format");r()}else{t(n).removeClass("small-format");r()}});i()},a=function(){t(".rrssb-buttons").each(function(e){t(this).addClass("rrssb-"+(e+1))});r();t(".rrssb-buttons li .text").each(function(e){var n=parseFloat(t(this).width());t(this).closest("li").attr("data-size",n)});o(!0)},f=function(e){t(".rrssb-buttons li.small").removeClass("small");o();e()},l=function(t,r,i,s){var o=e.screenLeft!==n?e.screenLeft:screen.left,u=e.screenTop!==n?e.screenTop:screen.top,a=e.innerWidth?e.innerWidth:document.documentElement.clientWidth?document.documentElement.clientWidth:screen.width,f=e.innerHeight?e.innerHeight:document.documentElement.clientHeight?document.documentElement.clientHeight:screen.height,l=a/2-i/2+o,c=f/3-s/3+u,h=e.open(t,r,"scrollbars=yes, width="+i+", height="+s+", top="+c+", left="+l);e.focus&&h.focus()},c=function(){var e={};return function(t,n,r){r||(r="Don't call this twice without a uniqueId");e[r]&&clearTimeout(e[r]);e[r]=setTimeout(t,n)}}();t(".rrssb-buttons a.popup").on("click",function(e){var n=t(this);l(n.attr("href"),n.find(".text").html(),580,470);e.preventDefault()});t(e).resize(function(){f(u);c(function(){f(u)},200,"finished resizing")});t(document).ready(function(){a()})})(window,jQuery);
//--------------------------------------------------------------------------------------------



/* ---------------------- 
  mix it up
---------------------- */
/*
* MIXITUP - A CSS3 and JQuery Filter & Sort Plugin
* Version: 1.5.5
* License: Creative Commons Attribution-NoDerivs 3.0 Unported - CC BY-ND 3.0
* http://creativecommons.org/licenses/by-nd/3.0/
* This software may be used freely on commercial and non-commercial projects with attribution to the author/copyright holder.
* Author: Patrick Kunka
* Copyright 2012-2013 Patrick Kunka, Barrel LLC, All Rights Reserved
* 
* http://mixitup.io
*/

(function($){
  
  // DECLARE METHODS
 
  var methods = {

    // "INIT" METHOD
  
      init: function(settings){

      return this.each(function(){
        
        var browser = window.navigator.appVersion.match(/Chrome\/(\d+)\./),
          ver = browser ? parseInt(browser[1], 10) : false,
          chromeFix = function(id){
            var grid = document.getElementById(id),
                  parent = grid.parentElement,
                  placeholder = document.createElement('div'),
                  frag = document.createDocumentFragment();

              parent.insertBefore(placeholder, grid);  
              frag.appendChild(grid);
              parent.replaceChild(grid, placeholder);
              frag = null;
              placeholder = null;
          };
        
        if(ver && ver == 31 || ver == 32){
          chromeFix(this.id);
        };
        
        // BUILD CONFIG OBJECT

        var config = {
          
          // PUBLIC PROPERTIES
          
          targetSelector : '.mix',
          filterSelector : '.filter',
          sortSelector : '.sort',
          buttonEvent: 'click',
          effects : ['fade', 'scale'],
          listEffects : null,
          easing : 'smooth',
          layoutMode: 'grid',
          targetDisplayGrid : 'inline-block',
          targetDisplayList: 'block',
          listClass : '',
          gridClass : '',
          transitionSpeed : 600,
          showOnLoad : 'all',
          sortOnLoad : false,
          multiFilter : false,
          filterLogic : 'or',
          resizeContainer : true,
          minHeight : 0,
          failClass : 'fail',
          perspectiveDistance : '3000',
          perspectiveOrigin : '50% 50%',
          animateGridList : true,
          onMixLoad: null,
          onMixStart : null,
          onMixEnd : null,

          // MISC

          container : null,
          origOrder : [],
          startOrder : [],
          newOrder : [],
          origSort: [],
          checkSort: [],
          filter : '',
          mixing : false,
          origDisplay : '',
          origLayout: '',
          origHeight : 0, 
          newHeight : 0,
          isTouch : false,
          resetDelay : 0,
          failsafe : null,

          // CSS
          
          prefix : '',
          easingFallback : 'ease-in-out',
          transition : {}, 
          perspective : {}, 
          clean : {},
          fade : '1',
          scale : '',
          rotateX : '',
          rotateY : '',
          rotateZ : '',
          blur : '',
          grayscale : ''
        };
        
        if(settings){
          $.extend(config, settings);
        };

        // ADD CONFIG OBJECT TO CONTAINER OBJECT PER INSTANTIATION
        
        this.config = config;
        
        // DETECT TOUCH
        
        $.support.touch = 'ontouchend' in document;

        if ($.support.touch) {
          config.isTouch = true;
          config.resetDelay = 350;
        };
        
        // LOCALIZE CONTAINER
  
        config.container = $(this);
        var $cont = config.container;
        
        // GET VENDOR PREFIX
        
        config.prefix = prefix($cont[0]);
        config.prefix = config.prefix ? '-'+config.prefix.toLowerCase()+'-' : '';
        
        // CACHE 'DEFAULT' SORTING ORDER
      
        $cont.find(config.targetSelector).each(function(){
          config.origOrder.push($(this));
        });
        
        // PERFORM SORT ON LOAD 
        
        if(config.sortOnLoad){
          var sortby, order;
          if($.isArray(config.sortOnLoad)){
            sortby = config.sortOnLoad[0], order = config.sortOnLoad[1];
            $(config.sortSelector+'[data-sort='+config.sortOnLoad[0]+'][data-order='+config.sortOnLoad[1]+']').addClass('active');
          } else {
            $(config.sortSelector+'[data-sort='+config.sortOnLoad+']').addClass('active');
            sortby = config.sortOnLoad, config.sortOnLoad = 'desc';
          };
          sort(sortby, order, $cont, config);
        };
        
        // BUILD TRANSITION AND PERSPECTIVE OBJECTS
        
        for(var i = 0; i<2; i++){
          var a = i==0 ? a = config.prefix : '';
          config.transition[a+'transition'] = 'all '+config.transitionSpeed+'ms ease-in-out';
          config.perspective[a+'perspective'] = config.perspectiveDistance+'px';
          config.perspective[a+'perspective-origin'] = config.perspectiveOrigin;
        };
        
        // BUILD TRANSITION CLEANER
        
        for(var i = 0; i<2; i++){
          var a = i==0 ? a = config.prefix : '';
          config.clean[a+'transition'] = 'none';
        };
  
        // CHOOSE GRID OR LIST
  
        if(config.layoutMode == 'list'){
          $cont.addClass(config.listClass);
          config.origDisplay = config.targetDisplayList;
        } else {
          $cont.addClass(config.gridClass);
          config.origDisplay = config.targetDisplayGrid;
        };
        config.origLayout = config.layoutMode;
        
        // PARSE 'SHOWONLOAD'
        
        var showOnLoadArray = config.showOnLoad.split(' ');
        
        // GIVE ACTIVE FILTER ACTIVE CLASS
        
        $.each(showOnLoadArray, function(){
          $(config.filterSelector+'[data-filter="'+this+'"]').addClass('active');
        });
        
        // RENAME "ALL" CATEGORY TO "MIX_ALL"
  
        $cont.find(config.targetSelector).addClass('mix_all');
        if(showOnLoadArray[0]  == 'all'){
          showOnLoadArray[0] = 'mix_all',
          config.showOnLoad = 'mix_all';
        };
        
        // FADE IN 'SHOWONLOAD'
        
        var $showOnLoad = $();
        $.each(showOnLoadArray, function(){
          $showOnLoad = $showOnLoad.add($('.'+this))
        });
        
        $showOnLoad.each(function(){
          var $t = $(this);
          if(config.layoutMode == 'list'){
            $t.css('display',config.targetDisplayList);
          } else {
            $t.css('display',config.targetDisplayGrid);
          };
          $t.css(config.transition);
        });
        
        // WRAP FADE-IN TO PREVENT RACE CONDITION
        
        var delay = setTimeout(function(){
          
          config.mixing = true;
          
          $showOnLoad.css('opacity','1');
          
          // CLEAN UP
          
          var reset = setTimeout(function(){
            if(config.layoutMode == 'list'){
              $showOnLoad.removeStyle(config.prefix+'transition, transition').css({
                display: config.targetDisplayList,
                opacity: 1
              });
            } else {
              $showOnLoad.removeStyle(config.prefix+'transition, transition').css({
                display: config.targetDisplayGrid,
                opacity: 1
              });
            };
            
            // FIRE "ONMIXLOAD" CALLBACK
            
            config.mixing = false;

            if(typeof config.onMixLoad == 'function') {
              var output = config.onMixLoad.call(this, config);

              // UPDATE CONFIG IF DATA RETURNED

              config = output ? output : config;
            };
            
          },config.transitionSpeed);
        },10);
        
        // PRESET ACTIVE FILTER
        
        config.filter = config.showOnLoad;
      
        // BIND SORT CLICK HANDLERS
      
        $(config.sortSelector).bind(config.buttonEvent,function(){
          
          if(!config.mixing){
            
            // PARSE SORT ARGUMENTS FROM BUTTON CLASSES
            
            var $t = $(this),
            sortby = $t.attr('data-sort'),
            order = $t.attr('data-order');
            
            if(!$t.hasClass('active')){
              $(config.sortSelector).removeClass('active');
              $t.addClass('active');
            } else {
              if(sortby != 'random')return false;
            };
            
            $cont.find(config.targetSelector).each(function(){
              config.startOrder.push($(this));
            });
        
            goMix(config.filter,sortby,order,$cont, config);
        
          };
        
        });

        // BIND FILTER CLICK HANDLERS

        $(config.filterSelector).bind(config.buttonEvent,function(){
        
          if(!config.mixing){
            
            var $t = $(this);
            
            // PARSE FILTER ARGUMENTS FROM BUTTON CLASSES
    
            if(config.multiFilter == false){
              
              // SINGLE ACTIVE BUTTON
              
              $(config.filterSelector).removeClass('active');
              $t.addClass('active');
            
              config.filter = $t.attr('data-filter');
            
              $(config.filterSelector+'[data-filter="'+config.filter+'"]').addClass('active');

            } else {
            
              // MULTIPLE ACTIVE BUTTONS
              
              var thisFilter = $t.attr('data-filter'); 
            
              if($t.hasClass('active')){
                $t.removeClass('active');
                
                // REMOVE FILTER FROM SPACE-SEPERATED STRING
                
                var re = new RegExp('(\\s|^)'+thisFilter);
                config.filter = config.filter.replace(re,'');
              } else {
                
                // ADD FILTER TO SPACE-SEPERATED STRING
                
                $t.addClass('active');
                config.filter = config.filter+' '+thisFilter;
                
              };
            };
            
            // GO MIX
            
            goMix(config.filter, null, null, $cont, config);

          };
        
        });
          
      });
    },
  
    // "TOGRID" METHOD
  
    toGrid: function(){
      return this.each(function(){
        var config = this.config;
        if(config.layoutMode != 'grid'){
          config.layoutMode = 'grid';
          goMix(config.filter, null, null, $(this), config);
        };
      });
    },
  
    // "TOLIST" METHOD
  
    toList: function(){
      return this.each(function(){
        var config = this.config;
        if(config.layoutMode != 'list'){
          config.layoutMode = 'list';
          goMix(config.filter, null, null, $(this), config);
        };
      });
    },
  
    // "FILTER" METHOD
  
    filter: function(arg){
      return this.each(function(){
        var config = this.config;
        if(!config.mixing){ 
          $(config.filterSelector).removeClass('active');
          $(config.filterSelector+'[data-filter="'+arg+'"]').addClass('active');
          goMix(arg, null, null, $(this), config);
        };
      }); 
    },
  
    // "SORT" METHOD
  
    sort: function(args){
      return this.each(function(){
        var config = this.config,
          $t = $(this);
        if(!config.mixing){
          $(config.sortSelector).removeClass('active');
          if($.isArray(args)){
            var sortby = args[0], order = args[1];
            $(config.sortSelector+'[data-sort="'+args[0]+'"][data-order="'+args[1]+'"]').addClass('active');
          } else {
            $(config.sortSelector+'[data-sort="'+args+'"]').addClass('active');
            var sortby = args, order = 'desc';
          };
          $t.find(config.targetSelector).each(function(){
            config.startOrder.push($(this));
          });
          
          goMix(config.filter,sortby,order, $t, config);
        
        };
      });
    },
    
    // "MULTIMIX" METHOD
    
    multimix: function(args){
      return this.each(function(){
        var config = this.config,
          $t = $(this);
          multiOut = {
            filter: config.filter,
            sort: null,
            order: 'desc',
            layoutMode: config.layoutMode
          };
        $.extend(multiOut, args);
        if(!config.mixing){
          $(config.filterSelector).add(config.sortSelector).removeClass('active');
          $(config.filterSelector+'[data-filter="'+multiOut.filter+'"]').addClass('active');
          if(typeof multiOut.sort !== 'undefined'){
            $(config.sortSelector+'[data-sort="'+multiOut.sort+'"][data-order="'+multiOut.order+'"]').addClass('active');
            $t.find(config.targetSelector).each(function(){
              config.startOrder.push($(this));
            });
          };
          config.layoutMode = multiOut.layoutMode;
          goMix(multiOut.filter,multiOut.sort,multiOut.order, $t, config);
        };
      });
    },
    
    // "REMIX" METHOD

    remix: function(arg){
      return this.each(function(){
        var config = this.config,
          $t = $(this); 
        config.origOrder = [];
        $t.find(config.targetSelector).each(function(){
          var $th = $(this);
          $th.addClass('mix_all'); 
            config.origOrder.push($th);
        });
        if(!config.mixing && typeof arg !== 'undefined'){
          $(config.filterSelector).removeClass('active');
          $(config.filterSelector+'[data-filter="'+arg+'"]').addClass('active');
          goMix(arg, null, null, $t, config);
        };
      });
    }
  };
  
  // DECLARE PLUGIN

  $.fn.mixitup = function(method, arg){
    if (methods[method]) {
      return methods[method].apply( this, Array.prototype.slice.call(arguments,1));
    } else if (typeof method === 'object' || ! method){
      return methods.init.apply( this, arguments );
    };
  };
  
  /* ==== THE MAGIC ==== */
  
  function goMix(filter, sortby, order, $cont, config){
    
    // WE ARE NOW MIXING

    clearInterval(config.failsafe);
    config.mixing = true; 
    
    // APPLY ARGS TO CONFIG
    
    config.filter = filter;
    
    // FIRE "ONMIXSTART" CALLBACK
    
    if(typeof config.onMixStart == 'function') {
      var output = config.onMixStart.call(this, config);
      
      // UPDATE CONFIG IF DATA RETURNED
      
      config = output ? output : config;
    };
    
    // SHORT LOCAL VARS
    
    var speed = config.transitionSpeed;
    
    // REBUILD TRANSITION AND PERSPECTIVE OBJECTS
    
    for(var i = 0; i<2; i++){
      var a = i==0 ? a = config.prefix : '';
      config.transition[a+'transition'] = 'all '+speed+'ms linear';
      config.transition[a+'transform'] = a+'translate3d(0,0,0)';
      config.perspective[a+'perspective'] = config.perspectiveDistance+'px';
      config.perspective[a+'perspective-origin'] = config.perspectiveOrigin;
    };
    
    // CACHE TARGET ELEMENTS FOR QUICK ACCESS
    
    var mixSelector = config.targetSelector,
    $targets = $cont.find(mixSelector);
    
    // ADD DATA OBJECT TO EACH TARGET
    
    $targets.each(function(){
      this.data = {};
    });
    
    // RE-DEFINE CONTAINER INCASE NOT IMMEDIATE PARENT OF TARGET ELEMENTS 
    
    var $par = $targets.parent();
  
    // ADD PERSPECTIVE TO CONTAINER 
    
    $par.css(config.perspective);
    
    // SETUP EASING

    config.easingFallback = 'ease-in-out';
    if(config.easing == 'smooth')config.easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if(config.easing == 'snap')config.easing = 'cubic-bezier(0.77, 0, 0.175, 1)';
    if(config.easing == 'windback'){
      config.easing = 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
      config.easingFallback = 'cubic-bezier(0.175, 0.885, 0.320, 1)'; // Fall-back for old webkit, with no values > 1 or < 1
    };
    if(config.easing == 'windup'){
      config.easing = 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
      config.easingFallback = 'cubic-bezier(0.6, 0.28, 0.735, 0.045)';
    };
    
    // USE LIST SPECIFIC EFFECTS IF DECLARED
    
    var effectsOut = config.layoutMode == 'list' && config.listEffects != null ? config.listEffects : config.effects;
  
    // BUILD EFFECTS STRINGS & SKIP IF IE8
  
    if (Array.prototype.indexOf){
      config.fade = effectsOut.indexOf('fade') > -1 ? '0' : '';
      config.scale = effectsOut.indexOf('scale') > -1 ? 'scale(.01)' : '';
      config.rotateZ = effectsOut.indexOf('rotateZ') > -1 ? 'rotate(180deg)' : '';
      config.rotateY = effectsOut.indexOf('rotateY') > -1 ? 'rotateY(90deg)' : '';
      config.rotateX = effectsOut.indexOf('rotateX') > -1 ? 'rotateX(90deg)' : '';
      config.blur = effectsOut.indexOf('blur') > -1 ? 'blur(8px)' : '';
      config.grayscale = effectsOut.indexOf('grayscale') > -1 ? 'grayscale(100%)' : '';
    };
    
    // DECLARE NEW JQUERY OBJECTS FOR GROUPING
    
    var $show = $(), 
    $hide = $(),
    filterArray = [],
    multiDimensional = false;
    
    // BUILD FILTER ARRAY(S)
    
    if(typeof filter === 'string'){
      
      // SINGLE DIMENSIONAL FILTERING
      
      filterArray = buildFilterArray(filter);
      
    } else {
      
      // MULTI DIMENSIONAL FILTERING
      
      multiDimensional = true;
      
      $.each(filter,function(i){
        filterArray[i] = buildFilterArray(this);
      });
    };

    // "OR" LOGIC (DEFAULT)
    
    if(config.filterLogic == 'or'){
      
      if(filterArray[0] == '') filterArray.shift(); // IF FIRST ITEM IN ARRAY IS AN EMPTY SPACE, DELETE
      
      // IF NO ELEMENTS ARE DESIRED THEN HIDE ALL VISIBLE ELEMENTS
    
      if(filterArray.length < 1){
        
        $hide = $hide.add($cont.find(mixSelector+':visible'));
        
      } else {

      // ELSE CHECK EACH TARGET ELEMENT FOR ANY FILTER CATEGORY:
      
        $targets.each(function(){
          var $t = $(this);
          if(!multiDimensional){
            // IF HAS ANY FILTER, ADD TO "SHOW" OBJECT
            if($t.is('.'+filterArray.join(', .'))){
              $show = $show.add($t);
            // ELSE IF HAS NO FILTERS, ADD TO "HIDE" OBJECT
            } else {
              $hide = $hide.add($t);
            };
          } else {
            
            var pass = 0;
            // FOR EACH DIMENSION
            
            $.each(filterArray,function(i){
              if(this.length){
                if($t.is('.'+this.join(', .'))){
                  pass++
                };
              } else if(pass > 0){
                pass++;
              };
            });
            // IF PASSES ALL DIMENSIONS, SHOW
            if(pass == filterArray.length){
              $show = $show.add($t);
            // ELSE HIDE
            } else {
              $hide = $hide.add($t);
            };
          };
        });
      
      };
  
    } else {
      
    // "AND" LOGIC
      
      // ADD "MIX_SHOW" CLASS TO ELEMENTS THAT HAVE ALL FILTERS
      
      $show = $show.add($par.find(mixSelector+'.'+filterArray.join('.')));
      
      // ADD "MIX_HIDE" CLASS TO EVERYTHING ELSE
      
      $hide = $hide.add($par.find(mixSelector+':not(.'+filterArray.join('.')+'):visible'));
    };
    
    // GET TOTAL NUMBER OF ELEMENTS TO SHOW
    
    var total = $show.length;
    
    // DECLARE NEW JQUERY OBJECTS

    var $tohide = $(),
    $toshow = $(),
    $pre = $();
    
    // FOR ELEMENTS TO BE HIDDEN, IF NOT ALREADY HIDDEN THEN ADD TO OBJECTS "TOHIDE" AND "PRE" 
    // TO INDICATE PRE-EXISTING ELEMENTS TO BE HIDDEN
    
    $hide.each(function(){
      var $t = $(this);
      if($t.css('display') != 'none'){
        $tohide = $tohide.add($t);
        $pre = $pre.add($t);
      };
    });
    
    // IF ALL ELEMENTS ARE ALREADY SHOWN AND THERE IS NOTHING TO HIDE, AND NOT PERFORMING A LAYOUT CHANGE OR SORT:
    
    if($show.filter(':visible').length == total && !$tohide.length && !sortby){
      
      if(config.origLayout == config.layoutMode){
        
        // THEN CLEAN UP AND GO HOME

        resetFilter();
        return false;
      } else {
        
        // IF ONLY ONE ITEM AND CHANGING FORM GRID TO LIST, MOST LIKELY POSITION WILL NOT CHANGE SO WE'RE DONE
      
        if($show.length == 1){ 
          
          if(config.layoutMode == 'list'){ 
            $cont.addClass(config.listClass);
            $cont.removeClass(config.gridClass);
            $pre.css('display',config.targetDisplayList);
          } else {
            $cont.addClass(config.gridClass);
            $cont.removeClass(config.listClass);
            $pre.css('display',config.targetDisplayGrid);
          };
          
          // THEN CLEAN UP AND GO HOME

          resetFilter();
          return false;
        }
      };
    };
    
    // GET CONTAINER'S STARTING HEIGHT

    config.origHeight = $par.height();
    
    // IF THERE IS SOMETHING TO BE SHOWN:

    if($show.length){
      
      // REMOVE "FAIL CLASS" FROM CONTAINER IF EXISTS
      
      $cont.removeClass(config.failClass);
      
      
      // FOR ELEMENTS TO BE SHOWN, IF NOT ALREADY SHOWN THEN ADD TO OBJECTS "TOSHOW" ELSE ADD CLASS "MIX_PRE"
      // TO INDICATE PRE-EXISTING ELEMENT

      $show.each(function(){ 
        var $t = $(this);
        if($t.css('display') == 'none'){
          $toshow = $toshow.add($t)
        } else {
          $pre = $pre.add($t);
        };
      });
  
      // IF NON-ANIMATED LAYOUT MODE TRANSITION:
    
      if((config.origLayout != config.layoutMode) && config.animateGridList == false){ 
      
        // ADD NEW DISPLAY TYPES, CLEAN UP AND GO HOME
        
        if(config.layoutMode == 'list'){ 
          $cont.addClass(config.listClass);
          $cont.removeClass(config.gridClass);
          $pre.css('display',config.targetDisplayList);
        } else {
          $cont.addClass(config.gridClass);
          $cont.removeClass(config.listClass);
          $pre.css('display',config.targetDisplayGrid);
        };
        
        resetFilter();
        return false;
      };
      
      // IF IE, FUCK OFF, AND THEN CLEAN UP AND GO HOME
    
      if(!window.atob){
        resetFilter();
        return false;
      };
      
      // OVERRIDE ANY EXISTING TRANSITION TIMING FOR CALCULATIONS
      
      $targets.css(config.clean);
      
      // FOR EACH PRE-EXISTING ELEMENT, ADD STARTING POSITION TO 'ORIGPOS' ARRAY
      
      $pre.each(function(){
        this.data.origPos = $(this).offset();
      });
  
      // TEMPORARILY SHOW ALL ELEMENTS TO SHOW (THAT ARE NOT ALREADY SHOWN), WITHOUT HIDING ELEMENTS TO HIDE
      // AND ADD/REMOVE GRID AND LIST CLASSES FROM CONTAINER
  
      if(config.layoutMode == 'list'){
        $cont.addClass(config.listClass);
        $cont.removeClass(config.gridClass);
        $toshow.css('display',config.targetDisplayList);
      } else {
        $cont.addClass(config.gridClass);
        $cont.removeClass(config.listClass);
        $toshow.css('display',config.targetDisplayGrid);
      };
      
      // FOR EACH ELEMENT NOW SHOWN, ADD ITS INTERMEDIATE POSITION TO 'SHOWINTERPOS' ARRAY
  
      $toshow.each(function(){
        this.data.showInterPos = $(this).offset();
      });
      
      // FOR EACH ELEMENT TO BE HIDDEN, BUT NOT YET HIDDEN, AND NOW MOVED DUE TO SHOWN ELEMENTS,
      // ADD ITS INTERMEDIATE POSITION TO 'HIDEINTERPOS' ARRAY

      $tohide.each(function(){
        this.data.hideInterPos = $(this).offset();
      });
      
      // FOR EACH PRE-EXISTING ELEMENT, NOW MOVED DUE TO SHOWN ELEMENTS, ADD ITS POSITION TO 'PREINTERPOS' ARRAY
  
      $pre.each(function(){
        this.data.preInterPos = $(this).offset();
      });
      
      // SET DISPLAY PROPERTY OF PRE-EXISTING ELEMENTS INCASE WE ARE CHANGING LAYOUT MODE
  
      if(config.layoutMode == 'list'){
        $pre.css('display',config.targetDisplayList);
      } else {
        $pre.css('display',config.targetDisplayGrid);
      };
      
      // IF A SORT ARGUMENT HAS BEEN SENT, RUN SORT FUNCTION SO OBJECTS WILL MOVE TO THEIR FINAL ORDER
      
      if(sortby){
        sort(sortby, order, $cont, config); 
      };
      
      // IF VISIBLE SORT ORDER IS THE SAME (WHICH WOULD NOT TRIGGER A TRANSITION EVENT)
    
      if(sortby && compareArr(config.origSort, config.checkSort)){
        
        // THEN CLEAN UP AND GO HOME
        resetFilter();
        return false;
      };
      
      // TEMPORARILY HIDE ALL SHOWN ELEMENTS TO HIDE

      $tohide.hide();
      
      // FOR EACH ELEMENT TO SHOW, AND NOW MOVED DUE TO HIDDEN ELEMENTS BEING REMOVED, 
      // ADD ITS POSITION TO 'FINALPOS' ARRAY
      
      $toshow.each(function(i){
        this.data.finalPos = $(this).offset();
      });
      
      // FOR EACH PRE-EXISTING ELEMENT NOW MOVED DUE TO HIDDEN ELEMENTS BEING REMOVED,
      // ADD ITS POSITION TO 'FINALPREPOS' ARRAY
  
      $pre.each(function(){
        this.data.finalPrePos = $(this).offset();
      });
      
      // SINCE WE ARE IN OUT FINAL STATE, GET NEW HEIGHT OF CONTAINER
  
      config.newHeight = $par.height();
      
      // IF A SORT ARGUMENT AS BEEN SENT, RUN SORT FUNCTION 'RESET' TO MOVE ELEMENTS BACK TO THEIR STARTING ORDER
      
      if(sortby){
        sort('reset', null, $cont, config);
      };
      
      // RE-HIDE ALL ELEMENTS TEMPORARILY SHOWN
      
      $toshow.hide();
      
      // SET DISPLAY PROPERTY OF PRE-EXISTING ELEMENTS BACK TO THEIR 
      // ORIGINAL PROPERTY, INCASE WE ARE CHANGING LAYOUT MODE
      
      $pre.css('display',config.origDisplay);
      
      // ADD/REMOVE GRID AND LIST CLASSES FROM CONTAINER
  
      if(config.origDisplay == 'block'){
        $cont.addClass(config.listClass);
        $toshow.css('display', config.targetDisplayList);
      } else {
        $cont.removeClass(config.listClass);
        $toshow.css('display', config.targetDisplayGrid);
      };
      
      // IF WE ARE ANIMATING CONTAINER, RESET IT TO ITS STARTING HEIGHT
    
      if(config.resizeContainer)$par.css('height', config.origHeight+'px');
  
      // ADD TRANSFORMS TO ALL ELEMENTS TO SHOW
      
      var toShowCSS = {};
      
      for(var i = 0; i<2; i++){
        var a = i==0 ? a = config.prefix : '';
        toShowCSS[a+'transform'] = config.scale+' '+config.rotateX+' '+config.rotateY+' '+config.rotateZ;
        toShowCSS[a+'filter'] = config.blur+' '+config.grayscale;
      };
      
      $toshow.css(toShowCSS);
  
      // FOR EACH PRE-EXISTING ELEMENT, SUBTRACT ITS INTERMEDIATE POSITION FROM ITS ORIGINAL POSITION 
      // TO GET ITS STARTING OFFSET
  
      $pre.each(function(){
        var data = this.data,
        $t = $(this);
        
        if ($t.hasClass('mix_tohide')){
          data.preTX = data.origPos.left - data.hideInterPos.left;
          data.preTY = data.origPos.top - data.hideInterPos.top;
        } else {
          data.preTX = data.origPos.left - data.preInterPos.left;
          data.preTY = data.origPos.top - data.preInterPos.top;
        };
        var preCSS = {};
        for(var i = 0; i<2; i++){
          var a = i==0 ? a = config.prefix : '';
          preCSS[a+'transform'] = 'translate('+data.preTX+'px,'+data.preTY+'px)';
        };
        
        $t.css(preCSS); 
      });
      
      // ADD/REMOVE GRID AND LIST CLASSES FROM CONTAINER
  
      if(config.layoutMode == 'list'){
        $cont.addClass(config.listClass);
        $cont.removeClass(config.gridClass);
      } else {
        $cont.addClass(config.gridClass);
        $cont.removeClass(config.listClass);
      };
      
      // WRAP ANIMATION FUNCTIONS IN 10ms TIMEOUT TO PREVENT RACE CONDITION
      
      var delay = setTimeout(function(){
    
        // APPLY TRANSITION TIMING TO CONTAINER, AND BEGIN ANIMATION TO NEW HEIGHT
        
        if(config.resizeContainer){
          var containerCSS = {};
          for(var i = 0; i<2; i++){
            var a = i==0 ? a = config.prefix : '';
            containerCSS[a+'transition'] = 'all '+speed+'ms ease-in-out';
            containerCSS['height'] = config.newHeight+'px';
          };
          $par.css(containerCSS);
        };
  
        // BEGIN FADING IN/OUT OF ALL ELEMENTS TO SHOW/HIDE
        $tohide.css('opacity',config.fade);
        $toshow.css('opacity',1);
  
        // FOR EACH ELEMENT BEING SHOWN, CALCULATE ITS TRAJECTORY BY SUBTRACTING
        // ITS INTERMEDIATE POSITION FROM ITS FINAL POSITION.
        // ALSO ADD SPEED AND EASING
        
        $toshow.each(function(){
          var data = this.data;
          data.tX = data.finalPos.left - data.showInterPos.left;
          data.tY = data.finalPos.top - data.showInterPos.top;
          
          var toShowCSS = {};
          for(var i = 0; i<2; i++){
            var a = i==0 ? a = config.prefix : '';
            toShowCSS[a+'transition-property'] = a+'transform, '+a+'filter, opacity';
            toShowCSS[a+'transition-timing-function'] = config.easing+', linear, linear';
            toShowCSS[a+'transition-duration'] = speed+'ms';
            toShowCSS[a+'transition-delay'] = '0';
            toShowCSS[a+'transform'] = 'translate('+data.tX+'px,'+data.tY+'px)';
            toShowCSS[a+'filter'] = 'none';
          };
          
          $(this).css('-webkit-transition', 'all '+speed+'ms '+config.easingFallback).css(toShowCSS);
        });
        
        // FOR EACH PRE-EXISTING ELEMENT, IF IT HAS A FINAL POSITION, CALCULATE 
        // ITS TRAJETORY BY SUBTRACTING ITS INTERMEDIATE POSITION FROM ITS FINAL POSITION.
        // ALSO ADD SPEED AND EASING
        
        $pre.each(function(){
          var data = this.data
          data.tX = data.finalPrePos.left != 0 ? data.finalPrePos.left - data.preInterPos.left : 0;
          data.tY = data.finalPrePos.left != 0 ? data.finalPrePos.top - data.preInterPos.top : 0;
          
          var preCSS = {};
          for(var i = 0; i<2; i++){
            var a = i==0 ? a = config.prefix : '';
            preCSS[a+'transition'] = 'all '+speed+'ms '+config.easing;
            preCSS[a+'transform'] = 'translate('+data.tX+'px,'+data.tY+'px)';
          };
          
          $(this).css('-webkit-transition', 'all '+speed+'ms '+config.easingFallback).css(preCSS);
        });
    
        // BEGIN TRANSFORMS ON ALL ELEMENTS TO BE HIDDEN
        
        var toHideCSS = {};
        for(var i = 0; i<2; i++){
          var a = i==0 ? a = config.prefix : '';
          toHideCSS[a+'transition'] = 'all '+speed+'ms '+config.easing+', '+a+'filter '+speed+'ms linear, opacity '+speed+'ms linear';
          toHideCSS[a+'transform'] = config.scale+' '+config.rotateX+' '+config.rotateY+' '+config.rotateZ;
          toHideCSS[a+'filter'] = config.blur+' '+config.grayscale;
          toHideCSS['opacity'] = config.fade;
        };
        
        $tohide.css(toHideCSS);
        
        // ALL ANIMATIONS HAVE NOW BEEN STARTED, NOW LISTEN FOR TRANSITION END:
        
        $par.bind('webkitTransitionEnd transitionend otransitionend oTransitionEnd',function(e){
          
          if (e.originalEvent.propertyName.indexOf('transform') > -1 || e.originalEvent.propertyName.indexOf('opacity') > -1){
            
            if(mixSelector.indexOf('.') > -1){
            
            // IF MIXSELECTOR IS A CLASS NAME
            
              if($(e.target).hasClass(mixSelector.replace('.',''))){
                resetFilter();
              };
            
            } else {
              
            // IF MIXSELECTOR IS A TAG
            
              if($(e.target).is(mixSelector)){
                resetFilter();
              };
              
            };
            
          };
        }); 
  
      },10);
      
      // LAST RESORT EMERGENCY FAILSAFE
      
      config.failsafe = setTimeout(function(){
        if(config.mixing){
          resetFilter();
        };
      }, speed + 400);
  
    } else {
      
    // ELSE IF NOTHING TO SHOW, AND EVERYTHING TO BE HIDDEN
    
      // IF WE ARE RESIZING CONTAINER, SET ITS STARTING HEIGHT
  
      if(config.resizeContainer)$par.css('height', config.origHeight+'px');
      
      // IF IE, FUCK OFF, AND THEN GO HOME
      
      if(!window.atob){
        resetFilter();
        return false;
      };
      
      // GROUP ALL ELEMENTS TO HIDE INTO JQUERY OBJECT
      
      $tohide = $hide;
      
      // WRAP ANIMATION FUNCTIONS IN A 10ms DELAY TO PREVENT RACE CONDITION
  
      var delay = setTimeout(function(){
        
        // APPLY PERSPECTIVE TO CONTAINER
  
        $par.css(config.perspective);
        
        // APPLY TRANSITION TIMING TO CONTAINER, AND BEGIN ANIMATION TO NEW HEIGHT
    
        if(config.resizeContainer){
          var containerCSS = {};
          for(var i = 0; i<2; i++){
            var a = i==0 ? a = config.prefix : '';
            containerCSS[a+'transition'] = 'height '+speed+'ms ease-in-out';
            containerCSS['height'] = config.minHeight+'px';
          };
          $par.css(containerCSS);
        };
  
        // APPLY TRANSITION TIMING TO ALL TARGET ELEMENTS
        
        $targets.css(config.transition);
        
        // GET TOTAL NUMBER OF ELEMENTS TO HIDE
  
        var totalHide = $hide.length;
        
        // IF SOMETHING TO HIDE:
  
        if(totalHide){
          
          // BEGIN TRANSFORMS ON ALL ELEMENTS TO BE HIDDEN

          var toHideCSS = {};
          for(var i = 0; i<2; i++){
            var a = i==0 ? a = config.prefix : '';
            toHideCSS[a+'transform'] = config.scale+' '+config.rotateX+' '+config.rotateY+' '+config.rotateZ;
            toHideCSS[a+'filter'] = config.blur+' '+config.grayscale;
            toHideCSS['opacity'] = config.fade;
          };

          $tohide.css(toHideCSS);
          
          // ALL ANIMATIONS HAVE NOW BEEN STARTED, NOW LISTEN FOR TRANSITION END:

          $par.bind('webkitTransitionEnd transitionend otransitionend oTransitionEnd',function(e){
            if (e.originalEvent.propertyName.indexOf('transform') > -1 || e.originalEvent.propertyName.indexOf('opacity') > -1){
              $cont.addClass(config.failClass);
              resetFilter();
            };
          });
    
        } else {
          
        // ELSE, WE'RE DONE MIXING
          
          config.mixing = false;
        };
  
      }, 10);
    }; 
    
    // CLEAN UP AND RESET FUNCTION

    function resetFilter(){
      
      // UNBIND TRANSITION END EVENTS FROM CONTAINER
      
      $par.unbind('webkitTransitionEnd transitionend otransitionend oTransitionEnd');
      
      // IF A SORT ARGUMENT HAS BEEN SENT, SORT ELEMENTS TO THEIR FINAL ORDER
      
      if(sortby){
        sort(sortby, order, $cont, config);
      };
      
      // EMPTY SORTING ARRAYS
    
      config.startOrder = [], config.newOrder = [], config.origSort = [], config.checkSort = [];
    
      // REMOVE INLINE STYLES FROM ALL TARGET ELEMENTS AND SLAM THE BRAKES ON
      
      $targets.removeStyle(
        config.prefix+'filter, filter, '+config.prefix+'transform, transform, opacity, display'
      ).css(config.clean).removeAttr('data-checksum');
      
      // BECAUSE IE SUCKS
      
      if(!window.atob){
        $targets.css({
          display: 'none',
          opacity: '0'
        });
      };
      
      // REMOVE HEIGHT FROM CONTAINER ONLY IF RESIZING
      
      var remH = config.resizeContainer ? 'height' : '';
      
      // REMOVE INLINE STYLES FROM CONTAINER
    
      $par.removeStyle(
        config.prefix+'transition, transition, '+config.prefix+'perspective, perspective, '+config.prefix+'perspective-origin, perspective-origin, '+remH
      );
      
      // ADD FINAL DISPLAY PROPERTIES AND OPACITY TO ALL SHOWN ELEMENTS
      // CACHE CURRENT LAYOUT MODE & SORT FOR NEXT MIX
      
      if(config.layoutMode == 'list'){
        $show.css({display:config.targetDisplayList, opacity:'1'});
        config.origDisplay = config.targetDisplayList;
      } else {
        $show.css({display:config.targetDisplayGrid, opacity:'1'});
        config.origDisplay = config.targetDisplayGrid;
      };
      config.origLayout = config.layoutMode;
        
      var wait = setTimeout(function(){
        
        // LET GO OF THE BRAKES
        
        $targets.removeStyle(config.prefix+'transition, transition');
      
        // WE'RE DONE MIXING
      
        config.mixing = false;
      
        // FIRE "ONMIXEND" CALLBACK
      
        if(typeof config.onMixEnd == 'function') {
          var output = config.onMixEnd.call(this, config);
        
          // UPDATE CONFIG IF DATA RETURNED
        
          config = output ? output : config;
        };
      });
    };
  };
  
  // SORT FUNCTION
  
  function sort(sortby, order, $cont, config){

    // COMPARE BY ATTRIBUTE

    function compare(a,b) {
      var sortAttrA = isNaN(a.attr(sortby) * 1) ? a.attr(sortby).toLowerCase() : a.attr(sortby) * 1,
        sortAttrB = isNaN(b.attr(sortby) * 1) ? b.attr(sortby).toLowerCase() : b.attr(sortby) * 1;
        if (sortAttrA < sortAttrB)
          return -1;
        if (sortAttrA > sortAttrB)
          return 1;
        return 0;
    };
    
    // REBUILD DOM

    function rebuild(element){
      if(order == 'asc'){
        $sortWrapper.prepend(element).prepend(' ');
      } else {
        $sortWrapper.append(element).append(' ');
      };
    };
    
    // RANDOMIZE ARRAY

    function arrayShuffle(oldArray){
      var newArray = oldArray.slice();
      var len = newArray.length;
      var i = len;
      while (i--){
        var p = parseInt(Math.random()*len);
        var t = newArray[i];
          newArray[i] = newArray[p];
          newArray[p] = t;
      };
      return newArray; 
    };
    
    // SORT
    
    $cont.find(config.targetSelector).wrapAll('<div class="mix_sorter"/>');
    
    var $sortWrapper = $cont.find('.mix_sorter');
    
    if(!config.origSort.length){
      $sortWrapper.find(config.targetSelector+':visible').each(function(){
        $(this).wrap('<s/>');
        config.origSort.push($(this).parent().html().replace(/\s+/g, ''));
        $(this).unwrap();
      });
    };
    
    
    
    $sortWrapper.empty();
    
    if(sortby == 'reset'){
      $.each(config.startOrder,function(){
        $sortWrapper.append(this).append(' ');
      });
    } else if(sortby == 'default'){
      $.each(config.origOrder,function(){
        rebuild(this);
      });
    } else if(sortby == 'random'){
      if(!config.newOrder.length){
        config.newOrder = arrayShuffle(config.startOrder);
      };
      $.each(config.newOrder,function(){
        $sortWrapper.append(this).append(' ');
      }); 
    } else if(sortby == 'custom'){
      $.each(order, function(){
        rebuild(this);
      });
    } else { 
      // SORT BY ATTRIBUTE
      
      if(typeof config.origOrder[0].attr(sortby) === 'undefined'){
        console.log('No such attribute found. Terminating');
        return false;
      };
      
      if(!config.newOrder.length){
        $.each(config.origOrder,function(){
          config.newOrder.push($(this));
        });
        config.newOrder.sort(compare);
      };
      $.each(config.newOrder,function(){
        rebuild(this);
      });
      
    };
    config.checkSort = [];
    $sortWrapper.find(config.targetSelector+':visible').each(function(i){
      var $t = $(this);
      if(i == 0){
        
        // PREVENT COMPARE RETURNING FALSE POSITIVES ON ELEMENTS WITH NO CLASS/ATTRIBUTES
        
        $t.attr('data-checksum','1');
      };
      $t.wrap('<s/>');
      config.checkSort.push($t.parent().html().replace(/\s+/g, ''));
      $t.unwrap();
    });
    
    $cont.find(config.targetSelector).unwrap();
  };
  
  // FIND VENDOR PREFIX

  function prefix(el) {
      var prefixes = ["Webkit", "Moz", "O", "ms"];
      for (var i = 0; i < prefixes.length; i++){
          if (prefixes[i] + "Transition" in el.style){
              return prefixes[i];
          };
      };
      return "transition" in el.style ? "" : false;
  };
  
  // REMOVE SPECIFIC STYLES
  
  $.fn.removeStyle = function(style){
    return this.each(function(){
      var obj = $(this);
      style = style.replace(/\s+/g, '');
      var styles = style.split(',');
      $.each(styles,function(){
        
        var search = new RegExp(this.toString() + '[^;]+;?', 'g');
        obj.attr('style', function(i, style){
          if(style) return style.replace(search, '');
          });
      });
    });
    };

  // COMPARE ARRAYS 
  
  function compareArr(a,b){
      if (a.length != b.length) return false;
      for (var i = 0; i < b.length; i++){
          if (a[i].compare) { 
              if (!a[i].compare(b[i])) return false;
          };
          if (a[i] !== b[i]) return false;
      };
      return true;
  };
  
  // BUILD FILTER ARRAY(S)
  
  function buildFilterArray(str){
    // CLEAN FILTER STRING
    str = str.replace(/\s{2,}/g, ' ');
    // FOR EACH PEROID SEPERATED CLASS NAME, ADD STRING TO FILTER ARRAY
    var arr = str.split(' ');
    // IF ALL, REPLACE WITH MIX_ALL
    $.each(arr,function(i){
      if(this == 'all')arr[i] = 'mix_all';
    });
    if(arr[0] == "")arr.shift(); 
    return arr;
  };

  
})(jQuery);

//--------------------------------------------------------------------------------------------


/* ---------------------- 
  tabs
---------------------- */
/*
 * jQuery EasyTabs plugin 3.2.0
 *
 * Copyright (c) 2010-2011 Steve Schwartz (JangoSteve)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Date: Thu May 09 17:30:00 2013 -0500
 */
(function(a){a.easytabs=function(j,e){var f=this,q=a(j),i={animate:true,panelActiveClass:"active",tabActiveClass:"active",defaultTab:"li:first-child",animationSpeed:"fast",tabs:"> ul > li",updateHash:false,cycle:false,collapsible:false,collapsedClass:"collapsed",collapsedByDefault:true,uiTabs:false,transitionIn:"fadeIn",transitionOut:"fadeOut",transitionInEasing:"swing",transitionOutEasing:"swing",transitionCollapse:"slideUp",transitionUncollapse:"slideDown",transitionCollapseEasing:"swing",transitionUncollapseEasing:"swing",containerClass:"",tabsClass:"",tabClass:"",panelClass:"",cache:true,event:"click",panelContext:q},h,l,v,m,d,t={fast:200,normal:400,slow:600},r;f.init=function(){f.settings=r=a.extend({},i,e);r.bind_str=r.event+".easytabs";if(r.uiTabs){r.tabActiveClass="ui-tabs-selected";r.containerClass="ui-tabs ui-widget ui-widget-content ui-corner-all";r.tabsClass="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all";r.tabClass="ui-state-default ui-corner-top";r.panelClass="ui-tabs-panel ui-widget-content ui-corner-bottom"}if(r.collapsible&&e.defaultTab!==undefined&&e.collpasedByDefault===undefined){r.collapsedByDefault=false}if(typeof(r.animationSpeed)==="string"){r.animationSpeed=t[r.animationSpeed]}a("a.anchor").remove().prependTo("body");q.data("easytabs",{});f.setTransitions();f.getTabs();b();g();w();n();c();q.attr("data-easytabs",true)};f.setTransitions=function(){v=(r.animate)?{show:r.transitionIn,hide:r.transitionOut,speed:r.animationSpeed,collapse:r.transitionCollapse,uncollapse:r.transitionUncollapse,halfSpeed:r.animationSpeed/2}:{show:"show",hide:"hide",speed:0,collapse:"hide",uncollapse:"show",halfSpeed:0}};f.getTabs=function(){var x;f.tabs=q.find(r.tabs),f.panels=a(),f.tabs.each(function(){var A=a(this),z=A.children("a"),y=A.children("a").data("target");A.data("easytabs",{});if(y!==undefined&&y!==null){A.data("easytabs").ajax=z.attr("href")}else{y=z.attr("href")}y=y.match(/#([^\?]+)/)[1];x=r.panelContext.find("#"+y);if(x.length){x.data("easytabs",{position:x.css("position"),visibility:x.css("visibility")});x.not(r.panelActiveClass).hide();f.panels=f.panels.add(x);A.data("easytabs").panel=x}else{f.tabs=f.tabs.not(A);if("console" in window){console.warn("Warning: tab without matching panel for selector '#"+y+"' removed from set")}}})};f.selectTab=function(x,C){var y=window.location,B=y.hash.match(/^[^\?]*/)[0],z=x.parent().data("easytabs").panel,A=x.parent().data("easytabs").ajax;if(r.collapsible&&!d&&(x.hasClass(r.tabActiveClass)||x.hasClass(r.collapsedClass))){f.toggleTabCollapse(x,z,A,C)}else{if(!x.hasClass(r.tabActiveClass)||!z.hasClass(r.panelActiveClass)){o(x,z,A,C)}else{if(!r.cache){o(x,z,A,C)}}}};f.toggleTabCollapse=function(x,y,z,A){f.panels.stop(true,true);if(u(q,"easytabs:before",[x,y,r])){f.tabs.filter("."+r.tabActiveClass).removeClass(r.tabActiveClass).children().removeClass(r.tabActiveClass);if(x.hasClass(r.collapsedClass)){if(z&&(!r.cache||!x.parent().data("easytabs").cached)){q.trigger("easytabs:ajax:beforeSend",[x,y]);y.load(z,function(C,B,D){x.parent().data("easytabs").cached=true;q.trigger("easytabs:ajax:complete",[x,y,C,B,D])})}x.parent().removeClass(r.collapsedClass).addClass(r.tabActiveClass).children().removeClass(r.collapsedClass).addClass(r.tabActiveClass);y.addClass(r.panelActiveClass)[v.uncollapse](v.speed,r.transitionUncollapseEasing,function(){q.trigger("easytabs:midTransition",[x,y,r]);if(typeof A=="function"){A()}})}else{x.addClass(r.collapsedClass).parent().addClass(r.collapsedClass);y.removeClass(r.panelActiveClass)[v.collapse](v.speed,r.transitionCollapseEasing,function(){q.trigger("easytabs:midTransition",[x,y,r]);if(typeof A=="function"){A()}})}}};f.matchTab=function(x){return f.tabs.find("[href='"+x+"'],[data-target='"+x+"']").first()};f.matchInPanel=function(x){return(x&&f.validId(x)?f.panels.filter(":has("+x+")").first():[])};f.validId=function(x){return x.substr(1).match(/^[A-Za-z]+[A-Za-z0-9\-_:\.].$/)};f.selectTabFromHashChange=function(){var y=window.location.hash.match(/^[^\?]*/)[0],x=f.matchTab(y),z;if(r.updateHash){if(x.length){d=true;f.selectTab(x)}else{z=f.matchInPanel(y);if(z.length){y="#"+z.attr("id");x=f.matchTab(y);d=true;f.selectTab(x)}else{if(!h.hasClass(r.tabActiveClass)&&!r.cycle){if(y===""||f.matchTab(m).length||q.closest(y).length){d=true;f.selectTab(l)}}}}}};f.cycleTabs=function(x){if(r.cycle){x=x%f.tabs.length;$tab=a(f.tabs[x]).children("a").first();d=true;f.selectTab($tab,function(){setTimeout(function(){f.cycleTabs(x+1)},r.cycle)})}};f.publicMethods={select:function(x){var y;if((y=f.tabs.filter(x)).length===0){if((y=f.tabs.find("a[href='"+x+"']")).length===0){if((y=f.tabs.find("a"+x)).length===0){if((y=f.tabs.find("[data-target='"+x+"']")).length===0){if((y=f.tabs.find("a[href$='"+x+"']")).length===0){a.error("Tab '"+x+"' does not exist in tab set")}}}}}else{y=y.children("a").first()}f.selectTab(y)}};var u=function(A,x,z){var y=a.Event(x);A.trigger(y,z);return y.result!==false};var b=function(){q.addClass(r.containerClass);f.tabs.parent().addClass(r.tabsClass);f.tabs.addClass(r.tabClass);f.panels.addClass(r.panelClass)};var g=function(){var y=window.location.hash.match(/^[^\?]*/)[0],x=f.matchTab(y).parent(),z;if(x.length===1){h=x;r.cycle=false}else{z=f.matchInPanel(y);if(z.length){y="#"+z.attr("id");h=f.matchTab(y).parent()}else{h=f.tabs.parent().find(r.defaultTab);if(h.length===0){a.error("The specified default tab ('"+r.defaultTab+"') could not be found in the tab set ('"+r.tabs+"') out of "+f.tabs.length+" tabs.")}}}l=h.children("a").first();p(x)};var p=function(z){var y,x;if(r.collapsible&&z.length===0&&r.collapsedByDefault){h.addClass(r.collapsedClass).children().addClass(r.collapsedClass)}else{y=a(h.data("easytabs").panel);x=h.data("easytabs").ajax;if(x&&(!r.cache||!h.data("easytabs").cached)){q.trigger("easytabs:ajax:beforeSend",[l,y]);y.load(x,function(B,A,C){h.data("easytabs").cached=true;q.trigger("easytabs:ajax:complete",[l,y,B,A,C])})}h.data("easytabs").panel.show().addClass(r.panelActiveClass);h.addClass(r.tabActiveClass).children().addClass(r.tabActiveClass)}q.trigger("easytabs:initialised",[l,y])};var w=function(){f.tabs.children("a").bind(r.bind_str,function(x){r.cycle=false;d=false;f.selectTab(a(this));x.preventDefault?x.preventDefault():x.returnValue=false})};var o=function(z,D,E,H){f.panels.stop(true,true);if(u(q,"easytabs:before",[z,D,r])){var A=f.panels.filter(":visible"),y=D.parent(),F,x,C,G,B=window.location.hash.match(/^[^\?]*/)[0];if(r.animate){F=s(D);x=A.length?k(A):0;C=F-x}m=B;G=function(){q.trigger("easytabs:midTransition",[z,D,r]);if(r.animate&&r.transitionIn=="fadeIn"){if(C<0){y.animate({height:y.height()+C},v.halfSpeed).css({"min-height":""})}}if(r.updateHash&&!d){window.location.hash="#"+D.attr("id")}else{d=false}D[v.show](v.speed,r.transitionInEasing,function(){y.css({height:"","min-height":""});q.trigger("easytabs:after",[z,D,r]);if(typeof H=="function"){H()}})};if(E&&(!r.cache||!z.parent().data("easytabs").cached)){q.trigger("easytabs:ajax:beforeSend",[z,D]);D.load(E,function(J,I,K){z.parent().data("easytabs").cached=true;q.trigger("easytabs:ajax:complete",[z,D,J,I,K])})}if(r.animate&&r.transitionOut=="fadeOut"){if(C>0){y.animate({height:(y.height()+C)},v.halfSpeed)}else{y.css({"min-height":y.height()})}}f.tabs.filter("."+r.tabActiveClass).removeClass(r.tabActiveClass).children().removeClass(r.tabActiveClass);f.tabs.filter("."+r.collapsedClass).removeClass(r.collapsedClass).children().removeClass(r.collapsedClass);z.parent().addClass(r.tabActiveClass).children().addClass(r.tabActiveClass);f.panels.filter("."+r.panelActiveClass).removeClass(r.panelActiveClass);D.addClass(r.panelActiveClass);if(A.length){A[v.hide](v.speed,r.transitionOutEasing,G)}else{D[v.uncollapse](v.speed,r.transitionUncollapseEasing,G)}}};var s=function(z){if(z.data("easytabs")&&z.data("easytabs").lastHeight){return z.data("easytabs").lastHeight}var B=z.css("display"),y,x;try{y=a("<div></div>",{position:"absolute",visibility:"hidden",overflow:"hidden"})}catch(A){y=a("<div></div>",{visibility:"hidden",overflow:"hidden"})}x=z.wrap(y).css({position:"relative",visibility:"hidden",display:"block"}).outerHeight();z.unwrap();z.css({position:z.data("easytabs").position,visibility:z.data("easytabs").visibility,display:B});z.data("easytabs").lastHeight=x;return x};var k=function(y){var x=y.outerHeight();if(y.data("easytabs")){y.data("easytabs").lastHeight=x}else{y.data("easytabs",{lastHeight:x})}return x};var n=function(){if(typeof a(window).hashchange==="function"){a(window).hashchange(function(){f.selectTabFromHashChange()})}else{if(a.address&&typeof a.address.change==="function"){a.address.change(function(){f.selectTabFromHashChange()})}}};var c=function(){var x;if(r.cycle){x=f.tabs.index(h);setTimeout(function(){f.cycleTabs(x+1)},r.cycle)}};f.init()};a.fn.easytabs=function(c){var b=arguments;return this.each(function(){var e=a(this),d=e.data("easytabs");if(undefined===d){d=new a.easytabs(this,c);e.data("easytabs",d)}if(d.publicMethods[c]){return d.publicMethods[c](Array.prototype.slice.call(b,1))}})}})(jQuery);


//--------------------------------------------------------------------------------------------

/* ---------------------- 
  flip clock
---------------------- */
/*
  Base.js, version 1.1a
  Copyright 2006-2010, Dean Edwards
  License: http://www.opensource.org/licenses/mit-license.php
*/

var Base = function() {
  // dummy
};

Base.extend = function(_instance, _static) { // subclass
  
  "use strict";
  
  var extend = Base.prototype.extend;
  
  // build the prototype
  Base._prototyping = true;
  
  var proto = new this();
  
  extend.call(proto, _instance);
  
  proto.base = function() {
  // call this method from any other method to invoke that method's ancestor
  };

  delete Base._prototyping;
  
  // create the wrapper for the constructor function
  //var constructor = proto.constructor.valueOf(); //-dean
  var constructor = proto.constructor;
  var klass = proto.constructor = function() {
    if (!Base._prototyping) {
      if (this._constructing || this.constructor == klass) { // instantiation
        this._constructing = true;
        constructor.apply(this, arguments);
        delete this._constructing;
      } else if (arguments[0] !== null) { // casting
        return (arguments[0].extend || extend).call(arguments[0], proto);
      }
    }
  };
  
  // build the class interface
  klass.ancestor = this;
  klass.extend = this.extend;
  klass.forEach = this.forEach;
  klass.implement = this.implement;
  klass.prototype = proto;
  klass.toString = this.toString;
  klass.valueOf = function(type) {
    //return (type == "object") ? klass : constructor; //-dean
    return (type == "object") ? klass : constructor.valueOf();
  };
  extend.call(klass, _static);
  // class initialisation
  if (typeof klass.init == "function") klass.init();
  return klass;
};

Base.prototype = {  
  extend: function(source, value) {
    if (arguments.length > 1) { // extending with a name/value pair
      var ancestor = this[source];
      if (ancestor && (typeof value == "function") && // overriding a method?
        // the valueOf() comparison is to avoid circular references
        (!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
        /\bbase\b/.test(value)) {
        // get the underlying method
        var method = value.valueOf();
        // override
        value = function() {
          var previous = this.base || Base.prototype.base;
          this.base = ancestor;
          var returnValue = method.apply(this, arguments);
          this.base = previous;
          return returnValue;
        };
        // point to the underlying method
        value.valueOf = function(type) {
          return (type == "object") ? value : method;
        };
        value.toString = Base.toString;
      }
      this[source] = value;
    } else if (source) { // extending with an object literal
      var extend = Base.prototype.extend;
      // if this object has a customised extend method then use it
      if (!Base._prototyping && typeof this != "function") {
        extend = this.extend || extend;
      }
      var proto = {toSource: null};
      // do the "toString" and other methods manually
      var hidden = ["constructor", "toString", "valueOf"];
      // if we are prototyping then include the constructor
      var i = Base._prototyping ? 0 : 1;
      while (key = hidden[i++]) {
        if (source[key] != proto[key]) {
          extend.call(this, key, source[key]);

        }
      }
      // copy each of the source object's properties to this object
      for (var key in source) {
        if (!proto[key]) extend.call(this, key, source[key]);
      }
    }
    return this;
  }
};

// initialise
Base = Base.extend({
  constructor: function() {
    this.extend(arguments[0]);
  }
}, {
  ancestor: Object,
  version: "1.1",
  
  forEach: function(object, block, context) {
    for (var key in object) {
      if (this.prototype[key] === undefined) {
        block.call(context, object[key], key, object);
      }
    }
  },
    
  implement: function() {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] == "function") {
        // if it's a function, call it
        arguments[i](this.prototype);
      } else {
        // add the interface using the extend method
        this.prototype.extend(arguments[i]);
      }
    }
    return this;
  },
  
  toString: function() {
    return String(this.valueOf());
  }
});
/*jshint smarttabs:true */

var FlipClock;
  
/**
 * FlipClock.js
 *
 * @author     Justin Kimbrell
 * @copyright  2013 - Objective HTML, LLC
 * @licesnse   http://www.opensource.org/licenses/mit-license.php
 */
  
(function($) {
  
  "use strict";
  
  /**
   * FlipFlock Helper
   *
   * @param  object  A jQuery object or CSS select
   * @param  int     An integer used to start the clock (no. seconds)
   * @param  object  An object of properties to override the default  
   */
   
  FlipClock = function(obj, digit, options) {
    if(typeof digit == "object") {
      options = digit;
      digit = 0;
    }

    return new FlipClock.Factory(obj, digit, options);
  };

  /**
   * The global FlipClock.Lang object
   */

  FlipClock.Lang = {};
  
  /**
   * The Base FlipClock class is used to extend all other FlipFlock
   * classes. It handles the callbacks and the basic setters/getters
   *  
   * @param   object  An object of the default properties
   * @param   object  An object of properties to override the default 
   */

  FlipClock.Base = Base.extend({
    
    /**
     * Build Date
     */
     
    buildDate: '2014-06-03',
    
    /**
     * Version
     */
     
    version: '0.5.5',
    
    /**
     * Sets the default options
     *
     * @param object  The default options
     * @param object  The override options
     */
     
    constructor: function(_default, options) {
      if(typeof _default !== "object") {
        _default = {};
      }
      if(typeof options !== "object") {
        options = {};
      }
      this.setOptions($.extend(true, {}, _default, options));
    },
    
    /**
     * Delegates the callback to the defined method
     *
     * @param object  The default options
     * @param object  The override options
     */
     
    callback: function(method) {
      if(typeof method === "function") {
        var args = [];
                
        for(var x = 1; x <= arguments.length; x++) {
          if(arguments[x]) {
            args.push(arguments[x]);
          }
        }
        
        method.apply(this, args);
      }
    },
     
    /**
     * Log a string into the console if it exists
     *
     * @param   string  The name of the option
     * @return  mixed
     */   
     
    log: function(str) {
      if(window.console && console.log) {
        console.log(str);
      }
    },
     
    /**
     * Get an single option value. Returns false if option does not exist
     *
     * @param   string  The name of the option
     * @return  mixed
     */   
     
    getOption: function(index) {
      if(this[index]) {
        return this[index];
      }
      return false;
    },
    
    /**
     * Get all options
     *
     * @return  bool
     */   
     
    getOptions: function() {
      return this;
    },
    
    /**
     * Set a single option value
     *
     * @param   string  The name of the option
     * @param   mixed   The value of the option
     */   
     
    setOption: function(index, value) {
      this[index] = value;
    },
    
    /**
     * Set a multiple options by passing a JSON object
     *
     * @param   object  The object with the options
     * @param   mixed   The value of the option
     */   
    
    setOptions: function(options) {
      for(var key in options) {
          if(typeof options[key] !== "undefined") {
            this.setOption(key, options[key]);
          }
        }
    }
    
  });
  
}(jQuery));

/*jshint smarttabs:true */

/**
 * FlipClock.js
 *
 * @author     Justin Kimbrell
 * @copyright  2013 - Objective HTML, LLC
 * @licesnse   http://www.opensource.org/licenses/mit-license.php
 */
  
(function($) {
  
  "use strict";
  
  /**
   * The FlipClock Face class is the base class in which to extend
   * all other FlockClock.Face classes.
   *
   * @param   object  The parent FlipClock.Factory object
   * @param   object  An object of properties to override the default 
   */
   
  FlipClock.Face = FlipClock.Base.extend({
    
    /**
     * An array of jQuery objects used for the dividers (the colons)
     */
     
    dividers: [],

    /**
     * An array of FlipClock.List objects
     */   
     
    factory: false,
    
    /**
     * An array of FlipClock.List objects
     */   
     
    lists: [],

    /**
     * Constructor
     *
     * @param   object  The parent FlipClock.Factory object
     * @param   object  An object of properties to override the default 
     */
     
    constructor: function(factory, options) {
      this.dividers = [];
      this.lists = [];
      this.base(options);
      this.factory  = factory;
    },
    
    /**
     * Build the clock face
     */
     
    build: function() {},
    
    /**
     * Creates a jQuery object used for the digit divider
     *
     * @param mixed   The divider label text
     * @param mixed Set true to exclude the dots in the divider. 
     *          If not set, is false.
     */
     
    createDivider: function(label, css, excludeDots) {
    
      if(typeof css == "boolean" || !css) {
        excludeDots = css;
        css = label;
      }

      var dots = [
        '<span class="'+this.factory.classes.dot+' top"></span>',
        '<span class="'+this.factory.classes.dot+' bottom"></span>'
      ].join('');

      if(excludeDots) {
        dots = '';  
      }

      label = this.factory.localize(label);

      var html = [
        '<span class="'+this.factory.classes.divider+' '+(css ? css : '').toLowerCase()+'">',
          '<span class="'+this.factory.classes.label+'">'+(label ? label : '')+'</span>',
          dots,
        '</span>'
      ];  
      
      return $(html.join(''));
    },
    
    /**
     * Creates a FlipClock.List object and appends it to the DOM
     *
     * @param mixed   The digit to select in the list
     * @param object  An object to override the default properties
     */
     
    createList: function(digit, options) {
      if(typeof digit === "object") {
        options = digit;
        digit = 0;
      }

      var obj = new FlipClock.List(this.factory, digit, options);
    
      this.lists.push(obj);

      return obj;
    },
    
    /**
     * Triggers when the clock is reset
     */

    reset: function() {
      this.factory.time = new FlipClock.Time(
        this.factor, 
        this.factory.original ? Math.round(this.factory.original) : 0
      );
      this.flip(this.factory.original, false);
    },

    /**
     * Sets the clock time
     */
     
    addDigit: function(digit) {
      var obj = this.createList(digit, {
        classes: {
          active: this.factory.classes.active,
          before: this.factory.classes.before,
          flip: this.factory.classes.flip
        }
      });
      
      obj.$el.append(this.factory.lists[this.factory.lists.length - 1].$obj);
              
      //this.factory.lists.unshift(obj);
    },
    
    /**
     * Triggers when the clock is started
     */
     
    start: function() {},
    
    /**
     * Triggers when the time on the clock stops
     */
     
    stop: function() {},
    
    /**
     * Auto increments/decrements the value of the clock face
     */
     
    autoIncrement: function() {
      if (!(this.factory.time.time instanceof Date)) {
        if(!this.factory.countdown) {
          this.increment();
        }
        else {
          this.decrement();
        }
      }
    },

    /**
     * Increments the value of the clock face
     */
     
    increment: function() {
      this.factory.time.addSecond();
    },

    /**
     * Decrements the value of the clock face
     */

    decrement: function() {
      if(this.factory.time.getTimeSeconds() == 0) {
            this.factory.stop()
      }
      else {
        this.factory.time.subSecond();
      }
    },
      
    /**
     * Triggers when the numbers on the clock flip
     */
     
    flip: function(time, doNotAddPlayClass) {
      var t = this;

      $.each(time, function(i, digit) {
        var list = t.lists[i];

        if(list) {
          if(!doNotAddPlayClass && digit != list.digit) {
            list.play();  
          }

          list.select(digit);
        } 
        else {
          t.addDigit(digit);
        }
      });

    }
          
  });
  
}(jQuery));

/*jshint smarttabs:true */

/**
 * FlipClock.js
 *
 * @author     Justin Kimbrell
 * @copyright  2013 - Objective HTML, LLC
 * @licesnse   http://www.opensource.org/licenses/mit-license.php
 */
  
(function($) {
  
  "use strict";
  
  /**
   * The FlipClock Factory class is used to build the clock and manage
   * all the public methods.
   *
   * @param   object  A jQuery object or CSS selector used to fetch
              the wrapping DOM nodes
   * @param   mixed   This is the digit used to set the clock. If an 
              object is passed, 0 will be used. 
   * @param   object  An object of properties to override the default 
   */
    
  FlipClock.Factory = FlipClock.Base.extend({
    
    /**
     * Auto start the clock on page load (True|False)
     */ 
     
    autoStart: true,
    
    /**
     * The callback methods
     */   
     
    callbacks: {
      destroy: false,
      create: false,
      init: false,
      interval: false,
      start: false,
      stop: false,
      reset: false
    },
    
    /**
     * The CSS classes
     */   
     
    classes: {
      active: 'flip-clock-active',
      before: 'flip-clock-before',
      divider: 'flip-clock-divider',
      dot: 'flip-clock-dot',
      label: 'flip-clock-label',
      flip: 'flip',
      play: 'play',
      wrapper: 'flip-clock-wrapper'
    },
    
    /**
     * The name of the clock face class in use
     */ 
     
    clockFace: 'HourlyCounter',
     
    /**
     * The name of the clock face class in use
     */ 
     
    countdown: false,
     
    /**
     * The name of the default clock face class to use if the defined
     * clockFace variable is not a valid FlipClock.Face object
     */ 
     
    defaultClockFace: 'HourlyCounter',
     
    /**
     * The default language
     */ 
     
    defaultLanguage: 'english',
     
    /**
     * The language being used to display labels (string)
     */ 
     
    language: 'english',
     
    /**
     * The language object after it has been loaded
     */ 
     
    lang: false,
     
    /**
     * The original starting value of the clock. Used for the reset method.
     */   
     
    original: false,
    
    /**
     * The FlipClock.Face object
     */ 
     
    face: true,
     
    /**
     * Is the clock running? (True|False)
     */   
     
    running: false,
    
    /**
     * The FlipClock.Time object
     */   
     
    time: false,
    
    /**
     * The FlipClock.Timer object
     */   
     
    timer: false,
    
    /**
     * An array of FlipClock.List objects
     */   
     
    lists: [],
    
    /**
     * The jQuery object
     */   
     
    $el: false,

    /**
     * The jQuery object (depcrecated)
     */   
     
    $wrapper: false,
    
    /**
     * Constructor
     *
     * @param   object  The wrapping jQuery object
     * @param object  Number of seconds used to start the clock
     * @param object  An object override options
     */
     
    constructor: function(obj, digit, options) {

      if(!options) {
        options = {};
      }

      this.lists = [];
      this.running = false;
      this.base(options); 

      this.$el = $(obj).addClass(this.classes.wrapper);

      // Depcrated support of the $wrapper property.
      this.$wrapper = this.$el;

      this.original = (digit instanceof Date) ? digit : (digit ? Math.round(digit) : 0);

      this.time = new FlipClock.Time(this, this.original, {
        minimumDigits: options.minimumDigits ? options.minimumDigits : 0,
        animationRate: options.animationRate ? options.animationRate : 1000 
      });

      this.timer = new FlipClock.Timer(this, options);

      this.lang = this.loadLanguage(this.language);
      
      this.face = this.loadClockFace(this.clockFace, options);

      if(this.autoStart) {
        this.start();
      }
    },
    
    /**
     * Load the FlipClock.Face object
     *
     * @param object  The name of the FlickClock.Face class
     * @param object  An object override options
     */
     
    loadClockFace: function(name, options) {  
      var face, suffix = 'Face';
      
      name = name.ucfirst()+suffix;
      
      if(FlipClock[name]) {
        face = new FlipClock[name](this, options);
      }
      else {
        face = new FlipClock[this.defaultClockFace+suffix](this, options);
      }
      
      face.build();
        
      return face;
    },
      
    
    /**
     * Load the FlipClock.Lang object
     *
     * @param object  The name of the language to load
     */
     
    loadLanguage: function(name) {  
      var lang;
      
      if(FlipClock.Lang[name.ucfirst()]) {
        lang = FlipClock.Lang[name.ucfirst()];
      }
      else if(FlipClock.Lang[name]) {
        lang = FlipClock.Lang[name];
      }
      else {
        lang = FlipClock.Lang[this.defaultLanguage];
      }
      
      return lang;
    },
          
    /**
     * Localize strings into various languages
     *
     * @param string  The index of the localized string
     * @param object  Optionally pass a lang object
     */

    localize: function(index, obj) {
      var lang = this.lang;

      if(!index) {
        return null;
      }

      var lindex = index.toLowerCase();

      if(typeof obj == "object") {
        lang = obj;
      }

      if(lang && lang[lindex]) {
        return lang[lindex];
      }

      return index;
    },
     

    /**
     * Starts the clock
     */
     
    start: function(callback) {
      var t = this;

      if(!t.running && (!t.countdown || t.countdown && t.time.time > 0)) {
        
        t.face.start(t.time);
        t.timer.start(function() {
          t.flip();
          
          if(typeof callback === "function") {
            callback();
          } 
        });
      }
      else {
        t.log('Trying to start timer when countdown already at 0');
      }
    },
    
    /**
     * Stops the clock
     */
     
    stop: function(callback) {
      this.face.stop();
      this.timer.stop(callback);
      
      for(var x in this.lists) {
        if (this.lists.hasOwnProperty(x)) {
          this.lists[x].stop();
        }
      } 
    },
    
    /**
     * Reset the clock
     */
     
    reset: function(callback) {
      this.timer.reset(callback);
      this.face.reset();
    },
    
    /**
     * Sets the clock time
     */
     
    setTime: function(time) {
      this.time.time = time;
      this.flip(true);    
    },
    
    /**
     * Get the clock time
     *
     * @return  object  Returns a FlipClock.Time object
     */
     
    getTime: function(time) {
      return this.time;   
    },
    
    /**
     * Changes the increment of time to up or down (add/sub)
     */
     
    setCountdown: function(value) {
      var running = this.running;
      
      this.countdown = value ? true : false;
        
      if(running) {
        this.stop();
        this.start();
      }
    },
    
    /**
     * Flip the digits on the clock
     *
     * @param  array  An array of digits   
     */
    flip: function(doNotAddPlayClass) {
      this.face.flip(false, doNotAddPlayClass);
    }
    
  });
    
}(jQuery));

/*jshint smarttabs:true */

/**
 * FlipClock.js
 *
 * @author     Justin Kimbrell
 * @copyright  2013 - Objective HTML, LLC
 * @licesnse   http://www.opensource.org/licenses/mit-license.php
 */
  
(function($) {
  
  "use strict";
  
  /**
   * The FlipClock List class is used to build the list used to create 
   * the card flip effect. This object fascilates selecting the correct
   * node by passing a specific digit.
   *
   * @param   object  A FlipClock.Factory object
   * @param   mixed   This is the digit used to set the clock. If an 
   *            object is passed, 0 will be used. 
   * @param   object  An object of properties to override the default 
   */
    
  FlipClock.List = FlipClock.Base.extend({
    
    /**
     * The digit (0-9)
     */   
     
    digit: 0,
    
    /**
     * The CSS classes
     */   
     
    classes: {
      active: 'flip-clock-active',
      before: 'flip-clock-before',
      flip: 'flip'  
    },
        
    /**
     * The parent FlipClock.Factory object
     */   
     
    factory: false,
    
    /**
     * The jQuery object
     */   
     
    $el: false,

    /**
     * The jQuery object (deprecated)
     */   
     
    $obj: false,
    
    /**
     * The items in the list
     */   
     
    items: [],
    
    /**
     * The last digit
     */   
     
    lastDigit: 0,
         
    /**
     * Constructor
     *
     * @param  object  A FlipClock.Factory object
     * @param  int     An integer use to select the correct digit
     * @param  object  An object to override the default properties  
     */
     
    minimumDigits: 0,

    constructor: function(factory, digit, options) {
      this.factory = factory;
      this.digit = digit;
      this.lastDigit = digit;
      this.$el = this.createList();
      
      // Depcrated support of the $obj property.
      this.$wrapper = this.$el;

      if(digit > 0) {
        this.select(digit);
      }

      this.factory.$el.append(this.$el);
    },
    
    /**
     * Select the digit in the list
     *
     * @param  int  A digit 0-9  
     */
     
    select: function(digit) {
      if(typeof digit === "undefined") {
        digit = this.digit;
      }
      else {
        this.digit = digit;
      }

      if(this.digit != this.lastDigit) {
        var $delete = this.$el.find('.'+this.classes.before).removeClass(this.classes.before);

        this.$el.find('.'+this.classes.active).removeClass(this.classes.active)
                            .addClass(this.classes.before);

        this.appendListItem(this.classes.active, this.digit);

        $delete.remove();

        this.lastDigit = this.digit;
      }

    },
    
    /**
     * Adds the play class to the DOM object
     */
        
    play: function() {
      this.$el.addClass(this.factory.classes.play);
    },
    
    /**
     * Removes the play class to the DOM object 
     */
     
    stop: function() {
      var t = this;

      setTimeout(function() {
        t.$el.removeClass(t.factory.classes.play);
      }, this.factory.timer.interval);
    },
    
    createListItem: function(css, value) {
      return [
        '<li class="'+(css ? css : '')+'">',
          '<a href="#">',
            '<div class="up">',
              '<div class="shadow"></div>',
              '<div class="inn">'+(value ? value : '')+'</div>',
            '</div>',
            '<div class="down">',
              '<div class="shadow"></div>',
              '<div class="inn">'+(value ? value : '')+'</div>',
            '</div>',
          '</a>',
        '</li>'
      ].join('');
    },

    appendListItem: function(css, value) {
      var html = this.createListItem(css, value);

      this.$el.append(html);
    },

    /**
     * Create the list of digits and appends it to the DOM object 
     */
     
    createList: function() {

      var lastDigit = this.getPrevDigit() ? this.getPrevDigit() : this.digit;

      var html = $([
        '<ul class="'+this.classes.flip+' '+(this.factory.running ? this.factory.classes.play : '')+'">',
          this.createListItem(this.classes.before, lastDigit),
          this.createListItem(this.classes.active, this.digit),
        '</ul>'
      ].join(''));
      
      /*
      DELETE PENDING - Replace with the more simple logic above.
      This should reduce the load on the some GPU's by having
      signifantly fewing DOM nodes in memory.

      for(var x = 0; x < 2; x++) {
        var item = $([
        '<li data-digit="'+x+'">',
          '<a href="#">',
            '<div class="up">',
              '<div class="shadow"></div>',
              '<div class="inn">'+x+'</div>',
            '</div>',
            '<div class="down">',
              '<div class="shadow"></div>',
              '<div class="inn">'+x+'</div>',
            '</div>',
          '</a>',
        '</li>'].join(''));
        
        this.items.push(item);
        
        html.append(item);
      }
      */
            
      return html;
    },

    getNextDigit: function() {
      return this.digit == 9 ? 0 : this.digit + 1;
    },

    getPrevDigit: function() {
      return this.digit == 0 ? 9 : this.digit - 1;
    },

    /*
    setActiveDigit: function(digit) {
      var $obj = this.$el.find('.'+this.classes.active);

      $obj.find('.inn').html(digit);
      $obj.removeClass(this.classes.active).addClass(this.classes.active);
    },

    setActiveDigit: function(digit) {
      this.$el.find('.'+this.classes.before).find('.inn').html(digit);
    }
    */

  });
  
  
}(jQuery));

/*jshint smarttabs:true */

/**
 * FlipClock.js
 *
 * @author     Justin Kimbrell
 * @copyright  2013 - Objective HTML, LLC
 * @licesnse   http://www.opensource.org/licenses/mit-license.php
 */
  
(function($) {
  
  "use strict";
  
  /**
   * Capitalize the first letter in a string
   *
   * @return string
   */
   
  String.prototype.ucfirst = function() {
    return this.substr(0, 1).toUpperCase() + this.substr(1);
  };
  
  /**
   * jQuery helper method
   *
   * @param  int     An integer used to start the clock (no. seconds)
   * @param  object  An object of properties to override the default  
   */
   
  $.fn.FlipClock = function(digit, options) {
    if(typeof digit == "object") {
      options = digit;
      digit = 0;
    }   
    return new FlipClock($(this), digit, options);
  };
  
  /**
   * jQuery helper method
   *
   * @param  int     An integer used to start the clock (no. seconds)
   * @param  object  An object of properties to override the default  
   */
   
  $.fn.flipClock = function(digit, options) {
    return $.fn.FlipClock(digit, options);
  };
  
}(jQuery));

/*jshint smarttabs:true */

/**
 * FlipClock.js
 *
 * @author     Justin Kimbrell
 * @copyright  2013 - Objective HTML, LLC
 * @licesnse   http://www.opensource.org/licenses/mit-license.php
 */
  
(function($) {
  
  "use strict";
      
  /**
   * The FlipClock Time class is used to manage all the time 
   * calculations.
   *
   * @param   object  A FlipClock.Factory object
   * @param   mixed   This is the digit used to set the clock. If an 
   *            object is passed, 0 will be used. 
   * @param   object  An object of properties to override the default 
   */
    
  FlipClock.Time = FlipClock.Base.extend({
    
    /**
     * The time (in seconds)
     */   
     
    time: 0,
    
    /**
     * The parent FlipClock.Factory object
     */   
     
    factory: false,
    
    /**
     * The minimum number of digits the clock face will have
     */   
     
    minimumDigits: 0,

    /**
     * Constructor
     *
     * @param  object  A FlipClock.Factory object
     * @param  int     An integer use to select the correct digit
     * @param  object  An object to override the default properties  
     */
     
    constructor: function(factory, time, options) {
      this.base(options);
      this.factory = factory;

      if(time) {
        this.time = time;
      }
    },
    
    /**
     * Convert a string or integer to an array of digits
     *
     * @param   mixed  String or Integer of digits   
     * @return  array  An array of digits 
     */
     
    convertDigitsToArray: function(str) {
      var data = [];
      
      str = str.toString();
      
      for(var x = 0;x < str.length; x++) {
        if(str[x].match(/^\d*$/g)) {
          data.push(str[x]);  
        }
      }
      
      return data;
    },
    
    /**
     * Get a specific digit from the time integer
     *
     * @param   int    The specific digit to select from the time  
     * @return  mixed  Returns FALSE if no digit is found, otherwise
     *           the method returns the defined digit  
     */
     
    digit: function(i) {
      var timeStr = this.toString();
      var length  = timeStr.length;
      
      if(timeStr[length - i])  {
        return timeStr[length - i];
      }
      
      return false;
    },

    /**
     * Formats any array of digits into a valid array of digits
     *
     * @param   mixed  An array of digits  
     * @return  array  An array of digits 
     */
     
    digitize: function(obj) {
      var data = [];
      
      $.each(obj, function(i, value) {
        value = value.toString();
        
        if(value.length == 1) {
          value = '0'+value;
        }
        
        for(var x = 0; x < value.length; x++) {
          data.push(value.charAt(x));
        }       
      });

      if(data.length > this.minimumDigits) {
        this.minimumDigits = data.length;
      }
      
      if(this.minimumDigits > data.length) {
        for(var x = data.length; x < this.minimumDigits; x++) {
          data.unshift('0');
        }
      }
      
      return data;
    },
    
    /**
     * Gets a daily breakdown
     *
     * @return  object  Returns a digitized object
     */

    getDayCounter: function(includeSeconds) {
      var digits = [
        this.getDays(),
        this.getHours(true),
        this.getMinutes(true)
      ];

      if(includeSeconds) {
        digits.push(this.getSeconds(true));
      }

      return this.digitize(digits);
    },

    /**
     * Gets number of days
     *
     * @param   bool  Should perform a modulus? If not sent, then no.
     * @return  int   Retuns a floored integer
     */
     
    getDays: function(mod) {
      var days = this.getTimeSeconds() / 60 / 60 / 24;
      
      if(mod) {
        days = days % 7;
      }
      
      return Math.floor(days);
    },
    
    /**
     * Gets an hourly breakdown
     *
     * @return  object  Returns a digitized object
     */
     
    getHourCounter: function() {
      var obj = this.digitize([
        this.getHours(),
        this.getMinutes(true),
        this.getSeconds(true)
      ]);
      
      return obj;
    },
    
    /**
     * Gets an hourly breakdown
     *
     * @return  object  Returns a digitized object
     */
     
    getHourly: function() {
      return this.getHourCounter();
    },
    
    /**
     * Gets number of hours
     *
     * @param   bool  Should perform a modulus? If not sent, then no.
     * @return  int   Retuns a floored integer
     */
     
    getHours: function(mod) {
      var hours = this.getTimeSeconds() / 60 / 60;
      
      if(mod) {
        hours = hours % 24; 
      }
      
      return Math.floor(hours);
    },
    
    /**
     * Gets the twenty-four hour time
     *
     * @return  object  returns a digitized object
     */
     
    getMilitaryTime: function() {
      var date = new Date(); 
      var obj  = this.digitize([
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()       
      ]);

      return obj;
    },
        
    /**
     * Gets number of minutes
     *
     * @param   bool  Should perform a modulus? If not sent, then no.
     * @return  int   Retuns a floored integer
     */
     
    getMinutes: function(mod) {
      var minutes = this.getTimeSeconds() / 60;
      
      if(mod) {
        minutes = minutes % 60;
      }
      
      return Math.floor(minutes);
    },
    
    /**
     * Gets a minute breakdown
     */
     
    getMinuteCounter: function() {
      var obj = this.digitize([
        this.getMinutes(),
        this.getSeconds(true)
      ]);

      return obj;
    },
    
    /**
     * Gets time count in seconds regardless of if targetting date or not.
     *
     * @return  int   Returns a floored integer
     */
     
    getTimeSeconds: function(mod) {
      if (this.time instanceof Date) {
        if (this.factory.countdown) {
          if ((new Date()).getTime() > this.time.getTime()) {
            this.factory.stop();
          }
          return Math.max(this.time.getTime()/1000 - (new Date()).getTime()/1000,0);
        } else {
          return (new Date()).getTime()/1000 - this.time.getTime()/1000 ;
        }
      } else {
        return this.time;
      }
    },
    
    /**
     * Gets number of seconds
     *
     * @param   bool  Should perform a modulus? If not sent, then no.
     * @return  int   Retuns a ceiled integer
     */
     
    getSeconds: function(mod) {
      var seconds = this.getTimeSeconds();
      
      if(mod) {
        if(seconds == 60) {
          seconds = 0;
        }
        else {
          seconds = seconds % 60;
        }
      }
      
      return Math.ceil(seconds);
    },
    
    /**
     * Gets the current twelve hour time
     *
     * @return  object  Returns a digitized object
     */
     
    getTime: function() {
      var date  = new Date(); 
      var hours = date.getHours();
      var merid = hours > 12 ? 'PM' : 'AM';
      var obj   = this.digitize([
        hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours),
        date.getMinutes(),
        date.getSeconds()       
      ]);

      return obj;
    },
    
    /**
     * Gets number of weeks
     *
     * @param   bool  Should perform a modulus? If not sent, then no.
     * @return  int   Retuns a floored integer
     */
     
    getWeeks: function() {
      var weeks = this.getTimeSeconds() / 60 / 60 / 24 / 7;
      
      if(mod) {
        weeks = weeks % 52;
      }
      
      return Math.floor(weeks);
    },
    
    /**
     * Removes a specific number of leading zeros from the array.
     * This method prevents you from removing too many digits, even
     * if you try.
     *
     * @param   int    Total number of digits to remove 
     * @return  array  An array of digits 
     */
     
    removeLeadingZeros: function(totalDigits, digits) {
      var total    = 0;
      var newArray = [];
      
      $.each(digits, function(i, digit) {
        if(i < totalDigits) {
          total += parseInt(digits[i], 10);
        }
        else {
          newArray.push(digits[i]);
        }
      });
      
      if(total === 0) {
        return newArray;
      }
      
      return digits;
    },

    /**
     * Adds X second to the current time
     */

    addSeconds: function(x) {
      this.time += x;
    },

    /**
     * Adds 1 second to the current time
     */

    addSecond: function() {
      this.addSeconds(1);
    },

    /**
     * Substracts X seconds from the current time
     */

    subSeconds: function(x) {
      this.time -= x;
    },

    /**
     * Substracts 1 second from the current time
     */

    subSecond: function() {
      this.subSeconds(1);
    },
    
    /**
     * Converts the object to a human readable string
     */
     
    toString: function() {
      return this.getTimeSeconds().toString();
    }
    
    /*
    getYears: function() {
      return Math.floor(this.time / 60 / 60 / 24 / 7 / 52);
    },
    
    getDecades: function() {
      return Math.floor(this.getWeeks() / 10);
    }*/
  });
  
}(jQuery));

/*jshint smarttabs:true */

/**
 * FlipClock.js
 *
 * @author     Justin Kimbrell
 * @copyright  2013 - Objective HTML, LLC
 * @licesnse   http://www.opensource.org/licenses/mit-license.php
 */
  
(function($) {
  
  "use strict";
  
  /**
   * The FlipClock.Timer object managers the JS timers
   *
   * @param object  The parent FlipClock.Factory object
   * @param object  Override the default options
   */
  
  FlipClock.Timer = FlipClock.Base.extend({
    
    /**
     * Callbacks
     */   
     
    callbacks: {
      destroy: false,
      create: false,
      init: false,
      interval: false,
      start: false,
      stop: false,
      reset: false
    },
    
    /**
     * FlipClock timer count (how many intervals have passed)
     */   
     
    count: 0,
    
    /**
     * The parent FlipClock.Factory object
     */   
     
    factory: false,
    
    /**
     * Timer interval (1 second by default)
     */   
     
    interval: 1000,

    /**
     * The rate of the animation in milliseconds
     */   
     
    animationRate: 1000,
        
    /**
     * Constructor
     *
     * @return  void
     */   
     
    constructor: function(factory, options) {
      this.base(options);
      this.factory = factory;
      this.callback(this.callbacks.init); 
      this.callback(this.callbacks.create);
    },
    
    /**
     * This method gets the elapsed the time as an interger
     *
     * @return  void
     */   
     
    getElapsed: function() {
      return this.count * this.interval;
    },
    
    /**
     * This method gets the elapsed the time as a Date object
     *
     * @return  void
     */   
     
    getElapsedTime: function() {
      return new Date(this.time + this.getElapsed());
    },
    
    /**
     * This method is resets the timer
     *
     * @param   callback  This method resets the timer back to 0
     * @return  void
     */   
     
    reset: function(callback) {
      clearInterval(this.timer);
      this.count = 0;
      this._setInterval(callback);      
      this.callback(this.callbacks.reset);
    },
    
    /**
     * This method is starts the timer
     *
     * @param   callback  A function that is called once the timer is destroyed
     * @return  void
     */   
     
    start: function(callback) {   
      this.factory.running = true;
      this._createTimer(callback);
      this.callback(this.callbacks.start);
    },
    
    /**
     * This method is stops the timer
     *
     * @param   callback  A function that is called once the timer is destroyed
     * @return  void
     */   
     
    stop: function(callback) {
      this.factory.running = false;
      this._clearInterval(callback);
      this.callback(this.callbacks.stop);
      this.callback(callback);
    },
    
    /**
     * Clear the timer interval
     *
     * @return  void
     */   
     
    _clearInterval: function() {
      clearInterval(this.timer);
    },
    
    /**
     * Create the timer object
     *
     * @param   callback  A function that is called once the timer is created
     * @return  void
     */   
     
    _createTimer: function(callback) {
      this._setInterval(callback);    
    },
    
    /**
     * Destroy the timer object
     *
     * @param   callback  A function that is called once the timer is destroyed
     * @return  void
     */   
      
    _destroyTimer: function(callback) {
      this._clearInterval();      
      this.timer = false;
      this.callback(callback);
      this.callback(this.callbacks.destroy);
    },
    
    /**
     * This method is called each time the timer interval is ran
     *
     * @param   callback  A function that is called once the timer is destroyed
     * @return  void
     */   
     
    _interval: function(callback) {
      this.callback(this.callbacks.interval);
      this.callback(callback);
      this.count++;
    },
    
    /**
     * This sets the timer interval
     *
     * @param   callback  A function that is called once the timer is destroyed
     * @return  void
     */   
     
    _setInterval: function(callback) {
      var t = this;
  
      t._interval(callback);

      t.timer = setInterval(function() {    
        t._interval(callback);
      }, this.interval);
    }
      
  });
  
}(jQuery));

(function($) {
  
  /**
   * Twenty-Four Hour Clock Face
   *
   * This class will generate a twenty-four our clock for FlipClock.js
   *
   * @param  object  The parent FlipClock.Factory object
   * @param  object  An object of properties to override the default  
   */
   
  FlipClock.TwentyFourHourClockFace = FlipClock.Face.extend({

    /**
     * Constructor
     *
     * @param  object  The parent FlipClock.Factory object
     * @param  object  An object of properties to override the default  
     */
     
    constructor: function(factory, options) {
      factory.countdown = false;
      this.base(factory, options);
    },

    /**
     * Build the clock face
     *
     * @param  object  Pass the time that should be used to display on the clock. 
     */
     
    build: function(time) {
      var t        = this;
      var children = this.factory.$el.find('ul');

      time = time ? time : (this.factory.time.time || this.factory.time.getMilitaryTime());
      
      if(time.length > children.length) {
        $.each(time, function(i, digit) {
          t.factory.lists.push(t.createList(digit));
        });
      }
      
      this.dividers.push(this.createDivider());
      this.dividers.push(this.createDivider());
      
      $(this.dividers[0]).insertBefore(this.factory.lists[this.factory.lists.length - 2].$el);
      $(this.dividers[1]).insertBefore(this.factory.lists[this.factory.lists.length - 4].$el);
      
      // this._clearExcessDigits();
      
      if(this.autoStart) {
        this.start();
      }
    },
    
    /**
     * Flip the clock face
     */
     
    flip: function(time, doNotAddPlayClass) {
      time = time ? time : this.factory.time.getMilitaryTime();
      
      this.base(time, doNotAddPlayClass); 
    }
    
    /**
     * Clear the excess digits from the tens columns for sec/min
     */
     
    /*
    _clearExcessDigits: function() {
      var tenSeconds = this.factory.lists[this.factory.lists.length - 2];
      var tenMinutes = this.factory.lists[this.factory.lists.length - 4];
      
      for(var x = 6; x < 10; x++) {
        tenSeconds.$el.find('li:last-child').remove();
        tenMinutes.$el.find('li:last-child').remove();
      }
    }
    */
        
  });
  
}(jQuery));
(function($) {
    
  /**
   * Counter Clock Face
   *
   * This class will generate a generice flip counter. The timer has been
   * disabled. clock.increment() and clock.decrement() have been added.
   *
   * @param  object  The parent FlipClock.Factory object
   * @param  object  An object of properties to override the default  
   */
   
  FlipClock.CounterFace = FlipClock.Face.extend({
    
    // autoStart: false,

    minimumDigits: 2,

    /**
     * Constructor
     *
     * @param  object  The parent FlipClock.Factory object
     * @param  object  An object of properties to override the default  
     */
     
    constructor: function(factory, options) {
      //factory.timer.interval = 0;
      factory.autoStart      = options.autoStart ? true : false;
      //factory.running      = true;

      factory.increment = function() {
        factory.countdown = false;
        factory.setTime(factory.getTime().getTimeSeconds() + 1);
      };

      factory.decrement = function() {
        factory.countdown = true;
        var time = factory.getTime().getTimeSeconds();
        if(time > 0) {
          factory.setTime(time - 1);
        }
      };

      factory.setValue = function(digits) {
        factory.setTime(digits);
      };

      factory.setCounter = function(digits) {
        factory.setTime(digits);
      };

      this.base(factory, options);
    },

    /**
     * Build the clock face 
     */
     
    build: function() {
      var t        = this;
      var children = this.factory.$el.find('ul');
      var lists    = [];
      var time   = this.factory.getTime().digitize([this.factory.getTime().time]);

      if(time.length > children.length) {
        $.each(time, function(i, digit) {
          var list = t.createList(digit, {
            minimumDigits: t.minimumDigits
          });

          list.select(digit);
          lists.push(list);
        });
      
      }

      $.each(lists, function(i, list) {
        list.play();
      });

      this.factory.lists = lists;
    },
    
    /**
     * Flip the clock face
     */
     
    flip: function(time, doNotAddPlayClass) {
      if(!time) {   
        time = this.factory.getTime().digitize([this.factory.getTime().time]);
      }

      if(this.autoStart) {
        this.autoIncrement();
      }
      
      this.base(time, doNotAddPlayClass);
    },

    /**
     * Reset the clock face
     */

    reset: function() {
      this.factory.time = new FlipClock.Time(
        this.factor, 
        this.factory.original ? Math.round(this.factory.original) : 0
      );

      this.flip();
    }
  });
  
}(jQuery));
(function($) {

  /**
   * Daily Counter Clock Face
   *
   * This class will generate a daily counter for FlipClock.js. A
   * daily counter will track days, hours, minutes, and seconds. If
   * the number of available digits is exceeded in the count, a new
   * digit will be created.
   *
   * @param  object  The parent FlipClock.Factory object
   * @param  object  An object of properties to override the default
   */

  FlipClock.DailyCounterFace = FlipClock.Face.extend({

    showSeconds: true,

    /**
     * Constructor
     *
     * @param  object  The parent FlipClock.Factory object
     * @param  object  An object of properties to override the default
     */

    constructor: function(factory, options) {
      this.base(factory, options);
    },

    /**
     * Build the clock face
     */

    build: function(excludeHours, time) {
      var t        = this;
      var children = this.factory.$el.find('ul');
      var lists    = [];
      var offset   = 0;

      time     = time ? time : this.factory.time.getDayCounter(this.showSeconds);

      if(time.length > children.length) {
        $.each(time, function(i, digit) {
          lists.push(t.createList(digit));
        });
      }

      this.factory.lists = lists;

      if(this.showSeconds) {
        $(this.createDivider('Seconds')).insertBefore(this.factory.lists[this.factory.lists.length - 2].$el);
      }
      else
      {
        offset = 2;
      }

      $(this.createDivider('Minutes')).insertBefore(this.factory.lists[this.factory.lists.length - 4 + offset].$el);
      $(this.createDivider('Hours')).insertBefore(this.factory.lists[this.factory.lists.length - 6 + offset].$el);
      $(this.createDivider('Days', true)).insertBefore(this.factory.lists[0].$el);

      // this._clearExcessDigits();

      if(this.autoStart) {
        this.start();
      }
    },

    /**
     * Flip the clock face
     */

    flip: function(time, doNotAddPlayClass) {
      if(!time) {
        time = this.factory.time.getDayCounter(this.showSeconds);
      }

      this.autoIncrement();

      this.base(time, doNotAddPlayClass);
    }

    /**
     * Clear the excess digits from the tens columns for sec/min
     */

     /*
    _clearExcessDigits: function() {
      var tenSeconds = this.factory.lists[this.factory.lists.length - 2];
      var tenMinutes = this.factory.lists[this.factory.lists.length - 4];

      for(var x = 6; x < 10; x++) {
        tenSeconds.$el.find('li:last-child').remove();
        tenMinutes.$el.find('li:last-child').remove();
      }
    }
    */

  });

}(jQuery));

(function($) {

    /**
     * FlipClock Arabic Language Pack
     *
     * This class will be used to translate tokens into the Arabic language.
     *
     */

    FlipClock.Lang.Arabic = {

      'years'   : 'سنوات',
      'months'  : 'شهور',
      'days'    : 'أيام',
      'hours'   : 'ساعات',
      'minutes' : 'دقائق',
      'seconds' : 'ثواني'

    };

    /* Create various aliases for convenience */

    FlipClock.Lang['ar']      = FlipClock.Lang.Arabic;
    FlipClock.Lang['ar-ar']   = FlipClock.Lang.Arabic;
    FlipClock.Lang['arabic']  = FlipClock.Lang.Arabic;

}(jQuery));


(function($) {
    
  /**
   * FlipClock English Language Pack
   *
   * This class will used to translate tokens into the English language.
   *  
   */
   
  FlipClock.Lang.English = {
    
    'years'   : 'Years',
    'months'  : 'Months',
    'days'    : 'Days',
    'hours'   : 'Hours',
    'minutes' : 'Minutes',
    'seconds' : 'Seconds' 

  };
  
  /* Create various aliases for convenience */

  FlipClock.Lang['en']      = FlipClock.Lang.English;
  FlipClock.Lang['en-us']   = FlipClock.Lang.English;
  FlipClock.Lang['english'] = FlipClock.Lang.English;

}(jQuery));



//--------------------------------------------------------------------------------------------

/* ---------------------- 
  touch effect
---------------------- */
/** Used Only For Touch Devices **/
( function( window ) {
  
  // for touch devices: add class cs-hover to the figures when touching the items
  if( Modernizr.touch ) {

    // classie.js https://github.com/desandro/classie/blob/master/classie.js
    // class helper functions from bonzo https://github.com/ded/bonzo

    function classReg( className ) {
      return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }

    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    var hasClass, addClass, removeClass;

    if ( 'classList' in document.documentElement ) {
      hasClass = function( elem, c ) {
        return elem.classList.contains( c );
      };
      addClass = function( elem, c ) {
        elem.classList.add( c );
      };
      removeClass = function( elem, c ) {
        elem.classList.remove( c );
      };
    }
    else {
      hasClass = function( elem, c ) {
        return classReg( c ).test( elem.className );
      };
      addClass = function( elem, c ) {
        if ( !hasClass( elem, c ) ) {
            elem.className = elem.className + ' ' + c;
        }
      };
      removeClass = function( elem, c ) {
        elem.className = elem.className.replace( classReg( c ), ' ' );
      };
    }

    function toggleClass( elem, c ) {
      var fn = hasClass( elem, c ) ? removeClass : addClass;
      fn( elem, c );
    }

    var classie = {
      // full names
      hasClass: hasClass,
      addClass: addClass,
      removeClass: removeClass,
      toggleClass: toggleClass,
      // short names
      has: hasClass,
      add: addClass,
      remove: removeClass,
      toggle: toggleClass
    };

    // transport
    if ( typeof define === 'function' && define.amd ) {
      // AMD
      define( classie );
    } else {
      // browser global
      window.classie = classie;
    }

    [].slice.call( document.querySelectorAll( 'ul.grid > li > figure' ) ).forEach( function( el, i ) {
      el.querySelector( 'figcaption > a' ).addEventListener( 'touchstart', function(e) {
        e.stopPropagation();
      }, false );
      el.addEventListener( 'touchstart', function(e) {
        classie.toggle( this, 'cs-hover' );
      }, false );
    } );

  }

})( window );
//--------------------------------------------------------------------------------------------

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
  def: 'easeOutQuad',
  swing: function (x, t, b, c, d) {
    //alert(jQuery.easing.default);
    return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
  },
  easeInQuad: function (x, t, b, c, d) {
    return c*(t/=d)*t + b;
  },
  easeOutQuad: function (x, t, b, c, d) {
    return -c *(t/=d)*(t-2) + b;
  },
  easeInOutQuad: function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t + b;
    return -c/2 * ((--t)*(t-2) - 1) + b;
  },
  easeInCubic: function (x, t, b, c, d) {
    return c*(t/=d)*t*t + b;
  },
  easeOutCubic: function (x, t, b, c, d) {
    return c*((t=t/d-1)*t*t + 1) + b;
  },
  easeInOutCubic: function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t + b;
    return c/2*((t-=2)*t*t + 2) + b;
  },
  easeInQuart: function (x, t, b, c, d) {
    return c*(t/=d)*t*t*t + b;
  },
  easeOutQuart: function (x, t, b, c, d) {
    return -c * ((t=t/d-1)*t*t*t - 1) + b;
  },
  easeInOutQuart: function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
    return -c/2 * ((t-=2)*t*t*t - 2) + b;
  },
  easeInQuint: function (x, t, b, c, d) {
    return c*(t/=d)*t*t*t*t + b;
  },
  easeOutQuint: function (x, t, b, c, d) {
    return c*((t=t/d-1)*t*t*t*t + 1) + b;
  },
  easeInOutQuint: function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
    return c/2*((t-=2)*t*t*t*t + 2) + b;
  },
  easeInSine: function (x, t, b, c, d) {
    return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
  },
  easeOutSine: function (x, t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
  },
  easeInOutSine: function (x, t, b, c, d) {
    return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
  },
  easeInExpo: function (x, t, b, c, d) {
    return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
  },
  easeOutExpo: function (x, t, b, c, d) {
    return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
  },
  easeInOutExpo: function (x, t, b, c, d) {
    if (t==0) return b;
    if (t==d) return b+c;
    if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
    return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
  },
  easeInCirc: function (x, t, b, c, d) {
    return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
  },
  easeOutCirc: function (x, t, b, c, d) {
    return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
  },
  easeInOutCirc: function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
    return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
  },
  easeInElastic: function (x, t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
    if (a < Math.abs(c)) { a=c; var s=p/4; }
    else var s = p/(2*Math.PI) * Math.asin (c/a);
    return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
  },
  easeOutElastic: function (x, t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
    if (a < Math.abs(c)) { a=c; var s=p/4; }
    else var s = p/(2*Math.PI) * Math.asin (c/a);
    return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
  },
  easeInOutElastic: function (x, t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
    if (a < Math.abs(c)) { a=c; var s=p/4; }
    else var s = p/(2*Math.PI) * Math.asin (c/a);
    if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
    return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
  },
  easeInBack: function (x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c*(t/=d)*t*((s+1)*t - s) + b;
  },
  easeOutBack: function (x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
  },
  easeInOutBack: function (x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158; 
    if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
    return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
  },
  easeInBounce: function (x, t, b, c, d) {
    return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
  },
  easeOutBounce: function (x, t, b, c, d) {
    if ((t/=d) < (1/2.75)) {
      return c*(7.5625*t*t) + b;
    } else if (t < (2/2.75)) {
      return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
    } else if (t < (2.5/2.75)) {
      return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
    } else {
      return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
    }
  },
  easeInOutBounce: function (x, t, b, c, d) {
    if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
    return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
  }
});
//--------------------------------------------------------------------------------------------


/* ---------------------- 
  HTML5 Shiv
---------------------- */
/**
* @preserve HTML5 Shiv 3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
*/
!function(a,b){function c(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function d(){var a=x.elements;return"string"==typeof a?a.split(" "):a}function e(a){var b=w[a[u]];return b||(b={},v++,a[u]=v,w[v]=b),b}function f(a,c,d){if(c||(c=b),p)return c.createElement(a);d||(d=e(c));var f;return f=d.cache[a]?d.cache[a].cloneNode():t.test(a)?(d.cache[a]=d.createElem(a)).cloneNode():d.createElem(a),!f.canHaveChildren||s.test(a)||f.tagUrn?f:d.frag.appendChild(f)}function g(a,c){if(a||(a=b),p)return a.createDocumentFragment();c=c||e(a);for(var f=c.frag.cloneNode(),g=0,h=d(),i=h.length;i>g;g++)f.createElement(h[g]);return f}function h(a,b){b.cache||(b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag()),a.createElement=function(c){return x.shivMethods?f(c,a,b):b.createElem(c)},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+d().join().replace(/[\w\-:]+/g,function(a){return b.createElem(a),b.frag.createElement(a),'c("'+a+'")'})+");return n}")(x,b.frag)}function i(a){a||(a=b);var d=e(a);return!x.shivCSS||o||d.hasCSS||(d.hasCSS=!!c(a,"article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")),p||h(a,d),a}function j(a){for(var b,c=a.getElementsByTagName("*"),e=c.length,f=RegExp("^(?:"+d().join("|")+")$","i"),g=[];e--;)b=c[e],f.test(b.nodeName)&&g.push(b.applyElement(k(b)));return g}function k(a){for(var b,c=a.attributes,d=c.length,e=a.ownerDocument.createElement(z+":"+a.nodeName);d--;)b=c[d],b.specified&&e.setAttribute(b.nodeName,b.nodeValue);return e.style.cssText=a.style.cssText,e}function l(a){for(var b,c=a.split("{"),e=c.length,f=RegExp("(^|[\\s,>+~])("+d().join("|")+")(?=[[\\s,>+~#.:]|$)","gi"),g="$1"+z+"\\:$2";e--;)b=c[e]=c[e].split("}"),b[b.length-1]=b[b.length-1].replace(f,g),c[e]=b.join("}");return c.join("{")}function m(a){for(var b=a.length;b--;)a[b].removeNode()}function n(a){function b(){clearTimeout(g._removeSheetTimer),d&&d.removeNode(!0),d=null}var d,f,g=e(a),h=a.namespaces,i=a.parentWindow;return!A||a.printShived?a:("undefined"==typeof h[z]&&h.add(z),i.attachEvent("onbeforeprint",function(){b();for(var e,g,h,i=a.styleSheets,k=[],m=i.length,n=Array(m);m--;)n[m]=i[m];for(;h=n.pop();)if(!h.disabled&&y.test(h.media)){try{e=h.imports,g=e.length}catch(o){g=0}for(m=0;g>m;m++)n.push(e[m]);try{k.push(h.cssText)}catch(o){}}k=l(k.reverse().join("")),f=j(a),d=c(a,k)}),i.attachEvent("onafterprint",function(){m(f),clearTimeout(g._removeSheetTimer),g._removeSheetTimer=setTimeout(b,500)}),a.printShived=!0,a)}var o,p,q="3.7.1",r=a.html5||{},s=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,t=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,u="_html5shiv",v=0,w={};!function(){try{var a=b.createElement("a");a.innerHTML="<xyz></xyz>",o="hidden"in a,p=1==a.childNodes.length||function(){b.createElement("a");var a=b.createDocumentFragment();return"undefined"==typeof a.cloneNode||"undefined"==typeof a.createDocumentFragment||"undefined"==typeof a.createElement}()}catch(c){o=!0,p=!0}}();var x={elements:r.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video",version:q,shivCSS:r.shivCSS!==!1,supportsUnknownElements:p,shivMethods:r.shivMethods!==!1,type:"default",shivDocument:i,createElement:f,createDocumentFragment:g};a.html5=x,i(b);var y=/^$|\b(?:all|print)\b/,z="html5shiv",A=!p&&function(){var c=b.documentElement;return!("undefined"==typeof b.namespaces||"undefined"==typeof b.parentWindow||"undefined"==typeof c.applyElement||"undefined"==typeof c.removeNode||"undefined"==typeof a.attachEvent)}();x.type+=" print",x.shivPrint=n,n(b)}(this,document);
//--------------------------------------------------------------------------------------------


/* ---------------------- 
  Respond
---------------------- */
/* Respond.js: min/max-width media query polyfill. (c) Scott Jehl. MIT Lic. j.mp/respondjs  */
(function( w ){

  "use strict";

  //exposed namespace
  var respond = {};
  w.respond = respond;

  //define update even in native-mq-supporting browsers, to avoid errors
  respond.update = function(){};

  //define ajax obj
  var requestQueue = [],
    xmlHttp = (function() {
      var xmlhttpmethod = false;
      try {
        xmlhttpmethod = new w.XMLHttpRequest();
      }
      catch( e ){
        xmlhttpmethod = new w.ActiveXObject( "Microsoft.XMLHTTP" );
      }
      return function(){
        return xmlhttpmethod;
      };
    })(),

    //tweaked Ajax functions from Quirksmode
    ajax = function( url, callback ) {
      var req = xmlHttp();
      if (!req){
        return;
      }
      req.open( "GET", url, true );
      req.onreadystatechange = function () {
        if ( req.readyState !== 4 || req.status !== 200 && req.status !== 304 ){
          return;
        }
        callback( req.responseText );
      };
      if ( req.readyState === 4 ){
        return;
      }
      req.send( null );
    },
    isUnsupportedMediaQuery = function( query ) {
      return query.replace( respond.regex.minmaxwh, '' ).match( respond.regex.other );
    };

  //expose for testing
  respond.ajax = ajax;
  respond.queue = requestQueue;
  respond.unsupportedmq = isUnsupportedMediaQuery;
  respond.regex = {
    media: /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi,
    keyframes: /@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi,
    comments: /\/\*[^*]*\*+([^/][^*]*\*+)*\//gi,
    urls: /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,
    findStyles: /@media *([^\{]+)\{([\S\s]+?)$/,
    only: /(only\s+)?([a-zA-Z]+)\s?/,
    minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
    maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
    minmaxwh: /\(\s*m(in|ax)\-(height|width)\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/gi,
    other: /\([^\)]*\)/g
  };

  //expose media query support flag for external use
  respond.mediaQueriesSupported = w.matchMedia && w.matchMedia( "only all" ) !== null && w.matchMedia( "only all" ).matches;

  //if media queries are supported, exit here
  if( respond.mediaQueriesSupported ){
    return;
  }

  //define vars
  var doc = w.document,
    docElem = doc.documentElement,
    mediastyles = [],
    rules = [],
    appendedEls = [],
    parsedSheets = {},
    resizeThrottle = 30,
    head = doc.getElementsByTagName( "head" )[0] || docElem,
    base = doc.getElementsByTagName( "base" )[0],
    links = head.getElementsByTagName( "link" ),

    lastCall,
    resizeDefer,

    //cached container for 1em value, populated the first time it's needed
    eminpx,

    // returns the value of 1em in pixels
    getEmValue = function() {
      var ret,
        div = doc.createElement('div'),
        body = doc.body,
        originalHTMLFontSize = docElem.style.fontSize,
        originalBodyFontSize = body && body.style.fontSize,
        fakeUsed = false;

      div.style.cssText = "position:absolute;font-size:1em;width:1em";

      if( !body ){
        body = fakeUsed = doc.createElement( "body" );
        body.style.background = "none";
      }

      // 1em in a media query is the value of the default font size of the browser
      // reset docElem and body to ensure the correct value is returned
      docElem.style.fontSize = "100%";
      body.style.fontSize = "100%";

      body.appendChild( div );

      if( fakeUsed ){
        docElem.insertBefore( body, docElem.firstChild );
      }

      ret = div.offsetWidth;

      if( fakeUsed ){
        docElem.removeChild( body );
      }
      else {
        body.removeChild( div );
      }

      // restore the original values
      docElem.style.fontSize = originalHTMLFontSize;
      if( originalBodyFontSize ) {
        body.style.fontSize = originalBodyFontSize;
      }


      //also update eminpx before returning
      ret = eminpx = parseFloat(ret);

      return ret;
    },

    //enable/disable styles
    applyMedia = function( fromResize ){
      var name = "clientWidth",
        docElemProp = docElem[ name ],
        currWidth = doc.compatMode === "CSS1Compat" && docElemProp || doc.body[ name ] || docElemProp,
        styleBlocks = {},
        lastLink = links[ links.length-1 ],
        now = (new Date()).getTime();

      //throttle resize calls
      if( fromResize && lastCall && now - lastCall < resizeThrottle ){
        w.clearTimeout( resizeDefer );
        resizeDefer = w.setTimeout( applyMedia, resizeThrottle );
        return;
      }
      else {
        lastCall = now;
      }

      for( var i in mediastyles ){
        if( mediastyles.hasOwnProperty( i ) ){
          var thisstyle = mediastyles[ i ],
            min = thisstyle.minw,
            max = thisstyle.maxw,
            minnull = min === null,
            maxnull = max === null,
            em = "em";

          if( !!min ){
            min = parseFloat( min ) * ( min.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 );
          }
          if( !!max ){
            max = parseFloat( max ) * ( max.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 );
          }

          // if there's no media query at all (the () part), or min or max is not null, and if either is present, they're true
          if( !thisstyle.hasquery || ( !minnull || !maxnull ) && ( minnull || currWidth >= min ) && ( maxnull || currWidth <= max ) ){
            if( !styleBlocks[ thisstyle.media ] ){
              styleBlocks[ thisstyle.media ] = [];
            }
            styleBlocks[ thisstyle.media ].push( rules[ thisstyle.rules ] );
          }
        }
      }

      //remove any existing respond style element(s)
      for( var j in appendedEls ){
        if( appendedEls.hasOwnProperty( j ) ){
          if( appendedEls[ j ] && appendedEls[ j ].parentNode === head ){
            head.removeChild( appendedEls[ j ] );
          }
        }
      }
      appendedEls.length = 0;

      //inject active styles, grouped by media type
      for( var k in styleBlocks ){
        if( styleBlocks.hasOwnProperty( k ) ){
          var ss = doc.createElement( "style" ),
            css = styleBlocks[ k ].join( "\n" );

          ss.type = "text/css";
          ss.media = k;

          //originally, ss was appended to a documentFragment and sheets were appended in bulk.
          //this caused crashes in IE in a number of circumstances, such as when the HTML element had a bg image set, so appending beforehand seems best. Thanks to @dvelyk for the initial research on this one!
          head.insertBefore( ss, lastLink.nextSibling );

          if ( ss.styleSheet ){
            ss.styleSheet.cssText = css;
          }
          else {
            ss.appendChild( doc.createTextNode( css ) );
          }

          //push to appendedEls to track for later removal
          appendedEls.push( ss );
        }
      }
    },
    //find media blocks in css text, convert to style blocks
    translate = function( styles, href, media ){
      var qs = styles.replace( respond.regex.comments, '' )
          .replace( respond.regex.keyframes, '' )
          .match( respond.regex.media ),
        ql = qs && qs.length || 0;

      //try to get CSS path
      href = href.substring( 0, href.lastIndexOf( "/" ) );

      var repUrls = function( css ){
          return css.replace( respond.regex.urls, "$1" + href + "$2$3" );
        },
        useMedia = !ql && media;

      //if path exists, tack on trailing slash
      if( href.length ){ href += "/"; }

      //if no internal queries exist, but media attr does, use that
      //note: this currently lacks support for situations where a media attr is specified on a link AND
        //its associated stylesheet has internal CSS media queries.
        //In those cases, the media attribute will currently be ignored.
      if( useMedia ){
        ql = 1;
      }

      for( var i = 0; i < ql; i++ ){
        var fullq, thisq, eachq, eql;

        //media attr
        if( useMedia ){
          fullq = media;
          rules.push( repUrls( styles ) );
        }
        //parse for styles
        else{
          fullq = qs[ i ].match( respond.regex.findStyles ) && RegExp.$1;
          rules.push( RegExp.$2 && repUrls( RegExp.$2 ) );
        }

        eachq = fullq.split( "," );
        eql = eachq.length;

        for( var j = 0; j < eql; j++ ){
          thisq = eachq[ j ];

          if( isUnsupportedMediaQuery( thisq ) ) {
            continue;
          }

          mediastyles.push( {
            media : thisq.split( "(" )[ 0 ].match( respond.regex.only ) && RegExp.$2 || "all",
            rules : rules.length - 1,
            hasquery : thisq.indexOf("(") > -1,
            minw : thisq.match( respond.regex.minw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" ),
            maxw : thisq.match( respond.regex.maxw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" )
          } );
        }
      }

      applyMedia();
    },

    //recurse through request queue, get css text
    makeRequests = function(){
      if( requestQueue.length ){
        var thisRequest = requestQueue.shift();

        ajax( thisRequest.href, function( styles ){
          translate( styles, thisRequest.href, thisRequest.media );
          parsedSheets[ thisRequest.href ] = true;

          // by wrapping recursive function call in setTimeout
          // we prevent "Stack overflow" error in IE7
          w.setTimeout(function(){ makeRequests(); },0);
        } );
      }
    },

    //loop stylesheets, send text content to translate
    ripCSS = function(){

      for( var i = 0; i < links.length; i++ ){
        var sheet = links[ i ],
        href = sheet.href,
        media = sheet.media,
        isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";

        //only links plz and prevent re-parsing
        if( !!href && isCSS && !parsedSheets[ href ] ){
          // selectivizr exposes css through the rawCssText expando
          if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
            translate( sheet.styleSheet.rawCssText, href, media );
            parsedSheets[ href ] = true;
          } else {
            if( (!/^([a-zA-Z:]*\/\/)/.test( href ) && !base) ||
              href.replace( RegExp.$1, "" ).split( "/" )[0] === w.location.host ){
              // IE7 doesn't handle urls that start with '//' for ajax request
              // manually add in the protocol
              if ( href.substring(0,2) === "//" ) { href = w.location.protocol + href; }
              requestQueue.push( {
                href: href,
                media: media
              } );
            }
          }
        }
      }
      makeRequests();
    };

  //translate CSS
  ripCSS();

  //expose update for re-running respond later on
  respond.update = ripCSS;

  //expose getEmValue
  respond.getEmValue = getEmValue;

  //adjust on resize
  function callMedia(){
    applyMedia( true );
  }

  if( w.addEventListener ){
    w.addEventListener( "resize", callMedia, false );
  }
  else if( w.attachEvent ){
    w.attachEvent( "onresize", callMedia );
  }
})(this);

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
/*! NOTE: If you're already including a window.matchMedia polyfill via Modernizr or otherwise, you don't need this part */

(function(w){
  "use strict";
  w.matchMedia = w.matchMedia || (function( doc, undefined ) {

    var bool,
      docElem = doc.documentElement,
      refNode = docElem.firstElementChild || docElem.firstChild,
      // fakeBody required for <FF4 when executed in <head>
      fakeBody = doc.createElement( "body" ),
      div = doc.createElement( "div" );

    div.id = "mq-test-1";
    div.style.cssText = "position:absolute;top:-100em";
    fakeBody.style.background = "none";
    fakeBody.appendChild(div);

    return function(q){

      div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

      docElem.insertBefore( fakeBody, refNode );
      bool = div.offsetWidth === 42;
      docElem.removeChild( fakeBody );

      return {
        matches: bool,
        media: q
      };

    };

  }( w.document ));
}( this ));

/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
(function( w ){
  "use strict";
  // Bail out for browsers that have addListener support
  if (w.matchMedia && w.matchMedia('all').addListener) {
    return false;
  }

  var localMatchMedia = w.matchMedia,
    hasMediaQueries = localMatchMedia('only all').matches,
    isListening     = false,
    timeoutID       = 0,    // setTimeout for debouncing 'handleChange'
    queries         = [],   // Contains each 'mql' and associated 'listeners' if 'addListener' is used
    handleChange    = function(evt) {
      // Debounce
      w.clearTimeout(timeoutID);

      timeoutID = w.setTimeout(function() {
        for (var i = 0, il = queries.length; i < il; i++) {
          var mql         = queries[i].mql,
            listeners   = queries[i].listeners || [],
            matches     = localMatchMedia(mql.media).matches;

          // Update mql.matches value and call listeners
          // Fire listeners only if transitioning to or from matched state
          if (matches !== mql.matches) {
            mql.matches = matches;

            for (var j = 0, jl = listeners.length; j < jl; j++) {
              listeners[j].call(w, mql);
            }
          }
        }
      }, 30);
    };

  w.matchMedia = function(media) {
    var mql         = localMatchMedia(media),
      listeners   = [],
      index       = 0;

    mql.addListener = function(listener) {
      // Changes would not occur to css media type so return now (Affects IE <= 8)
      if (!hasMediaQueries) {
        return;
      }

      // Set up 'resize' listener for browsers that support CSS3 media queries (Not for IE <= 8)
      // There should only ever be 1 resize listener running for performance
      if (!isListening) {
        isListening = true;
        w.addEventListener('resize', handleChange, true);
      }

      // Push object only if it has not been pushed already
      if (index === 0) {
        index = queries.push({
          mql         : mql,
          listeners   : listeners
        });
      }

      listeners.push(listener);
    };

    mql.removeListener = function(listener) {
      for (var i = 0, il = listeners.length; i < il; i++){
        if (listeners[i] === listener){
          listeners.splice(i, 1);
        }
      }
    };

    return mql;
  };
}( this ));


//--------------------------------------------------------------------------------------------


