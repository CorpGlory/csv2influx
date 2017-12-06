# csv2influx

A CLI tool for importing csv file to influxdb database.
You can map csv fields to influxdb columns in config file.

See [examples](examples)

## Install

```
npm install -g csv2influx
```

## Usage

```
Usage:
  csv2influx init                     Creates template config file
  csv2influx [options] data.csv       Imports file data.csv to your influxDB

Options:
  -c, --config /path/to/config.json   [optional] Specifies path to your config file.
                                      Default: ./csv2influx.conf.json
  -q, --quiet                         [optional] Makes output quiet (progress bar instead of written to DB values)
```

## Config example

```javascript

{
  "influxdbUrl": "http://127.0.0.1:8086/INFLUXDB_URL", // Database has to exist
  "measurementName": "MEASUREMENT_NAME",
  "mapping": {
    "time": { // specifies CSV-fields used to get time.
              // In case it's not defined you get WARNING and
              // current time is written to DB
      "from": "date",
      "type": "timestamp",
      "format": "jsDate" // field "format" is required for timestamp.
                          // in this case means that string will by parsed as
                          // JavaScript date string format
                          // https://www.w3schools.com/js/js_date_formats.asp
    },
    "fieldSchema": {
      "name": { // fields "from" and "type" are required
        "from": "name",
        "type": "string" // influxdb string target type
      },
      "latitude": {
        "from": "lat", // we use field "lat" from CSV to fill up field "latitude" in DB
        "type": "float" // influxdb float target type
      },
      "longitude": {
        "from": "lng", // we use field "lng" from CSV to fill up field "longitude" in DB
        "type": "float"
      }
    },
    "tagSchema": {
      "location": {
        "from": "location",
        "type": "*" // type of tag can be "*" (any value) or array of possible values
                    // see https://vicanso.github.io/influxdb-nodejs/Client.html#schema
      }
    }
  },
  "csv": { // Parser options from http://csv.adaltas.com/parse/
    "delimiter": ','
  }
}

```

See more [examples](examples) to learn more about mapping

## Changelog

###### 0.0.12 
-  Tags support
-  Merging CSV-fields using template-sting-like-syntax
