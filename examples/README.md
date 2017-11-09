# Air Quality
Based on https://archive.ics.uci.edu/ml/datasets/Air+quality.
First two columns merged to one.

The folder contains [airQuality.csv](airQuality.csv) and [airQuality.conf.json](airQuality.conf.json) for it.
Examples demonstrates how to take subset of all fields from csv file. Also `;` delimeter is used.

See next example to learn how to merge Date/Time


### Run

```
csv2influx --config airQuality.conf.json airQuality.csv
```

# Traffic Violations

Based on https://catalog.data.gov/dataset/traffic-violations-56dda (top 10 rows)


If you have date and time in separate fields in csv, like:

```
Date Of Stop,Time Of Stop, ...
08/28/2017,23:41:00, ...
```

You can merge fields `Date Of Stop` and `Time Of Stop` map to one `time` field.

Also, you can merge any field or tag using template-string-like syntax. 
"Imagine a csv has Street,City,State,Zip, you may want to merge those as "Street\nCity,State\nZip" (c) https://github.com/CorpGlory/csv2influx/issues/28#issuecomment-335570628

### Example
```javascript

{
  ...
  "mapping": {
    "time": {
      // fields "Date of Stop" and "Time of Stop" will be concatenated to create timestamp
      "from": ["Date Of Stop", "Time Of Stop"],
      "type": "timestamp",
      "format": "jsDate"
    },
    "fieldSchema": {
      "coordinates": {
        // fields "Latitude" and "Longitude" will be concatenated 
        // with "," delimiter to create "coordinates" field
        "from": "${Latitude},${Longitude}",
        "type": "string"
      }
    },
    "tagSchema": {
      "agency": {
        "from": "Agency",
        "type": "*"
      }
    }
  }
  ...
}

```

### Run

```
csv2influx --config traffic_violations.conf.json traffic_violations.csv
```
