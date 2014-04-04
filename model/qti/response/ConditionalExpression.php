<?php
/*  
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
 * Copyright (c) 2013 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *               
 * 
 */
namespace oat\taoQtiItem\model\qti\response;

use oat\taoQtiItem\model\qti\response\ConditionalExpression;
use oat\taoQtiItem\model\qti\response\Rule;
use oat\taoQtiItem\model\qti\expression\Expression;

/**
 * Short description of class
 *
 * @access public
 * @author Joel Bout, <joel.bout@tudor.lu>
 * @package taoQTI
 
 */
class ConditionalExpression
        implements Rule
{
    // --- ASSOCIATIONS ---
    // generateAssociationEnd :     // generateAssociationEnd :     // generateAssociationEnd :     // generateAssociationEnd : 

    // --- ATTRIBUTES ---

    /**
     * Short description of attribute condition
     *
     * @access protected
     * @var Expression
     */
    protected $condition = null;

    /**
     * Short description of attribute actions
     *
     * @access protected
     * @var array
     */
    protected $actions = array();

    // --- OPERATIONS ---

    /**
     * Short description of method getRule
     *
     * @access public
     * @author Joel Bout, <joel.bout@tudor.lu>
     * @return string
     */
    public function getRule()
    {
        $returnValue = (string) '';

        // section 127-0-1-1-3397f61e:12c15e8566c:-8000:0000000000002AFF begin
        
        $returnValue = 'if('.$this->getCondition()->getRule().') {';
        foreach ($this->getActions() as $actions) {
            $returnValue .= $actions->getRule();
        }
        $returnValue .= '}';
        
        // section 127-0-1-1-3397f61e:12c15e8566c:-8000:0000000000002AFF end

        return (string) $returnValue;
    }

    /**
     * Short description of method __construct
     *
     * @access public
     * @author Joel Bout, <joel.bout@tudor.lu>
     * @param  Expression condition
     * @param  array actions
     * @return mixed
     */
    public function __construct( Expression $condition, $actions)
    {
        // section 127-0-1-1-2d3ac2b0:12c120718cc:-8000:0000000000002AE9 begin
        $this->condition	= $condition;
        $this->actions		= $actions;
        // section 127-0-1-1-2d3ac2b0:12c120718cc:-8000:0000000000002AE9 end
    }

    /**
     * Short description of method getCondition
     *
     * @access public
     * @author Joel Bout, <joel.bout@tudor.lu>
     * @return oat\taoQtiItem\model\qti\expression\Expression
     */
    public function getCondition()
    {
        $returnValue = null;

        // section 127-0-1-1-2d3ac2b0:12c120718cc:-8000:0000000000004907 begin
        $returnValue = $this->condition;
        // section 127-0-1-1-2d3ac2b0:12c120718cc:-8000:0000000000004907 end

        return $returnValue;
    }

    /**
     * Short description of method getActions
     *
     * @access public
     * @author Joel Bout, <joel.bout@tudor.lu>
     * @return array
     */
    public function getActions()
    {
        $returnValue = array();

        // section 127-0-1-1-2d3ac2b0:12c120718cc:-8000:0000000000004909 begin
        $returnValue = $this->actions;
        // section 127-0-1-1-2d3ac2b0:12c120718cc:-8000:0000000000004909 end

        return (array) $returnValue;
    }

} /* end of class oat\taoQtiItem\model\qti\response\ConditionalExpression */

?>