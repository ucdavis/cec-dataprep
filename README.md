# CEC Dataprep

Program to prepare F3 data for use in the CEC DSS application.

A run of this program takes a single raw pixel input CSV file and creates a single processed output CSV file.  The processed file groups pixels into clusters and contains additional calculated information including cluster yarding slope and distance as well as per-treatment details.

# Running on Farm Cluster

The Wiki contains information on running the dataprep on the UC Davis Farm computing cluster: https://github.com/ucdavis/cec-dataprep/wiki.  The same steps will work for any parallelizable computing cluster running the [Slurm workload manager](https://slurm.schedmd.com/overview.html).

# Running locally

## Preparing data

1. Download the data folder from box at the following link: https://ucdavis.box.com/s/bmyts3ps4e04yxs7uw7jla8bltq4rezp
2. Place it in the project root and rename it "data"
3. When running 2025 data, leave the file names as they are. When running 2030 data, change line 25 in index.ts to './data/complete_GLRBT_2030.csv' instead of './data/complete_GLRBT_2025.csv'

## Setting environmental variables

DotEnv is supported, or any other standard method of setting environmental variables will work

Variable | Purpose | Default
--- | --- | ---
PIXEL_FILE | The input raw pixel file | `none`
TREATED_OUT_FILE | Where to create the output file | `none`
OSRM_FILE | Location of the main OSRM file | `./data/california-latest.osrm`
HGT_FILES | Elevation info is automatically downloaded here | `./data`

## Running

Make sure you are using node v16

`npm install`

`npm run dev`


