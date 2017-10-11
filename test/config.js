const expect = require("chai").expect;
const config = require("../config");

describe("Config", function() {
  describe("Required fields", function() {
    
    var configObj = {};
    it("Returns errors when required fields undefined", function() {
      
      expect(config._checkConfigObject(configObj))
        .to.not.be.equal(undefined);
      
    });
  });
  
});