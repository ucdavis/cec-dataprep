# CEC Dataprep

Program to prepare F3 data for use in the CEC DSS application.

A run of this program takes a single raw pixel input CSV file and creates a single processed output CSV file.  The processed file groups pixels into clusters and contains additional calculated information including cluster yarding slope and distance as well as per-treatment details.

# Running on Farm Cluster

The Wiki contains information on running the dataprep on the UC Davis Farm computing cluster: https://github.com/ucdavis/cec-dataprep/wiki.  The same steps will work for any parallelizable computing cluster running the [Slurm workload manager](https://slurm.schedmd.com/overview.html).

# Running locally

## Preparing data

1. Create a folder called `data` in the project root

1. Add OSRM data to the `data` folder. You can create an OSRM extract yourself by following the guides at the official OSRM website. We also provide a custom OSRM extract which is available at (TBD - coming soon)

1. Add your input files wherever you would like, by default they normall go in the `data` folder as well

## Setting environmental variables

DotEnv is supported, or any other standard method of setting environmental variables will work

Variable | Purpose | Default
--- | --- | ---
PIXEL_FILE | The input raw pixel file | `none`
TREATED_OUT_FILE | Where to create the output file | `none`
OSRM_FILE | Location of the main OSRM file | `./data/california-latest.osrm`
HGT_FILES | Elevation info is automatically downloaded here | `./data`

## Running

Make sure you are using node v10

`npm install`

`npm run dev`


