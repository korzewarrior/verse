#!/usr/bin/env python3
"""
Convert Bible SuperSearch JSON format to the format used by kjv.json/bbe.json
"""
import json
import sys

def convert_bible(input_file, output_file):
    # Load the flat verse format
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    verses = data.get('verses', [])
    if not verses:
        print(f"Error: No verses found in {input_file}")
        return False
    
    # Build the hierarchical structure
    books = {}
    book_order = []
    
    for verse in verses:
        book_name = verse['book_name']
        chapter = verse['chapter'] - 1  # Convert to 0-indexed
        text = verse['text']
        
        if book_name not in books:
            books[book_name] = {
                'name': book_name,
                'chapters': {}
            }
            book_order.append(book_name)
        
        if chapter not in books[book_name]['chapters']:
            books[book_name]['chapters'][chapter] = []
        
        books[book_name]['chapters'][chapter].append(text)
    
    # Convert to final format
    result = []
    for book_name in book_order:
        book = books[book_name]
        # Convert chapters dict to sorted list
        max_chapter = max(book['chapters'].keys())
        chapters_list = []
        for i in range(max_chapter + 1):
            chapters_list.append(book['chapters'].get(i, []))
        
        # Generate abbreviation (simplified - just use first 2-3 chars lowercase)
        abbrev = book_name.lower().replace(' ', '')[:3]
        
        result.append({
            'name': book_name,
            'abbrev': abbrev,
            'chapters': chapters_list
        })
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False)
    
    print(f"✅ Converted {len(result)} books with {len(verses)} total verses")
    print(f"   Output: {output_file}")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: convert_bible.py <input.json> <output.json>")
        sys.exit(1)
    
    success = convert_bible(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)

