/**
 * Class to control the genogram legend
 * @param svg: html svg container
 * @constructor
 */
function GenogramLegend(svg){

    this.lgy = 0;    // Legend x
    this.lgx = 0;    // Legend y
    this.lgw = 200;  // Legend width
    this.lgh = 100;  // Legend height
    this.lgs = 1;    // Legend spacing
    this.lgws = 20;  // Legend word size

    var container = svg.append('foreignObject')
        .attr("x", 5)
        .attr("y", 5)
        .attr("width", this.lgw)
        .attr("height", "100%");

    var legend = container.append('xhtml:div')
        .style("position", "relative")
        .style("margin-bottom", "0.5em")
        .style("margin-left", "1.0em")
        .style("border", "2px solid #EEEEEE")
        .style("border-radius", "5px")
        .style("padding", "1em")
        .style("z-index", "5")
        .style("fill", "#F6FBFF")
        .attr("id", "familyLegend");

    var header = legend.append('legend')
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .html("Family Members:");

    var innerLegend = legend.append("div")
        .attr("id", "familyLegendBody");

    this.header = header;
    this.separator = null;
    this.legend = innerLegend[0][0];
}


GenogramLegend.prototype.updateLegend = function(elements, newEl){

    var fl = this.legend;

    if(!this.separator){
        this.separator = this.header.append("hr");
    } else if(elements.length === 0){
        this.separator.remove();
        this.separator = null;
    }

    if(newEl){
        var p = document.createElement('p');
        p.innerHTML = newEl.abrev + ": " + newEl.name;
        fl.append(p)
    }else{
        // TODO: We should just refresh, not reset
        while (fl.hasChildNodes()) {
            fl.removeChild(fl.lastChild);
        }

        elements.forEach(function(elem){
            var p = document.createElement('p');

            p.innerHTML = elem.abrev + ": " + elem.name;
            fl.append(p)
        });
    }
};
