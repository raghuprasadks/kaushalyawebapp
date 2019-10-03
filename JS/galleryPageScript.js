$(function() {
  // ======================= imagesLoaded Plugin ===============================
  // https://github.com/desandro/imagesloaded

  // $('#my-container').imagesLoaded(myFunction)
  // execute a callback when all images have loaded.
  // needed because .load() doesn't work on cached images

  // callback function gets image collection as argument
  //  this is the container

  // original: mit license. paul irish. 2010.
  // contributors: Oren Solomianik, David DeSandro, Yiannis Chatzikonstantinou

  $.fn.imagesLoaded     = function( callback ) {
  var $images = this.find('img'),
    len   = $images.length,
    _this   = this,
    blank   = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  function triggerCallback() {
    callback.call( _this, $images );
  }

  function imgLoaded() {
    if ( --len <= 0 && this.src !== blank ){
      setTimeout( triggerCallback );
      $images.off( 'load error', imgLoaded );
    }
  }

  if ( !len ) {
    triggerCallback();
  }

  $images.on( 'load error',  imgLoaded ).each( function() {
    // cached images don't fire load sometimes, so we reset src.
    if (this.complete || this.complete === undefined){
      var src = this.src;
      // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
      // data uri bypasses webkit log warning (thx doug jones)
      this.src = blank;
      this.src = src;
    }
  });

  return this;
  };

  // gallery container
  var $rgGallery      = $('#rg-gallery'),
  // carousel container
  $esCarousel     = $rgGallery.find('div.es-carousel-wrapper'),
  // the carousel items
  $items        = $esCarousel.find('ul > li'),
  // total number of items
  itemsCount      = $items.length;
  
  Gallery       = (function() {
      // index of the current item
    var current     = 0, 
      // mode : carousel || fullview
      mode      = 'carousel',
      // control if one image is being loaded
      anim      = false,
      init      = function() {
        
        // (not necessary) preloading the images here...
        $items.add('<img src="images/ajax-loader.gif"/><img src="images/black.png"/>').imagesLoaded( function() {
          // add options
          _addViewModes();
          
          // add large image wrapper
          _addImageWrapper();
          
          // show first image
          _showImage( $items.eq( current ) );
            
        });
        
        // initialize the carousel
        if( mode === 'carousel' )
          _initCarousel();
        
      },
      _initCarousel = function() {
        
        // we are using the elastislide plugin:
        // http://tympanus.net/codrops/2011/09/12/elastislide-responsive-carousel/
        $esCarousel.show().elastislide({
          imageW  : 65,
          onClick : function( $item ) {
            if( anim ) return false;
            anim  = true;
            // on click show image
            _showImage($item);
            // change current
            current = $item.index();
          }
        });
        
        // set elastislide's current to current
        $esCarousel.elastislide( 'setCurrent', current );
        
      },
      _addViewModes = function() {
        
        // top right buttons: hide / show carousel
        
        var $viewfull = $('<a href="#" class="rg-view-full"></a>'),
          $viewthumbs = $('<a href="#" class="rg-view-thumbs rg-view-selected"></a>');
        
        $rgGallery.prepend( $('<div class="rg-view"/>').append( $viewfull ).append( $viewthumbs ) );
        
        $viewfull.on('click.rgGallery', function( event ) {
            if( mode === 'carousel' )
              $esCarousel.elastislide( 'destroy' );
            $esCarousel.hide();
          $viewfull.addClass('rg-view-selected');
          $viewthumbs.removeClass('rg-view-selected');
          mode  = 'fullview';
          return false;
        });
        
        $viewthumbs.on('click.rgGallery', function( event ) {
          _initCarousel();
          $viewthumbs.addClass('rg-view-selected');
          $viewfull.removeClass('rg-view-selected');
          mode  = 'carousel';
          return false;
        });
        
        if( mode === 'fullview' )
          $viewfull.trigger('click');
          
      },
      _addImageWrapper= function() {
        
        // adds the structure for the large image and the navigation buttons (if total items > 1)
        // also initializes the navigation events
        
        $('#img-wrapper-tmpl').tmpl( {itemsCount : itemsCount} ).appendTo( $rgGallery );
        
        if( itemsCount > 1 ) {
          // addNavigation
          var $navPrev    = $rgGallery.find('a.rg-image-nav-prev'),
            $navNext    = $rgGallery.find('a.rg-image-nav-next'),
            $imgWrapper   = $rgGallery.find('div.rg-image');
            
          $navPrev.on('click.rgGallery', function( event ) {
            _navigate( 'left' );
            return false;
          }); 
          
          $navNext.on('click.rgGallery', function( event ) {
            _navigate( 'right' );
            return false;
          });
        
          // add touchwipe events on the large image wrapper
          $imgWrapper.touchwipe({
            wipeLeft      : function() {
              _navigate( 'right' );
            },
            wipeRight     : function() {
              _navigate( 'left' );
            },
            preventDefaultEvents: false
          });
        
          $(document).on('keyup.rgGallery', function( event ) {
            if (event.keyCode == 39)
              _navigate( 'right' );
            else if (event.keyCode == 37)
              _navigate( 'left' );  
          });
          
        }
        
      },
      _navigate   = function( dir ) {
        
        // navigate through the large images
        
        if( anim ) return false;
        anim  = true;
        
        if( dir === 'right' ) {
          if( current + 1 >= itemsCount )
            current = 0;
          else
            ++current;
        }
        else if( dir === 'left' ) {
          if( current - 1 < 0 )
            current = itemsCount - 1;
          else
            --current;
        }
        
        _showImage( $items.eq( current ) );
        
      },
      _showImage    = function( $item ) {
        
        // shows the large image that is associated to the $item
        
        var $loader = $rgGallery.find('div.rg-loading').show();
        
        $items.removeClass('selected');
        $item.addClass('selected');
           
        var $thumb    = $item.find('img'),
          largesrc  = $thumb.data('large'),
          title   = $thumb.data('description');
        
        $('<img/>').load( function() {
          
          $rgGallery.find('div.rg-image').empty().append('<img src="' + largesrc + '"/>');
          
          if( title )
            $rgGallery.find('div.rg-caption').show().children('p').empty().text( title );
          
          $loader.hide();
          
          if( mode === 'carousel' ) {
            $esCarousel.elastislide( 'reload' );
            $esCarousel.elastislide( 'setCurrent', current );
          }
          
          anim  = false;
          
        }).attr( 'src', largesrc );
        
      },
      addItems    = function( $new ) {
      
        $esCarousel.find('ul').append($new);
        $items    = $items.add( $($new) );
        itemsCount  = $items.length; 
        $esCarousel.elastislide( 'add', $new );
      
      };
    
    return { 
      init    : init,
      addItems  : addItems
    };
  
  })();

  Gallery.init();
  
  });








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




(function( window, $, undefined ) {
  
  // http://www.netcu.de/jquery-touchwipe-iphone-ipad-library
  $.fn.touchwipe        = function(settings) {
    
    var config = {
      min_move_x: 20,
      min_move_y: 20,
      wipeLeft: function() { },
      wipeRight: function() { },
      wipeUp: function() { },
      wipeDown: function() { },
      preventDefaultEvents: true
    };
     
    if (settings) $.extend(config, settings);
 
    this.each(function() {
      var startX;
      var startY;
      var isMoving = false;

      function cancelTouch() {
        this.removeEventListener('touchmove', onTouchMove);
        startX = null;
        isMoving = false;
      } 
     
      function onTouchMove(e) {
        if(config.preventDefaultEvents) {
          e.preventDefault();
        }
        if(isMoving) {
          var x = e.touches[0].pageX;
          var y = e.touches[0].pageY;
          var dx = startX - x;
          var dy = startY - y;
          if(Math.abs(dx) >= config.min_move_x) {
            cancelTouch();
            if(dx > 0) {
              config.wipeLeft();
            }
            else {
              config.wipeRight();
            }
          }
          else if(Math.abs(dy) >= config.min_move_y) {
            cancelTouch();
            if(dy > 0) {
              config.wipeDown();
            }
            else {
              config.wipeUp();
            }
          }
        }
      }
     
      function onTouchStart(e)
      {
        if (e.touches.length == 1) {
          startX = e.touches[0].pageX;
          startY = e.touches[0].pageY;
          isMoving = true;
          this.addEventListener('touchmove', onTouchMove, false);
        }
      }      
      if ('ontouchstart' in document.documentElement) {
        this.addEventListener('touchstart', onTouchStart, false);
      }
    });
 
    return this;
  };
  
  $.elastislide         = function( options, element ) {
    this.$el  = $( element );
    this._init( options );
  };
  
  $.elastislide.defaults    = {
    speed   : 450,  // animation speed
    easing    : '', // animation easing effect
    imageW    : 190,  // the images width
    margin    : 3,  // image margin right
    border    : 2,  // image border
    minItems  : 1,  // the minimum number of items to show. 
              // when we resize the window, this will make sure minItems are always shown 
              // (unless of course minItems is higher than the total number of elements)
    current   : 0,  // index of the current item
              // when we resize the window, the carousel will make sure this item is visible 
    onClick   : function() { return false; } // click item callback
    };
  
  $.elastislide.prototype   = {
    _init         : function( options ) {
      
      this.options    = $.extend( true, {}, $.elastislide.defaults, options );
      
      // <ul>
      this.$slider    = this.$el.find('ul');
      
      // <li>
      this.$items     = this.$slider.children('li');
      
      // total number of elements / images
      this.itemsCount   = this.$items.length;
      
      // cache the <ul>'s parent, since we will eventually need to recalculate its width on window resize
      this.$esCarousel  = this.$slider.parent();
      
      // validate options
      this._validateOptions();
      
      // set sizes and initialize some vars...
      this._configure();
      
      // add navigation buttons
      this._addControls();
      
      // initialize the events
      this._initEvents();
      
      // show the <ul>
      this.$slider.show();
      
      // slide to current's position
      this._slideToCurrent( false );
      
    },
    _validateOptions  : function() {
    
      if( this.options.speed < 0 )
        this.options.speed = 450;
      if( this.options.margin < 0 )
        this.options.margin = 4;
      if( this.options.border < 0 )
        this.options.border = 1;
      if( this.options.minItems < 1 || this.options.minItems > this.itemsCount )
        this.options.minItems = 1;
      if( this.options.current > this.itemsCount - 1 )
        this.options.current = 0;
        
    },
    _configure      : function() {
      
      // current item's index
      this.current    = this.options.current;
      
      // the ul's parent's (div.es-carousel) width is the "visible" width
      this.visibleWidth = this.$esCarousel.width();
      
      // test to see if we need to initially resize the items
      if( this.visibleWidth < this.options.minItems * ( this.options.imageW + 2 * this.options.border ) + ( this.options.minItems - 1 ) * this.options.margin ) {
        this._setDim( ( this.visibleWidth - ( this.options.minItems - 1 ) * this.options.margin ) / this.options.minItems );
        this._setCurrentValues();
        // how many items fit with the current width
        this.fitCount = this.options.minItems;
      }
      else {
        this._setDim();
        this._setCurrentValues();
      }
      
      // set the <ul> width
      this.$slider.css({
        width : this.sliderW
      });
      
    },
    _setDim       : function( elW ) {
      
      // <li> style
      this.$items.css({
        marginRight : this.options.margin,
        width   : ( elW ) ? elW : this.options.imageW + 2 * this.options.border
      }).children('a').css({ // <a> style
        borderWidth   : this.options.border
      });
      
    },
    _setCurrentValues : function() {
      
      // the total space occupied by one item
      this.itemW      = this.$items.outerWidth(true);
      
      // total width of the slider / <ul>
      // this will eventually change on window resize
      this.sliderW    = this.itemW * this.itemsCount;
      
      // the ul parent's (div.es-carousel) width is the "visible" width
      this.visibleWidth = this.$esCarousel.width();
      
      // how many items fit with the current width
      this.fitCount   = Math.floor( this.visibleWidth / this.itemW );
      
    },
    _addControls    : function() {
      
      this.$navNext = $('<span class="es-nav-next">Next</span>');
      this.$navPrev = $('<span class="es-nav-prev">Previous</span>');
      $('<div class="es-nav"/>')
      .append( this.$navPrev )
      .append( this.$navNext )
      .appendTo( this.$el );
      
      //this._toggleControls();
        
    },
    _toggleControls   : function( dir, status ) {
      
      // show / hide navigation buttons
      if( dir && status ) {
        if( status === 1 )
          ( dir === 'right' ) ? this.$navNext.show() : this.$navPrev.show();
        else
          ( dir === 'right' ) ? this.$navNext.hide() : this.$navPrev.hide();
      }
      else if( this.current === this.itemsCount - 1 || this.fitCount >= this.itemsCount )
          this.$navNext.hide();
      
    },
    _initEvents     : function() {
      
      var instance  = this;
      
      // window resize
      $(window).on('resize.elastislide', function( event ) {
        
        instance._reload();
        
        // slide to the current element
        clearTimeout( instance.resetTimeout );
        instance.resetTimeout = setTimeout(function() {
          instance._slideToCurrent();
        }, 200);
        
      });
      
      // navigation buttons events
      this.$navNext.on('click.elastislide', function( event ) {
        instance._slide('right');
      });
      
      this.$navPrev.on('click.elastislide', function( event ) {
        instance._slide('left');
      });
      
      // item click event
      this.$slider.on('click.elastislide', 'li', function( event ) {
        instance.options.onClick( $(this) );
        return false;
      });
      
      // touch events
      instance.$slider.touchwipe({
        wipeLeft      : function() {
          instance._slide('right');
        },
        wipeRight     : function() {
          instance._slide('left');
        }
      });
      
    },
    reload        : function( callback ) {
      this._reload();
      if ( callback ) callback.call();
    
    },
    _reload       : function() {
      
      var instance  = this;
      
      // set values again
      instance._setCurrentValues();
      
      // need to resize items
      if( instance.visibleWidth < instance.options.minItems * ( instance.options.imageW + 2 * instance.options.border ) + ( instance.options.minItems - 1 ) * instance.options.margin ) {
        instance._setDim( ( instance.visibleWidth - ( instance.options.minItems - 1 ) * instance.options.margin ) / instance.options.minItems );
        instance._setCurrentValues();
        instance.fitCount = instance.options.minItems;
      } 
      else{
        instance._setDim();
        instance._setCurrentValues();
      }
      
      instance.$slider.css({
        width : instance.sliderW + 10 // TODO: +10px seems to solve a firefox "bug" :S
      });
      
    },
    _slide        : function( dir, val, anim, callback ) {
      
      // if animating return
      //if( this.$slider.is(':animated') )
        //return false;
      
      // current margin left
      var ml    = parseFloat( this.$slider.css('margin-left') );
      
      // val is just passed when we want an exact value for the margin left (used in the _slideToCurrent function)
      if( val === undefined ) {
      
        // how much to slide?
        var amount  = this.fitCount * this.itemW, val;
        
        if( amount < 0 ) return false;
        
        // make sure not to leave a space between the last item / first item and the end / beggining of the slider available width
        if( dir === 'right' && this.sliderW - ( Math.abs( ml ) + amount ) < this.visibleWidth ) {
          amount  = this.sliderW - ( Math.abs( ml ) + this.visibleWidth ) - this.options.margin; // decrease the margin left
          // show / hide navigation buttons
          this._toggleControls( 'right', -1 );
          this._toggleControls( 'left', 1 );
        }
        else if( dir === 'left' && Math.abs( ml ) - amount < 0 ) {        
          amount  = Math.abs( ml );
          // show / hide navigation buttons
          this._toggleControls( 'left', -1 );
          this._toggleControls( 'right', 1 );
        }
        else {
          var fml; // future margin left
          ( dir === 'right' ) 
            ? fml = Math.abs( ml ) + this.options.margin + Math.abs( amount ) 
            : fml = Math.abs( ml ) - this.options.margin - Math.abs( amount );
          
          // show / hide navigation buttons
          if( fml > 0 )
            this._toggleControls( 'left', 1 );
          else  
            this._toggleControls( 'left', -1 );
          
          if( fml < this.sliderW - this.visibleWidth )
            this._toggleControls( 'right', 1 );
          else  
            this._toggleControls( 'right', -1 );
            
        }
        
        ( dir === 'right' ) ? val = '-=' + amount : val = '+=' + amount
        
      }
      else {
        var fml   = Math.abs( val ); // future margin left
        
        if( Math.max( this.sliderW, this.visibleWidth ) - fml < this.visibleWidth ) {
          val = - ( Math.max( this.sliderW, this.visibleWidth ) - this.visibleWidth );
          if( val !== 0 )
            val += this.options.margin; // decrease the margin left if not on the first position
            
          // show / hide navigation buttons
          this._toggleControls( 'right', -1 );
          fml = Math.abs( val );
        }
        
        // show / hide navigation buttons
        if( fml > 0 )
          this._toggleControls( 'left', 1 );
        else
          this._toggleControls( 'left', -1 );
        
        if( Math.max( this.sliderW, this.visibleWidth ) - this.visibleWidth > fml + this.options.margin ) 
          this._toggleControls( 'right', 1 );
        else
          this._toggleControls( 'right', -1 );
          
      }
      
      $.fn.applyStyle = ( anim === undefined ) ? $.fn.animate : $.fn.css;
      
      var sliderCSS = { marginLeft : val };
      
      var instance  = this;
      
      this.$slider.stop().applyStyle( sliderCSS, $.extend( true, [], { duration : this.options.speed, easing : this.options.easing, complete : function() {
        if( callback ) callback.call();
      } } ) );
      
    },
    _slideToCurrent   : function( anim ) {
      
      // how much to slide?
      var amount  = this.current * this.itemW;
      this._slide('', -amount, anim );
      
    },
    add         : function( $newelems, callback ) {
      
      // adds new items to the carousel
      this.$items     = this.$items.add( $newelems );
      this.itemsCount   = this.$items.length;
      this._setDim();
      this._setCurrentValues();
      this.$slider.css({
        width : this.sliderW
      });
      this._slideToCurrent();
      
      if ( callback ) callback.call( $newelems );
      
    },
    setCurrent      : function( idx, callback ) {
      
      this.current = idx;
      
      var ml    = Math.abs( parseFloat( this.$slider.css('margin-left') ) ),
        posR  = ml + this.visibleWidth,
        fml   = Math.abs( this.current * this.itemW );
      
      if( fml + this.itemW > posR || fml < ml ) {
        this._slideToCurrent();
      }
      
      if ( callback ) callback.call();
      
    },
    destroy       : function( callback ) {
      
      this._destroy( callback );
      
    },
    _destroy      : function( callback ) {
      this.$el.off('.elastislide').removeData('elastislide');
      $(window).off('.elastislide');
      if ( callback ) callback.call();
    }
  };
  
  var logError        = function( message ) {
    if ( this.console ) {
      console.error( message );
    }
  };
  
  $.fn.elastislide        = function( options ) {
    if ( typeof options === 'string' ) {
      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function() {
        var instance = $.data( this, 'elastislide' );
        if ( !instance ) {
          logError( "cannot call methods on elastislide prior to initialization; " +
          "attempted to call method '" + options + "'" );
          return;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
          logError( "no such method '" + options + "' for elastislide instance" );
          return;
        }
        instance[ options ].apply( instance, args );
      });
    } 
    else {
      this.each(function() {
        var instance = $.data( this, 'elastislide' );
        if ( !instance ) {
          $.data( this, 'elastislide', new $.elastislide( options, this ) );
        }
      });
    }
    return this;
  };
  
})( window, jQuery );





(function(a){var r=a.fn.domManip,d="_tmplitem",q=/^[^<]*(<[\w\W]+>)[^>]*$|\{\{\! /,b={},f={},e,p={key:0,data:{}},h=0,c=0,l=[];function g(e,d,g,i){var c={data:i||(d?d.data:{}),_wrap:d?d._wrap:null,tmpl:null,parent:d||null,nodes:[],calls:u,nest:w,wrap:x,html:v,update:t};e&&a.extend(c,e,{nodes:[],parent:d});if(g){c.tmpl=g;c._ctnt=c._ctnt||c.tmpl(a,c);c.key=++h;(l.length?f:b)[h]=c}return c}a.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(f,d){a.fn[f]=function(n){var g=[],i=a(n),k,h,m,l,j=this.length===1&&this[0].parentNode;e=b||{};if(j&&j.nodeType===11&&j.childNodes.length===1&&i.length===1){i[d](this[0]);g=this}else{for(h=0,m=i.length;h<m;h++){c=h;k=(h>0?this.clone(true):this).get();a.fn[d].apply(a(i[h]),k);g=g.concat(k)}c=0;g=this.pushStack(g,f,i.selector)}l=e;e=null;a.tmpl.complete(l);return g}});a.fn.extend({tmpl:function(d,c,b){return a.tmpl(this[0],d,c,b)},tmplItem:function(){return a.tmplItem(this[0])},template:function(b){return a.template(b,this[0])},domManip:function(d,l,j){if(d[0]&&d[0].nodeType){var f=a.makeArray(arguments),g=d.length,i=0,h;while(i<g&&!(h=a.data(d[i++],"tmplItem")));if(g>1)f[0]=[a.makeArray(d)];if(h&&c)f[2]=function(b){a.tmpl.afterManip(this,b,j)};r.apply(this,f)}else r.apply(this,arguments);c=0;!e&&a.tmpl.complete(b);return this}});a.extend({tmpl:function(d,h,e,c){var j,k=!c;if(k){c=p;d=a.template[d]||a.template(null,d);f={}}else if(!d){d=c.tmpl;b[c.key]=c;c.nodes=[];c.wrapped&&n(c,c.wrapped);return a(i(c,null,c.tmpl(a,c)))}if(!d)return[];if(typeof h==="function")h=h.call(c||{});e&&e.wrapped&&n(e,e.wrapped);j=a.isArray(h)?a.map(h,function(a){return a?g(e,c,d,a):null}):[g(e,c,d,h)];return k?a(i(c,null,j)):j},tmplItem:function(b){var c;if(b instanceof a)b=b[0];while(b&&b.nodeType===1&&!(c=a.data(b,"tmplItem"))&&(b=b.parentNode));return c||p},template:function(c,b){if(b){if(typeof b==="string")b=o(b);else if(b instanceof a)b=b[0]||{};if(b.nodeType)b=a.data(b,"tmpl")||a.data(b,"tmpl",o(b.innerHTML));return typeof c==="string"?(a.template[c]=b):b}return c?typeof c!=="string"?a.template(null,c):a.template[c]||a.template(null,q.test(c)?c:a(c)):null},encode:function(a){return(""+a).split("<").join("&lt;").split(">").join("&gt;").split('"').join("&#34;").split("'").join("&#39;")}});a.extend(a.tmpl,{tag:{tmpl:{_default:{$2:"null"},open:"if($notnull_1){_=_.concat($item.nest($1,$2));}"},wrap:{_default:{$2:"null"},open:"$item.calls(_,$1,$2);_=[];",close:"call=$item.calls();_=call._.concat($item.wrap(call,_));"},each:{_default:{$2:"$index, $value"},open:"if($notnull_1){$.each($1a,function($2){with(this){",close:"}});}"},"if":{open:"if(($notnull_1) && $1a){",close:"}"},"else":{_default:{$1:"true"},open:"}else if(($notnull_1) && $1a){"},html:{open:"if($notnull_1){_.push($1a);}"},"=":{_default:{$1:"$data"},open:"if($notnull_1){_.push($.encode($1a));}"},"!":{open:""}},complete:function(){b={}},afterManip:function(f,b,d){var e=b.nodeType===11?a.makeArray(b.childNodes):b.nodeType===1?[b]:[];d.call(f,b);m(e);c++}});function i(e,g,f){var b,c=f?a.map(f,function(a){return typeof a==="string"?e.key?a.replace(/(<\w+)(?=[\s>])(?![^>]*_tmplitem)([^>]*)/g,"$1 "+d+'="'+e.key+'" $2'):a:i(a,e,a._ctnt)}):e;if(g)return c;c=c.join("");c.replace(/^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/,function(f,c,e,d){b=a(e).get();m(b);if(c)b=j(c).concat(b);if(d)b=b.concat(j(d))});return b?b:j(c)}function j(c){var b=document.createElement("div");b.innerHTML=c;return a.makeArray(b.childNodes)}function o(b){return new Function("jQuery","$item","var $=jQuery,call,_=[],$data=$item.data;with($data){_.push('"+a.trim(b).replace(/([\\'])/g,"\\$1").replace(/[\r\t\n]/g," ").replace(/\$\{([^\}]*)\}/g,"{{= $1}}").replace(/\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g,function(m,l,j,d,b,c,e){var i=a.tmpl.tag[j],h,f,g;if(!i)throw"Template command not found: "+j;h=i._default||[];if(c&&!/\w$/.test(b)){b+=c;c=""}if(b){b=k(b);e=e?","+k(e)+")":c?")":"";f=c?b.indexOf(".")>-1?b+c:"("+b+").call($item"+e:b;g=c?f:"(typeof("+b+")==='function'?("+b+").call($item):("+b+"))"}else g=f=h.$1||"null";d=k(d);return"');"+i[l?"close":"open"].split("$notnull_1").join(b?"typeof("+b+")!=='undefined' && ("+b+")!=null":"true").split("$1a").join(g).split("$1").join(f).split("$2").join(d?d.replace(/\s*([^\(]+)\s*(\((.*?)\))?/g,function(d,c,b,a){a=a?","+a+")":b?")":"";return a?"("+c+").call($item"+a:d}):h.$2||"")+"_.push('"})+"');}return _;")}function n(c,b){c._wrap=i(c,true,a.isArray(b)?b:[q.test(b)?b:a(b).html()]).join("")}function k(a){return a?a.replace(/\\'/g,"'").replace(/\\\\/g,"\\"):null}function s(b){var a=document.createElement("div");a.appendChild(b.cloneNode(true));return a.innerHTML}function m(o){var n="_"+c,k,j,l={},e,p,i;for(e=0,p=o.length;e<p;e++){if((k=o[e]).nodeType!==1)continue;j=k.getElementsByTagName("*");for(i=j.length-1;i>=0;i--)m(j[i]);m(k)}function m(j){var p,i=j,k,e,m;if(m=j.getAttribute(d)){while(i.parentNode&&(i=i.parentNode).nodeType===1&&!(p=i.getAttribute(d)));if(p!==m){i=i.parentNode?i.nodeType===11?0:i.getAttribute(d)||0:0;if(!(e=b[m])){e=f[m];e=g(e,b[i]||f[i],null,true);e.key=++h;b[h]=e}c&&o(m)}j.removeAttribute(d)}else if(c&&(e=a.data(j,"tmplItem"))){o(e.key);b[e.key]=e;i=a.data(j.parentNode,"tmplItem");i=i?i.key:0}if(e){k=e;while(k&&k.key!=i){k.nodes.push(j);k=k.parent}delete e._ctnt;delete e._wrap;a.data(j,"tmplItem",e)}function o(a){a=a+n;e=l[a]=l[a]||g(e,b[e.parent.key+n]||e.parent,null,true)}}}function u(a,d,c,b){if(!a)return l.pop();l.push({_:a,tmpl:d,item:this,data:c,options:b})}function w(d,c,b){return a.tmpl(a.template(d),c,b,this)}function x(b,d){var c=b.options||{};c.wrapped=d;return a.tmpl(a.template(b.tmpl),b.data,c,b.item)}function v(d,c){var b=this._wrap;return a.map(a(a.isArray(b)?b.join(""):b).filter(d||"*"),function(a){return c?a.innerText||a.textContent:a.outerHTML||s(a)})}function t(){var b=this.nodes;a.tmpl(null,null,null,this).insertBefore(b[0]);a(b).remove()}})(jQuery)