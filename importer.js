const errors = require('./errors');
const Influx = require('influxdb-nodejs');
const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');

class Importer {

  constructor(config) {
    this.config = config;
    this.client = undefined;
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
    console.log('Shema: ' + this.config.shemaName);

    const TAG_SCHEMA = {};
    client.schema(this.config.shemaName, this.config.influxdbUrl, TAG_SCHEMA, {
      // default is false
      stripUnknown: true,
    });

    var parser = parse(this.config.csv);
    var input = fs.createReadStream(inputFile);

    var transformer = transform((record, callback) => {
      // TODO: ignore first line
      // TODO: collect csv header
      // TODO: add filter
      this.writeRecordToInflux(record)
        .then(() => callback(null, ' -> ' + record[1] + '\n'))
        .catch((err) => console.log(err));
    }, { parallel: 10 });

    input
      .pipe(parser)
      .pipe(transformer)
      .pipe(process.stdout);
  }

  writeRecordToInflux(record) {
    var fieldObject = {

    };

    return this.client.write(this.config.shemaName)
      .tag({
        // TODO: add tags support
      })
      .field(fieldObject);
  }

}

module.exports = {
  Importer
}