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
        num: {
          from: 'num',
          type: 'integer'
        },
        address: {
          from: '${street}\n${city},${state}\n${zip}',
          type: 'string'
        }
      },
      tagsSchema: {
        method: {
          from: 'method',
          type: '*'
        },
        type: {
          from: 'type',
          type: ['1', '2', '3']
        }
      }
    };

    var record = {
      date: '11/03/2004 03:00:00',
      num: 1,
      street: 'Nevskiy pr.',
      city: 'St. Petersburg',
      state: 'Russia',
      zip: '192121',
      method: 'foo',
      type: '1'
    };
    
    it("Returns empty mappings on undefined", function() {
      var vpr = importer.flatSchema(undefined);
      expect(vpr.schema).to.deep.equal({});
      expect(vpr.namesMapping).to.deep.equal({});
    });

    it("Parses schema", function() {
      var vpr = importer.flatSchema(mapping.fieldSchema);
      expect(vpr.schema).to.deep.equal({
        'num': 'integer',
        'address': 'string'
      });

      vpr = importer.flatSchema(mapping.tagsSchema);
      expect(vpr.schema).to.deep.equal({
        'method': '*',
        'type': ['1', '2', '3']
      });
    });

    it("Merges columns", function() {
      var flatSchema = importer.flatSchema(mapping.fieldSchema);
      var vpr = importer.convertSchemaToObject(flatSchema.schema, flatSchema.namesMapping, record);

      expect(vpr).to.deep.equal({
        'num': 1,
        'address': 'Nevskiy pr.\nSt. Petersburg,Russia\n192121'
      });
    });    

    it("Throws error on field.from undefined", function() {
      var clone = JSON.parse(JSON.stringify(mapping));
      clone.fieldSchema.num.from = undefined;
      expect(() =>
        importer.flatSchema(clone.fieldSchema)
      ).to.throw('mapping.fieldSchema[num].from is undefined');
    });

    it("Throws error on field.type undefined", function () {
      var clone = JSON.parse(JSON.stringify(mapping));
      clone.fieldSchema.num.type = undefined;
      expect(() =>
        importer.flatSchema(clone.fieldSchema)
      ).to.throw('mapping.fieldSchema[num].type is undefined');
    });
  });
});
