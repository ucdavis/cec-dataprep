# Process the split csv files by adding them to the db
# And moving the file to the "upload _completed" folder
# If there's an error it will be moved to the "error_files" folder

import psycopg2
import os
import shutil
import sys

def create_completed_dir():
    completed_dir = 'upload_completed'
    if not os.path.exists(completed_dir):
        os.makedirs(completed_dir)
        print("Created 'upload_completed' directory")
    return completed_dir

def create_error_dir():
    error_dir = 'error_files'
    if not os.path.exists(error_dir):
        os.makedirs(error_dir)
        print("Created 'error_files' directory")
    return error_dir

def connect_to_db():
    try:
        conn = psycopg2.connect(
            host='hostname',
            dbname='dbname',
            user='username',
            password='password',
            port='5432'
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        sys.exit(1)

def check_existing_data(cur, year, county):
    try:
        cur.execute(
            "SELECT year, county_name FROM treatedclusters WHERE year=%s AND county_name=%s LIMIT 1;",
            (year, county)
        )
        return cur.fetchone()
    except Exception as e:
        print(f"Error checking existing data: {str(e)}")
        return None

def upload_file(cur, file_path):
    copy_sql = """ COPY treatedclusters(
        cluster_no, treatmentid, year, landing_lat, landing_lng, 
        landing_elevation, center_lat, center_lng, center_elevation, 
        slope, area, mean_yarding, site_class, county_name, 
        land_use, forest_type, haz_class, "Stem6to9_tonsAcre", 
        "Stem4to6_tonsAcre", "Stem9Plus_tonsAcre", "Branch_tonsAcre", 
        "Foliage_tonsAcre", wood_density
    ) FROM STDIN DELIMITER ',' CSV HEADER """
    
    with open(file_path, 'r') as f:
        try:
            cur.copy_expert(copy_sql, f)
            return True
        except psycopg2.Error as e:
            print(f"Database error: {str(e)}")
            return False

if len(sys.argv) != 2:
    print('Usage: python upload_files.py /path/to/split_files')
    sys.exit(1)

split_dir = sys.argv[1]
if not os.path.exists(split_dir):
    print(f"Error: Directory {split_dir} not found!")
    sys.exit(1)

completed_dir = create_completed_dir()
error_dir = create_error_dir()

conn = connect_to_db()
print('Connected to db')
cur = conn.cursor()

try:
    csv_files = [f for f in os.listdir(split_dir) if f.endswith('.csv')]
    total_files = len(csv_files)
    print(f"\nFound {total_files} CSV files to process")
    
    processed_count = 0
    skipped_count = 0
    error_count = 0

    for filename in csv_files:
        file_path = os.path.join(split_dir, filename)
        
        county, year = filename.replace('.csv', '').split('_')
        
        print(f"\nProcessing {filename} ({processed_count + skipped_count + error_count + 1}/{total_files})...")

        if check_existing_data(cur, year, county):
            print(f"Data already exists for {county} {year}. Skipping...")
            shutil.move(file_path, os.path.join(completed_dir, filename))
            print(f"Moved {filename} to completed directory")
            skipped_count += 1
            continue

        try:
            if upload_file(cur, file_path):
                conn.commit()
                print(f"Successfully uploaded {filename}")
                shutil.move(file_path, os.path.join(completed_dir, filename))
                print(f"Moved {filename} to completed directory")
                processed_count += 1
            else:
                conn.rollback()
                print(f"Failed to upload {filename}")
                shutil.move(file_path, os.path.join(error_dir, filename))
                print(f"Moved {filename} to error directory")
                error_count += 1

        except Exception as e:
            conn.rollback()
            print(f"Error processing {filename}: {str(e)}")
            shutil.move(file_path, os.path.join(error_dir, filename))
            print(f"Moved {filename} to error directory")
            error_count += 1

except Exception as e:
    print(f"Error in main processing loop: {str(e)}")

finally:
    cur.close()
    conn.close()
    
    print("\nProcessing Summary:")
    print(f"Total files found: {total_files}")
    print(f"Successfully processed: {processed_count}")
    print(f"Skipped (already exists): {skipped_count}")
    print(f"Errors: {error_count}")
    print("\nProcessing complete!")