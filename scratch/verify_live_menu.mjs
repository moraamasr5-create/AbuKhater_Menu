import { menuService } from '../src/services/api/menuService.js';

async function test() {
    const { items, error } = await menuService.fetchMenu({ force: true });
    if (error) {
        console.error('Error fetching menu:', error);
        return;
    }

    console.log(`Total menu items fetched: ${items.length}`);

    const sharqi = items.find(i => i.id === '808c11d2-d7af-4512-bb2c-1c14510a1d14');
    const shawarma = items.find(i => i.id === 'ade87b63-64f7-417e-93a6-5b92cd71a594');
    const pepsi = items.find(i => i.id === '260329a4-49a5-411d-ac19-c5733277ad48');

    console.log('\n==============================');
    console.log('1. وجبة الشرقي (Configured with Variants):');
    console.log('Name:', sharqi?.name);
    console.log('Base Price:', sharqi?.price);
    console.log('Has Configuration:', sharqi?.has_configuration);
    console.log('Variants:', sharqi?.variants);

    console.log('\n==============================');
    console.log('2. شاورما فراخ (Configured with Options):');
    console.log('Name:', shawarma?.name);
    console.log('Base Price:', shawarma?.price);
    console.log('Has Configuration:', shawarma?.has_configuration);
    console.log('Option Groups:', JSON.stringify(shawarma?.option_groups, null, 2));

    console.log('\n==============================');
    console.log('3. بيبسي (Configured with Options):');
    console.log('Name:', pepsi?.name);
    console.log('Base Price:', pepsi?.price);
    console.log('Has Configuration:', pepsi?.has_configuration);
    console.log('Option Groups:', JSON.stringify(pepsi?.option_groups, null, 2));
}

test();
