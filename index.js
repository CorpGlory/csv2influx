/*
  node.js script for importing data from csv file to influxdb
*/

// CONFIG

const SHEMA_NAME = '';
const INPUT_FILE = '';
const INFLUX_DB_URL = '';

const TAG_SCHEMA = {

};

const FIELD_SCHEMA = {
  lat: 'float',
  lng: 'float',
  name: 'string',
  description: 'string',
  location: 'string'
};


// SOURCE

const Influx = require('influxdb-nodejs');
const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');


const client = new Influx(INFLUX_DB_URL);

client.schema(SHEMA_NAME, FIELD_SCHEMA, TAG_SCHEMA, {
  // default is false
  stripUnknown: true,
});

function writeRecordToInflux(lat, lng, name, description, location) {
  return client.write(SHEMA_NAME)
    .tag({

    })
    .field({
      lat: lat,
      lng: lng,
      name: name,
      description: description,
      location: location
    });
}

var parser = parse({ delimiter: ',' });
var input = fs.createReadStream(INPUT_FILE);


var transformer = transform(function(record, callback) {
  if(record[0] !== 'Location') {
    writeRecordToInflux(
      record[3], record[4],
      record[1], record[2], record[0]
    )
    .then(() => callback(null, ' -> ' + record[1] + '\n'))
    .catch((err) => console.log(err));
  } else {
    callback(null,  '...\n');
  }

}, { parallel: 10 });

input
  .pipe(parser)
  .pipe(transformer)
  .pipe(process.stdout);