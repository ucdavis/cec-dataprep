#!/bin/bash -l
# Name of the job
#SBATCH -J county-process
#SBATCH -o slurm-county-process-%A_%a.output
#SBATCH -e slurm-county-process-%A_%a.error
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=3
#SBATCH --time=1:00:00
#SBATCH --mem=64G
#SBATCH --no-requeue
#SBATCH --account=adamgrp
#SBATCH --partition=high

module load node-js/20.15.1-scagana
module load npm/10.9.0-4tdev2b
module load conda
module load python/3.13.0-xf4zxxe

export OSRM_FILE="/scratch/cecdss/california-latest.osrm"
export INPUT_FOLDER="./data/unprocessed_counties"
export PROCESSED_FOLDER="./data/processed_files"

YEAR=${1:-2030}

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

COUNTY=${COUNTIES[$SLURM_ARRAY_TASK_ID]}

echo "Processing county: $COUNTY for year: $YEAR"

source activate cec

npm run process $YEAR $COUNTY

echo "Finished processing $COUNTY for year $YEAR"