// ==UserScript==
// @name        PrUn-KAWA-Beautifier
// @namespace   http://tampermonkey.net/
// @version     2.2.1
// @description A custom made tampermonkey script by KAWA corp with QoL improvements for Prosperous Universe.
// @author      Dergell
// @match       https://apex.prosperousuniverse.com/
// @grant       none
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js
// @downloadURL https://raw.githubusercontent.com/Dergell/PrUn-KAWA-Beautifier/master/src/PrUn-KAWA-Beautifier.js
// @updateURL   https://raw.githubusercontent.com/Dergell/PrUn-KAWA-Beautifier/master/src/PrUn-KAWA-Beautifier.js
// ==/UserScript==

// Fix jQuery conflicts
this.$ = this.jQuery = jQuery.noConflict(true);

(function () {
    'use strict';

    // observer configuration
    const observerConfig = {
        childList: true,
        attributes: true,
        attributeFilter: ['value'],
        subtree: true,
    };

    // class selectors
    const classList = {
        // generic
        logo:        '_2fyRVq2wB-JiJ3M4q1mEB',
        logoLoading: '_9loCuZeuQgJye2371syub',
        buffer:      '_1h7jHHAYnTmdWfZvSkS4bo',
        bufferIdent: '_1OuLU0zrb4Lq9rlap4OCdX',
        formRow:     '_2NJYPo9yjhxjx33ER3xFk3',
        // colors
        greenText:   '_1rsxmEXgWQAbBHGrAT6ZiI',
        yellowText:  '_2SSIH9--LqS6n8etor6vMq',
        redText:     '_37rC6F3tFhQffBlJ3pVE0N',
        greenButton: '_3yZx55zAhax66rAfv6d6Z1',
        redButton:   '_31dQZugJBAqjKvME7bRBlA',
        // specific
        lmAdText:     '_1owHJs3IjU2hxdT0zQ1ytB',
        prodLine:     'z8O6A0dWYid_6Vb1y75qz',
        prodItem:     '_1j-lU9fMFzEgedyKKsPDtL',
        prodProgress: 'E1aHYdg2zdgvZCsPl3p9y',
        prodqTable:   'B5JEuqpNoN-VT8jmA8g3l',
    };

    // process every change that was detected
    function processChange(mutation) {
        // wait Apex to finish loading
        if ($(`.${classList.logo}`).hasClass(classList.logoLoading)) {
            setTimeout(processChange, 100, mutation);
            return;
        }

        // find buffers that changed
        let buffers = $(mutation.target).find(`.${classList.buffer}`);
        if (!buffers.length) {
            buffers = $(mutation.target).closest(`.${classList.buffer}`);
        }

        // disable observation until our changes are applied
        observer.disconnect();

        // update buffers individually
        $(buffers).each(function () {
            identifyBuffer(this);
        });

        // restart observation
        observer.observe($('body')[0], observerConfig);
    }

    // identify buffer and call corresponsing update method
    function identifyBuffer(buffer) {
        let identifier = $(buffer).find(`.${classList.bufferIdent}`).text().split(' ')[0];
        switch (identifier) {
            case 'LM':
            case 'LMOS':
                updateLM(buffer);
                break;
            case 'LMP':
                updateLMP(buffer);
                break;
            case 'PROD':
                updatePROD(buffer);
                break;
            case 'PRODQ':
                updatePRODQ(buffer);
                break;
        }
    }

    // convert duration string to seconds
    function parseDuration(duration) {
        let parsedSeconds = 0;

        let days = duration.match(/(\d+)\s*d/);
        if (days) {
            parsedSeconds += parseInt(days[1]) * 86400;
        }

        let hours = duration.match(/(\d+)\s*h/);
        if (hours) {
            parsedSeconds += parseInt(hours[1]) * 3600;
        }

        let minutes = duration.match(/(\d+)\s*m/);
        if (minutes) {
            parsedSeconds += parseInt(minutes[1]) * 60;
        }

        let seconds = duration.match(/(\d+)\s*s/);
        if (seconds) {
            parsedSeconds += parseInt(seconds[1]);
        }

        return parsedSeconds;
    }

    // create ETA string from seconds
    function calcETA(seconds) {
        let eta = new Date();

        eta.setSeconds(eta.getSeconds() + seconds);

        return eta.toLocaleString(navigator.language, {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
    }

    // LM -> Local Market
    function updateLM(buffer) {
        // remove previous changes
        $(buffer).find('.kawa').remove();

        // each LM ads row
        $(buffer).find(`.${classList.lmAdText}`).each(function () {
            // clone text; this is necessary because Apex needs the original row for updates
            let clone = $(this).clone();

            // calculate price per unit
            let matches = /(?:BUYING|SELLING)\s*(\d+)\s(.*)\s@\s([\d,.]+)\s[A-Z]+/.exec(clone.text());
            if (matches) {
                let price = parseFloat(matches[3].replace(',', ''));
                let quantity = parseInt(matches[1]);
                let result = ' (' + parseFloat((price / quantity).toFixed(2)) + '/u)';

                clone.find('span').append(result);
            }

            // add color
            let line = clone.html().split(' ');
            if (line[0] == 'BUYING') {
                line[0] = `<span class="${classList.greenText}">` + line[0] + '</span>';
            } else if (line[0] == "SELLING") {
                line[0] = `<span class="${classList.redText}">` + line[0] + '</span>';
            } else if (line[0] == "SHIPPING") {
                line[0] = `<span class="${classList.yellowText}">` + line[0] + '</span>';
            }
            clone.html(line.join(' '));

            // hide original row and show clone
            $(this).hide().parent().append(clone);
            clone.addClass('kawa').removeClass(classList.lmAdText).show();
        });
    }

    // LMP -> Local Market Post
    function updateLMP(buffer) {
        let data = {};

        // remove previous changes
        $(buffer).find('.kawa').remove();

        // collect current form data
        $(buffer).find(`.${classList.formRow}`).each(function () {
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

        // process changes
        if (!$.isEmptyObject(data)) {
            if (data.adType == 'BUYING') {
                data.adButton.addClass(classList.greenButton);
                data.adButton.text('BUY');
            } else if (data.adType == 'SELLING') {
                data.adButton.addClass(classList.redButton);
                data.adButton.text('SELL');
            }

            if (data.adType != 'SHIPPING' && data.adPrice.val() && data.adAmount.val()) {
                let unitPrice = parseFloat((data.adPrice.val() / data.adAmount.val()).toFixed(2));
                data.adPrice.parent().prepend('<span class="kawa">' + unitPrice + '/u </span>');
            }
        }
    }

    // PROD -> Production Lines
    function updatePROD(buffer) {
        // remove previous changes
        $(buffer).find('.kawa').remove();

        // calculate times for each line
        $(buffer).find(`.${classList.prodLine}`).each(function () {
            let data = [];

            // go through all items in this line
            $(this).find(`.${classList.prodItem}`).each(function () {
                let timeSpan = $(this).find(`span:not([class])`);
                let active = $(this).find(`.${classList.prodProgress}`).length;

                if (active) {
                    let duration = parseDuration(timeSpan.text());
                    timeSpan.after('<div class="kawa">' + calcETA(duration) + '</div>');
                    data.push(duration);
                } else {
                    let duration = Math.min(...data) + parseDuration(timeSpan.text());
                    timeSpan.after('<div class="kawa">' + calcETA(duration) + '</div>');
                    data[data.indexOf(Math.min(...data))] = duration;
                }
            });
        });
    }

    // PRODQ -> Production Queue
    function updatePRODQ(buffer) {
        let data = [];

        // remove previous changes
        $(buffer).find('.kawa').remove();

        // calculate ETA for active lines
        $(buffer).find(`.${classList.prodqTable} tbody:nth-child(2) td:nth-child(5)`).each(function () {
            let timeSpan = $(this).find('span');
            let duration = parseDuration(timeSpan.text());

            timeSpan.after('<div class="kawa">' + calcETA(duration) + '</div>');
            data.push(duration);
        });

        // calculate ETA for queued lines
        $(buffer).find(`.${classList.prodqTable} tbody:nth-child(3) td:nth-child(5)`).each(function () {
            let timeSpan = $(this).find('span');
            let duration = Math.min(...data) + parseDuration(timeSpan.text());

            timeSpan.after('<div class="kawa">' + calcETA(duration) + '</div>');
            data[data.indexOf(Math.min(...data))] = duration;
        });
    }

    // create oberserver
    var observer = new MutationObserver(mutations => {
        mutations.forEach(processChange);
    });

    // start observation
    observer.observe($('body')[0], observerConfig);

})();