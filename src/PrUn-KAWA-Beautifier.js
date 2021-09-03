// ==UserScript==
// @name        PrUn-KAWA-Beautifier
// @namespace   http://tampermonkey.net/
// @version     1.0
// @description A custom made tampermonkey script by KAWA corp with QoL improvements for Prosperous Universe. 
// @author      Dergell
// @match       https://apex.prosperousuniverse.com/
// @grant       none
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js
// @require     https://cdn.jsdelivr.net/gh/timthedevguy/apexutils@0.0.35/src/apexutils.js
// @downloadURL https://raw.githubusercontent.com/Dergell/PrUn-KAWA-Beautifier/master/src/PrUn-KAWA-Beautifier.js
// @updateURL   https://raw.githubusercontent.com/Dergell/PrUn-KAWA-Beautifier/master/src/PrUn-KAWA-Beautifier.js
// ==/UserScript==

// Fix jQuery conflicts
this.$ = this.jQuery = jQuery.noConflict(true);

(function () {
    'use strict';

    // load apex utils first
    apex.load();

    document.addEventListener('PrUnTools_Loaded', () => {
        update_beautifier();

        // extra event needed to track and update when the tab in LMP is changed
        $('body').on('click', '._1vWRpdI8cKNMPyOPnzlXgX', () => {
            //  timeout needed to wait for PrUn to finish tab change
            setTimeout(function () {
                update_beautifier();
            }, 1);
        });
    });

    document.addEventListener('PrUnTools_ScreenChange_Complete', () => {
        update_beautifier();
    });

    document.addEventListener('PrUnTools_TileUpdate', () => {
        update_beautifier();
    });

    document.addEventListener('PrUnTools_BufferCreated', () => {
        update_beautifier();
    });

    // LM -> Local Market
    function update_LM() {
        // each LM ads row
        $('._14L--Z4VrwQHE-Dayta1db').each(function () {
            let row = $(this).find('._1owHJs3IjU2hxdT0zQ1ytB');
            let line = row.html().split(" ");

            // add done class to prevent recursion
            if (!row.hasClass('done')) {
                if (line[0] == 'BUYING') {
                    let priceIndex = $.inArray('@', line) + 1;
                    let price = parseFloat(line[priceIndex].replace(',', '').replace('<span>', ''));
                    let quantity = parseInt(line[1]);
                    let result = ' (' + price / quantity + '/u)';

                    line[priceIndex] = line[priceIndex] + result;
                    line[0] = '<span class="_1rsxmEXgWQAbBHGrAT6ZiI">' + line[0] + '</span>';   // class for green text color
                } else if (line[0] == "SELLING") {
                    let priceIndex = $.inArray('@', line) + 1;
                    let price = parseFloat(line[priceIndex].replace(',', '').replace('<span>', ''));
                    let quantity = parseInt(line[1]);
                    let result = ' (' + price / quantity + '/u)';

                    line[priceIndex] = line[priceIndex] + result;
                    line[0] = '<span class="_37rC6F3tFhQffBlJ3pVE0N">' + line[0] + '</span>';   // class for red text color
                } else if (line[0] == "SHIPPING") {
                    line[0] = '<span class="_2SSIH9--LqS6n8etor6vMq">' + line[0] + '</span>';   // class for yellow text color
                }

                row.html(line.join(' ')).addClass('done');
            }
        });
    }

    // LMP -> Local Market Post
    function update_LMP() {
        let type = $('form._3s_jDJ1t-xQhEfezpWyvsh ._3ghhLiZ1ioM5uEL9rCkYz6').first().find('._1XdRW9HaFHplJXb_FL0L4b');
        let button = $('form._3s_jDJ1t-xQhEfezpWyvsh ._7iA4PlbA4_YVUCJRZ1RuQ ._1Y9l3J20Xn-CyxMZIcH06i');

        if (type.text() == "BUYING") {
            button.addClass('_3yZx55zAhax66rAfv6d6Z1'); // class for green button color
            button.text('BUY');
        } else if (type.text() == "SELLING") {
            button.addClass('_31dQZugJBAqjKvME7bRBlA'); // class for red button color
            button.text('SELL');
        }
    }

    // trigger global update
    function update_beautifier() {
        update_LMP();
        update_LM();
    }

})();