import json
import os

items_dir = 'c:\\Users\\mamdo\\reactProject\\items'
categories_file = os.path.join(items_dir, 'categories.json')

with open(categories_file, 'r', encoding='utf-8') as f:
    categories_data = json.load(f)['categories']

all_items = []
categories_list = [{'id': 'all', 'name': 'الكل', 'icon': '🍽️'}]

# Mapping for file names that differ from category_id
file_mapping = {
    'extras': 'additions'
}

for cat in categories_data:
    if not cat['visible']:
        continue
    
    cat_id = cat['category_id']
    categories_list.append({
        'id': cat_id,
        'name': cat['title'],
        'icon': cat['icon']
    })
    
    # Try mapped name first, then cat_id
    filename_base = file_mapping.get(cat_id, cat_id)
    file_path = os.path.join(items_dir, f"{filename_base}.json")
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            items = data.get('items', [])
            for item in items:
                img = item.get('image_url', '')
                if 'drive.google.com' in img:
                    try:
                        file_id = img.split('id=')[-1].split('&')[0]
                        img = f"https://lh3.googleusercontent.com/d/{file_id}"
                    except:
                        pass
                
                all_items.append({
                    'id': item['item_id'],
                    'name': item['name'],
                    'description': item.get('comment', ''),
                    'price': item['base_price'],
                    'status': 'available' if item.get('status') == 'available' else 'unavailable',
                    'image': img,
                    'category': cat_id
                })

output_content = f"""export const menuItems = {json.dumps(all_items, indent=4, ensure_ascii=False)};

export const categories = {json.dumps(categories_list, indent=4, ensure_ascii=False)};
"""

with open('c:\\Users\\mamdo\\reactProject\\src\\utils\\data.js', 'w', encoding='utf-8') as f:
    f.write(output_content)
