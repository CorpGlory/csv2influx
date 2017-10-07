const errors = require('./errors');
const Influx = require('influxdb-nodejs');
const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');


function parseValue(recordValue, mappingObject) {
  if(mappingObject.format === 'jsDate') {
    // convert millisconds to nanoseconds
    return (new Date(recordValue)).getTime() * 1000 * 1000;
  }
  return recordValue;
}

function flatMappingToInfuxFieldSchema(mapping) {
  var res = {};
  var namesMapping = {};
  for(var k in mapping.fieldSchema) {
    if(k === mapping.timestamp) {
      res['time'] = 'timestamp';
    } else {
      var distName = k;
      if(typeof mapping.fieldSchema[k] === 'string') {
        res[k] = mapping.fieldSchema[k];
      } else {
        if(mapping.fieldSchema[k].type === undefined) {
          console.error('mapping.fieldSchema[' + k + '].type is undefined');
          process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
        }
        if(mapping.fieldSchema[k].name !== undefined) {
          distName = mapping.fieldSchema[k].name;
        }
        res[distName] = mapping.fieldSchema[k].type;
      }
      namesMapping[k] = distName;
    }
  }
  return {
    fieldSchema: res,
    namesMapping
  };
}

class Importer {

  constructor(config) {
    this.config = config;
    this.client = undefined;
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
    var flatMap = flatMappingToInfuxFieldSchema(this.config.mapping);
    this.namesMapping = flatMap.namesMapping;
    client.schema(this.config.measurementName, flatMap.fieldSchema, TAG_SCHEMA, {
      // default is false
      stripUnknown: true,
    });

    this.config.csv.columns = (cols) => { // callback for checking columns names in csv
      Object.keys(this.config.mapping.fieldSchema).forEach((key) => {
        if (cols.indexOf(key) < 0) // if key doesn't exist in cols array
        {
          console.error('Error: there is no column named ' + key + ' in ' + inputFile);
          console.error('column names: ' + cols);
          process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
        }
      });

      return cols; // callback should return list of columns' names
    };

    var parser = parse(this.config.csv);
    var input = fs.createReadStream(inputFile);

    console.log('Importing');
    
    var transformer = transform((record, callback) => {
      // TODO: add filter
      this.writeRecordToInflux(record)
        .then(() => callback(null, '.'))
        .catch((err) => {
          console.log(err);
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

    for(var k in this.config.mapping.fieldSchema) {
      if(k === this.config.mapping.timestamp) {
        continue;
      }
      fieldObject[this.namesMapping[k]] = parseValue(record[k], this.config.mapping.fieldSchema[k]);
    }

    console.log(fieldObject);

    var writer = this.client.write(this.config.measurementName)
      .tag({
        // TODO: add tags support
      })
      .field(fieldObject)
    
    if(this.config.mapping.timestamp !== undefined) {
      var timeKey = this.config.mapping.timestamp;
      var time = parseValue(record[timeKey], this.config.mapping.fieldSchema[timeKey]);
      writer.time(time);
      console.log('time ' + time);
    }
      
    return writer;
  }

}

module.exports = {
  Importer
}