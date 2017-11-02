const expect = require("chai").expect;
const importer = require("../importer");

describe("Importer", function() {
  describe("parseValue", function() {
    it("Parses datetes to nanoseconds", function() {
      var parsedValue = importer.parseValue(
        '09/24/2013 17:11:00', { type: "timestamp", format: "jsDate" }
      );
      expect(parsedValue).to.equal(1380031860000000000);
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
      expect(vpr.schema).to.deep.equal({});
      expect(vpr.namesMapping).to.deep.equal({});
    });

    it("Parses fieldSchema", function() {
      var vpr = importer.flatSchema(mapping.fieldSchema);
      expect(vpr.schema).to.deep.equal({
        'date': 'timestamp'
      });
    });
    
    it("Parses tagsSchema", function() {
      var vpr = importer.flatSchema(mapping.tagsSchema);
      expect(vpr.schema).to.deep.equal({
        'name': 'string'
      });
    });

    // TODO: write test
    
  });
});