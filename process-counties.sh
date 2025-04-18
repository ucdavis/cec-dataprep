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


export OSRM_FILE="/scratch/cecdss/california-latest.osrm"
export INPUT_FOLDER="./data/unprocessed_counties"
export PROCESSED_FOLDER="./data/processed_files"

YEAR=${1:-2030}

declare -a COUNTIES=(
  "Alameda" "Alpine" "Amador" "Butte" "Calaveras" "Colusa" "Contra_Costa"
  "Del_Norte" "El_Dorado" "Fresno" "Glenn" "Humboldt" "Imperial" "Inyo"
  "Kern" "Kings" "Lake" "Lassen" "Los_Angeles" "Madera" "Marin" "Mariposa"
  "Mendocino" "Merced" "Modoc" "Mono" "Monterey" "Napa" "Nevada" "Orange"
  "Placer" "Plumas" "Riverside" "Sacramento" "San_Benito" "San_Bernardino"
  "San_Diego" "San_Francisco" "San_Joaquin" "San_Luis_Obispo" "San_Mateo"
  "Santa_Barbara" "Santa_Clara" "Santa_Cruz" "Shasta" "Sierra" "Siskiyou"
  "Solano" "Sonoma" "Stanislaus" "Sutter" "Tehama" "Trinity" "Tulare"
  "Tuolumne" "Ventura" "Yolo" "Yuba" "No_County"
)

COUNTY=${COUNTIES[$SLURM_ARRAY_TASK_ID]}

echo "Processing county: $COUNTY for year: $YEAR"

source activate cec

npm run process $YEAR $COUNTY

echo "Finished processing $COUNTY for year $YEAR"