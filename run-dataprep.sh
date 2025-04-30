#!/bin/bash

#SBATCH --partition=med2
#SBATCH --time=1-00:00
#SBATCH --mem=64G
#SBATCH --job-name=cec-dataprep
#SBATCH --output=%x-%j.out
#SBATCH --error=%x-%j.err

module load node-js/20.15.1-scagana
module load npm/10.9.0-4tdev2b
module load conda
source activate cec

echo "Running on host: $(hostname)"
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"
echo "Time: $(date)"

export OSRM_FILE="./data/california-latest.osrm"
export TREATED_OUT_FILE="../data/GLRBT_processed_2025.csv"
export PIXEL_FILE="../data/complete_GLRBT_2025.csv"

echo "OSRM_FILE = $OSRM_FILE"
echo "TREATED_OUT_FILE = $TREATED_OUT_FILE"
echo "PIXEL_FILE = $PIXEL_FILE"

echo "Installing npm packages"
npm install

echo "Building the project"
npm run build 

if [ ! -d "dist" ]; then
    echo "Error: dist directory not found after build"
    echo "Contents of current directory:"
    ls -la
    exit 1
fi

echo "Running node script"
node dist/index.js