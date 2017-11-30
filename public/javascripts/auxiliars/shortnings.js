function Shortnings(){
    this.alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

    this.nextId = 0;
}

Shortnings.prototype.nextAlphaNumeric = function(){
    var alphanumeric;

    if(this.nextId < this.alphabet.length){
        alphanumeric = this.alphabet[this.nextId];
    }else{
        alphanumeric = this.alphabet[this.nextId % 26] + (this.nextId % 26).toString();
    }

    this.nextId++;

    return alphanumeric;
};

Shortnings.prototype.setNextId = function(id){
    this.nextId = id;
};

Shortnings.prototype.reset = function(){
    this.nextId = 0;
};
