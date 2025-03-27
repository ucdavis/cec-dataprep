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
#SBATCH --partition=high

echo "Running on $(hostname)"

module load node-js/20.15.1-scagana
module load npm/10.9.0-4tdev2b
module load conda
module load python/3.13.0-xf4zxxe

YEAR=${1:-2030}

NUM_COUNTIES=58  

export OSRM_FILE="/scratch/cecdss/california-latest.osrm"
export INPUT_FOLDER="./data/unprocessed_counties"
export PROCESSED_FOLDER="./data/processed_files"

echo "Submitting array job to process all counties for year $YEAR"

# --array=0-58 means process all 59 counties (indices 0 to 58)
sbatch --array=0-$NUM_COUNTIES process-counties.sh $YEAR

echo "Job submitted. Monitor with 'squeue -u \$USER'"