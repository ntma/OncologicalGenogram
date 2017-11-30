/**
 * Base class for a person
 * @param name
 * @param age
 * @param gender
 * @constructor
 */
function Person(name, age, gender){
    this.name = name;
    this.age = age;
    this.gender = gender;
}

/**
 * To Json
 * @returns {{name: *, age: *, gender: *}}
 */
Person.prototype.toJson = function(){
    return {
        name: this.name,
        age: this.age,
        gender: this.gender
    };
};

/**
 * From Json
 * @param person - json object
 */
Person.prototype.fromJson = function(person){
    this.name = person.name;
    this.age = person.age;
    this.gender = person.gender;
};


Person.prototype.getName = function(){
    return this.name;
};

Person.prototype.getAge = function(){
    return this.age;
};

Person.prototype.getGender = function(){
    return this.gender;
};


Person.prototype.setName = function(name){
    this.name = name;
};

Person.prototype.setAge = function(age){
    this.age = age;
};

Person.prototype.setGender = function(gender){
    this.gender = gender;
};