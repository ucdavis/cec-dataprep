# This files splits the GLBRT_processed data into smaller files county_name_year.csv in a files 'split_files'
# For entries with no county name the entries will be added to No County_year.csv
# Pass the second argument is the relative path of the processed data

import csv
import os
import sys

if len(sys.argv) != 2:
    print('Usage: python split_csv.py giant-file.csv')
    sys.exit()

input_file = sys.argv[1]

output_dir = 'split_files'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
    print("Created 'split_files' directory")

county_year_data = {}

print("Counting total input rows")
with open(input_file, 'r') as infile:
    total_input_rows = sum(1 for line in infile) - 1
print(f"Total input rows (excluding header): {total_input_rows}")

print("\nReading and splitting file")
with open(input_file, 'r') as infile:
    reader = csv.reader(infile)
    original_headers = next(reader)
    clean_headers = [h.replace(' ', '').lower() for h in original_headers]
    
    print("Original headers:", original_headers)
    print("Cleaned headers:", clean_headers)
    
    land_use_index = clean_headers.index('land_use')
    county_index = clean_headers.index('county_name')
    year_index = clean_headers.index('year')
    
    processed_rows = 0
    for row in reader:
        processed_rows += 1
        
        if len(row) > 23:
            row[land_use_index] = f"{row[land_use_index + 1]} {row[land_use_index]}"
            row = row[:land_use_index + 1] + row[land_use_index + 2:]
        
        county = row[county_index]
        if not county.strip():
            county = "No County"
        year = row[year_index]
        key = (county, year)
        
        if key not in county_year_data:
            county_year_data[key] = [clean_headers[:23]]
        
        county_year_data[key].append(row[:23])

print("\nCreating county/year files")
total_output_rows = 0
file_counts = []

for (county, year), rows in county_year_data.items():
    rows_in_file = len(rows) - 1
    total_output_rows += rows_in_file
    
    output_file = os.path.join(output_dir, f"{county}_{year}.csv")
    with open(output_file, 'w', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(rows)
    file_counts.append((f"{county}_{year}.csv", rows_in_file))
    print(f"Created {output_file} with {rows_in_file} rows")

print("\nRow Count Summary:")
print(f"Total input rows: {total_input_rows}")
print(f"Total output rows: {total_output_rows}")
if total_input_rows == total_output_rows:
    print("Counts match for the rows")
else:
    print(f"! Row count mismatch: Difference of {abs(total_input_rows - total_output_rows)} rows")

print(f"\nCreated {len(county_year_data)} files in 'split_files' directory")

print("\nDetailed file counts (sorted by row count):")
for filename, count in sorted(file_counts, key=lambda x: x[1], reverse=True):
    print(f"{filename}: {count} rows")