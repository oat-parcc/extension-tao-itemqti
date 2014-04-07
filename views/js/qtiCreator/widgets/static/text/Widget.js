define([
    'taoQtiItem/qtiCreator/widgets/static/Widget',
    'taoQtiItem/qtiCreator/widgets/static/text/states/states',
    'tpl!taoQtiItem/qtiCreator/tpl/toolbars/htmlEditorTrigger',
    'taoQtiItem/qtiCreator/helper/htmlEditor'
], function(Widget, states, toolbarTpl, htmlEditor){

    var TextWidget = Widget.clone();

    TextWidget.initCreator = function(){

        Widget.initCreator.call(this);

        this.registerStates(states);
        
        this.buildEditor();
    };
    
    TextWidget.buildContainer = function(){
        
        var $wrap = $('<div>', {'data-serial' : this.element.serial, 'class' : 'widget-box'})
            .append($('<div>', {'data-html-editable' : true}));
        
        this.$original.wrapInner($wrap);
        
        this.$container = this.$original.children('.widget-box');
    };
    
    TextWidget.createToolbar = function() {

        this.$container.append(toolbarTpl({
            serial: this.serial,
            state: 'active'
        }));

        return this;
    };

    TextWidget.buildEditor = function() {

        var _this = this,
            $editableContainer = this.$container,
            container = this.element;

        $editableContainer.attr('data-html-editable-container', true);

        if (!htmlEditor.hasEditor($editableContainer)) {
            htmlEditor.buildEditor($editableContainer, {
                change: function(data) {
                    container.body(data);
                },
                focus: function() {
                    _this.changeState('active');
                }
            });
        }
    };
    
    return TextWidget;
});