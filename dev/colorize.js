/**
 * jQuery colorize
 * @author Zachary Ross (http://zacharyross.me)
 * @version 1.3
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
            textDecoration: 'none',
            direction:      'forwards',
            speed:          15,
            callback:       function() {}
        }

        this.el         = el;
        this.opt        = $.extend({}, this.o, opt);
        this.se         = [] // Stored elements

        this.lsc        = false; // left side complete
        this.rsc        = false; // right side complete
        this.lst        = ''; // left side html
        this.rst        = ''; // right side html
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

        /*
         * determine where the functon will start
         * i eventually want this to be from any point in the sequence
         */
        _determineStart: function() {
            if (this.opt.direction == 'backwards') {
                this.lsi = this.se.length - 1;
                this.rsi = this.se.length;
            } else {
                this.lsi = -1;
                this.rsi = 0;
            }
        },

        /*
         *  go in each direction until there is nothing left in either of them
         */
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
                        // get rid of any scragglers
                        $('.colored').filter(function(){return $(this).text().length == 0}).remove()
                        t.opt.callback.call(e);

                    }

            }, this.opt.speed)

        },

        /*
         *  Add the text to the tag, or move tags if there is another tag
         *  already there. Only do this if the side has not been
         *  completed
         */
        _expandRight: function() {

            // When moving to the right, swap the other 'colored' tag with the
            // next element. If the next element is the closing tag for it, then
            // delete both of them
            var swapped = false;
            if($(this.se[this.rsi].txt).prop('className') == 'colored') {

                this._swap(this.rsi, this.rsi + 1)
                swapped = true;

                if(this.se[this.rsi].txt == '</span>') {
                    this.se.splice(this.rsi, 2)
                }

            }

            if(this.rsi == this.se.length) {return;}

            // if the next element is a tag, then go through the next few elemtents
            // until the sequence is no longer in a tag. Then place open and
            // closing tags for the colorizer around the outer tags
            if (this.se[this.rsi].type == 'tag' && !swapped){

                this.rst += '</span>'

                while(this.se[this.rsi + 1].type == 'tag') {
                    this.rst += this.se[this.rsi].txt;
                    this.rsi++;
                    if(this.rsi + 1 == this.se.length - 1) {
                        return;
                    }
                }

                // go back one since the last tag will be the span needed to
                // traverse the sequence
                this.rsi--;
                this.rst += this._tagHTML();

            } else {

                this.rst += this.se[this.rsi].txt;

            }

            this.rsi++;

        },

        /*
         *  do the same thing as expandRight, except go left
         */
        _expandLeft: function() {
            var swapped = false;
            var converged = false;
            if(this.se[this.lsi].txt == '</span>') {

                this._swap(this.lsi, this.lsi - 1)
                swapped = true;
                if(this.se[this.lsi].type == 'tag') {
                    if($(this.se[this.lsi].txt).prop('className') == 'colored') {
                        this.se.splice(this.lsi - 1, 2)
                        // only subtract one from this since the ending will
                        // automatically subtract one anyways
                        this.lsi -= 1;
                        // subtract 2 since 2 items are being removed
                        this.rsi -= 2;
                        converged = true;
                    }
                }
            }

            if (this.se[this.lsi].type == 'tag' && !swapped){

                var string = this._tagHTML();

                while(this.se[this.lsi - 1].type == 'tag') {
                    string = this.se[this.lsi].txt + string;
                    this.lsi--;

                    if(this.lsi == 0) {
                        return;
                    }
                }
                this.lsi++;
                this.lst = '</span>' + string + this.lst;

            } else if (!converged) {

                this.lst = this.se[this.lsi].txt + this.lst;
            }
            this.lsi--;
        },

        _swap: function(ind1, ind2) {
            var temp = this.se[ind1]
            this.se[ind1] = this.se[ind2]
            this.se[ind2] = temp
        },

        /*
         * will check if things are on the screen eventually
         */
        _isVisible: function() {
            return true;
        },

        /*
         *  html for the span being used
         */
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
            var leftSide = this._getHTML(0, this.lsi + 1);
            var rightSide = this._getHTML(this.rsi, this.se.length);
            return leftSide
                + this._tagHTML() + this.lst + '</span>'
                + this._tagHTML() + this.rst + '</span>'
                + rightSide;
        },

        _wrapText: function(elem) {
            var t = this;
            $(elem).children().each(function (){
                t._wrapText($(this))
            })
            elem.contents().filter(function() {
                return this.nodeType === 3
                    && this.parentElement.className != 'colored'
                    && $(this).text().replace(/\s/g, '').length > 0;
            }).wrap("<span class = 'colored'></span>")

        },

        /*
         *  Parses the html into the queue
         */
        _parseElement: function() {
            var html = this.el.html();
            var str = '';
            for(var i = 0; i < html.length; i++) {
                str += html.charAt(i);
                if(str.charAt(0) == '<') {
                    if(/<[^>]*>/.test(str)) {
                        this.se.push({txt: str, type:'tag'});
                        str = '';
                    }
                } else if(str.charAt(0) == '&') {
                    if(/&[^;]*;/.test(str)) {
                        this.se.push({txt: str, type:'entity'});
                        str = '';
                    }
                } else {
                    this.se.push({txt: str, type: 'text'})
                    str = '';
                }
            }
        }
    }
}(jQuery));
