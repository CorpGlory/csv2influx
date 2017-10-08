const errors = require('./errors');
const Influx = require('influxdb-nodejs');
const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');


function parseValue(recordValue, mappingObject) {
  if(mappingObject.type === 'timestamp') {
    if(mappingObject.format === 'jsDate') {
      // convert millisconds to nanoseconds
      return (new Date(recordValue).getTime()) * 1000 * 1000;
    }
  }
  return recordValue;
}

function flatMappingToInfluxFieldSchema(mapping) {
  var res = {};
  var namesMapping = {};
  var schema = mapping.fieldSchema;

  Object.keys(schema).forEach(key => {
    if(schema[key].type === undefined) {
      console.error('mapping.fieldSchema[' + key + '].type is undefined');
      process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
    }
    if(schema[key].from === undefined) {
      console.error('mapping.fieldSchema[' + key + '].from is undefined');
      process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
    }

    res[key] = schema[key].type;
    namesMapping[key] = schema[key].from;
  });

  return {
    fieldSchema: res,
    namesMapping
  };
}

class Importer {

  constructor(config) {
    this.config = config;
    this.client = undefined;
    this.fieldSchema = undefined;
    this.namesMapping = undefined;
  }

  run(inputFile) {

    if(inputFile === undefined) {
      throw new Error('inputFile is undefined');
    }

    if(!fs.existsSync(inputFile)) {
      console.error(inputFile + ' doesn`t exist. Can`t continue.');
      process.exit(errors.ERROR_BAD_CSV_FILE);
    }

    console.log('Connecting to ' + this.config.influxdbUrl);
    const client = new Influx(this.config.influxdbUrl);
    if(client === undefined) {
      console.error('Can`t connect to ' + this.config.influxdbUrl);
      process.exit(errors.ERROR_CONNECTION_TO_DB);
    }
    this.client = client;
    console.log('Schema: ' + this.config.measurementName);

    const TAG_SCHEMA = {};
    var flatMap = flatMappingToInfluxFieldSchema(this.config.mapping);

    this.fieldSchema = flatMap.fieldSchema;
    this.namesMapping = flatMap.namesMapping;

    client.schema(this.config.measurementName, this.fieldSchema, TAG_SCHEMA, {
      // default is false
      stripUnknown: true,
    });

    // callback for checking columns names in csv
    this.config.csv.columns = (cols) => { 
      Object.keys(this.fieldSchema).forEach(key => {
        // if 'from' field is an array - checking each of them
        if(Array.isArray(this.namesMapping[key])) { 
          this.namesMapping[key].forEach(el => {
            if(cols.indexOf(el) < 0) {
              console.error('Error: there is no column named ' + el + ' in ' + inputFile);
              console.error('column names: ' + cols);
              process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
            } 
          });
        }
        // if key doesn't exist in cols array
        else if(cols.indexOf(this.namesMapping[key]) < 0) {
            console.error('Error: there is no column named ' + this.namesMapping[key] + ' in ' + inputFile);
            console.error('column names: ' + cols);
            process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
          } 
      });

      // callback should return list of columns' names
      return cols; 
    };

    var parser = parse(this.config.csv);
    var input = fs.createReadStream(inputFile);

    console.log('Importing');
    
    var transformer = transform((record, callback) => {
      // TODO: add filter
      this.writeRecordToInflux(record)
        .then(() => callback(null, ''))
        .catch(err => {
          console.error(err);
          console.error(JSON.stringify(err, null, 2));
          process.exit(errors.ERROR_BAD_WRITE);
        });
    }, { parallel: 1 });

    input
      .pipe(parser)
      .pipe(transformer)
      .pipe(process.stdout);
  }

  writeRecordToInflux(record) {

    var fieldObject = {
    };

    var time;
    var schema = this.fieldSchema;

    Object.keys(schema).forEach(key => {
      if(schema[key] === 'timestamp') {
        if(Array.isArray(this.namesMapping[key])) {
          var timestamp = [];
          this.namesMapping[key].forEach(
            el => timestamp.push(record[el])
          );

          time = parseValue(timestamp, this.config.mapping.fieldSchema[key]);
        }
        else {
          time = parseValue(record[this.namesMapping[key]], this.config.mapping.fieldSchema[key]);
        }
      }
      else {
        fieldObject[key] = parseValue(record[this.namesMapping[key]], this.config.mapping.fieldSchema[key]);
      }
    });

    console.log(fieldObject);

    var writer = this.client.write(this.config.measurementName)
      .tag({
        // TODO: add tags support
      })
      .field(fieldObject)

    console.log('time: ' + time);
    writer.time(time);
      
    return writer;
  }

}

module.exports = {
  Importer
}