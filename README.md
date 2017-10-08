# csv2influx

A tool for converting csv file to influxdb database.
You map csv fields to influxdb columns in config file.

https://github.com/CorpGlory/csv2influx

## Install

```
npm install -g csv2influx
```

## Usage

```
csv2influx init                                       Creates template config file
csv2influx [--config path/to/config.json] data.csv    Loads config from path/to/config.json 
                                                      then imports file data.csv to your influx
                                                      Default path: ./csv2influx.conf.json
```

See [example](example) for more details.

## Config documentation

```javascript

{
  "influxdbUrl": "http://127.0.0.1:8086/INFLUXDB_URL", // Database has to exist
  "measurementName": "MEASUREMENT_NAME",
  "mapping": {
    "fieldSchema": {
      "date": { // timestamp will always be "time" in database
        "from": "date",
        "type": "timestamp",
        "format": "jsDate" // field "format" is required for timestamp
      },
      "lat": { // fields "from" and "type" are required
        "from": "lat",
        "type": "float"
      },
      "language": { 
        "from": "lng", // we use field "lng" from CSV to fill up field "language" in DB
        "type": "float"
      },
      "name": {
        "from": "name",
        "type": "string"
      },
      "descr": { // renaming field available: description -> descr
        "from": "description", 
        "type": "string"
      },
      "location": {
        "from": "location",
        "type": "string"
      },
    },
  },
  "csv": {
    "delimiter": ','
  }
}

```

If you have date and time in separate fields in csv, like:
```
Date Of Stop,Time Of Stop, ...
08/28/2017,23:41:00, ...
```

You need to point it out in "timestamp" field:
```javascript

{
  "influxdbUrl": "http://127.0.0.1:8086/INFLUXDB_URL",
  "measurementName": "MEASUREMENT_NAME",
  "mapping": {
    "fieldSchema": {
      "date": {
        "from": ["Date of Stop", "Time Of Stop"], // fields "Date of Stop" and "Time of Stop" will be concatenated to create timestamp
        "type": "timestamp",
        "format": "jsDate"
      },
      "lat": {
        "from": "lat",
        "type": "float"
      },
      "lng": {
        "from": "lng",
        "type": "float"
      },
      "name": {
        "from": "name",
        "type": "string"
      },
      "descr": {
        "from": "description", 
        "type": "string"
      },
      "location": {
        "from": "location",
        "type": "string"
      },
    },
  },
  "csv": {
    "delimiter": ','
  }
}

```

