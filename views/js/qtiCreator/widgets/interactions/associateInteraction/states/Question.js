define([
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/blockInteraction/states/Question',
    'taoQtiItem/qtiCreator/widgets/interactions/helpers/formElement',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/interactions/associate'
], function(stateFactory, Question, formElement, formTpl){

    var AssociateInteractionStateQuestion = stateFactory.extend(Question);

    AssociateInteractionStateQuestion.prototype.initForm = function(){

        var _widget = this.widget;

        _widget.$form.html(formTpl({
            shuffle : !!_widget.element.attr('shuffle')
        }));
        
        formElement.initShuffle(_widget);
    };

    return AssociateInteractionStateQuestion;
});