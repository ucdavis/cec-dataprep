# Split the data into county_year.csv files and check if all rows are exported

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

# Count total input rows (excluding header)
print("Counting total input rows")
with open(input_file, 'r') as infile:
    total_input_rows = sum(1 for line in infile) - 1
print(f"Total input rows (excluding header): {total_input_rows}")

print("\nReading and splitting file...")
with open(input_file, 'r') as infile:
    reader = csv.reader(infile)
    headers = next(reader)
    processed_rows = 0
    
    for row in reader:
        processed_rows += 1
        if len(row) > 23:
            # If we have extra columns (which is a consistent error that was found), combine land_use fields
            row[14] = row[14] + ' ' + row[15]  # Combine land_use fields
            row = row[:15] + row[16:]  # Remove the extra field
        
        county = row[13]
        year = row[2]
        key = (county, year)
        
        if key not in county_year_data:
            county_year_data[key] = [headers]
        county_year_data[key].append(row)

print("\nCreating county/year files...")
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
    print("✓ Row counts match!")
else:
    print(f"! Row count mismatch: Difference of {abs(total_input_rows - total_output_rows)} rows")

print(f"\nCreated {len(county_year_data)} files in 'split_files' directory")

print("\nDetailed file counts (sorted by row count):")
for filename, count in sorted(file_counts, key=lambda x: x[1], reverse=True):
    print(f"{filename}: {count} rows")