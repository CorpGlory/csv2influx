const errors = require('./errors');
const Influx = require('influxdb-nodejs');
const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');
const ProgressBar = require('progress');


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
      console.error('mapping.fieldSchema[' + key + '].type is undefined');
      process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
    }
    if(schema[key].from === undefined) {
      console.error('mapping.fieldSchema[' + key + '].from is undefined');
      process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
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
    }).on("end", () => {
      resolve(lineCount);
    }).on("error", reject);
  });
};

class Importer {

  constructor(config) {
    this.config = config;
    this.client = undefined;
    this.fieldSchema = undefined;
    this.tagSchema = undefined;
    this.fieldsNamesMapping = undefined;
    this.tagsNamesMapping = undefined;
    this.isQuiteMode = false;
    this.progressBar = undefined;
  }

  // TODO: it's better to move these params to constructor
  //       and invode run without params
  run(inputFile, isQuiteMode) {
    if(inputFile === undefined) {
      throw new Error('inputFile is undefined');
    }
    
    if(!fs.existsSync(inputFile)) {
      console.error(inputFile + ' doesn`t exist. Can`t continue.');
      process.exit(errors.ERROR_BAD_CSV_FILE);
    }
    
    this.inputFile = inputFile;
    this.isQuiteMode = isQuiteMode;
    if(isQuiteMode) {
      return countFileLines(this.inputFile)
        .then(linesCount => {
          this.linesCount = linesCount;
          return this._import();
        })
    } else {
      // TODO: use reject when errors
      // TODO: no more prosess.exit in this file
      return new Promise((resolve, reject) => {
        this._import();
        resolve();
      });
    }
  }
  
  _import() {
  
    if(this.isQuiteMode) {
      console.log('lines count:' + this.linesCount);
      this.progressBar = new ProgressBar(':current: % :bar ', { width: 100, total: this.linesCount });
    }

    console.log('Connecting to ' + this.config.influxdbUrl);
    const client = new Influx(this.config.influxdbUrl);
    if(client === undefined) {
      console.error('Can`t connect to ' + this.config.influxdbUrl);
      process.exit(errors.ERROR_CONNECTION_TO_DB);
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
          this._checkColInCols(this.fieldsNamesMapping[key], cols);
        }
      };

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
          callback(null, '');
        })
        .catch(err => {
          console.error('\n [' + num + '] BAD_WRITE');
          console.error(record);
          console.error(err);
          console.error(JSON.stringify(err, null, 2));
          if(this.isQuiteMode) {
            this.progressBar.tick();
          }
          //process.exit(errors.ERROR_BAD_WRITE);
          callback(null, '');
        });
    }, { parallel: 1 });

    input
      .pipe(parser)
      .pipe(transformer)
      .pipe(process.stdout);
  }

  _writeRecordToInflux(record) {

    var fieldObject = {};
    var tagObject = {};

    var fieldSchema = this.fieldSchema;

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

    for(var key in fieldSchema) {
        fieldObject[key] = record[this.fieldsNamesMapping[key]];
    }

    var writer = this.client.write(this.config.measurementName)
      .tag(tagObject)
      .field(fieldObject)

    if(!this.isQuiteMode) {
      console.log(fieldObject);
      console.log('time: ' + time);
    }

    writer.time(time);

    return writer;
  }

  _checkColInCols(col, cols) {
    if(cols.indexOf(col) < 0) {
      // if key doesn't exist in cols array
      console.error('Error: there is no column named ' + col + ' in ' + this.inputFile);
      console.error('column names (current delimiter: "' + this.config.csv.delimiter + '"):');
      cols.forEach((el, idx) => console.error((idx+1) + ': ' + el));
      process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
    }
  }

}

module.exports = {
  Importer,
  
  // for testing
  parseValue,
  flatSchema
}