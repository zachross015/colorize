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
            this._wrapText(this.el);
            this._parseElement();
            this._determineStart();
            this._expand();

        },

        _determineStart: function() {
            if (this.opt.direction == 'backwards') {
                this.lsi = this.se.length;
                this.rsi = this.se.length;
            } else {
                this.lsi = 0;
                this.rsi = -1;
            }
        },

        _expand: function() {

            // Stop if there is nothing left, continue otherwise
            if(this.rsi >= this.se.length - 1) {
                this.rsc = true;
            } else {
                this._expandRight();
            }
            if(this.lsi < 1) {
                this.lsc = true;
            } else {
                this._expandLeft();
            }

            // change the html to accomadate
            this.el.html(this._finalHTML());

            var t = this;
            var e = this.el;
            this.iterate = setTimeout(function() {
                    // rinse and repeat
                    if(!(t.rsc && t.lsc)) {
                        t._expand();
                    } else {
                        //t._normalize(e);
                        t.opt.callback();

                    }

            }, this.opt.speed)

        },

        // Add the text to the tag, or move tags if there is another tag
        // already there. Only do this if the side has not been
        // completed
        _expandRight: function() {

            // increment
            this.rsi++;

            // if the next element is using a previously colored item, move it
            // to the right one
            if($(this.se[this.rsi].txt).prop('className') == 'colored') {
                this._swap(this.rsi, this.rsi + 1)
            }

            var elem = this.se[this.rsi];

            if(elem.type == 'tag') {

                // remove the colored tag, since the two tags are swapped,
                // we remove the one at the next index
                if(elem.txt == '</span>') {
                    this.se.splice(this.rsi + 1, 1);
                }

                // otherwise, iterate until all tags have been exited
                while(this.se[this.rsi + 1].type == 'tag') {

                    this.rst += elem.txt;
                    this.rsi++;

                    // if that was the final tag, exit
                    if(this.rsi + 1 >= this.se.length - 1) return;

                    elem = this.se[this.rsi];
                }

                // go back one since the second to last tag would be the opening
                // for the next colored tag
                this.rsi--;

                // Start the new tag
                this.rst += this._tagHTML();

            } else {

                this.rst += elem.txt;

            }
        },

        _expandLeft: function() {

            // increment backwards
            this.lsi--;

            // if the next element is using a previously colored item, move it
            // to the left one
            if(this.se[this.lsi].txt == '</span>') {
                this._swap(this.lsi, this.lsi - 1)
            }

            var elem = this.se[this.lsi];

            if(elem.type == 'tag') {

                // remove the colored tag and its closing tag, increment only
                // once since the program will automatically decrement a second
                // time once the function is run again
                if($(elem.txt).prop('className') == 'colored') {
                    this.se.splice(this.lsi - 1, 2);
                    this.lsi--;
                    return;
                }

                // Since evertyhing is added in backwards, we have to store each
                // text
                var str = '';

                // Iterate until all tags have been exited
                while(elem.type == 'tag') {
                    str = elem.txt + str;
                    this.lsi--;

                    // if that was the final tag, exit
                    if(this.lsi <= 0) return;

                    elem = this.se[this.lsi];

                }

                // the mose recent tag will have been the closing to another
                // colored tag, so decrement 2 and the function will go back and
                // deal with the closing tag
                this.lsi += 2;

                // add in all of the tags
                this.lst =  str + this._tagHTML() + this.lst;

            } else {
                this.lst =  elem.txt + this.lst;
            }

        },

        _swap: function(ind1, ind2) {
            var temp = this.se[ind1]
            this.se[ind1] = this.se[ind2]
            this.se[ind2] = temp
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

        _wrapText: function(elem) {
            var t = this;
            $(elem).children().each(function (){

                t._wrapText($(this))
            })
            elem.contents().filter(function() {
                return this.nodeType === 3 && this.parentElement.className != 'colored'
            }).wrap("<span class = 'colored'></span>")

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
                    var text = html.slice(startIndex, index + 1)
                    this.se.push({txt: text, type:type})
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
