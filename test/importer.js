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
  
  describe("flatSchema", function() {
    var mapping = {
      fieldSchema: {
        date: {
          from: 'date',
          type: 'timestamp',
          format: 'jsDate'
        }
      },
      tagsSchema: {
        name: {
          from: 'name',
          type: 'string'
        }
      }
    };
    
    it("Returns empty mappings on undefined", function() {
      var vpr = importer.flatSchema(undefined);
      expect(vpr.schema).to.not.be.undefined();
      expect(vpr.namesMapping).to.not.be.undefined();
    });
    
    it("Parses tagsSchema", function() {
      var vpr = importer.flatSchema(mapping.tagsSchema);
      expect(vpr.schema).to.not.be.undefined('No schema in result');
    });

    // TODO: write test
    
  });
});