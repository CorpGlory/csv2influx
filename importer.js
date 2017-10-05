const Influx = require('influxdb-nodejs');
const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');

class Importer {
  constructor(config) {
    
  }
  
  run() {
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
  } 
  
}

module.exports = {
  Importer
}