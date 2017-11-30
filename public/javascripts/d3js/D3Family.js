/**
 * Class that wraps a Family with Dashing3djs logic
 * @param svg: html svg
 * @param elements: initial set of elements
 * @param marriage: initial marriage connections
 * @param descendancy: initial descendancy connections
 * @constructor
 */
function D3Family(svg, elements, marriage, descendancy){
    Family.call(this, elements, marriage, descendancy);

    this.genDistance = 50;        // TODO: use this to control generation distance

    this.mainGroup = null;        // Top level svg group
    this.descendancyLines = null; // Descendancies svg group
    this.marriageLines = null;    // Marriages svg group
    this.nodeElements = null;     // Node elements svg group

    this.dragLine = null;         // Reference to placeholder drag line

    this.svg = svg;               // svg reference
}

D3Family.prototype = Object.create(Family.prototype);

D3Family.prototype.state = {
    selectedNode: null,
    selectedEdge: null,
    mouseDownNode: null,
    mouseDownLink: null,
    justDragged: false,
    justScaleTransGraph: false,
    descendancyDrag: false,
    marriageDrag: false
};

D3Family.prototype.consts = {
    selectedClass: "selected",
    connectClass: "connect-node",
    memberGClass: "nodeElement",
    graphClass: "mainGroup",
    activeEditId: "active-editing",
    nodeRadius: 10
};

D3Family.prototype.conditions = {
    breast_cancer: "BC",
    diabetes: "DB",
    heart_disease: "HD"
};

D3Family.prototype.clear = function(){
    Family.prototype.clear.call(this);

    this.updateGraph();
};

// === Initialization ===
// ======================
D3Family.prototype.initSvgGroups = function () {
    // Set the background color
    this.svg.append("rect")
        .attr("width","100%")
        .attr("height", "100%")
        .attr("fill", "white");

    // Base group for family nodes/links
    this.mainGroup = this.svg.append("g").classed(this.consts.graphClass, true);

    // displayed when dragging between nodes
    this.dragLine = this.mainGroup.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0');

    // Reference to svg nodes and links
    this.descendancyLines = this.mainGroup.append("g").selectAll("g");
    this.marriageLines = this.mainGroup.append("g").selectAll("g");
    this.nodeElements = this.mainGroup.append("g").selectAll("g");
};

D3Family.prototype.initDefinitions = function(){

    var defs = this.svg.append('svg:defs');
    defs.append("pattern")
        .attr("id", "BC")
        .attr("width", "1")
        .attr("height", "1")
        .attr("viewBox", "0 0 2 2")
        .append("rect")
        .attr("y", "0.0")
        .attr("x", "1.0")
        .attr("width", "1.0")
        .attr("height", "1.0")
        .attr("fill", "#f466d8");

    defs.append("pattern")
        .attr("id", "HD")
        .attr("width", "1")
        .attr("height", "1")
        .attr("viewBox", "0 0 2 2")
        .append("rect")
        .attr("y", "0.0")
        .attr("x", "0.0")
        .attr("width", "1.0")
        .attr("height", "1.0")
        .attr("fill", "#dd2323");

    defs.append("pattern")
        .attr("id", "DB")
        .attr("width", "1")
        .attr("height", "1")
        .attr("viewBox", "0 0 2 2")
        .append("rect")
        .attr("y", "1.0")
        .attr("x", "0.0")
        .attr("width", "1.0")
        .attr("height", "1.0")
        .attr("fill", "#2c8422");
};

D3Family.prototype.initEvents = function(){
    var me = this;

    this.drag = d3.behavior.drag()
        .origin(function(d){
            return {x: d.x, y: d.y};
        })
        .on("drag", function(args){
            me.state.justDragged = true;
            me.dragmove.call(me, args);
        })
        .on("dragend", function() {
            // todo check if edge-mode is selected
        });

    this.svg.on("mousedown", function(d){me.svgMouseDown.call(me, d);});
    this.svg.on("mouseup", function(d){me.svgMouseUp.call(me, d);});

    // listen for dragging
    var dragSvg = d3.behavior.zoom()
        .on("zoom", function(){
            // if (d3.event.sourceEvent.shiftKey){
            //     // TODO  the internal d3 state is still changing
            //     return false;
            // } else{
            me.zoomed.call(me);
            // }
            return true;
        })
        .on("zoomstart", function(){
            var ael = d3.select("#" + me.consts.activeEditId).node();
            if (ael){
                ael.blur();
            }
            // if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
        })
        .on("zoomend", function(){
            d3.select('body').style("cursor", "auto");
        });

    this.svg.call(dragSvg).on("dblclick.zoom", null);
};

D3Family.prototype.initialize = function(){
    this.initSvgGroups();

    this.initDefinitions();

    this.initEvents();
};

// === Update Operations ===
// =========================
D3Family.prototype.updateNodes = function(){
    var me = this,
        consts = me.consts;

    // ==== PROCESS NODES ====
    // =======================
    me.nodeElements.attr("transform", me.nodeTransform);
    me.nodeElements = me.nodeElements.data(me.elements);

    // add new nodes
    var newGroups = me.nodeElements.enter()
        .append("g");

    newGroups.classed(consts.memberGClass, true)
        .attr("id", function(d){return "g" + d.id;})
        .attr("transform", me.nodeTransform)
        .on("mouseover", function(d){})
        .on("mouseout", function(d){})
        .on("mousedown", function(d){
            me.nodeMouseDown.call(me, d3.select(this), d);
        })
        .on("mouseup", function(d){
            me.nodeMouseUp.call(me, d3.select(this), d);
        })
        .call(me.drag);

    // Filter woman and set circles
    var females = newGroups.filter(function(d){ return d.gender === 'F'; });
    var males   = newGroups.filter(function(d){ return d.gender === 'M'; });

    females.append("circle")
        .style("fill", "#F6FBFF")
        // .style("fill", "#F6FBFF")
        .style("stroke", "#333")
        .style("stroke-width", "2px")
        .attr("r", consts.nodeRadius);

    // Filter man and set rect's
    males.append("rect")
        .style("fill", "#F6FBFF")
        .style("stroke", "#333")
        .style("stroke-width", "2px")
        .attr("x", - consts.nodeRadius)
        .attr("y", - consts.nodeRadius)
        .attr("width", consts.nodeRadius * 2.0)
        .attr("height", consts.nodeRadius * 2.0);


    for( var k in me.conditions){
        const cond = me.conditions[k];

        females.filter(function(d){ return d.conditions.includes(cond); })
            .append('circle')
            .attr("id", function(d){return "d" + d.id + cond})
            .attr("r", consts.nodeRadius)
            .style("fill", "url(#" + cond + ")")
            .style("stroke", "#333")
            .style("stroke-width", "2px");

        // Filter man and set rect's
        males.filter(function(d){ return d.conditions.includes(cond); })
            .append("rect")
            .attr("id", function(d){return "d" + d.id + cond})
            .attr("x", - consts.nodeRadius)
            .attr("y", - consts.nodeRadius)
            .attr("width", consts.nodeRadius * 2.0)
            .attr("height", consts.nodeRadius * 2.0)
            .style("fill", "url(#" + cond + ")")
            .style("stroke", "#333")
            .style("stroke-width", "2px");
    }


    newGroups.append("text")
        .attr("dy", consts.nodeRadius * 1.5)
        .attr("dx", consts.nodeRadius * 1.5)
        .html(function(d){ return d.abrev;});

    // remove old nodes
    me.nodeElements.exit().remove();
};

D3Family.prototype.updatePaths = function () {
    var me = this,
        consts = me.consts,
        state = me.state;

    // ==== DESCENDANCY PATHS ====
    // ==========================
    me.descendancyLines = me.descendancyLines.data(me.descendancy);

    // update existing descendancyLines
    var descendancyLines = me.descendancyLines;
    descendancyLines
        .classed(consts.selectedClass, function(d){
            return d === state.selectedEdge;
        })
        .attr("d", me.descendancyLine);

    // add new descendancyLines
    descendancyLines.enter()
        .append("path")
        .classed("link", true)
        .attr("d", me.descendancyLine)
        .style("fill", "none")
        .style("stroke-width", "2px")
        .style("cursor", "default")
        .style("stroke", "#333")
        .on("mousedown", function(d){
            me.pathMouseDown.call(me, d3.select(this), d);
        })
        .on("mouseup", function(d){
            state.mouseDownLink = null;
        });

    // remove old links
    descendancyLines.exit().remove();

    // ***** MARRIAGE LINKS *******
    // ****************************
    me.marriageLines = me.marriageLines.data(me.marriage);

    // update existing marriageLines
    var marriageLines = me.marriageLines;
    marriageLines.classed(consts.selectedClass, function(d){
        return d === state.selectedEdge;
    })
        .attr("d", me.marriageLine);

    // add new paths
    marriageLines.enter()
        .append("path")
        .classed("link", true)
        .attr("d", me.marriageLine)
        .style("fill", "none")
        .style("stroke-width", "2px")
        .style("cursor", "default")
        .style("stroke", "#333")
        .on("mousedown", function(d){
            me.pathMouseDown.call(me, d3.select(this), d);
        })
        .on("mouseup", function(d){
            state.mouseDownLink = null;
        });

    // remove old links
    marriageLines.exit().remove();
};

D3Family.prototype.updateGraph = function(){

    this.updateNodes();

    this.updatePaths();
};

D3Family.prototype.updateConditions = function(elem, newconditions){
    var consts = this.consts,
        oldconditions = elem.getConditions();

    // Styles to add
    var to_remove = oldconditions.filter(function(i) {return newconditions.indexOf(i) < 0;});
    var to_add = newconditions.filter(function(i) {return oldconditions.indexOf(i) < 0;});

    var fig = this.nodeElements.filter(function(data){ return data.id === elem.id; });

    // TODO: Simplify this
    if(elem.getGender() === 'M'){
        // TODO: Update conditions styles
        for(var k in to_add){

            var cond = newconditions[k];
            fig.append("rect")
                .attr("id", function(d){return "d" + d.getId() + cond})
                .attr("x", - consts.nodeRadius)
                .attr("y", - consts.nodeRadius)
                .attr("width", consts.nodeRadius * 2.0)
                .attr("height", consts.nodeRadius * 2.0)
                .attr("style", "fill: url(#" + cond +"); stroke: #333;stroke-width: 2px;");
        }
    }else{
        // TODO: Update conditions styles
        for(var k in to_add){
            var cond = newconditions[k];
            fig.append('circle')
                .attr("id", function(d){return "d" + d.getId() + cond})
                .attr("r", consts.nodeRadius)
                .attr("style", "fill: url(#" + cond +"); stroke: #333;stroke-width: 2px;");
        }
    }

    for(var k in to_remove){
        var cond = elem.conditions[k];
        document.getElementById("d" + elem.getId() + cond).remove();
    }

    elem.setConditions(newconditions);
};

// === Overrides ===
// =================
D3Family.prototype.addElement = function (values) {

    var elem = new FamilyMember();
    elem.fromJson(values);

    var bb;
    // We have to set the gen of the first element
    if(this.getCountElements() === 0 && elem.gen === null) {
        // Initial element spawn
        elem.setGen(5);
        bb = this.svg[0][0].getBBox();

        elem.setX(bb.x + bb.width / 2.0);
        elem.setY(bb.y + bb.height / 2.0);
    } else{
        // Initial element spawn
        bb = this.mainGroup[0][0].getBBox();
        elem.setX(bb.x + bb.width + 20);
        elem.setY(bb.y + bb.height + 20);
    }

    //TODO: [BUG] Added elements are null after setting X/Y here

    Family.prototype.addElement.call(this, elem);

    this.updateGraph();
};

D3Family.prototype.removeElement = function (elem) {
    Family.prototype.removeElement.call(this, elem);

    this.updateGraph();
};

// === Events  ===
// ===============
D3Family.prototype.dragmove = function(d) {
    var me = this;
    if (me.state.descendancyDrag || me.state.marriageDrag){
        me.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(me.mainGroup.node())[0] + ',' + d3.mouse(this.mainGroup.node())[1]);
    } else{
        d.x += d3.event.dx;

        if(d.gen === null){
            d.y +=  d3.event.dy;
        }

        me.updateGraph();
    }
};

D3Family.prototype.pathMouseDown = function(d3path, d){
    var me = this,
        state = me.state;
    d3.event.stopPropagation();
    state.mouseDownLink = d;

    if (state.selectedNode){
        me.removeSelectFromNode();
    }

    var prevEdge = state.selectedEdge;
    if (!prevEdge || prevEdge !== d){
        me.replaceSelectEdge(d3path, d);
    } else{
        me.removeSelectFromEdge();
    }
};

// mousedown on node
D3Family.prototype.nodeMouseDown = function(d3node, d){
    var me = this,
        state = me.state;
    d3.event.stopPropagation();
    state.mouseDownNode = d;


    if(state.descendancyDrag || state.marriageDrag){
        me.dragLine.classed('hidden', false)
            .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    }
};

// mouseup on nodes
D3Family.prototype.nodeMouseUp = function(d3node, targetNode){
    var me = this,
        state = me.state;

    var sourceNode = state.mouseDownNode;

    if (!sourceNode) return;

    me.dragLine.classed("hidden", true);

    if (sourceNode !== targetNode){

        // DESCENDANCY/ASCENDANCY
        if(state.descendancyDrag){
            me.addDescendancy(sourceNode, targetNode);

            state.descendancyDrag = false;
            // MARRIAGE
        }else{
            me.addMarriage(sourceNode, targetNode);

            state.marriageDrag = false;
        }

        me.updateGraph();

    } else{
        // we're in the same node
        if (state.justDragged) {
            // dragged, not clicked
            state.justDragged = false;
        } else{
            //TODO: from here on, should be evented
            if (state.selectedEdge){
                me.removeSelectFromEdge();
            }
            var prevNode = state.selectedNode;

            // If previous node and not the same
            if (!prevNode || prevNode.id !== targetNode.id){
                me.replaceSelectNode(d3node, targetNode);

                // Allow edit
                document.getElementById("edit_button").disabled = false;
                document.getElementById("delete_button").disabled = false;

                // If no previous node
            } else{
                me.removeSelectFromNode();

                // Disable edit
                document.getElementById("edit_button").disabled = true;
                document.getElementById("delete_button").disabled = true;

            }
        }
    }

    state.mouseDownNode = null;
}; // end of circles mouseup

// mousedown on main svg
D3Family.prototype.svgMouseDown = function(){
    this.state.graphMouseDown = true;
};

// mouseup on main svg
D3Family.prototype.svgMouseUp = function(){
    var me = this,
        state = me.state;

    if (state.justScaleTransGraph) {
        // dragged not clicked
        state.justScaleTransGraph = false;
    } else if (state.descendancyDrag){
        // dragged from node
        state.descendancyDrag = false;
        me.dragLine.classed("hidden", true);
    } else if (state.marriageDrag){
        // dragged from node
        state.marriageDrag = false;
        me.dragLine.classed("hidden", true);
    }
    state.graphMouseDown = false;
};

// On zoom, scale/translate svg
D3Family.prototype.zoomed = function(){
    this.state.justScaleTransGraph = true;
    d3.select("." + this.consts.graphClass)
        .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
};

// === Highlights ===
// ==================
D3Family.prototype.replaceSelectEdge = function(d3Path, edgeData){
    var me = this;
    d3Path.classed(me.consts.selectedClass, true);
    if (me.state.selectedEdge){
        me.removeSelectFromEdge();
    }
    me.state.selectedEdge = edgeData;
};

D3Family.prototype.replaceSelectNode = function(d3Node, nodeData){
    var me = this;
    d3Node.classed(this.consts.selectedClass, true);
    if (me.state.selectedNode){
        me.removeSelectFromNode();
    }
    me.state.selectedNode = nodeData;
};

D3Family.prototype.removeSelectFromNode = function(){
    var me = this;
    me.nodeElements.filter(function(cd){
        return cd.id === me.state.selectedNode.id;
    }).classed(me.consts.selectedClass, false);
    me.state.selectedNode = null;
};

D3Family.prototype.removeSelectFromEdge = function(){
    var me = this;
    me.descendancyLines.filter(function(cd){
        return cd === me.state.selectedEdge;
    }).classed(me.consts.selectedClass, false);
    me.state.selectedEdge = null;
};

// === Auxiliars ===
// =================
// Create descendancy link
D3Family.prototype.descendancyLine = function(d){
    var l = d.source.source;
    var r = d.source.target;

    var x = (l.x + r.x) / 2.0;
    var y = (l.y + r.y) / 2.0;

    var my = (y + d.target.y) / 2.0;

    return "M" + x + "," + y +
        "L" + x + "," + my +
        "L" + d.target.x + "," + my +
        "L" + d.target.x + "," + d.target.y;
};

// Create marriage link
D3Family.prototype.marriageLine = function(d){
    return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
};

D3Family.prototype.nodeTransform =  function(d){
    if(d.gen !== null){
        // TODO: this.genDistance
        d.y = d.gen * 50;
    }

    return "translate(" + d.x + "," + d.y + ")";
};

// === Getters ===
// ===============
D3Family.prototype.getSelectedNode = function(){
    return this.state.selectedNode;
};

D3Family.prototype.getSelectedEdge = function(){
    return this.state.selectedEdge;
};

D3Family.prototype.getMarriageDrag = function(){
    return this.state.marriageDrag;
};

D3Family.prototype.getDescendancyDrag = function(){
    return this.state.descendancyDrag;
};

D3Family.prototype.setSelectedNode = function(node){
    // TODO: [Enhance] If !null, highlight
    this.state.selectedNode = node;
};

D3Family.prototype.setSelectedEdge = function(node){
    // TODO: [Enhance] If !null, highlight
    this.state.selectedEdge = node;
};

D3Family.prototype.setMarriageDrag = function(state){
    this.state.marriageDrag = state;
};

D3Family.prototype.setDescendancyDrag = function(state){
    this.state.descendancyDrag = state;
};