const expect = require("chai").expect;
const importer = require("../importer");

describe("Importer", function() {
  describe("parseValue", function() {
    it("Parses datetes to nanoseconds", function() {
      var parsedValue = importer.parseValue(
        '09/24/2013 17:11:00', { type: "timestamp", formt: "jsDate" }
      );
      expect(parsedValue).to.not.be.equal(1380031860000000000);
    });
  });
});