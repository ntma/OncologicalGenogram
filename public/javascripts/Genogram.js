/**
 * Genogram creator
 * @param svg: html svg container
 * @param elements: initial set of family members
 * @param marriage
 * @param descendancy
 * @constructor
 */
var Genogram = function(svg, elements, marriage, descendancy){
    this.version = 1.0;

    this.d3family = new D3Family(svg, elements, marriage, descendancy);
    this.shorts = new Shortnings();
    this.legend = new GenogramLegend(svg);
};

Genogram.prototype.initialize = function(){
    this.d3family.initialize();
};

// === Toolbar buttons protos ===
// ==============================
Genogram.prototype.deleteGenogram = function(){

    // Remove selections
    if(this.d3family.getSelectedNode()){
        this.d3family.removeSelectFromNode();
    }
    if(this.d3family.getSelectedEdge()){
        this.d3family.removeSelectFromEdge();
    }

    // Clear family
    this.d3family.clear();

    // Update legend and svg components
    this.legend.updateLegend(this.d3family.getElements());
};

// === Add/Delete/Edit Elements ===
// ================================
Genogram.prototype.addElement = function(values) {

    if(!values.abrev){
        values["abrev"] = this.shorts.nextAlphaNumeric();
    }

    this.d3family.addElement(values);
    this.legend.updateLegend(this.d3family.getElements(), values);
};

Genogram.prototype.editElement = function(updatedInfo) {
    var elem = this.d3family.getSelectedNode();

    elem.setName(updatedInfo.name);
    elem.setGender(updatedInfo.gender);

    var newconditions = updatedInfo.conditions;

    this.d3family.updateConditions(elem, newconditions);

    this.legend.updateLegend(this.d3family.getElements(), undefined, true);
};

Genogram.prototype.removeElement = function(){
    var selectedNode = this.d3family.getSelectedNode();

    if (selectedNode){
        this.d3family.removeElement(selectedNode);

        this.d3family.setSelectedNode(null);

        this.legend.updateLegend(this.d3family.getElements());

        document.getElementById("delete_button").disabled = true;
        document.getElementById("edit_button").disabled = true;
    }

    // TODO: Edges are to be removed
    // else if (selectedEdge){
    //     this.edges.splice(this.edges.indexOf(selectedEdge), 1);
    //     this.state.selectedEdge = null;
    //     this.updateGraph();
    // }
};

// On activate create marriages
Genogram.prototype.activateDrawMarriage = function(){
    if(this.d3family.getDescendancyDrag()){
        this.d3family.setDescendancyDrag(false);
    }

    this.d3family.setMarriageDrag(true);
};

// On activate create marriages
Genogram.prototype.activateDrawDescendancy = function(){
    if(this.d3family.getMarriageDrag()){
        this.d3family.setMarriageDrag(false);
    }

    this.d3family.setDescendancyDrag(true);
};

// === Read/Write Json ===
// =======================
//TODO: this with the JSON parser/stringify
Genogram.prototype.getJson = function(){
    var json = this.d3family.toJson();

    // Add version
    json["version"] = this.version;

    return json;
};

Genogram.prototype.setJson = function(json){
    this.deleteGenogram();

    this.d3family.fromJson(json);

    this.shorts.setNextId(this.d3family.getCountElements());

    // And finnaly, update legend and graph
    this.legend.updateLegend(this.d3family.getElements());

    this.d3family.updateGraph();
};
