#!/usr/bin/env python3
"""
Blueprints Manifest Generator
Automatically generates blueprints-manifest.json from files in the blueprints/ folder.
Run this script whenever you add/remove files from the blueprints folder.
"""

import os
import json
from pathlib import Path

def get_file_type(filename):
    """Get file type from extension"""
    ext = filename.suffix.lower()
    if ext in ['.pdf']:
        return 'pdf'
    elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
        return 'image'
    else:
        return None  # Skip unsupported files

def generate_title_from_filename(filename):
    """Generate a readable title from filename"""
    # Remove extension and clean up the name
    name = filename.stem

    # Replace common separators with spaces
    name = name.replace('-', ' ').replace('_', ' ')

    # Handle parentheses and numbers
    name = name.replace('(', ' ').replace(')', '')

    # Title case
    return name.title()

def generate_blueprints_manifest():
    """Generate the blueprints manifest JSON file"""
    blueprints_dir = Path('blueprints')

    if not blueprints_dir.exists():
        print("Error: blueprints/ folder not found!")
        return

    files = []
    for file_path in blueprints_dir.iterdir():
        if file_path.is_file() and not file_path.name.startswith('.'):
            file_type = get_file_type(file_path)
            if file_type:  # Only include supported file types
                title = generate_title_from_filename(file_path)
                files.append({
                    'filename': file_path.name,
                    'type': file_type,
                    'title': title
                })

    # Sort files alphabetically by filename
    files.sort(key=lambda x: x['filename'])

    # Write to manifest file
    manifest_path = Path('blueprints-manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(files, f, indent=4, ensure_ascii=False)

    print("Generated blueprints-manifest.json")
    print("=" * 50)
    print(f"Found {len(files)} supported files in blueprints/ folder:")
    for file_info in files:
        print(f"  - {file_info['filename']} ({file_info['type']}) -> '{file_info['title']}'")

if __name__ == "__main__":
    generate_blueprints_manifest()