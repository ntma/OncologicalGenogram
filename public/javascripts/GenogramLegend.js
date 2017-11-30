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
        .attr("id", "familyLegend")
        .attr("style", "position: relative;margin-bottom: 0.5em;margin-left: 1em;border: 2px solid #EEEEEE;border-radius: 5px;padding: 1em;z-index: 5;fill: #F6FBFF;");

    var header = legend.append('legend')
        .attr("style", "font-size:15px;font-weight: bold;")
        .html("Family Members:")
        .append("hr");

    var innerLegend = legend.append("div")
        .attr("id", "familyLegendBody");

    this.legend = innerLegend[0][0];
}


GenogramLegend.prototype.updateLegend = function(elements, newEl){

    var fl = this.legend;//document.getElementById('familyLegendBody');

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
