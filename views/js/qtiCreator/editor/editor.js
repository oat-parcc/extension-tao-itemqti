define([
    'jquery',
    'lodash',
    //gui components
    'taoItems/preview/preview',
    'taoQtiItem/qtiCreator/editor/preparePrint',
    //appearance editor:
    'taoQtiItem/qtiCreator/editor/styleEditor/fontSelector',
    'taoQtiItem/qtiCreator/editor/styleEditor/colorSelector',
    'taoQtiItem/qtiCreator/editor/styleEditor/fontSizeChanger',
    'taoQtiItem/qtiCreator/editor/styleEditor/itemResizer',
    'taoQtiItem/qtiCreator/editor/styleEditor/styleEditor',
    'taoQtiItem/qtiCreator/editor/styleEditor/styleSheetToggler',
    // item related
    'taoQtiItem/qtiCreator/helper/itemSerializer'
], function(
    $,
    _,
    preview,
    preparePrint,
    fontSelector,
    colorSelector,
    fontSizeChanger,
    itemResizer,
    styleEditor,
    styleSheetToggler,
    itemSerializer
    ){

    'use strict';

    var askForSave = false,
        serializeTimeOut,
        lastItemData,
        serializeItem = function (element) {
            lastItemData = itemSerializer.serialize(element);
        };

    var initStyleEditor = function(widget, config){

        styleEditor.init(widget.element, config);

        styleSheetToggler.init(config);

        // CSS widgets
        fontSelector();
        colorSelector();
        fontSizeChanger();
        itemResizer(widget.element);

    };

    /**
     * Confirm to save the item
     */
    var _confirmPreview = function (overlay) {

        var confirmBox = $('.preview-modal-feedback'),
            cancel = confirmBox.find('.cancel'),
            save = confirmBox.find('.save'),
            close = confirmBox.find('.modal-close');

        confirmBox.modal({ width: 500 });

        save.on('click', function () {
            overlay.trigger('save.preview');
            confirmBox.modal('close');
        });

        cancel.on('click', function () {
            confirmBox.modal('close');
        });
    };


    var initPreview = function(widget){

        var previewContainer;

        clearTimeout(serializeTimeOut);
        //serialize the item at the initialization level
        //TODO wait for an item ready event
        // itemWidget.$container.on('ready...
        serializeTimeOut = setTimeout(function() {
            serializeItem(widget.element);
        }, 500);

        //get the last value by saving
        $('#save-trigger').on('click.qti-creator', function() {
            serializeItem(widget.element);
        });

        $(document).on('stylechange.qti-creator', function () {
            //we need to save before preview of style has changed (because style content is not part of the item model)
            askForSave = true;
        });

        //compare the current item with the last serialized to see if there is any change
        if (!askForSave) {
            var currentItemData = serializeItem(widget.element);
            if (lastItemData !== currentItemData || currentItemData === '') {
                lastItemData = currentItemData;
                askForSave = true;
            }
        }

        previewContainer = preview.init(widget.itemUri);

        // wait for confirmation to save the item
        if (askForSave) {
            _confirmPreview(previewContainer);
            previewContainer.on('save.preview', function () {
                previewContainer.off('save.preview');
                askForSave = false;
                $.when(styleEditor.save(), widget.save()).done(function () {
                    preview.show();
                });
            });
        }
        else {
            //or show the preview
            preview.show();
        }

    };

    /**
     * Initialize interface
     */
    var initGui = function(widget, config){

        updateHeight();
        $(window).off('resize.qti-editor')
            .on('resize.qti-editor', _.throttle(updateHeight, 50));

        initStyleEditor(widget, config);

        preparePrint();

        var $itemPanel = $('#item-editor-panel'),
            $labelSpan = $('#item-editor-label span'),
            $actionGroups = $('.action-group');

        $itemPanel.addClass('has-item');
        $labelSpan.text(config.$label);
        $actionGroups.show();
    };

    /**
     * Update the height of the authoring tool
     * @private 
     */
    var updateHeight = function updateHeight(){
        var $itemEditorPanel = $('#item-editor-panel');
        var $itemSidebars = $('.item-editor-sidebar');
        var $contentPanel = $('#panel-authoring');
        var $searchBar,
            searchBarHeight,
            footerTop,
            contentWrapperTop,
            remainingHeight;

        if (!$contentPanel.length || !$itemEditorPanel.length) {
            return;
        }

        $searchBar = $contentPanel.find('.search-action-bar');
        searchBarHeight = $searchBar.outerHeight() + parseInt($searchBar.css('margin-bottom')) + parseInt($searchBar.css('margin-top'));

        footerTop = (function() {
            var $footer = $('body > footer'),
                footerTop;
            $itemSidebars.hide();
            footerTop = $footer.offset().top;
            $itemSidebars.show();
            return footerTop;
        }());
        contentWrapperTop = $contentPanel.offset().top;
        remainingHeight = footerTop - contentWrapperTop - $('.item-editor-action-bar').outerHeight();


        // in the item editor the action bars are constructed slightly differently
        $itemEditorPanel.find('#item-editor-scroll-outer').css({ minHeight: remainingHeight, maxHeight: remainingHeight, height: remainingHeight });
        $itemSidebars.css({ minHeight: remainingHeight, maxHeight: remainingHeight, height: remainingHeight });
    };

    return {
        initGui : initGui,
        initPreview: initPreview
    };

});


