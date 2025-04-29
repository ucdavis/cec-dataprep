import os
import sys
import csv
import psycopg2
import shutil

def fix_and_upload_csv_files(split_files_dir):
    processed_dir = 'upload_completed'
    error_dir = 'error_files'
    
    for directory in [processed_dir, error_dir]:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Created '{directory}' directory")
    
    try:
        conn = psycopg2.connect(
            host='localhost',
            dbname='db',
            user='user',
            password='pass',
            port='5432'
        )
        cur = conn.cursor()
        print('Connected to database')
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        sys.exit(1)
    
    csv_files = [f for f in os.listdir(split_files_dir) if f.endswith('.csv')]
    total_files = len(csv_files)
    print(f"\nFound {total_files} CSV files to process")
    
    processed_count = 0
    error_count = 0
    
    for i, filename in enumerate(csv_files):
        file_path = os.path.join(split_files_dir, filename)
        print(f"\nProcessing {filename} ({i+1}/{total_files})...")
        
        try:
            # Read the CSV file and fix the land_use column issue
            with open(file_path, 'r') as f:
                reader = csv.reader(f)
                headers = next(reader)  # Get headers
                
                # Create a temporary file with fixed rows
                temp_file_path = os.path.join(split_files_dir, f"temp_{filename}")
                with open(temp_file_path, 'w', newline='') as temp_f:
                    writer = csv.writer(temp_f)
                    
                    # Write header row (first 23 columns only)
                    writer.writerow(headers[:23])
                    
                    # Process each row, applying the same fix as in split_csv.py
                    for row in reader:
                        if len(row) > 23:  # If row has extra columns
                            # Combine the land_use field with the extra field, like in split_csv.py
                            land_use_index = 14  # Index of land_use based on your code
                            row[land_use_index] = f"{row[land_use_index + 1]} {row[land_use_index]}"
                            # Remove the extra column
                            row = row[:land_use_index + 1] + row[land_use_index + 2:]
                        
                        # Write only the first 23 columns to ensure proper format
                        writer.writerow(row[:23])
            
            # Upload the temporary file
            with open(temp_file_path, 'r') as f:
                copy_sql = """ COPY treatedclusters(
                    cluster_no, treatmentid, year, landing_lat, landing_lng, 
                    landing_elevation, center_lat, center_lng, center_elevation, 
                    slope, area, mean_yarding, site_class, county_name, 
                    land_use, forest_type, haz_class, stem6to9_tonsacre, 
                    stem4to6_tonsacre, stem9plus_tonsacre, branch_tonsacre, 
                    foliage_tonsacre, wood_density
                ) FROM STDIN DELIMITER ',' CSV HEADER """
                
                cur.copy_expert(copy_sql, f)
                conn.commit()
                print(f"Successfully uploaded {filename}")
                
                # Move original file to completed directory
                shutil.move(file_path, os.path.join(processed_dir, filename))
                
                # Remove temporary file
                os.remove(temp_file_path)
                
                processed_count += 1
                
        except Exception as e:
            conn.rollback()
            print(f"Error processing {filename}: {str(e)}")
            
            # Move file to error directory
            shutil.move(file_path, os.path.join(error_dir, filename))
            
            # Clean up temporary file if it exists
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
            error_count += 1
    
    # Close database connection
    cur.close()
    conn.close()
    
    # Print summary
    print("\nProcessing Summary:")
    print(f"Total files found: {total_files}")
    print(f"Successfully processed: {processed_count}")
    print(f"Errors: {error_count}")
    print("\nProcessing complete!")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print('Usage: python fix_and_upload.py /path/to/split_files')
        sys.exit(1)
    
    split_files_dir = sys.argv[1]
    
    if not os.path.exists(split_files_dir):
        print(f"Error: Directory {split_files_dir} not found!")
        sys.exit(1)
    
    fix_and_upload_csv_files(split_files_dir)