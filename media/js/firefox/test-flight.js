/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// create namespace
if (typeof window.Mozilla === 'undefined') {
    window.Mozilla = {};
}

Mozilla.MobileForm = function(formId) {
    'use strict';

    this.formId = formId;
    this.$form = $(formId);
    this.$fieldsets = this.$form.find('.snazzy-fieldset');
    this.$fields = this.$fieldsets.find('input, select');

    this.enhanced = false;

    if (typeof matchMedia !== 'undefined') {
        this.queryMobileViewport = matchMedia('(max-width: 760px)');
    }

    if (this.queryMobileViewport.matches) {
        this.enhance();
    }

    var that = this;

    this.queryMobileViewport.addListener(function(mq) {
        if (mq.matches && !that.enhanced) {
            that.enhance();
        } else {
            that.dehance();
        }
    });

    return this.$form;
};

Mozilla.MobileForm.prototype.enhance = function() {
    this.enhanced = true;

    this.$fields.each(function(i, field) {
        var $field = $(field);
        $field.attr('placeholder', $field.data('placeholder'));
    });

    this.$fields.on('focus.mobileform', function() {
        var $this = $(this);

        // get rid of placeholder on focus, as label is shown instead
        $this.attr('placeholder', '');

        $this.parent('.field').addClass('focused labeled').removeClass('invalid');
    }).on('blur.mobileform', function() {
        var $this = $(this);
        var $parent = $this.parent('.field');

        // if nothing entered, hide label and re-enable placeholder
        if ($this.val() === '') {
            $parent.removeClass('labeled');
            $this.attr('placeholder', $this.data('placeholder'));
        }

        $parent.removeClass('focused');

        // if field is required, update UI
        if ($this[0].hasAttribute('required')) {
            if ($this.val() === '') {
                $parent.addClass('invalid');
            } else {
                $parent.removeClass('invalid');
            }
        }
    });
};

Mozilla.MobileForm.prototype.dehance = function() {
    this.enhanced = false;

    // unbind all the things
    this.$fields.off('.mobileform');
    this.$fields.attr('placeholder', '');
};

(function($, Spinner) {
    'use strict';

    //var $testFlightForm = new Mozilla.SnazzyForm('#test-flight-form');
    new Mozilla.MobileForm('#test-flight-form');

    $('#test-flight-form').on('submit', function (e) {
        e.preventDefault();

        var $self = $(this);
        var $errors = $('#test-flight-errors');
        var $errorlist = $errors.find('.errorlist');
        var $submitbutton = $('#test-flight-submit');
        var $spinnerTarget = $('#test-flight-spinner');
        var spinner = new Spinner({
            lines: 12, // The number of lines to draw
            length: 4, // The length of each line
            width: 2, // The line thickness
            radius: 8, // The radius of the inner circle
            corners: 0, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#fff', // #rgb or #rrggbb or array of colors
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: true // Whether to use hardware acceleration
        });

        $errors.hide();
        $errorlist.empty();

        // have to collect data before disabling inputs
        var formData = $self.serialize();
        disableForm();

        $.ajax($self.attr('action'), {
            'method': 'post',
            'data': formData,
            'dataType': 'json'
        }).done(function (data) {
            if (data.success) {
                var $thanks = $('#test-flight-form-thankyou');
                var formHeight = $self.css('height');

                // set the min-height of the thank you message
                // to the height of the form to stop page height
                // jumping on success
                $thanks.css('min-height', formHeight);
                $self.hide();

                // enableForm to cancel interval and enable form elements.
                // if page is refreshed and form elements are disabled,
                // they will be disabled after refresh.
                enableForm();

                // show the thank you message
                $thanks.show();

                // track signup in GA
                var newsletter = $('input[name="newsletters"]').val();
                window.dataLayer.push({
                    'event': 'newsletter-signup-success',
                    'newsletter': newsletter
                });

            } else if (data.errors) {
                for (var i = 0; i < data.errors.length; i++) {
                    $errorlist.append('<li>' + data.errors[i] + '</li>');
                }
                $errors.show();
                enableForm();
            }
        }).fail(function () {
            // shouldn't need l10n. This should almost never happen.
            $errorlist.append('<li>An unknown error occurred. Please try again later</li>');
            $errors.show();
            enableForm();
        });

        function disableForm() {
            $self.addClass('loading');
            $self.find('input, select').prop('disabled', true);
            $submitbutton.addClass('insensitive');
            spinner.spin($spinnerTarget.show()[0]);
        }

        function enableForm() {
            $self.removeClass('loading');
            $self.find('input, select').prop('disabled', false);
            $submitbutton.removeClass('insensitive');
            spinner.stop();
            $spinnerTarget.hide();
        }
    });

    /*
    var $inputs = $('#form-fields').find('input, select');

    $inputs.each(function(i, input) {
        var $input = $(input);
        $input.attr('placeholder', $input.data('placeholder'));
    });

    $inputs.on('focus', function() {
        var $this = $(this);

        $this.attr('placeholder', '');

        $this.parent('.field').addClass('focused').removeClass('invalid');
    }).on('blur', function() {
        var $this = $(this);
        var $parent = $this.parent('.field');

        $this.attr('placeholder', $this.data('placeholder'));

        $parent.removeClass('focused');

        // if field is required, update UI
        if ($this[0].hasAttribute('required')) {
            if ($this.val() === '') {
                $parent.addClass('invalid');
            } else {
                $parent.removeClass('invalid');
            }
        }
    });
    */
})(window.jQuery, window.Spinner);
