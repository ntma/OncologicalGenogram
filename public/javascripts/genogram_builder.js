
// === Genogram Creator ====
// =========================
var Genogram = function(svg, elements, descendancy, marriage){
    var thisGenogram = this;
    thisGenogram.idct = 0;

    thisGenogram.genDistance = 50;

    thisGenogram.lgy = 0;    // Legend x
    thisGenogram.lgx = 0;    // Legend y
    thisGenogram.lgw = 200;  // Legend width
    thisGenogram.lgh = 100;  // Legend height
    thisGenogram.lgs = 1;    // Legend spacing
    thisGenogram.lgws = 20;  // Legend word size

    thisGenogram.elements = elements || [];       // Family members
    thisGenogram.descendancy = descendancy || []; // Descendacy links
    thisGenogram.marriage = marriage || [];       // Marriage links

    thisGenogram.state = {
        selectedNode: null,
        selectedEdge: null,
        mouseDownNode: null,
        mouseDownLink: null,
        justDragged: false,
        justScaleTransGraph: false,
        lastKeyDown: -1,
        shiftNodeDrag: false,
        ctrlNodeDrag: false,
        selectedText: null
    };

    // TODO: Template this
    thisGenogram.conditions = {
        breast_cancer: "BC",
        diabetes: "DB",
        heart_disease: "HD"
    };

    var defs = svg.append('svg:defs');
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

    // Store the svg reference
    thisGenogram.svg = svg;

    // Append the subtitle to the svg body
    var legend = svg.append('foreignObject')
        .attr("x", 5)
        .attr("y", 5)
        .attr("width", thisGenogram.lgw)
        .attr("height", "100%")
        .append('xhtml:div')
        .attr("id", "familyLegend")
        .attr("style", "position: relative;margin-bottom: 0.5em;margin-left: 1em;border: 2px solid #EEEEEE;border-radius: 5px;padding: 1em;z-index: 5;fill: #F6FBFF;");

    legend.append('legend')
        .attr("style", "font-size:15px;font-weight: bold;")
        .html("Family Members:")
        .append("hr");

    legend.append("div")
        .attr("id", "familyLegendBody");

    // Set the background color
    thisGenogram.svg.append("rect")
        .attr("width","100%")
        .attr("height", "100%")
        .attr("fill", "white");


    // Base group for family nodes/links
    thisGenogram.svgG = svg.append("g")
        .classed(thisGenogram.consts.graphClass, true);

    var svgG = thisGenogram.svgG;

    // displayed when dragging between nodes
    thisGenogram.dragLine = svgG.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0');
        // .style('marker-end', 'url(#mark-end-arrow)');

    // Reference to svg nodes and links
    thisGenogram.descendancyLinks = svgG.append("g").selectAll("g");
    thisGenogram.marriageLinks = svgG.append("g").selectAll("g");
    thisGenogram.nodes = svgG.append("g").selectAll("g");

    thisGenogram.updateLegend();

    thisGenogram.drag = d3.behavior.drag()
        .origin(function(d){
            return {x: d.x, y: d.y};
        })
        .on("drag", function(args){
            thisGenogram.state.justDragged = true;
            thisGenogram.dragmove.call(thisGenogram, args);
        })
        .on("dragend", function() {
            // todo check if edge-mode is selected
        });

    // listen for key events
    d3.select(window).on("keydown", function(){
        thisGenogram.svgKeyDown.call(thisGenogram);
    }).on("keyup", function(){
            thisGenogram.svgKeyUp.call(thisGenogram);
    });

    svg.on("mousedown", function(d){thisGenogram.svgMouseDown.call(thisGenogram, d);});
    svg.on("mouseup", function(d){thisGenogram.svgMouseUp.call(thisGenogram, d);});

    // listen for dragging
    var dragSvg = d3.behavior.zoom()
        .on("zoom", function(){
            if (d3.event.sourceEvent.shiftKey){
                // TODO  the internal d3 state is still changing
                return false;
            } else{
                thisGenogram.zoomed.call(thisGenogram);
            }
            return true;
        })
        .on("zoomstart", function(){
            var ael = d3.select("#" + thisGenogram.consts.activeEditId).node();
            if (ael){
                ael.blur();
            }
            if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
        })
        .on("zoomend", function(){
            d3.select('body').style("cursor", "auto");
        });

    svg.call(dragSvg).on("dblclick.zoom", null);


    // // handle download data
    // d3.select("#download-input").on("click", function(){
    //     var saveEdges = [];
    //     thisGenogram.descendancy.forEach(function(val, i){
    //         saveEdges.push({source: val.source.id, target: val.target.id});
    //     });
    //     var blob = new Blob([window.JSON.stringify({"nodes": thisGenogram.elements, "descendancy": saveEdges})], {type: "text/plain;charset=utf-8"});
    //     saveAs(blob, "mydag.json");
    // });
    //
    // // handle uploaded data
    // d3.select("#upload-input").on("click", function(){
    //     document.getElementById("hidden-file-upload").click();
    // });
    // d3.select("#hidden-file-upload").on("change", function(){
    //     if (window.File && window.FileReader && window.FileList && window.Blob) {
    //         var uploadFile = this.files[0];
    //         var filereader = new window.FileReader();
    //
    //         filereader.onload = function(){
    //             var txtRes = filereader.result;
    //             // TODO better error handling
    //             try{
    //                 var jsonObj = JSON.parse(txtRes);
    //                 thisGenogram.deleteGraph(true);
    //                 thisGenogram.elements = jsonObj.elements;
    //                 thisGenogram.setIdCt(jsonObj.elements.length + 1);
    //                 var newEdges = jsonObj.descendancy;
    //                 newEdges.forEach(function(e, i){
    //                     newEdges[i] = {source: thisGenogram.elements.filter(function(n){return n.id == e.source;})[0],
    //                         target: thisGenogram.elements.filter(function(n){return n.id == e.target;})[0]};
    //                 });
    //                 thisGenogram.descendancy = newEdges;
    //                 thisGenogram.updateGraph();
    //             }catch(err){
    //                 window.alert("Error parsing uploaded file\nerror message: " + err.message);
    //                 return;
    //             }
    //         };
    //         filereader.readAsText(uploadFile);
    //
    //     } else {
    //         alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
    //     }
    //
    // });

};

// TODO: remove this
Genogram.prototype.setIdCt = function(idct){
    this.idct = idct;
};


Genogram.prototype.consts =  {
    selectedClass: "selected",
    connectClass: "connect-node",
    memberGClass: "memberG",
    graphClass: "graph",
    activeEditId: "active-editing",
    // BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 10,
    abrevList: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
};

// === Toolbar buttons protos ===
// ==============================
Genogram.prototype.deleteGenogram = function(){
    var thisGenogram = this;

    // Remove selections
    if(thisGenogram.state.selectedNode){
        thisGenogram.removeSelectFromNode();
    }
    if(thisGenogram.state.selectedEdge){
        thisGenogram.removeSelectFromEdge();
    }

    // Clear support structures
    thisGenogram.elements = [];
    thisGenogram.descendancy = [];
    thisGenogram.marriage = [];

    // Update legend and svg components
    thisGenogram.updateLegend();
    thisGenogram.updateGraph();
};

Genogram.prototype.replaceSelectEdge = function(d3Path, edgeData){
    var thisGenogram = this;
    d3Path.classed(thisGenogram.consts.selectedClass, true);
    if (thisGenogram.state.selectedEdge){
        thisGenogram.removeSelectFromEdge();
    }
    thisGenogram.state.selectedEdge = edgeData;
};

Genogram.prototype.replaceSelectNode = function(d3Node, nodeData){
    var thisGenogram = this;
    d3Node.classed(this.consts.selectedClass, true);
    if (thisGenogram.state.selectedNode){
        thisGenogram.removeSelectFromNode();
    }
    thisGenogram.state.selectedNode = nodeData;
};


Genogram.prototype.removeSelectFromNode = function(){
    var thisGenogram = this;
    thisGenogram.nodes.filter(function(cd){
        return cd.id === thisGenogram.state.selectedNode.id;
    }).classed(thisGenogram.consts.selectedClass, false);
    thisGenogram.state.selectedNode = null;
};

Genogram.prototype.removeSelectFromEdge = function(){
    var thisGenogram = this;
    thisGenogram.descendancyLinks.filter(function(cd){
        return cd === thisGenogram.state.selectedEdge;
    }).classed(thisGenogram.consts.selectedClass, false);
    thisGenogram.state.selectedEdge = null;
};


// === Events  ===
// ===============

Genogram.prototype.dragmove = function(d) {
    var thisGenogram = this;
    if (thisGenogram.state.shiftNodeDrag || thisGenogram.state.ctrlNodeDrag){
        thisGenogram.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGenogram.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
    } else{
        d.x += d3.event.dx;

        // TODO: Refine generation change
        /* Account to multiple gen skip
            marriage, descendancy
         */
        if(d.gen === null){
            d.y +=  d3.event.dy;
        }

        thisGenogram.updateGraph();
    }
};

Genogram.prototype.pathMouseDown = function(d3path, d){
    var thisGenogram = this,
        state = thisGenogram.state;
    d3.event.stopPropagation();
    state.mouseDownLink = d;

    if (state.selectedNode){
        thisGenogram.removeSelectFromNode();
    }

    var prevEdge = state.selectedEdge;
    if (!prevEdge || prevEdge !== d){
        thisGenogram.replaceSelectEdge(d3path, d);
    } else{
        thisGenogram.removeSelectFromEdge();
    }
};

// mousedown on node
Genogram.prototype.circleMouseDown = function(d3node, d){
    var thisGenogram = this,
        state = thisGenogram.state;
    d3.event.stopPropagation();
    state.mouseDownNode = d;


    if(state.shiftNodeDrag || state.ctrlNodeDrag){
        thisGenogram.dragLine.classed('hidden', false)
            .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    }

    // if (d3.event.shiftKey){
    //     state.shiftNodeDrag = d3.event.shiftKey;
    //     // reposition dragged directed edge
    //     thisGenogram.dragLine.classed('hidden', false)
    //         .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    //     // return;
    // }else if(d3.event.ctrlKey){
    //     //TODO: HERE
    //     state.ctrlNodeDrag = d3.event.ctrlKey;
    //     // reposition dragged directed edge
    //     thisGenogram.dragLine.classed('hidden', false)
    //         .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    // }

    return;
};

// mouseup on nodes
Genogram.prototype.circleMouseUp = function(d3node, d){
    var thisGenogram = this,
        state = thisGenogram.state,
        consts = thisGenogram.consts;


    var dragType = "";

    if(state.shiftNodeDrag !== false){
        dragType = "SHIFT";
    }else if(state.shiftNodeDrag !== false){
        dragType = "CTRL";
    }

    // reset the states
    state.shiftNodeDrag = false;
    state.ctrlNodeDrag = false;
    d3node.classed(consts.connectClass, false);

    var mouseDownNode = state.mouseDownNode;

    if (!mouseDownNode) return;

    thisGenogram.dragLine.classed("hidden", true);

    if (mouseDownNode !== d){

        // DESCENDANCY/ASCENDANCY
        if(dragType === "SHIFT"){
            //TODO: IF HAS MARRIAGE, we have to properlly handle
            //TODO: IF has no marriage, we have to set it to null
            var mar= null;

            var found = false;

            thisGenogram.marriage.forEach(function(elem, index, arr){
                if(elem.source.id === mouseDownNode.id
                    || elem.target.id === mouseDownNode.id){
                    found = !found;
                    mar = elem;
                }
            });

            if(!found)
                mar = {source: mouseDownNode, target: mouseDownNode};

            // Check if we need to set the gen
            if(d.gen === null){
                d.gen = mouseDownNode.gen - 1;
                d.y = d.gen * thisGenogram.genDistance;
            } else if (mouseDownNode.gen === null){
                mouseDownNode.gen = d.gen + 1;
                mouseDownNode.y = mouseDownNode.gen * thisGenogram.genDistance;
            }

            // we're in a different node: create new edge for mousedown edge and add to graph
            var newEdge = {source: mar, target: d};
            var filtRes = thisGenogram.descendancyLinks.filter(function(d){
                if (d.source === newEdge.target && d.target === newEdge.source){
                    thisGenogram.descendancy.splice(thisGenogram.descendancy.indexOf(d), 1);
                }
                return d.source === newEdge.source && d.target === newEdge.target;
            });
            if (!filtRes[0].length){
                thisGenogram.descendancy.push(newEdge);

                // If the marriage did not exist
                if(!found)
                    thisGenogram.marriage.push(mar);
                thisGenogram.updateGraph();
            }

            // MARRIAGE
        }else{
            //TODO: IF HAS MARRIAGE, we have to properlly handle
            //TODO: IF has no marriage, we have to set it to null

            var found = false;
            thisGenogram.marriage.forEach(function(ford, index, theArray) {
                // console.log(d.id)
                // console.log(ford.source.id)

                if(d.id === ford.source.id){
                    theArray[index].target = mouseDownNode;

                    // ford.target = d;
                    found = !found;
                }else if(mouseDownNode.id === ford.source.id){
                    theArray[index].target = d;

                    // ford.target = d;
                    found = !found;
                }
            });


            // Check if we need to set the gen
            if(d.gen === null){
                d.gen = mouseDownNode.gen;
                d.y = d.gen * thisGenogram.genDistance;

            } else if (mouseDownNode.gen === null){
                mouseDownNode.gen = d.gen;
                mouseDownNode.y = mouseDownNode.gen * thisGenogram.genDistance;
            }


            if(!found){
                var newEdge = {source: mouseDownNode, target: d};
                thisGenogram.marriage.push(newEdge);
            }

            thisGenogram.updateGraph();

        }
    } else{
        // we're in the same node
        if (state.justDragged) {
            // dragged, not clicked
            state.justDragged = false;
        } else{
            //TODO: from here on, should be evented
            if (state.selectedEdge){
                thisGenogram.removeSelectFromEdge();
            }
            var prevNode = state.selectedNode;

            // If previous node and not the same
            if (!prevNode || prevNode.id !== d.id){
                thisGenogram.replaceSelectNode(d3node, d);

                // Allow edit
                document.getElementById("edit_button").disabled = false;
                document.getElementById("delete_button").disabled = false;

                // If no previous node
            } else{
                thisGenogram.removeSelectFromNode();

                // Disable edit
                document.getElementById("edit_button").disabled = true;
                document.getElementById("delete_button").disabled = true;

            }
        }

    }
    state.mouseDownNode = null;
    return;

}; // end of circles mouseup

// mousedown on main svg
Genogram.prototype.svgMouseDown = function(){
    this.state.graphMouseDown = true;
};

// mouseup on main svg
Genogram.prototype.svgMouseUp = function(){
    var thisGenogram = this,
        state = thisGenogram.state;

    if (state.justScaleTransGraph) {
        // dragged not clicked
        state.justScaleTransGraph = false;
    } else if (state.shiftNodeDrag){
        // dragged from node
        state.shiftNodeDrag = false;
        thisGenogram.dragLine.classed("hidden", true);
    } else if (state.ctrlNodeDrag){
        // dragged from node
        state.ctrlNodeDrag = false;
        thisGenogram.dragLine.classed("hidden", true);
    }
    state.graphMouseDown = false;
};

// keydown on main svg
Genogram.prototype.svgKeyDown = function() {
    var thisGenogram = this,
        state = thisGenogram.state,
        consts = thisGenogram.consts;
    // make sure repeated key presses don't register for each keydown
    // if(state.lastKeyDown !== -1) return;
};

Genogram.prototype.svgKeyUp = function() {
    this.state.lastKeyDown = -1;
};

// On zoom, scale/translate svg
Genogram.prototype.zoomed = function(){
    this.state.justScaleTransGraph = true;
    d3.select("." + this.consts.graphClass)
        .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
};

// On activate create marriages
Genogram.prototype.activateDrawMarriage = function(){
    var thisGenogram = this;

    if(thisGenogram.state.shiftNodeDrag){
        thisGenogram.state.shiftNodeDrag = false;
    }

    thisGenogram.state.ctrlNodeDrag = true;
};

// On activate create marriages
Genogram.prototype.activateDrawDescendancy = function(){
    var thisGenogram = this;

    if(thisGenogram.state.ctrlNodeDrag){
        thisGenogram.state.ctrlNodeDrag = false;
    }

    thisGenogram.state.shiftNodeDrag = true;
};

// === Auxiliars ===
// =================

// Create abbreviations for each node
Genogram.prototype.createAbrev = function(id){
    if(id < 26){
        return this.consts.abrevList[id];
    }else{
        return this.consts.abrevList[id % 26] + (id % 26).toString();
    }
};

// Create descendancy link
Genogram.prototype.descendancyLine = function(d){
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
Genogram.prototype.marriageLine = function(d){
    return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
};

Genogram.prototype.addElement = function(values) {
    var thisGenogram = this;

    values.id = genogram.idct;
    values.abrev = genogram.createAbrev(genogram.idct);
    genogram.idct++;

    values.gen = null;

    var bb;
    // We have to set the gen of the first element
    if(thisGenogram.elements.length === 0 && values.gen === null) {
        // Initial element spawn
        values.gen = 5;
        bb = thisGenogram.svg[0][0].getBBox();

        values.x = bb.x + bb.width / 2.0;
        values.y = bb.y + bb.height / 2.0;

    } else{
        // Initial element spawn
        bb = thisGenogram.svgG[0][0].getBBox();
        values.x = bb.x + bb.width + 20;
        values.y = bb.y + bb.height + 20;
    }

    thisGenogram.elements.push(values);
    thisGenogram.updateLegend(values);
    thisGenogram.updateGraph();
};

Genogram.prototype.editElement = function(updatedInfo) {
    var thisGenogram = this;

    var d = thisGenogram.state.selectedNode;

    d.name = updatedInfo.name;
    d.gender = updatedInfo.name;

    var newconditions = updatedInfo.conditions;

    // Styles to add
    var to_remove = d.conditions.filter(function(i) {return newconditions.indexOf(i) < 0;});
    var to_add = newconditions.filter(function(i) {return d.conditions.indexOf(i) < 0;});

    var fig = genogram.nodes.filter(function(data){
        return data.id === d.id;
    });

    if(d.gender === 'M'){
        // TODO: Update conditions styles
        for(var k in to_add){

            var cond = newconditions[k];
            fig.append("rect")
                .attr("id", function(d){return "d" + d.id + cond})
                .attr("x", function(d) { return - genogram.consts.nodeRadius; })
                .attr("y", function(d) { return - genogram.consts.nodeRadius; })
                .attr("width", function (d) { return genogram.consts.nodeRadius * 2.0; })
                .attr("height", function (d) { return genogram.consts.nodeRadius * 2.0; })
                .attr("style", "fill: url(#" + cond +"); stroke: #333;stroke-width: 2px;");
        }
    }else{
        // TODO: Update conditions styles
        for(var k in to_add){
            var cond = newconditions[k];
            fig.append('circle')
                .attr("id", function(d){return "d" + d.id + cond})
                .attr("r", String(genogram.consts.nodeRadius))
                .attr("style", "fill: url(#" + cond +"); stroke: #333;stroke-width: 2px;");
        }
    }

    for(var k in to_remove){
        var cond = d.conditions[k];
        document.getElementById("d" + d.id + cond).remove();
    }

    d.conditions = newconditions;

    genogram.updateLegend(undefined, true);
    // genogram.updateGraph(); // Wont update since we did not add anything new
};

Genogram.prototype.removeElement = function(){
    var thisGenogram = this;

    var selectedNode = thisGenogram.state.selectedNode;
    // var selectedEdge = thisGenogram.state.selectedEdge;

    if (selectedNode){
        thisGenogram.elements.splice(thisGenogram.elements.indexOf(selectedNode), 1);
        // thisGenogram.spliceLinksForNode(selectedNode);

        // Remove descending connections
        thisGenogram.removeDescendancy(selectedNode.id);

        // Remove marriage connections
        thisGenogram.removeMarriage(selectedNode.id);

        thisGenogram.state.selectedNode = null;

        document.getElementById("delete_button").disabled = true;
        document.getElementById("edit_button").disabled = true;

        thisGenogram.updateLegend();
        thisGenogram.updateGraph();
    }

    // TODO: Edges are to be removed
    // else if (selectedEdge){
    //     thisGenogram.edges.splice(thisGenogram.edges.indexOf(selectedEdge), 1);
    //     thisGenogram.state.selectedEdge = null;
    //     thisGenogram.updateGraph();
    // }
};

Genogram.prototype.removeMarriage = function(id){
    var thisGenogram = this;

    var idx = [];

    thisGenogram.marriage.forEach(function(d, i){
        if(d.source.id === id || d.target.id === id){
            idx.push(i)
        }
    });

    for (var i = idx.length -1; i >= 0; i--)
        thisGenogram.marriage.splice(idx[i],1);
};

Genogram.prototype.removeDescendancy = function(id){
    var thisGenogram = this;

    var idx = [];

    thisGenogram.descendancy.forEach(function(d, i){
        if(d.source.source.id === id || d.source.target.id === id || d.target.id === id){
            idx.push(i)
        }
    });

    for (var i = idx.length -1; i >= 0; i--)
        thisGenogram.descendancy.splice(idx[i],1);
};


// === Update operations ===
// =========================
Genogram.prototype.updateLegend = function(newEl){
    var thisGenogram = this;

    var fl = document.getElementById('familyLegendBody');

    if(newEl){
        var p = document.createElement('p');
        p.innerHTML = newEl.abrev + ": " + newEl.name;
        fl.append(p)
    }else{
        // TODO: We should just refresh, not reset
        while (fl.hasChildNodes()) {
            fl.removeChild(fl.lastChild);
        }

        thisGenogram.elements.forEach(function(d){
            var p = document.createElement('p');

            p.innerHTML = d.abrev + ": " + d.name;
            fl.append(p)
        });
    }
};

Genogram.prototype.updateGraph = function(){

    var thisGenogram = this,
        consts = thisGenogram.consts,
        state = thisGenogram.state;

    // ==== PROCESS NODES ====
    // =======================
    thisGenogram.nodes = thisGenogram.nodes.data(thisGenogram.elements, function(d){ return d.id;});
    thisGenogram.nodes.attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";});

    // add new nodes
    var newGs= thisGenogram.nodes.enter()
        .append("g");

    newGs.classed(consts.memberGClass, true)
        .attr("id", function(d){return "g" + d.id;})
        .attr("genAxis", function(d){
            if(d.gen !== null){
                //TODO: is this ok?
                d.y = d.gen * thisGenogram.genDistance;
            }

            return d.y;
        })
        .attr("transform", function(d){
            if(d.gen !== null){
                //TODO: is this ok?
                d.y = d.gen * thisGenogram.genDistance;
            }

            return "translate(" + d.x + "," + d.y + ")";
        })
        .on("mouseover", function(d){
            if (state.shiftNodeDrag){
                d3.select(this).classed(consts.connectClass, true);
            }
        })
        .on("mouseout", function(d){
            d3.select(this).classed(consts.connectClass, false);
        })
        .on("mousedown", function(d){
            thisGenogram.circleMouseDown.call(thisGenogram, d3.select(this), d);
        })
        .on("mouseup", function(d){
            thisGenogram.circleMouseUp.call(thisGenogram, d3.select(this), d);
        })
        .call(thisGenogram.drag);

    // Filter woman and set circles
    newGs.filter(function(d, idx, arr){
        return d.gender === 'F';
    }).append("circle")
        .attr("data-legend", function(d) { return d.name})
        .attr("style","fill: #F6FBFF;stroke: #333;stroke-width: 2px;")
        .attr("r", String(consts.nodeRadius));

    // Filter man and set rect's
    newGs.filter(function(d, idx, arr){
        return d.gender === 'M';
    }).append("rect")
        .attr("style","fill: #F6FBFF;stroke: #333;stroke-width: 2px;")
        .attr("x", function(d) { return - consts.nodeRadius; })
        .attr("y", function(d) { return - consts.nodeRadius; })
        .attr("width", function (d) { return consts.nodeRadius * 2.0; })
        .attr("height", function (d) { return consts.nodeRadius * 2.0; });


    for( var k in thisGenogram.conditions){
        const cond = thisGenogram.conditions[k];

        newGs.filter(function(d, idx, arr){
            return d.gender === 'F' && d.conditions.includes(cond);
        }).append('circle')
            .attr("id", function(d){return "d" + d.id + cond})
            .attr("r", String(consts.nodeRadius))
            .attr("style", "fill: url(#" + cond +"); stroke: #333;stroke-width: 2px;");

        // Filter man and set rect's
        newGs.filter(function(d, idx, arr){
            return d.gender === 'M' && d.conditions.includes(cond);
        }).append("rect")
            .attr("id", function(d){return "d" + d.id + cond})
            .attr("x", function(d) { return - consts.nodeRadius; })
            .attr("y", function(d) { return - consts.nodeRadius; })
            .attr("width", function (d) { return consts.nodeRadius * 2.0; })
            .attr("height", function (d) { return consts.nodeRadius * 2.0; })
            .attr("style", "fill: url(#" + cond +"); stroke: #333;stroke-width: 2px;");
    }


    newGs.append("text")
        .attr("dy", consts.nodeRadius * 1.5)
        .attr("dx", consts.nodeRadius * 1.5)
        .html(function(d){ return d.abrev;});

    // remove old nodes
    thisGenogram.nodes.exit().remove();

    // ==== DESCENDANCY PATHS ====
    // ==========================
    thisGenogram.descendancyLinks = thisGenogram.descendancyLinks.data(thisGenogram.descendancy, function(d){
        return String(d.source.id) + "+" + String(d.target.id);
    });

    // update existing descendancyLinks
    var descendancyLinks = thisGenogram.descendancyLinks;
    descendancyLinks
        .classed(consts.selectedClass, function(d){
            return d === state.selectedEdge;
        })
        .attr("d", thisGenogram.descendancyLine);

    // add new descendancyLinks
    descendancyLinks.enter()
        .append("path")
        .classed("link", true)
        .attr("d", thisGenogram.descendancyLine)
        .attr("style", "fill: none;stroke: #333;stroke-width: 2px;cursor: default;")
        .on("mousedown", function(d){
                thisGenogram.pathMouseDown.call(thisGenogram, d3.select(this), d);
            }
        )
        .on("mouseup", function(d){
            state.mouseDownLink = null;
        });

    // remove old links
    descendancyLinks.exit().remove();

    // ***** MARRIAGE LINKS *******
    // ****************************
    thisGenogram.marriageLinks = thisGenogram.marriageLinks.data(thisGenogram.marriage, function(d){
        return String(d.source.id) + "+" + String(d.target.id);
    });

    // update existing marriageLinks
    var marriageLinks = thisGenogram.marriageLinks;
    marriageLinks.classed(consts.selectedClass, function(d){
            return d === state.selectedEdge;
        })
        .attr("d", thisGenogram.marriageLine);

    // add new paths
    marriageLinks.enter()
        .append("path")
        .classed("link", true)
        .attr("d", thisGenogram.marriageLine)
        .attr("style", " fill: none;stroke: #333;stroke-width: 2px;cursor: default;")
        .on("mousedown", function(d){
                thisGenogram.pathMouseDown.call(thisGenogram, d3.select(this), d);
            }
        )
        .on("mouseup", function(d){
            state.mouseDownLink = null;
        });

    // remove old links
    marriageLinks.exit().remove();
};

Genogram.prototype.updateWindow = function(x, y){
    this.svg.attr("width", x).attr("height", y);
};