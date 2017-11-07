const expect = require("chai").expect;
const template = require("../template");

describe("Template", function () {
  describe("Parsing", function () {
    it("Doesn't parse template without field-names", function () {
      var tpl = new template.Template("test");
      expect(tpl.getItems()).to.be.empty;
    });

    it("Parses field-names", function () {
      var tpl = new template.Template("${Name},${Description}");
      expect(tpl.getItems()).to.deep.equal(["Name", "Description"]);
    });
  });

  describe("Rendering", function () {
    it("Renders string from record", function () {
      var tpl = new template.Template("${Name}, ${Description}");
      var record = {
        Name: "test",
        Description: "render test"
      }
      expect(tpl.render(record)).to.be.equal("test, render test");
    });
  });
});