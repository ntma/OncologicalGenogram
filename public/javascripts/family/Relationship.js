
function Relationship(source, target){
    this.source = source;
    this.target = target;
}

Relationship.prototype.getSource = function(){
    return this.source;
};

Relationship.prototype.getTarget = function(){
    return this.target;
};

Relationship.prototype.setSource = function(source){
    this.source = source;
};

Relationship.prototype.setTarget = function(target){
    this.target = target;
};
