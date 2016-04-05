/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function(Mozilla, $) {
    'use strict';

    var client = Mozilla.Client;

    // *************
    // pin it/search variation
    // *************
    var $trySearch = $('#search-now');
    var $searchPointer = $('#search-pointer');

    function shouldPromoteYahooSearch() {
        var availableTargets = new Promise(function(resolve, reject) {
            Mozilla.UITour.getConfiguration('availableTargets', function(config) {
                if (config && config.targets) {
                    resolve(config.targets);
                } else {
                    reject('UITour: targets property not found.');
                }
            });
        });

        return new Promise(function(resolve, reject) {
            Promise.all([availableTargets]).then(function(results) {
                resolve(results[0] && results[0].indexOf('search') > -1);
            }, function(reason) {
                reject(reason);
            });
        });
    }

    function openSearchUI(e) {
        e.preventDefault();
        Mozilla.UITour.openSearchPanel(function() {
            Mozilla.UITour.setSearchTerm('What is the weather?');
            $trySearch.addClass('hidden');
            $searchPointer.removeClass('hidden');
        });
    }

    function initSearchUI() {
        shouldPromoteYahooSearch().then(function() {
            $trySearch.removeClass('hidden');
            $trySearch.on('click', openSearchUI);
        });
    }

    // only 45+ should hit this page, but safer to double check
    if (client.isFirefoxDesktop && client.FirefoxMajorVersion >= 43) {
        initSearchUI();
    }

    // *************
    // mobile/privacy variation
    // *************
    var $tryPB = $('#try-pb');

    if (client.FirefoxMajorVersion >= 42)  {
        // initialize UITour
        Mozilla.HighlightTarget.init('#try-pb');

        $tryPB.attr('role', 'button');
    }
})(window.Mozilla, window.jQuery);
