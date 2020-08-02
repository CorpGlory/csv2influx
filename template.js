class Template {
  constructor(str) {
    this.str = str;
    this.re = /\${(.+?)}/g;
    var match = undefined;
    this.items = [];
    while((match = this.re.exec(this.str)) !== null) {
      this.items.push(match[1]);
    }
  }

  getItems() {
    return this.items;
  }

  render(record) {
    return this.str.replace(this.re, function(match, capture) {
      return record[capture];
    });
  }
}

module.exports = {
  Template
}
