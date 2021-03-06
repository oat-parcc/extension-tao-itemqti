<?php
/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * 
 * Copyright (c) 2008-2010 (original work) Deutsche Institut für Internationale Pädagogische Forschung (under the project TAO-TRANSFER);
 *               2009-2012 (update and modification) Public Research Centre Henri Tudor (under the project TAO-SUSTAIN & TAO-DEV);
 *               2013-2015 (update and modification) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 * 
 */
namespace oat\taoQtiItem\model\Export;

use core_kernel_classes_Property;
use DOMDocument;
use DOMXPath;
use oat\taoMediaManager\helpers\SharedStimulus;
use oat\taoQtiItem\model\qti\exception\ExportException;
use taoItems_models_classes_ItemExporter;
use oat\taoQtiItem\model\qti\AssetParser;
use oat\taoQtiItem\model\apip\ApipService;
use oat\taoQtiItem\helpers\Apip;
use oat\taoItems\model\media\ItemMediaResolver;
use oat\taoQtiItem\model\qti\Parser;
use oat\taoQtiItem\model\qti\Service;

abstract class AbstractQTIItemExporter extends taoItems_models_classes_ItemExporter
{

    /**
    * List of regexp of media that should be excluded from retrieval
    */
    private static $BLACKLIST = array(
        '/^data:[^\/]+\/[^;]+(;charset=[\w]+)?;base64,/'
    );

    abstract public function buildBasePath();

    abstract public function buildBaseFilename();

    abstract protected function renderManifest(array $options, array $qtiItemData);

    abstract protected function itemContentPostProcessing($content);

    public function buildAssetBasePath($path, $rename = true)
    {
        return rtrim($this->buildBasePath(), '/\\') . DIRECTORY_SEPARATOR . $path;
    }

    public function buildItemAssetBasePath($path, $rename = true)
    {
        return $path;
    }

    /**
     * Overriden export from QTI items.
     *
     * @param array $options An array of options.
     * @return \common_report_Report $report
     * @see taoItems_models_classes_ItemExporter::export()
     */
    public function export($options = array())
    {
        $report = \common_report_Report::createSuccess(__('item %s successfully updated', $this->getItem()->getLabel()));
        $asApip = isset($options['apip']) && $options['apip'] === true;
        
        $lang = \common_session_SessionManager::getSession()->getDataLanguage();
        $basePath = $this->buildBasePath();

        if(is_null($this->getItemModel())){
            throw new ExportException('', 'No Item Model found for item : '.$this->getItem()->getUri());
        }

        $content = $this->getItemService()->getItemContent($this->getItem());
        $resolver = new ItemMediaResolver($this->getItem(), $lang);

        // get the local resources and add them
        foreach ($this->getAssets($this->getItem(), $lang) as $type => $assets) {
            foreach($assets as $assetUrl){
                try{
                    $mediaAsset = $resolver->resolve($assetUrl);
                    $mediaSource = $mediaAsset->getMediaSource();
                    if (get_class($mediaSource) !== 'oat\tao\model\media\sourceStrategy\HttpSource') {
                        $srcPath = $mediaSource->download($mediaAsset->getMediaIdentifier());
                        $fileInfo = $mediaSource->getFileInfo($mediaAsset->getMediaIdentifier());
                        $replacement = $mediaAsset->getMediaIdentifier();

                        if(isset($fileInfo['filePath'])){
                            $filename = $fileInfo['filePath'];
                            if($mediaAsset->getMediaIdentifier() !== $fileInfo['uri']){
                                $replacement = $filename;
                            }
                            $destPath = ltrim($filename, '/\\');
                        } else {
                            $destPath = $replacement = basename($srcPath);
                        }

                        $replacement = $this->buildItemAssetBasePath($replacement);

                        if (file_exists($srcPath)) {
                            if($type === 'xinclude'){
                                //try to get embedded assets of shared stimulus
                                $files = SharedStimulus::prepareExportedFile($srcPath, $resolver);
                                foreach($files as $dest => $src){
                                    $this->addFile($src, $this->buildAssetBasePath($dest, false));
                                }
                            }
                            $this->addFile($srcPath, $this->buildAssetBasePath($destPath));
                            $content = str_replace($assetUrl, $replacement, $content);
                        }
                    }
                } catch(\tao_models_classes_FileNotFoundException $e){
                    $content = str_replace($assetUrl, '', $content);
                    $report->setMessage('Missing resource for ' . $assetUrl);
                    $report->setType(\common_report_Report::TYPE_ERROR);
                }
            }
        }
        
        if ($asApip === true) {
            // 1. let's merge qti.xml and apip.xml.
            // 2. retrieve apip related assets.
            $apipService = ApipService::singleton();
            $apipContentDoc = $apipService->getApipAccessibilityContent($this->getItem());
            
            if ($apipContentDoc === null) {
                \common_Logger::i("No APIP accessibility content found for item '" . $this->getItem()->getUri() . "', default inserted.");
                $apipContentDoc = $apipService->getDefaultApipAccessibilityContent($this->getItem());
            }
            
            $qtiItemDoc = new DOMDocument('1.0', 'UTF-8');
            $qtiItemDoc->formatOutput = true;
            $qtiItemDoc->loadXML($content);
            
            // Let's merge QTI and APIP Accessibility!
            Apip::mergeApipAccessibility($qtiItemDoc, $apipContentDoc);
            $content = $qtiItemDoc->saveXML();
            $fileHrefElts = $qtiItemDoc->getElementsByTagName('fileHref');
            for ($i = 0; $i < $fileHrefElts->length; $i++) {
                $fileHrefElt = $fileHrefElts->item($i);
                $destPath = $basePath . '/' . $fileHrefElt->nodeValue;
                $sourcePath = $this->getItemLocation() . $fileHrefElt->nodeValue;
                $this->addFile($sourcePath, $destPath);
            }
        }

        // Possibility to delegate (if necessary) some item content post-processing to sub-classes.
        $content = $this->itemContentPostProcessing($content);

        // add xml file
        $this->getZip()->addFromString($basePath . $this->getDataFile(), $content);

        return $report;

    }
    
    protected function getAssets(\core_kernel_classes_Resource $item, $lang)
    {
        $qtiItem = Service::singleton()->getDataItemByRdfItem($item, $lang);
        if (is_null($qtiItem)) {
            return [];
        }
        $assetParser = new AssetParser($qtiItem);
        $assetParser->setGetSharedLibraries(false);
        $returnValue = array();
        foreach ($assetParser->extract() as $type => $assets) {
            foreach ($assets as $assetUrl) {
                foreach (self::$BLACKLIST as $blacklist) {
                    if (preg_match($blacklist, $assetUrl) === 1) {
                        continue(2);
                    }
                }
                $returnValue[$type][] = $assetUrl;
            }
        }
        return $returnValue;
    }

    public function getDataFile()
    {
        return (string) $this->getItemModel()->getOnePropertyValue(new core_kernel_classes_Property(\taoItems_models_classes_ItemsService::TAO_ITEM_MODEL_DATAFILE_PROPERTY));
    }
}
