const expect = require("chai").expect;
const importer = require("../importer");

describe("Importer", function() {
  describe("parseValue", function() {
    it("Parses date to nanoseconds", function() {
      var parsedValue = importer.parseValue(
        '09/24/2013 17:11:00', { type: "timestamp", format: "jsDate" }
      );
      expect(parsedValue).to.equal(1380031860000000000);
    });
  });
  
  describe("flatSchema", function() {
    var mapping = {
      time: {
        from: 'date',
        type: 'timestamp',
        format: 'jsDate'
      },
      fieldSchema: {
        description: {
          from: 'description',
          type: 'string'
        }
      },
      tagsSchema: {
        name: {
          from: 'name',
          type: '*'
        },
        type: {
          from: 'type',
          type: ['1', '2', '3']
        }
      }
    };
    
    it("Returns empty mappings on undefined", function() {
      var vpr = importer.flatSchema(undefined);
      expect(vpr.schema).to.deep.equal({});
      expect(vpr.namesMapping).to.deep.equal({});
    });

    it("Parses schema", function() {
      var vpr = importer.flatSchema(mapping.fieldSchema);
      expect(vpr.schema).to.deep.equal({
        'description': 'string'
      });

      vpr = importer.flatSchema(mapping.tagsSchema);
      expect(vpr.schema).to.deep.equal({
        'name': '*',
        'type': ['1', '2', '3']
      });
    });

    it("Throws error on field.from undefined", function() {
      var clone = JSON.parse(JSON.stringify(mapping));
      clone.fieldSchema.description.from = undefined;
      expect(() =>
        importer.flatSchema(clone.fieldSchema)
      ).to.throw('mapping.fieldSchema[description].from is undefined');
    });

    it("Throws error on field.type undefined", function () {
      var clone = JSON.parse(JSON.stringify(mapping));
      clone.fieldSchema.description.type = undefined;
      expect(() =>
        importer.flatSchema(clone.fieldSchema)
      ).to.throw('mapping.fieldSchema[description].type is undefined');
    });

  });
});