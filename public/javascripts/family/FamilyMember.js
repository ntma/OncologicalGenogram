/**
 * Base class for genogram members
 * @param name
 * @param age
 * @param gender
 * @param abrev
 * @param gen
 * @param conditions
 * @param x
 * @param y
 * @constructor
 */
function FamilyMember(name, age, gender, abrev, gen, conditions, x, y){

    this.abrev = abrev;
    this.gen   = gen;
    this.conditions = conditions || [];
    this.x = x;
    this.y = y;
    this.id = guid();

    this.married = false;

    Person.call(this, name, age, gender);
}

// Inherits Person
FamilyMember.prototype = Object.create(Person.prototype);

/**
 * To json
 * @returns {*}
 */
FamilyMember.prototype.toJson = function(){

    var json = Person.prototype.toJson.call(this);

    json["id"] = this.id;
    json["abrev"] = this.abrev;
    json["gen"] = this.gen;
    json["conditions"] = this.conditions;
    json["x"] = this.x;
    json["y"] = this.y;

    return json;
};

/**
 * From json
 * @param member - json object
 */
FamilyMember.prototype.fromJson = function(member){

    Person.prototype.fromJson.call(this, member);

    this.id = (member.id !== undefined) ? member.id : guid();
    this.abrev = member.abrev || null;
    this.gen = member.gen || null;
    this.conditions = member.conditions || [];
    this.x = member.x || null;
    this.y = member.y || null;
};


/****************************/
/********* Getters **********/
/****************************/
FamilyMember.prototype.getId = function(){
    return this.id;
};

FamilyMember.prototype.getAbrev = function(){
    return this.abrev;
};

FamilyMember.prototype.getGen = function(){
    return this.gen;
};

FamilyMember.prototype.getConditions = function(){
    return this.conditions;
};

FamilyMember.prototype.getX = function(){
    return this.x;
};

FamilyMember.prototype.getY = function(){
    return this.y;
};

FamilyMember.prototype.getMarried = function(){
    return this.married;
};

/****************************/
/********* Setters **********/
/****************************/
FamilyMember.prototype.setId = function(id){
    this.id = id;
};

FamilyMember.prototype.setAbrev = function(abrev){
    this.abrev = abrev;
};

FamilyMember.prototype.setGen = function(gen){
    this.gen = gen;
};

FamilyMember.prototype.setConditions = function(conditions){
    this.conditions = conditions;
};

FamilyMember.prototype.setX = function(x){
    this.x = x;
};

FamilyMember.prototype.setY = function(y){
    this.y = y;
};

FamilyMember.prototype.setMarried = function(married){
    this.married = married;
};
