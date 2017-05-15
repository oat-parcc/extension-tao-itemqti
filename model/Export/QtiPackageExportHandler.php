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
 * Copyright (c) 2014 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *               
 * 
 */

namespace oat\taoQtiItem\model\Export;

use oat\oatbox\PhpSerializable;
use oat\oatbox\PhpSerializeStateless;
use oat\taoQtiItem\model\ItemModel;
use \tao_models_classes_export_ExportHandler;
use \core_kernel_classes_Resource;
use \core_kernel_classes_Class;
use \taoItems_models_classes_ItemsService;
use \tao_helpers_File;
use \Exception;
use \ZipArchive;
use \common_Logger;

/**
 * Short description of class oat\taoQtiItem\model\ItemModel
 *
 * @access public
 * @author Joel Bout, <joel@taotesting.com>
 * @package taoQTI
 
 */
class QtiPackageExportHandler implements tao_models_classes_export_ExportHandler, PhpSerializable
{

    use PhpSerializeStateless;
    /**
     * (non-PHPdoc)
     * @see tao_models_classes_export_ExportHandler::getLabel()
     */
    public function getLabel() {
    	return __('QTI Package 2.1');
    }
    
    /**
     * (non-PHPdoc)
     * @see tao_models_classes_export_ExportHandler::getExportForm()
     */
    public function getExportForm(core_kernel_classes_Resource $resource) {
        if ($resource instanceof core_kernel_classes_Class) {
            $formData= array('class' => $resource);
        } else {
            $formData= array('instance' => $resource);
        }
    	$form = new ExportForm($formData);
    	return $form->getForm();
    }
    
    /**
     * (non-PHPdoc)
     * @see tao_models_classes_export_ExportHandler::export()
     */
    public function export($formValues, $destination) {
        $report = \common_report_Report::createSuccess();
		if (isset($formValues['filename'], $formValues['instances'])) {
			$instances = $formValues['instances'];
			if(count($instances) > 0){

				$itemService = taoItems_models_classes_ItemsService::singleton();

				$fileName = $formValues['filename'].'_'.time().'.zip';
				$path = tao_helpers_File::concat(array($destination, $fileName));
				if(!tao_helpers_File::securityCheck($path, true)){
					throw new Exception('Unauthorized file name');
				}

				$zipArchive = new ZipArchive();
				if($zipArchive->open($path, ZipArchive::CREATE) !== true){
					throw new Exception('Unable to create archive at '.$path);
				}

				$manifest = $this->createManifest();
				foreach($instances as $instance){
					$item = new core_kernel_classes_Resource($instance);
					if($itemService->hasItemModel($item, array(ItemModel::MODEL_URI))){
						$exporter = $this->createExporter($item, $zipArchive, $manifest);

                        try {
                            $subReport = $exporter->export();
                            $manifest = $exporter->getManifest();
                            $report->add($subReport);
                        } catch (\Exception $e) {
                            $report->add(\common_report_Report::createFailure(__('Error to export item %s: %s', $instance, $e->getMessage())));
                            common_Logger::i(__('Error to export item %s: %s', $instance, $e->getMessage()));
                        }
					}
				}
				
				$zipArchive->close();
				$report->setData($path);
			}
		} else {
			if (!isset($formValues['filename'])) {
				common_Logger::w('Missing filename for export using '.__CLASS__);
			}
			if (!isset($formValues['instances'])) {
				common_Logger::w('No instances selected for export using '.__CLASS__);
			}
		}
		return $report;
    }


    protected function createExporter(\core_kernel_classes_Resource $itemResource, \ZipArchive $zip, \DOMDocument $manifest = null)
    {
        return new QTIPackedItemExporter($itemResource, $zip, $manifest);
    }

    protected function createManifest()
    {
        return null;
    }
}