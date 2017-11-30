/**
 * Base class to represent a family
 * @param elements: family members
 * @param marriage: marriage connections
 * @param descendancy: descendancy connections
 * @constructor
 */
function Family(elements, marriage, descendancy){
    this.elements = elements || [];
    this.marriage = marriage || [];
    this.descendancy = descendancy || [];
}


Family.prototype.clear = function(){
    this.elements = [];
    this.marriage = [];
    this.descendancy = [];
};

//*****************************************
//*********** Family Members **************
//*****************************************

Family.prototype.addElement = function(elem){
    this.elements.push(elem);
};

Family.prototype.removeElement = function(elem){
    // Remove the element
    this.elements.splice(this.elements.indexOf(elem), 1);

    // Remove descending connections
    this.removeDescendancy(elem.id);

    // Remove marriage connections
    this.removeMarriage(elem.id);
};

Family.prototype.searchElement = function(id){
    //TODO: searh element
};

//*****************************************
//************** Marriage *****************
//*****************************************
Family.prototype.addMarriage = function(source, target){

    if(this.validateMarriage(source, target)){
        var mar;

        if((mar = this.searchMarriage(source.getId()))) {
            source.setMarried(true);
            target.setMarried(true);

            target.setGen(source.getGen());

            mar.target = target;
        } else if((mar = this.searchMarriage(target.getId()))){
            source.setMarried(true);
            target.setMarried(true);

            source.setGen(target.getGen());

            mar.source = source;
        } else {
            mar = new Relationship();

            source.setMarried(true);

            if(target){
                target.setMarried(true);

                if(target.getGen() === null){
                    target.setGen(source.getGen());
                } else if (source.getGen() === null){
                    source.setGen(target.getGen());
                }

                mar.setTarget(target);
            }

            mar.setSource(source);

            this.marriage.push(mar);
        }
    }
};

Family.prototype.removeMarriage = function(id){

    var idx = [];

    var me = this;

    this.marriage.forEach(function(d, i){

        if(d.source.getId() === id || d.target.getId() === id){
            idx.push(i);

            d.source.setMarried(false);
            d.target.setMarried(false);
        }
    });

    for (var i = idx.length -1; i >= 0; i--) {
        this.marriage.splice(idx[i], 1);
    }
};

Family.prototype.splitMarriage = function(){
  //TODO: split marriage
};

Family.prototype.validateMarriage = function(source, target){

    // If source is null or is married
    if(!source || source.getMarried()){
        console.log("[Validation] Source null or married")
        return false;
    }

    // If target not null and is married
    if(target && target.getMarried()){
        console.log("[Validation] target married");
        return false;
    }

    var gensource = source.getGen();
    var gentarget = target.getGen();

    if(gensource && gentarget && gentarget !== gensource){
        console.log("[Validation] Can't marry while belonging to distinct generations")
        return false;
    }

    return true;
};

Family.prototype.searchMarriage = function(id){
    var found = null;

    this.marriage.some(function(elem, index, arr){
        if(elem.source.getId() === id || elem.target.getId() === id){
            found = elem;

            return true;
        }
    });

    return found;
};

//*****************************************
//************** Descendancy **************
//*****************************************
Family.prototype.addDescendancy = function(source, target){

    if(this.validateDescendancy(source, target)){
        var newMarriage = this.searchMarriage(source.getId());

        // Create one if we did not find any
        if(!newMarriage){
            newMarriage = new Relationship(source, source); //TODO: the second should be null

            this.marriage.push(newMarriage);
        }

        var newDescendancy = new Relationship();

        // Check if we need to set the gen
        if(target.gen === null){
            target.setGen(source.gen + 1);
        } else if (source.gen === null){
            source.setGen(target.gen - 1);
        }

        newDescendancy.setSource(newMarriage);
        newDescendancy.setTarget(target);

        this.descendancy.push(newDescendancy);
    }
};

Family.prototype.removeDescendancy = function(id){
    var idx = [];

    this.descendancy.forEach(function(d, i){
        if(d.source.source.id === id || d.source.target.id === id || d.target.id === id){
            idx.push(i)
        }
    });

    for (var i = idx.length -1; i >= 0; i--){
        this.descendancy.splice(idx[i],1);
    }
};

Family.prototype.splitDescendancy = function(){
    //TODO: this
};

Family.prototype.validateDescendancy = function(source, target){

    // If null
    if(!source || !target) {
        console.log("[Validate] Source/Target are null");
        return false;
    }

    var sourcegen = source.getGen();
    var targetgen = target.getGen();

    // If they are not an adjacent generation
    if(sourcegen && targetgen && Math.abs(sourcegen - targetgen) > 1){
        console.log("[Validate] Source/Target are not in an adjacent generation");
        return false;
    }

    // TODO: [BUG] Account for duplicate descendancies
    // TODO: the missing conditions

    return true;
};

Family.prototype.searchDescendancy = function(id){

    var found = null;

    //TODO: search descendancy

    return found;
};


/***********************************/
/************** GETTERS ************/
/***********************************/
Family.prototype.getCountElements = function(){
    return this.elements.length;
};

Family.prototype.getElements = function(){
    return this.elements;
};

Family.prototype.getMarriage = function(){
    return this.marriage;
};

Family.prototype.getDescendancy = function(){
    return this.descendancy;
};

/***********************************/
/************** SETTERS ************/
/***********************************/
Family.prototype.setElements = function(elements){
    this.elements = elements;
};

Family.prototype.setMarriage = function(marriage){
    this.marriage = marriage;
};

Family.prototype.setDescendancy = function(descendancy){
    this.descendancy = descendancy;
};

//*****************************************
//************** JSON IO ******************
//*****************************************
Family.prototype.fromJson = function(json){

    var jsonElements = json.nodes,
        jsonMarriage = json.marriage,
        jsonDescendancy = json.descendancy,
        newElements = [],
        newMarriage = [],
        newDescendancy = [];

    // Set the nodes
    jsonElements.forEach(function(elem){

        var gm = new FamilyMember();
        gm.fromJson(elem);

        newElements.push(gm);
    });


    // Set the marriage links
    jsonMarriage.forEach(function(e, i){
        var source = newElements.filter(function(n){return n.getId() === e.source;})[0];
        var target = newElements.filter(function(n){return n.getId() === e.target;})[0];

        source.setMarried(true);
        target.setMarried(true);

        newMarriage.push(new Relationship(source,target));
    });

    // Set the descendancy links
    json.descendancy.forEach(function(e, i){
        newDescendancy.push(
            new Relationship(
                newMarriage.filter(function(n){return n.source.id === e.source.source && n.target.id === e.source.target;})[0],
                newElements.filter(function(n){return n.getId() === e.target;})[0]
            )
        );
    });

    // TODO: we should set here who is married
    this.elements = newElements;
    this.marriage = newMarriage;
    this.descendancy = newDescendancy;
};

Family.prototype.toJson = function(){

    var jsonNodes = [];
    var jsonDescendancy = [];
    var jsonMarriage = [];

    this.elements.forEach(function(elem){
        jsonNodes.push(elem.toJson());
    });

    this.marriage.forEach(function(val, i){
        // Element <-> Element
        jsonMarriage.push({
            source: val.source.id,
            target: val.target.id
        });
    });

    this.descendancy.forEach(function(val, i){
        // Marriage <-> Element
        jsonDescendancy.push({
            source: {
                source: val.source.source.id,
                target: val.source.target.id
            },
            target: val.target.id
        });
    });

    return {
        nodes: jsonNodes,
        descendancy: jsonDescendancy,
        marriage: jsonMarriage
    };
};