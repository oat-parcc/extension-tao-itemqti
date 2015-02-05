define([
    'jquery',
    'lodash',
    'taoQtiItem/qtiCreator/helper/popup',
    'tpl!taoQtiItem/qtiCreator/editor/colorPicker/tpl/popup',
    'i18n',
    'taoQtiItem/qtiCreator/editor/styleEditor/farbtastic/farbtastic'
], function($, _, popup, popupTpl, __){

    'use strict';

    var _defaults = {
        title : __('Color Picker'),
        offsetTop : -40
    };

    /**
     * Create and attach a color picker to a JQuery container
     * 
     * @param {Object} $colorTrigger - a JQuery container
     * @param {Object} config
     * @returns {undefined}
     */
    function create($colorTrigger, config){

        config = _.defaults(config || {}, _defaults);

        var color, $input = $colorTrigger.siblings('input');

        //set color recorded in the hidden input to the color trigger
        if(config.color){
            color = config.color;
            $input.val(color);
        }else{
            color = $input.val();
        }

        $colorTrigger.css('background-color', color);

        var $popup = $(popupTpl());

        $('#item-editor-wrapper').append($popup);

        // basic popup functionality
        popup.init($colorTrigger, {popup : $popup});


        // after popup opens
        $colorTrigger.on('open.popup', function(e, params){

            var $trigger = $(this),
                $container = $trigger.parents('.sidebar-popup'),
                // this is the input of the color picker
                color = $input.val();

            var $colorPicker = params.popup.find('.color-picker'),
                $colorPickerInput = params.popup.find('.color-picker-input');

            params.popup.css({right : $(window).width() - $container.offset().left + 2, top : $trigger.offset().top + config.offsetTop - $('#item-editor-wrapper').offset().top});
            params.popup.find('h3').text(config.title);

            // Init the color picker
            $colorPicker.farbtastic($colorPickerInput);

            // Set the color to the currently set on the form init
            $colorPickerInput.val(color).trigger('keyup');
            config.color = color;

            // Populate the input with the color on quitting the modal
            params.popup.find('.closer').off('click').on('click', function(){
                params.popup.hide();
                $colorPicker.off('.farbtastic');
            });

            //listen to color change
            $colorPicker.off('.farbtastic').on('colorchange.farbtastic', function(e, color){
                $colorTrigger.css('background-color', color);
                $input.val(color).trigger('change');
            });

        });

        // after popup closes
        $colorTrigger.on('close.popup', function(e, params){
            params.popup.find('.color-picker').off('.farbtastic');
        });

    }

    /**
     * Destroy the color picker attached to a JQuery conttainer
     * 
     * @param {Object} $colorTrigger - a JQuery container
     * @returns {undefined}
     */
    function destroy($colorTrigger){
        $colorTrigger.off('.color-picker');
        $colorTrigger.removeAttr('data-color-picker');
    }

    return {
        create : create,
        destroy : destroy
    };
});