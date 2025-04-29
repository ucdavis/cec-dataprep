#!/bin/bash

#SBATCH --partition=med2
#SBATCH --output="job.out"
#SBATCH --time=1-00:00
#SBATCH --mem=64G
#SBATCH --job-name=cec-dataprep
#SBATCH --output=%x-%j.out
#SBATCH --error=%x-%j.err

# Load conda environment
module load node-js/20.15.1-scagana
module load npm/10.9.0-4tdev2b
module load conda
source activate cec || { echo "Failed to activate conda environment"; exit 1; }

# Print environment info for debugging
echo "Running on host: $(hostname)"
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"
echo "Time: $(date)"
echo "Git branch before checkout: $(git branch --show-current)"

# Checkout to a different branch
echo "Checking out branch CECDP-09"
git checkout CECDP-09 || { echo "Failed to checkout branch"; exit 1; }
echo "Git branch after checkout: $(git branch --show-current)"

# Set environment variables with proper syntax (no spaces around =)
export OSRM_FILE="./data/california-latest.osrm"
export TREATED_OUT_FILE="../data/GLRBT_processed_2025.csv"
export PIXEL_FILE="../data/complete_GLRBT_2025.csv"

# Echo environment variables to confirm
echo "OSRM_FILE = $OSRM_FILE"
echo "TREATED_OUT_FILE = $TREATED_OUT_FILE"
echo "PIXEL_FILE = $PIXEL_FILE"

echo "Installing npm packages"
npm install --force || { echo "Failed to install packages"; exit 1; }

echo "Building the project"
npm run build || { echo "Failed to build the project"; exit 1; }

if [ ! -d "dist" ]; then
    echo "Error: dist directory not found after build"
    echo "Contents of current directory:"
    ls -la
    exit 1
fi

echo "Running node script"
node dist/index.js