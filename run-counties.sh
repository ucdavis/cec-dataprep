#!/bin/bash

# This script submits the array job to SLURM

# Year to process (passed as argument, defaults to 2030)
YEAR=${1:-2030}

# BRANCH to use (default to main if not specified)
BRANCH=${2:-main}

# Get the total number of counties (minus 1 because array indices start at 0)
NUM_COUNTIES=58  # Total of 59 counties, indices 0-58 (includes no_county)

echo "Setting up environment for branch: $BRANCH, year: $YEAR"

# Setup the repo to the correct branch
if [ ! -d "cec-dataprep" ]; then
  git clone https://github.com/ucdavis/cec-dataprep.git
  cd cec-dataprep
else
  cd cec-dataprep
  git fetch
fi

# Checkout the specified branch
git checkout $BRANCH
git pull

# Install dependencies and build the project
npm install
npm run build
cd ..

echo "Submitting array job to process all counties for year $YEAR on branch $BRANCH"

# Submit the job as an array, where each array task processes one county
# -t specifies runtime in minutes (adjust as needed)
# --array=0-58 means process all 59 counties (indices 0 to 58)
sbatch --array=0-$NUM_COUNTIES -t 120 process-counties.sh $YEAR

echo "Job submitted. Monitor with 'squeue -u \$USER'"