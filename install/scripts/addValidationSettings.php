<?php


use oat\oatbox\service\ServiceManager;
use oat\taoQtiItem\model\ValidationService;


$serviceManager = ServiceManager::getServiceManager();

//Set Validation service
$validationService = new ValidationService();
$validationService->setServiceManager($serviceManager);
$serviceManager->register(ValidationService::SERVICE_ID, $validationService);

