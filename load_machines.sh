#!/bin/bash

# Check if file path is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 \"<path_to_excel_file>\""
    echo "Example: $0 \"/path/to/machines.xlsx\""
    echo "Note: Use quotes if filename contains spaces"
    exit 1
fi

EXCEL_FILE="$1"

# Check if file exists
if [ ! -f "$EXCEL_FILE" ]; then
    echo "Error: File '$EXCEL_FILE' not found!"
    echo "Make sure to use quotes around the filename if it contains spaces"
    exit 1
fi

echo "Processing Excel file: $EXCEL_FILE"
echo "File exists: $(ls -la "$EXCEL_FILE")"
echo "=================================="

# Check if python and required packages are available
echo "Checking dependencies..."
python -c "import pandas as pd; import openpyxl; print('Dependencies OK')" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Error: Missing dependencies. Please install:"
    echo "conda install pandas openpyxl"
    echo "or"
    echo "pip install pandas openpyxl"
    exit 1
fi

# Convert Excel to CSV using python (requires openpyxl)
CSV_FILE="/tmp/machines_temp.csv"

echo "Reading Excel file..."
python -c "
import pandas as pd
import sys

try:
    print('Attempting to read Excel file...')
    # Read Excel file
    df = pd.read_excel('$EXCEL_FILE')
    
    # Display what we loaded
    print('SUCCESS: Loaded data')
    print('Columns:', list(df.columns))
    print('Shape:', df.shape)
    print()
    print('First few rows:')
    print(df.head())
    print()
    
    # Save as CSV for processing
    df.to_csv('$CSV_FILE', index=False)
    print('Converted to CSV for processing')
    
except Exception as e:
    print(f'ERROR processing Excel file: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
" || {
    echo "Python script failed!"
    exit 1
}

echo "Python script completed successfully"

# Check if CSV was created successfully
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: Failed to convert Excel to CSV"
    exit 1
fi

echo ""
echo "Generating SQL INSERT commands..."
echo "================================="

# Generate SQL INSERT commands
python -c "
import pandas as pd
import sys

try:
    df = pd.read_csv('$CSV_FILE')
    
    # Expected column mapping (adjust based on your Excel structure)
    # You may need to modify these column names to match your Excel headers
    column_mapping = {
        'Equipment': 'equipment_number',
        'Bezeichnung': 'equipment_description', 
        'Equipmenttyp': 'equipment_type',
        'Standort': 'location',
        'Sortierfeld': 'sort_field',
        'HerstSerialNr': 'manufacturer_serial_number',
        'Arbeitsplatz': 'work_station',
        'Typbezeichng': 'type_designation',
        'HerstTeilNr': 'manufacturer_part_number',
        'Baujahr': 'construction_year',
        'Größe/Abmess.': 'size_dimensions',
        'Hersteller': 'manufacturer',
        'ABC-Kennz.': 'abc_classification'
    }
    
    print('-- SQL INSERT commands for ticketing.machines_imported')
    print()
    
    for index, row in df.iterrows():
        values = []
        columns = []
        
        for excel_col, db_col in column_mapping.items():
            if excel_col in df.columns:
                value = row[excel_col]
                if pd.notna(value):
                    columns.append(db_col)
                    if isinstance(value, str):
                        # Escape single quotes in strings
                        value = str(value).replace(\"'\", \"''\")
                        values.append(f\"'{value}'\")
                    elif isinstance(value, (int, float)):
                        values.append(str(int(value)) if db_col == 'equipment_number' or db_col == 'construction_year' else str(value))
                    else:
                        values.append(f\"'{value}'\")
        
        if columns:
            columns_str = ', '.join(columns)
            values_str = ', '.join(values)
            print('INSERT INTO ticketing.machines_imported (' + columns_str + ') VALUES (' + values_str + ');')
    
    print()
    print('-- End of INSERT commands')
    
except Exception as e:
    print(f'Error generating SQL: {e}')
    sys.exit(1)
"

# Clean up temporary file
rm -f "$CSV_FILE"

echo ""
echo "Script completed!"
echo "Review the SQL commands above and execute them in your database."