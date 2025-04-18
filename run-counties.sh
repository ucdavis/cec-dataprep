#!/bin/bash

# This script submits the array job to SLURM
#SBATCH -J run-counties
#SBATCH -o slurm-run-counties-%A_%a.output
#SBATCH -e slurm-run-counties-%A_%a.error
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=3
#SBATCH --time=1:00:00
#SBATCH --mem=64G
#SBATCH --no-requeue
#SBATCH --account=adamgrp
#SBATCH --partition=high (check access, srun)

echo "Running on $(hostname)"

module load node-js/20.15.1-scagana
module load npm/10.9.0-4tdev2b
module load conda
module load python/3.13.0-xf4zxxe

YEAR=${1:-2030}

NUM_COUNTIES=58  

export OSRM_FILE="./data/california-latest.osrm"
export INPUT_FOLDER="./data/unprocessed_split_files"
export PROCESSED_FOLDER="./data/processed_split_files"

npm install 
npm run build

echo "Submitting array job to process all counties for year $YEAR"

sbatch --array=0-$NUM_COUNTIES process-counties.sh $YEAR

echo "Job submitted. Monitor with 'squeue -u \$USER'"