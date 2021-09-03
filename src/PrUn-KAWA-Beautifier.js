// ==UserScript==
// @name         PrUn_Beautifier
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  just some QOL improvements
// @author       Dergell
// @match        https://apex.prosperousuniverse.com/
// @grant        none
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js
// @require https://cdn.jsdelivr.net/gh/calebjacob/tooltipster@latest/dist/js/tooltipster.bundle.min.js
// @require https://cdn.jsdelivr.net/gh/timthedevguy/apexutils@0.0.35/src/apexutils.js
// @downloadURL https://raw.githubusercontent.com/timthedevguy/PrUnTools_Public/master/FIO_Tooltips/PrUnTools_FIO_Tooltips.js
// @updateURL https://raw.githubusercontent.com/timthedevguy/PrUnTools_Public/master/FIO_Tooltips/PrUnTools_FIO_Tooltips.js
// ==/UserScript==

// Fix JQUERY conflicts
this.$ = this.jQuery = jQuery.noConflict(true);

(function () {
    'use strict';

    let fio = [];
    let last_update = null;
    let updates_on = null;
    let loaded = false;

    apex.load();

    document.addEventListener('PrUnTools_Loaded', () => {
        update_beautifier();

        $('body').on('click', '._1vWRpdI8cKNMPyOPnzlXgX', () => {
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

    function update_LMP() {
        let type = $('form._3s_jDJ1t-xQhEfezpWyvsh ._3ghhLiZ1ioM5uEL9rCkYz6').first().find('._1XdRW9HaFHplJXb_FL0L4b');
        let button = $('form._3s_jDJ1t-xQhEfezpWyvsh ._7iA4PlbA4_YVUCJRZ1RuQ ._1Y9l3J20Xn-CyxMZIcH06i');

        if (type.text() == "BUYING") {
            button.addClass('_3yZx55zAhax66rAfv6d6Z1');
            button.text('BUY');
        } else if (type.text() == "SELLING") {
            button.addClass('_31dQZugJBAqjKvME7bRBlA');
            button.text('SELL');
        }
    }

    function update_LM() {
        $('._14L--Z4VrwQHE-Dayta1db').each(function () {
            let row = $(this).find('._1owHJs3IjU2hxdT0zQ1ytB');
            let line = row.html().split(" ");

            if (!row.hasClass('done')) {
                if (line[0] == 'BUYING') {
                    let priceIndex = $.inArray('@', line) + 1;
                    let price = parseFloat(line[priceIndex].replace(',', '').replace('<span>', ''));
                    let quantity = parseInt(line[1]);
                    let result = ' (' + price / quantity + '/u)';

                    line[priceIndex] = line[priceIndex] + result;
                    line[0] = '<span class="_1rsxmEXgWQAbBHGrAT6ZiI">' + line[0] + '</span>';
                } else if (line[0] == "SELLING") {
                    let priceIndex = $.inArray('@', line) + 1;
                    let price = parseFloat(line[priceIndex].replace(',', '').replace('<span>', ''));
                    let quantity = parseInt(line[1]);
                    let result = ' (' + price / quantity + '/u)';

                    line[priceIndex] = line[priceIndex] + result;
                    line[0] = '<span class="_37rC6F3tFhQffBlJ3pVE0N">' + line[0] + '</span>';
                } else if (line[0] == "SHIPPING") {
                    line[0] = '<span class="_2SSIH9--LqS6n8etor6vMq">' + line[0] + '</span>';
                }

                row.html(line.join(' ')).addClass('done');
            }
        });
    }

    function update_beautifier() {
        update_LMP();
        update_LM();
    }

})();