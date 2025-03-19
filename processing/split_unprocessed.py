# This script splits data into smaller files by county_name in a 'unprocessed_counties_2030' directory
# For entries with no county name the entries will be added to No County.csv
# Usage: python split_unprocessed.py giant-file.csv
# Run the file - python split_unprocessed.py RELATIVE_PATH_OF_GLBRT_2030_DATA.CSV

import csv
import os
import sys

if len(sys.argv) != 2:
    print('Usage: python split_unprocessed.py giant-file.csv')
    sys.exit()

input_file = sys.argv[1]

output_dir = '../data/unprocessed_counties_2030'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
    print("Created 'unprocessed_counties_2030' directory")

county_data = {}

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
    
    # Find the county index in the headers
    # Looking at the screenshots, "county_name" or "County" could be the column name
    county_index = None
    for potential_name in ['county_name', 'county']:
        try:
            county_index = clean_headers.index(potential_name.lower().replace(' ', ''))
            print(f"Found county column at index {county_index}")
            break
        except ValueError:
            continue
    
    if county_index is None:
        print("Error: Could not find a county column in the headers")
        sys.exit(1)
    
    processed_rows = 0
    for row in reader:
        processed_rows += 1
        
        if processed_rows % 1000 == 0:
            print(f"Processed {processed_rows} rows...")
        
        # Handle potential issues with row length
        if len(row) != len(original_headers):
            print(f"Warning: Row {processed_rows} has {len(row)} columns, expected {len(original_headers)}")
            # Try to fix by truncating or padding
            if len(row) > len(original_headers):
                row = row[:len(original_headers)]
            else:
                row = row + [''] * (len(original_headers) - len(row))
        
        county = row[county_index]
        if not county.strip():
            county = "No County"
        
        if county not in county_data:
            county_data[county] = [original_headers]
        
        county_data[county].append(row)

print("\nCreating county files")
total_output_rows = 0
file_counts = []

for county, rows in county_data.items():
    rows_in_file = len(rows) - 1  # Subtract 1 for the header
    total_output_rows += rows_in_file
    
    # Replace any special characters in county name for filename
    safe_county = county.replace(' ', '_').replace('/', '_').replace('\\', '_')
    output_file = os.path.join(output_dir, f"{safe_county}.csv")
    
    with open(output_file, 'w', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(rows)
    
    file_counts.append((f"{safe_county}.csv", rows_in_file))
    print(f"Created {output_file} with {rows_in_file} rows")

print("\nRow Count Summary:")
print(f"Total input rows: {total_input_rows}")
print(f"Total output rows: {total_output_rows}")
if total_input_rows == total_output_rows:
    print("Counts match for the rows")
else:
    print(f"! Row count mismatch: Difference of {abs(total_input_rows - total_output_rows)} rows")

print(f"\nCreated {len(county_data)} files in 'unprocessed_counties_2030' directory")

print("\nDetailed file counts (sorted by row count):")
for filename, count in sorted(file_counts, key=lambda x: x[1], reverse=True):
    print(f"{filename}: {count} rows")