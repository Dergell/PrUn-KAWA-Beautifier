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
// @require     https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js
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
            let line = row.html().split(' ');

            // add done class to prevent recursion
            if (!row.hasClass('done')) {
                if (line[0] == 'BUYING') {
                    let priceIndex = $.inArray('@', line) + 1;
                    let price = parseFloat(line[priceIndex].replace(',', '').replace('<span>', ''));
                    let quantity = parseInt(line[1]);
                    let result = ' (' + parseFloat((price / quantity).toFixed(2)) + '/u)';

                    line[priceIndex] = line[priceIndex] + result;
                    line[0] = '<span class="_1rsxmEXgWQAbBHGrAT6ZiI">' + line[0] + '</span>';   // class for green text color
                } else if (line[0] == "SELLING") {
                    let priceIndex = $.inArray('@', line) + 1;
                    let price = parseFloat(line[priceIndex].replace(',', '').replace('<span>', ''));
                    let quantity = parseInt(line[1]);
                    let result = ' (' + parseFloat((price / quantity).toFixed(2)) + '/u)';

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
        let data = {};

        $('form._3s_jDJ1t-xQhEfezpWyvsh > div').each(function () {
            let rowLabel = $(this).find('> label > span').text();
            let rowContent = $(this).find('> div');

            switch (rowLabel) {
                case 'Type':
                    data.adType = rowContent.text();
                    break;
                case 'Amount':
                    data.adAmount = rowContent.find('input');
                    break;
                case 'Total price':
                    data.adPrice = rowContent.find('input');
                    if (!data.adPrice.prev().hasClass('unitPrice')) {
                        data.adPrice.parent().prepend('<span class="unitPrice"></span>');
                    }
                    break;
                case 'CMD':
                    data.adButton = rowContent.find('button');
                    break;
            }
        });

        if (!$.isEmptyObject(data)) {
            if (data.adType == "BUYING") {
                data.adButton.addClass('_3yZx55zAhax66rAfv6d6Z1'); // class for green button color
                data.adButton.text('BUY');
            } else if (data.adType == "SELLING") {
                data.adButton.addClass('_31dQZugJBAqjKvME7bRBlA'); // class for red button color
                data.adButton.text('SELL');
            }

            if (data.adPrice.val() && data.adAmount.val()) {
                data.adPrice.prev().text(parseFloat((data.adPrice.val() / data.adAmount.val()).toFixed(2)) + '/u ');
            }
        }
    }

    // PRODQ -> Production Queue
    function update_PRODQ() {
        let data = {};

        $('.B5JEuqpNoN-VT8jmA8g3l td:nth-child(5)').each(function () {
            let span = $(this).find('span');

            if (span.siblings('div').length == 0 && span.text().indexOf('in') != -1) {
                let date = moment();
                let timer = /((\d+)\s?([a-z]+)\s?)?(\d+)\s?([a-z]+)/.exec(span.text());

                if (timer) {
                    let daysIndex = $.inArray('days', timer);
                    if (daysIndex) {
                        date.add(timer[daysIndex - 1], timer[daysIndex]);
                    }

                    let hoursIndex = $.inArray('h', timer);
                    if (hoursIndex) {
                        date.add(timer[hoursIndex - 1], timer[hoursIndex]);
                    }

                    let minutesIndex = $.inArray('m', timer);
                    if (minutesIndex) {
                        date.add(timer[minutesIndex - 1], timer[minutesIndex]);
                    }

                    let secondsIndex = $.inArray('s', timer);
                    if (secondsIndex) {
                        date.add(timer[secondsIndex - 1], timer[secondsIndex]);
                    }

                    span.after('<div>' + date.calendar() + '</div>');
                }
            }
        });
    }

    // trigger global update
    function update_beautifier() {
        update_LMP();
        update_LM();
        update_PRODQ();
    }

})();