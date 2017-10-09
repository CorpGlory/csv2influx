# Air Quality

The folder contains [airQuality.csv](airQuality.csv) and [airQuality.conf.json](airQuality.conf.json) for it.
Examples demonstrates how to take subset of all fields from csv file. Also `;` delimeter is used.

Based on https://archive.ics.uci.edu/ml/datasets/Air+quality. 
Dates merged manualy. See next example to learn how to merge Date/Time.


## Run

```
csv2influx --config aitQuality.conf.json aitQuality.csv
```

# Traffic Violations

Based on https://catalog.data.gov/dataset/traffic-violations-56dda (top 10 rows)


If you have date and time in separate fields in csv, like:

```
Date Of Stop,Time Of Stop, ...
08/28/2017,23:41:00, ...
```

You may point it out in "timestamp" field:
```json

{
  ...
  "mapping": {
    "fieldSchema": {
      "date": {
        // fields "Date of Stop" and "Time of Stop" will be concatenated to create timestamp
        "from": ["Date of Stop", "Time Of Stop"], 
        "type": "timestamp",
        "format": "jsDate"
      },
  ...
}

```

## Run

```
csv2influx --config aitQuality.conf.json aitQuality.csv
```