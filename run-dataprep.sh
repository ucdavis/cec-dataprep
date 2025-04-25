#!/bin/bash

#SBATCH --partition=med2
#SBATCH --time=1-00:00
#SBATCH --mem=64G
#SBATCH --output=cecdataprep_output_%j.txt

# NOTE: you need to have your conda env setup before running!
module load conda
source activate cec

# Checkout to a different branch
git checkout CECDP-09

export OSRM_FILE="./data/california-latest.osrm"
export TREATED_OUT_FILE =  '../data/GLRBT_processed_2025.csv'
export PIXEL_FILE = '../data/complete_GLRBT_2025.csv'

# install and build
npm install

npm run build

# run the built dataprep
srun node dist/index.js






