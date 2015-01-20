define([
    'jquery',
    'lodash',
    'i18n',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/blockInteraction/states/Question',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCommonRenderer/renderers/interactions/ExtendedTextInteraction',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/interactions/extendedText'
], function($, _, __, stateFactory, Question, formElement, renderer, formTpl){
    'use strict';
    var initState = function initState(){
        // Disable inputs until response edition.
        this.widget.$container.find('input, textarea').attr('disabled', 'disabled');
    };

    var exitState = function exitState(){
        // Enable inputs until response edition.
        this.widget.$container.find('input, textarea').removeAttr('disabled');
    };

    var ExtendedTextInteractionStateQuestion = stateFactory.extend(Question, initState, exitState);

    function parsePattern(pattern,type){
        if (pattern === undefined){
            return null;
        }
        if (type === "words") {
            //expre = /^(?:(?:[^\s\:\!\?\;\…\€]+)[\s\:\!\?\;\…\€]*){0,3}$/;
            var regex =  /\/\^\(\?\:\(\?\:\[\^\\s\\:\\!\\\?\\\;\\\…\\\€\]\+\)\[\\s\\:\\!\\\?\\;\\\…\\\€\]\*\)\{\d+\,(\d+)\}/;
            var result = pattern.match(regex);

            if (result !== null && result.length > 1) {
                return result[1];
            }else{
                return null;
            }
        }else if (type === "chars"){
            // This is the original regExp generated by our code
            // expre = /^[\s\S]{0,10}$/;
            // and we will try to extract the top limit from it with this regexp
            // wich is mostly just escaped version of the first one.
            var regex = /\/\^\[\\s\\S\]\{\d+\,(\d+)\}\$\//;
            var result = pattern.match(regex)[1];

            if (result !== null && result.length > 1) {
                return result[1];
            }else{
                return null;
            }
        }else{
            return 0;
        }
    }

    ExtendedTextInteractionStateQuestion.prototype.initForm = function(){

        var _widget = this.widget,
            $form = _widget.$form,
            interaction = _widget.element,
            format = interaction.attr('format');

        var formats = {
            plain : {label : __("Plain text"), selected : false},
            preformatted : {label : __("Pre-formatted text"), selected : false},
            xhtml : {label : __("XHTML"), selected : false}
        };

        if(formats[format]){
            formats[format].selected = true;
        }


        var patternMask = interaction.attr('patternMask');
        var expectedLength = parseInt(interaction.attr('expectedLength'), 10);
        var maxWords = parsePattern(patternMask,'words');
        var maxChars = parsePattern(patternMask,'chars');


        $form.html(formTpl({
            formats : formats,
            patternMask : patternMask,
            maxWords : maxWords,
            maxLength : maxChars,
            expectedLength : expectedLength

        }));

        formElement.initWidget($form);
        //  init data change callbacks
        var callbacks = {};

        // -- format Callback
        callbacks.format = function(interaction, attrValue){
            var response = interaction.getResponseDeclaration();
            var correctResponse = _.values(response.getCorrect());
            var previousFormat = interaction.attr('format');

            interaction.attr('format', attrValue);
            renderer.updateFormat(interaction, previousFormat);

            if(previousFormat === 'xhtml'){
                if(typeof correctResponse[0] !== 'undefined'){
                    // Get a correct response with all possible html tags removed.
                    // (Why not let jquery do that :-) ?)
                    response.setCorrect($('<p>' + correctResponse[0] + '</p>').text());
                }
            }
        };
        callbacks.maxWords = function(interaction, attrValue){
            var value = parseInt(attrValue,10);
            if (! isNaN(value)) {
                // save the value
                interaction.attr('maxStrings', value);
                // if it's not empty / 0 so avtivate the expectation
                if (value < 0) {interaction.attr('expectMaxWords', true);}
                    else {interaction.attr('expectMaxWords', false);}
            }
        };
        callbacks.maxLength = function(interaction, attrValue){
            var value = parseInt(attrValue,10);
            if (! isNaN(value)) {
                // save the value
                interaction.attr('maxLength', value);
                // if it's not empty / 0 so avtivate the expectation
                if (value < 0) {interaction.attr('expectMaxLength', true);}
                    else {interaction.attr('expectMaxLength', false);}
            }
        };
        callbacks.patternMask = function(interaction, attrValue){
            // save the value
            interaction.attr('patternMask', attrValue);
            // if it's not empty / 0 so avtivate the expectation
            if (attrValue !== '') {interaction.attr('expectPatternMask',true);}
                else {interaction.attr('expectPatternMask', false);}
        };

        callbacks.expectPatternMask = function(interaction,attrValue){
            var value = parseInt(attrValue,10);
            // save the value
            if (! isNaN(value) && value === 1) { interaction.attr('expectPatternMask',true);}
                else { interaction.attr('expectPatternMask',false);}
        };
        callbacks.expectMaxWords = function(interaction,attrValue){
            var value = parseInt(attrValue,10);
            if (! isNaN(value) && value === 1) {
                interaction.attr('expectMaxWords',true);}
                else{ interaction.attr('expectMaxWords',false);}
        };
        callbacks.expectMaxLength = function(interaction,attrValue){
            var value = parseInt(attrValue,10);
            if (! isNaN(value) && value === 1) {
                interaction.attr('expectMaxLength',true);}
                else{ interaction.attr('expectMaxLength',false);}
            };

        formElement.setChangeCallbacks($form, interaction, callbacks);
    };

    return ExtendedTextInteractionStateQuestion;
});
