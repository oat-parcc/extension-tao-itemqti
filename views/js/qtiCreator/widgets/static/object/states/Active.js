define([
    'jquery',
    'i18n',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/static/states/Active',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/static/object',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCreator/widgets/static/helpers/inline',
    'taoQtiItem/qtiItem/helper/util',
    'lodash',
    'util/image',
    'ui/mediasizer',
    'ui/resourcemgr',
    'nouislider',
    'ui/tooltip'
], function($, __, stateFactory, Active, formTpl, formElement, inlineHelper, itemUtil, _, imageUtil){

    var fileFilters = 'image/jpeg,image/png,image/gif,image/svg+xml,video/mp4,video/avi,video/ogv,video/mpeg,video/ogg,video/quicktime,video/webm,video/x-ms-wmv,video/x-flv,audio/mp3,audio/vnd.wav,audio/ogg,audio/vorbis,audio/webm,audio/mpeg,application/ogg,audio/aac,application/pdf';

    var ObjectStateActive = stateFactory.extend(Active, function(){

        this.initForm();

    }, function(){

        this.widget.$form.empty();
    });

    /**
     * Extract a default label from a file/path name
     * @param {String} fileName - the file/path
     * @returns {String} a label
     */
    var _extractLabel = function extractLabel(fileName){
        return fileName
            .replace(/\.[^.]+$/, '')
            .replace(/^(.*)\//, '')
            .replace(/\W/, ' ')
            .substr(0, 255);
    };

    ObjectStateActive.prototype.initForm = function(){

        var _widget = this.widget,
            $qtiObject = _widget.$original,
            $form = _widget.$form,
            qtiObject = _widget.element,
            baseUrl = _widget.options.baseUrl,
            responsive = true;

        $form.html(formTpl({
            baseUrl : baseUrl || '',
            src : qtiObject.attr('data'),
            alt : qtiObject.attr('alt'),
            height : qtiObject.attr('height'),
            width : qtiObject.attr('width'),
            responsive : responsive
        }));

        //init slider and set align value before ...
        _initAdvanced(_widget);
        _initMediaSizer(_widget);
        _initAlign(_widget);
        _initUpload(_widget);

        //... init standard ui widget
        formElement.initWidget($form);

        //init data change callbacks
        formElement.setChangeCallbacks($form, qtiObject, {
            src : _.throttle(function(object, value){

                qtiObject.attr('data', value);
                //refresh rendering:
                $qtiObject.attr('data', _widget.getAssetManager().resolve(value));
                _widget.refresh();
            }, 1000),
            alt : function(qtiObject, value){
                qtiObject.attr('alt', value);
            },
            align : function(qtiObject, value){
                inlineHelper.positionFloat(_widget, value);
            }
        });

    };

    var _initAlign = function(widget){

        var align = 'default';

        //init float positioning:
        if(widget.element.hasClass('rgt')){
            align = 'right';
        }else if(widget.element.hasClass('lft')){
            align = 'left';
        }

        inlineHelper.positionFloat(widget, align);
        widget.$form.find('select[name=align]').val(align);
    };


    var _initMediaSizer = function(widget){

        return;

        var qtiObject = widget.element,
            $src = widget.$form.find('input[name=src]'),
            $mediaResizer = widget.$form.find('.img-resizer'),
            $mediaSpan = widget.$container;

        if($src.val()){

            //init data-responsive:
            if(qtiObject.data('responsive') === undefined){
                if(qtiObject.attr('width') && !/[0-9]+%/.test(qtiObject.attr('width'))){
                    qtiObject.data('responsive', false);
                }else{
                    qtiObject.data('responsive', true);
                }
            }

            //hack to fix the initial width issue:
            if(qtiObject.data('responsive')){
                $mediaSpan.css('width', qtiObject.attr('width'))
                $mediaSpan.css('height', '')
            }

            //init media sizer
            $mediaResizer.mediasizer({
                responsive : (qtiObject.data('responsive') !== undefined) ? !!qtiObject.data('responsive') : true,
                target : widget.$original,
                applyToMedium : false
            });

            //bind modification events
            $mediaResizer
                .off('.mediasizer')
                .on('responsiveswitch.mediasizer', function(e, responsive){

                    qtiObject.data('responsive', responsive);

                })
                .on('sizechange.mediasizer', function(e, size){


                    _(['width', 'height']).each(function(sizeAttr){
                        if(size[sizeAttr] === '' || size[sizeAttr] === undefined || size[sizeAttr] === null){
                            qtiObject.removeAttr(sizeAttr);
                            $mediaSpan.css(sizeAttr, '')
                        }else{
                            qtiObject.attr(sizeAttr, size[sizeAttr]);
                            $mediaSpan.css(sizeAttr, size[sizeAttr])
                        }

                        //trigger choice container size adaptation
                        widget.$container.trigger('contentChange.qti-widget');
                    });

                });
        }

    };

    var _initAdvanced = function(widget){

        var $form = widget.$form,
            data = widget.element.attr('data');

        if(data){
            $form.find('[data-role=advanced]').show();
        }else{
            $form.find('[data-role=advanced]').hide();
        }
    };


    var _initUpload = function(widget){

        var $form = widget.$form,
            options = widget.options,
            qtiObject = widget.element,
            $container = widget.$container,
            $uploadTrigger = $form.find('[data-role="upload-trigger"]'),
            $src = $form.find('input[name=src]');

        var _openResourceMgr = function(){
            $uploadTrigger.resourcemgr({
                title : __('Please select a media file from the resource manager. You can add files from your computer with the button "Add file(s)".'),
                appendContainer : options.mediaManager.appendContainer,
                mediaSourcesUrl : options.mediaManager.mediaSourcesUrl,
                browseUrl : options.mediaManager.browseUrl,
                uploadUrl : options.mediaManager.uploadUrl,
                deleteUrl : options.mediaManager.deleteUrl,
                downloadUrl : options.mediaManager.downloadUrl,
                fileExistsUrl : options.mediaManager.fileExistsUrl,
                params : {
                    uri : options.uri,
                    lang : options.lang,
                    filters : fileFilters
                },
                pathParam : 'path',
                select : function(e, files){

                    var file, alt;

                    if(files && files.length){

                        file = files[0].file;
                        type = files[0].mime;
                        console.log('file', files[0]);
                        imageUtil.getSize(options.baseUrl + file, function(size){

                            if(size && size.width >= 0){

                                var w = parseInt(size.width, 10),
                                    maxW = $container.parents().innerWidth();

                                //always set the image size in % of the container size with a seurity margin of 5%
                                if(w >= maxW * 0.95){
                                    qtiObject.attr('width', '100%');
                                }else{
                                    w = parseInt(100*w/maxW);
                                    qtiObject.attr('width', w+'%');
                                }
                                qtiObject.removeAttr('height');
                            }

                            _.defer(function(){
                                qtiObject.attr('type', type);
                                $src.val(file).trigger('change');
                            });
                        });
                    }
                },
                open : function(){
                    //hide tooltip if displayed
                    if($src.data('qtip')){
                        $src.blur().qtip('hide');
                    }
                },
                close : function(){
                    //triggers validation :
                    $src.blur();
                }
            });
        };

        $uploadTrigger.on('click', _openResourceMgr);

        //if empty, open file manager immediately
        if(!$src.val()){
            _openResourceMgr();
        }

    };

    return ObjectStateActive;
});
