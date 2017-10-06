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

function flatMappingToInfuxFieldShema(mapping) {
  var res = {};
  var namesMapping = {};
  for(var k in mapping.fieldShema) {
    if(k === mapping.timestamp) {
      res['time'] = 'timestamp';
    } else {
      var distName = k;
      if(typeof mapping.fieldShema[k] === 'string') {
        res[k] = mapping.fieldShema[k];
      } else {
        if(mapping.fieldShema[k].type === undefined) {
          console.error('mapping.fieldShema[' + k + '].type is undefined');
          process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
        }
        if(mapping.fieldShema[k].name !== undefined) {
          distName = mapping.fieldShema[k].name;
        }
        res[distName] = mapping.fieldShema[k].type;
      }
      namesMapping[k] = distName;
    }
  }
  return {
    fieldShema: res,
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
    console.log('Shema: ' + this.config.measurmentName);

    const TAG_SCHEMA = {};
    var flatMap = flatMappingToInfuxFieldShema(this.config.mapping);
    this.namesMapping = flatMap.namesMapping;
    client.schema(this.config.measurmentName, flatMap.fieldShema, TAG_SCHEMA, {
      // default is false
      stripUnknown: true,
    });

    this.config.csv.columns = true;
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

    for(var k in this.config.mapping.fieldShema) {
      if(k === this.config.mapping.timestamp) {
        continue;
      }
      fieldObject[this.namesMapping[k]] = parseValue(record[k], this.config.mapping.fieldShema[k]);
    }

    console.log(fieldObject);

    var writer = this.client.write(this.config.measurmentName)
      .tag({
        // TODO: add tags support
      })
      .field(fieldObject)
    
    if(this.config.mapping.timestamp !== undefined) {
      var timeKey = this.config.mapping.timestamp;
      var time = parseValue(record[timeKey], this.config.mapping.fieldShema[timeKey]);
      writer.time(time);
      console.log('time ' + time);
    }
      
    return writer;
  }

}

module.exports = {
  Importer
}