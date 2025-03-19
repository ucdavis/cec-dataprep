#!/bin/bash -l
# Name of the job
#SBATCH -J county-process
# Standard out and Standard Error output files with the job number in the name
#SBATCH -o slurm-county-process-%A_%a.output
#SBATCH -e slurm-county-process-%A_%a.error
# Ask for enough memory to hold our CSV contents
#SBATCH --mem 8000
# Increase to 8GB for node memory
export NODE_OPTIONS="--max-old-space-size=8192"

# Print the hostname for debugging purposes
hostname

# Year parameter with default value
YEAR=${1:-2030}

# Define the array of county names
declare -a COUNTIES=(
  "alameda" "alpine" "amador" "butte" "calaveras" "colusa" "contra_costa"
  "del_norte" "el_dorado" "fresno" "glenn" "humboldt" "imperial" "inyo"
  "kern" "kings" "lake" "lassen" "los_angeles" "madera" "marin" "mariposa"
  "mendocino" "merced" "modoc" "mono" "monterey" "napa" "nevada" "orange"
  "placer" "plumas" "riverside" "sacramento" "san_benito" "san_bernardino"
  "san_diego" "san_francisco" "san_joaquin" "san_luis_obispo" "san_mateo"
  "santa_barbara" "santa_clara" "santa_cruz" "shasta" "sierra" "siskiyou"
  "solano" "sonoma" "stanislaus" "sutter" "tehama" "trinity" "tulare"
  "tuolumne" "ventura" "yolo" "yuba" "no_county"
)

# We will use array index to select which county to process
COUNTY=${COUNTIES[$SLURM_ARRAY_TASK_ID]}

echo "Processing county: $COUNTY for year: $YEAR"

# Set environment variables for the processing script
export OSRM_FILE="/home/YOUR_USERNAME/osrm-data/california-latest.osrm"
export INPUT_FOLDER="/home/YOUR_USERNAME/data/unprocessed_counties"
export PROCESSED_FOLDER="/home/YOUR_USERNAME/data/processed_files"

# Make sure the output directory exists
mkdir -p $PROCESSED_FOLDER/$YEAR

# Load the conda environment
module load conda3
source activate cec

# Change to the working directory
cd $SLURM_SUBMIT_DIR

# Run the processing script with the parameters
npm run process $YEAR $COUNTY

echo "Finished processing $COUNTY for year $YEAR"