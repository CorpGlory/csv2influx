const errors = require('./errors');
const template = require('./template');
const Influx = require('influxdb-nodejs');
const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');


function parseValue(recordValue, mappingObject) {
  if(mappingObject.format === 'jsDate') {
    // convert millisconds to nanoseconds
    return (new Date(recordValue).getTime()) * 1000 * 1000;
  }

  return recordValue;
}

function flatSchema(schema) {
  var flatSchema = {};
  var namesMapping = {};
  for(var key in schema) {
    if(schema[key].type === undefined) {
      throw new Error('mapping.fieldSchema[' + key + '].type is undefined');
    }
    if(schema[key].from === undefined) {
      throw new Error('mapping.fieldSchema[' + key + '].from is undefined');
    }
    flatSchema[key] = schema[key].type;
    namesMapping[key] = schema[key].from;
  }
  return {
    schema: flatSchema,
    namesMapping: namesMapping
  }
}

function countFileLines(filePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    let i = 0;
    fs.createReadStream(filePath)
      .on("data", (buffer) => {
        for(i = 0; i < buffer.length; ++i) {
          if(buffer[i] == 10) {
            lineCount++;
          }
        }
      })
      .on("end", () => {
      resolve(lineCount);
    }).on("error", reject);
  });
}

function convertSchemaToObject(schema, namesMapping, record) {
  var obj = {};

  for(var key in schema) {
    var tpl = new template.Template(namesMapping[key]);

    var items = tpl.getItems();
    if(items.length > 0) {
      obj[key] = tpl.render(record);
    }
    else {
      obj[key] = record[namesMapping[key]];
    }
  }

  return obj;
}

class Importer {

  constructor(config, inputFile, progressBar) {
    this.config = config;
    this.inputFile = inputFile;
    this.progressBar = progressBar;
    this.isQuiteMode = (progressBar)? true: false;
    this.client = undefined;
    this.fieldSchema = undefined;
    this.tagSchema = undefined;
    this.fieldsNamesMapping = undefined;
    this.tagsNamesMapping = undefined;
  }

  run() {
    return this._import();
  }
  
  _import() {
    return new Promise((resolve, reject) => {
      console.log('Connecting to ' + this.config.influxdbUrl);
      const client = new Influx(this.config.influxdbUrl);
      if(client === undefined) {
        throw new Error('Can`t connect to ' + this.config.influxdbUrl);
      }
      this.client = client;
      console.log('Schema: ' + this.config.measurementName);

      var fieldsFlatMap = flatSchema(this.config.mapping.fieldSchema);
      var tagsFlatMap = flatSchema(this.config.mapping.tagSchema);

      this.timeObject = this.config.mapping.time;
      this.fieldSchema = fieldsFlatMap.schema;
      this.fieldsNamesMapping = fieldsFlatMap.namesMapping;
      this.tagSchema = tagsFlatMap.schema;
      this.tagsNamesMapping = tagsFlatMap.namesMapping;

      client.schema(this.config.measurementName, this.fieldSchema, this.tagSchema, {
        // default is false
        stripUnknown: true,
      });

      // callback for checking columns names in csv

    this.config.csv.columns = (cols) => {
      for(var key in this.fieldSchema) {
        // if 'from' field is an array - checking each of array items
        if(Array.isArray(this.fieldsNamesMapping[key])) {
          this.fieldsNamesMapping[key].forEach(el => this._checkColInCols(el, cols));
        } else {
          var tpl = new template.Template(this.fieldsNamesMapping[key]);
          var items = tpl.getItems();
          if(items.length > 0) {
            items.forEach(
              (item) => this._checkColInCols(item, cols)
            );
          } else {
            this._checkColInCols(this.fieldsNamesMapping[key], cols);
          }
        }

        // callback should return list of columns' names
        return cols;
      };

      var parser = parse(this.config.csv);
      var input = fs.createReadStream(this.inputFile);

      console.log('Importing');
      var num = 0;

      var transformer = transform((record, callback) => {
        num++;
        // TODO: add filter
        this._writeRecordToInflux(record)
          .then(() => {
            if(this.isQuiteMode) {
              this.progressBar.tick();
            }

            callback(null);
          })
          .catch(err => {
            var errMessage = `${num} BAD_WRITE\n` +
              `${JSON.stringify(record, null, 2)}\n` +
              `${err}\n` +
              `${JSON.stringify(err, null, 2)}`;

            reject(errMessage);
          });
      }, { parallel: 1 });

      input
        .pipe(parser)
        .on('error', (err) => reject(err.message))
        .pipe(transformer)
        .pipe(process.stdout);
    });
  }

  _writeRecordToInflux(record) {

    var fieldObject = convertSchemaToObject(this.fieldSchema, this.fieldsNamesMapping, record);
    var tagObject = convertSchemaToObject(this.tagSchema, this.tagsNamesMapping, record);

    var time = undefined;

    if(Array.isArray(this.timeObject.from)) {
      var timestamp = [];
      this.timeObject['from'].forEach(
        el => timestamp.push(record[el])
      );
      time = parseValue(timestamp, this.timeObject);
    } else {
      time = parseValue(record[this.timeObject.from], this.timeObject);
    }

    var writer = this.client.write(this.config.measurementName)
      .tag(tagObject)
      .field(fieldObject)

    if(!this.isQuiteMode) {
      console.log('Fields: ' + JSON.stringify(fieldObject));
      console.log('Tags: ' + JSON.stringify(tagObject));
      console.log('Time: ' + time);
    }

    writer.time(time);

    return writer;
  }

  _checkColInCols(col, cols) {
    if(cols.indexOf(col) < 0) {
      // if key doesn't exist in cols array
      var errMessage = `there is no column named "${col}" in ${this.inputFile}\n`;
      errMessage += `column names (current delimiter: "${this.config.csv.delimiter}"):\n`;
      cols.forEach((el, idx) => errMessage += (idx+1) + ': ' + el + '\n');
      throw new Error(errMessage);
    }
  }
}

module.exports = {
  Importer,
  countFileLines,
  
  // for testing
  parseValue,
  flatSchema,
  convertSchemaToObject

}