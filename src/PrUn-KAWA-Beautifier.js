// ==UserScript==
// @name        PrUn-KAWA-Beautifier
// @namespace   http://tampermonkey.net/
// @version     2.0
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
        lmAdRow:    '_14L--Z4VrwQHE-Dayta1db',
        lmAdText:   '_1owHJs3IjU2hxdT0zQ1ytB',
        prodqTable: 'B5JEuqpNoN-VT8jmA8g3l',
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
                updateLM(buffer);
                break;
            case 'LMP':
                updateLMP(buffer);
                break;
            case 'PRODQ':
                updatePRODQ(buffer);
                break;
        }
    }

    // convert duration string to ETA
    function toETA(duration) {
        let eta = new Date();
        let now = new Date();
        let days = duration.match(/(\d+)\s*d/);
        let hours = duration.match(/(\d+)\s*h/);
        let minutes = duration.match(/(\d+)\s*m/);
        let seconds = duration.match(/(\d+)\s*s/);

        let parsedSeconds = 0;
        if (days) {
            parsedSeconds += parseInt(days[1]) * 86400;
        }
        if (hours) {
            parsedSeconds += parseInt(hours[1]) * 3600;
        }
        if (minutes) {
            parsedSeconds += parseInt(minutes[1]) * 60;
        }
        if (seconds) {
            parsedSeconds += parseInt(seconds[1]);
        }
        eta.setSeconds(eta.getSeconds() + parsedSeconds);

        let diffTime = Math.abs(eta.getTime() - now.getTime());
        let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let result = eta.toLocaleString(navigator.language, {hour: '2-digit', minute: '2-digit'});
        if (diffDays > 0) {
            result = eta.toLocaleString(navigator.language, {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
        }

        return result;
    }

    // LM -> Local Market
    function updateLM(buffer) {
        // remove previous changes
        $(buffer).find('.kawa').remove();

        // each LM ads row
        $(buffer).find(`.${classList.lmAdRow}`).each(function () {
            // clone row; this is necessary because Apex needs the original row for updates
            let row = $(this).find(`.${classList.lmAdText}`);
            let newRow = row.clone();
            newRow.addClass('kawa').removeClass(classList.lmAdText);

            // calculate price per unit
            let matches = /(?:BUYING|SELLING)\s*(\d+)\s(.*)\s@\s([\d,.]+)\s[A-Z]+/.exec(newRow.text());
            if (matches) {
                let price = parseFloat(matches[3].replace(',', ''));
                let quantity = parseInt(matches[1]);
                let result = ' (' + parseFloat((price / quantity).toFixed(2)) + '/u)';

                newRow.find('span').append(result);
            }

            // add color
            let line = newRow.html().split(' ');
            if (line[0] == 'BUYING') {
                line[0] = `<span class="${classList.greenText}">` + line[0] + '</span>';
            } else if (line[0] == "SELLING") {
                line[0] = `<span class="${classList.redText}">` + line[0] + '</span>';
            } else if (line[0] == "SHIPPING") {
                line[0] = `<span class="${classList.yellowText}">` + line[0] + '</span>';
            }
            newRow.html(line.join(' '));

            // hide original row and show clone
            row.hide();
            row.parent().append(newRow);
            newRow.show();
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

    // PRODQ -> Production Queue
    function updatePRODQ(buffer) {
        // remove previous changes
        $(buffer).find('.kawa').remove();

        // calculate ETA
        $(buffer).find(`.${classList.prodqTable} td:nth-child(5)`).each(function () {
            let timer = $(this).find('span');
            timer.after('<div class="kawa">' + toETA(timer.text()) + '</div>');
        });
    }

    // create oberserver
    var observer = new MutationObserver(mutations => {
        mutations.forEach(processChange);
    });

    // start observation
    observer.observe($('body')[0], observerConfig);

})();