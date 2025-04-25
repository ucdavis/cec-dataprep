#!/bin/bash

#SBATCH --partition=med2
#SBATCH --time=1-00:00
#SBATCH --mem=64G
#SBATCH --output=cecdataprep_output.txt
#SBATCH -o slurm-run-counties.output
#SBATCH -e slurm-run-counties.error
#SBATCH --job-name=cec-dataprep

# Load conda environment
module load conda
source activate cec

# Print current directory for debugging
echo "Current directory: $(pwd)"

# Checkout to a different branch
echo "Checking out to branch CECDP-09"
git checkout CECDP-09
if [ $? -ne 0 ]; then
    echo "Failed to checkout branch"
    exit 1
fi

# Set environment variables with proper syntax
export OSRM_FILE="./data/california-latest.osrm"
export TREATED_OUT_FILE="../data/GLRBT_processed_2025.csv"
export PIXEL_FILE="../data/complete_GLRBT_2025.csv"

# Install dependencies
echo "Installing npm packages"
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install packages"
    exit 1
fi

# Build the project
echo "Building the project"
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build the project"
    exit 1
fi

# Run the built dataprep
echo "Running node script"
node dist/index.js