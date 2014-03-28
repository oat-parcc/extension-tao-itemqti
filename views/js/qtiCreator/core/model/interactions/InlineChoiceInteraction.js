define([
    'lodash',
    'taoQtiItem/qtiCreator/core/model/mixin/editable',
    'taoQtiItem/qtiCreator/core/model/mixin/editableInteraction',
    'taoQtiItem/qtiItem/core/interactions/InlineChoiceInteraction',
    'taoQtiItem/qtiCreator/core/model/choices/InlineChoice'
], function(_, editable, editableInteraction, Interaction, Choice){
    var methods = {};
    _.extend(methods, editable);
    _.extend(methods, editableInteraction);
    _.extend(methods, {
        getDefaultAttributes : function(){
            return {
                'shuffle' : false,
                'required' : false
            };
        },
        afterCreate : function(){
            this.createChoice();
            this.createChoice();
            this.createChoice();
            this.createResponse();
        },
        createChoice : function(){
            var choice = new Choice();
            
            this.addChoice(choice);

            var rank = _.size(this.getChoices());
            
            choice
                .val('choice' + ' #' + rank)
                .buildIdentifier('choice');
            
            if(this.getRenderer()){
                choice.setRenderer(this.getRenderer());
            }
            
            $(document).trigger('choiceCreated.qti-widget', {'choice' : choice, 'interaction' : this});
            
            return choice;
        }
    });
    return Interaction.extend(methods);
});

