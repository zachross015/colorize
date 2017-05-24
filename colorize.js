/**
 * jQuery colorize
 * @author Zachary Ross (http://zacharyross.me)
 * @version 1.0
 * @copyright 2017 Zachary Ross
 * @description Gives color to text
 */

(function($) {

    'use strict';

    // Initialization script
    $.fn.colorize = function(opt) {
        // For all of the elements being called
        return this.each(function() {
            // Set the data associated to this element in memory
            var $el = $(this);
            var $elData = $(this).data('colorize');
            if($elData !== undefined) {
                // Remove any previously associated data
                clearTimeout($elData.iterate);
                $el.removeData('colorize')
            }
            $el.data('colorize', new $.colorize($el, opt));
        })
    }

    $.colorize = function(el, opt) {
        this.o = {
            color:          'white',
            textDecoration: 'line-through',
            direction:      'forwards',
            speed:          15,
            range:          undefined,
            callback:       function() {}
        }

        this.el         = el;
        this.opt        = $.extend({}, this.o, opt);
        this.se         = [] // Stored elements

        this.lsc        = false; // left side complete
        this.rsc        = false; // right side complete
        this.lst        = '</span>'; // left side html
        this.rst        = this._tagHTML(); // right side html
        this.lsi        = 0; // left side index
        this.rsi        = 0; // right side index

        this._init();
    }

    $.colorize.prototype = {

        _init: function() {

            this._parseElement();
            this._determineStart();
            this._expand();

        },

        _determineStart: function() {
            if(this.opt.direction == 'middle') {
                var middle = this.se.length / 2;
                this.lsi = middle;
                this.rsi = middle - 1;
            } else if (this.opt.direction == 'backwards') {
                this.lsi = this.se.length;
                this.rsi = this.se.length;
            } else {
                this.lsi = 0;
                this.rsi = -1;
            }
        },

        _expand: function() {
            // Start at the next index
            this.lsi--;
            this.rsi++;

            // Stop if there is nothing left
            if(this.rsi >= this.se.length) {
                this.rsc = true;
            } else {
                this._expandRight();
            }
            if(this.lsi < 0) {
                this.lsc = true;
            } else {
                this._expandLeft();
            }

            // change the html to accomadate
            this.el.html(this._finalHTML());

            var t = this;
            var e = this.el;
            this.iterate = setTimeout(function() {

                    //console.log(t._finalHTML());
                    // rinse and repeat
                    if(!(t.rsc && t.lsc)) {
                        t._expand();
                    } else {
                        t._normalize(e);
                        t.opt.callback();
                    }

            }.bind(this.el), this.opt.speed)

        },

        // Add the text to the tag, or move tags if there is another tag
        // already there. Only do this if the side has not been
        // completed
        _expandRight: function() {
            if(!this.rsc) {
                var elem = this.se[this.rsi];
                if(elem.type == 'tag') {
                    this.rst += '</span>';
                    // Iterate until all tags have been exited
                    while(elem.type == 'tag' && this.rsi < this.se.length - 1) {
                        this.rst += elem.txt;
                        this.rsi ++;
                        elem = this.se[this.rsi];
                    }
                    // The loop will have broken out, and the next element should
                    // be from a different area
                    if(this.rsi < this.se.length) {
                        this.rst += this._tagHTML() + elem.txt;
                    }

                } else {
                    this.rst += elem.txt;
                }
            }
        },

        _expandLeft: function() {
            var elem = this.se[this.lsi];
            if(elem.type == 'tag') {

                var str = '';
                // Iterate until all tags have been exited
                while(elem.type == 'tag' && this.lsi > 0) {
                    str = elem.txt + str;
                    this.lsi--;
                    elem = this.se[this.lsi];
                }
                // The loop will have broken out, and the next element should
                // be from a different area
                if(this.lsi >= 0) {
                    this.lst = '</span>' + str + elem.txt + this._tagHTML() + this.lst ;
                }

            } else {
                this.lst = elem.txt + this.lst;
            }
        },

        _isVisible: function() {
            return true;
        },

        _tagHTML: function() {
            var style = 'display:inline;pointer-events:none;';
            style += 'color:' + this.opt.color + ';';
            style += 'text-decoration:' + this.opt.textDecoration + ';';
            return "<span class = 'colored' style = '" + style + "'>"
        },

        /*
         *  Since objects are being used in the array, the text needs to be
         *  retrieved from each element and put together
         */
        _getHTML: function(index1, index2) {
            var html = '';
            for(var i = index1; i < index2; i++) {
                html += this.se[i].txt;
            }
            return html;
        },

        /*
         *  Make the html that will be exchanged with the current html
         */
        _finalHTML: function() {
            var leftSide = this._getHTML(0, this.lsi);
            var rightSide = this._getHTML(this.rsi + 1, this.se.length);
            return leftSide + this._tagHTML() + this.lst + this.rst + '</span>' + rightSide;
        },

        /*
         * Will go through and remove all of the custom tags and replace them by
         * making each div have the inline coloring
         */
        _normalize: function(elem) {
            var t = this;
            // Set the top level inline css
            elem.css({textDecoration: this.opt.textDecoration, color: this.opt.color});
            if(elem.children().length > 0) {
                // Set each child's css
                elem.children().each(function() {
                    t._normalize($(this));

                })

                $('.colored').each(function() {
                    $(this).contents().unwrap(); // Gets rid of most of them
                    $(this).remove(); // Gets rid of the scragglers

                })
            }
        },

        /*
         *  Parses the html into the queue
         */
        _parseElement: function() {
            var html = this.el.html();
            var startIndex = 0;
            for(var i = 0; i < html.length; i++) {
                i = this._storeElement(i);
            }
        },

        /*
         *  Checks the which element is at the current index and decides the
         *  proper queue type for it. Mainly a buffer until I shrink the other
         *  queue functions into one
         */
        _storeElement: function(index) {
            var html = this.el.html();
            if(html.charAt(index) == '<') {
                index = this._storeTag(index)
            } else if(html.charAt(index) == '&') {
                index = this._storeEntity(index);
            } else {
                index = this._storeText(index);
            }
            return index
        },

        /*
         * Finds the range for text in the html and appends it to the queue
         */
        _storeText: function(index) {
            var html = this.el.html()
            var type = 'text'
            if(html.charAt(index) != '<' && html.charAt(index) != '&') {
                this.se.push({txt: html.charAt(index), type:type});
                return index;
            }
        },

        /*
         * Finds the range for a tag in the html and appends it to the queue
         */
        _storeTag: function(index) {
            var html = this.el.html()
            var type = 'tag'
            var startIndex = index;
            for(; index < html.length; index++) {
                if(html.charAt(index) == '>') {
                    this.se.push({txt: html.slice(startIndex, index + 1), type:type})
                    return index;
                }
            }
        },

        /*
         * Finds the range for an html entity in the html and appends it to queue
         */
        _storeEntity: function(index) {
            var html = this.el.html()
            var type = 'entity'
            var startIndex = index;
            for(; index < html.length; index++) {
                if(html.charAt(index) == ';') {
                    this.se.push({txt: html.slice(startIndex, index + 1), type:type})
                    return index;
                }
            }
        }

    }

}(jQuery));
