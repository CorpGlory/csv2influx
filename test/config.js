const expect = require("chai").expect;
const config = require("../config");

describe("Config", function() {
  describe("Required fields", function() {
    
    var configObj = {
      "measurementName": "events",
      "influxdbUrl": "http://127.0.0.1:8086/traffic_violations",
      "mapping": {
        "time": {
          "from": ["Date Of Stop", "Time Of Stop"],
          "type": "timestamp",
          "format": "jsDate"
        },
        "fieldSchema": {
          "description": {
            "from": "Description",
            "type": "string"
          }
        },
        "tagSchema": {
          "agency": {
            "from": "Agency",
            "type": "*"
          }
        }
      },
      "csv": {
        "delimiter": ","
      }
    };

    it("Returns error when measurementName undefined", function() {
      var clone = copyObjectDeep(configObj);
      delete clone.measurementName;

      var vpr = config._checkConfigObject(clone);

      expect(vpr).to.be.equal("no measurementName field");
    });

    it("Returns error when influxdbUrl undefined", function () {
      var clone = copyObjectDeep(configObj);
      delete clone.influxdbUrl;

      var vpr = config._checkConfigObject(clone);

      expect(vpr).to.be.equal("no influxdbUri field");
    });

    it("Returns error when mapping undefined", function () {
      var clone = copyObjectDeep(configObj);
      delete clone.mapping;

      var vpr = config._checkConfigObject(clone);

      expect(vpr).to.be.equal("no mapping field");
    });

    it("Returns error when mapping.time.format undefined", function () {
      var clone = copyObjectDeep(configObj);
      clone.mapping.time.format = undefined;

      var vpr = config._checkConfigObject(clone);

      expect(vpr).to.be.equal("no format specified for time");
    });

    it("Returns error when fieldSchema undefined", function () {
      var clone = copyObjectDeep(configObj);
      clone.mapping.fieldSchema = undefined;

      var vpr = config._checkConfigObject(clone);

      expect(vpr).to.be.equal("no fieldSchema specified");
    });

    it("Can use influxdbUri insdead of influxdbUrl", function () {
      var clone = copyObjectDeep(configObj);
      clone.influxdbUri = clone.influxdbUrl;
      delete clone.influxdbUrl;

      var vpr = config._checkConfigObject(clone);

      expect(vpr).to.be.undefined;
    });
  });
});

function copyObjectDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}
