-- ==============================================================================
-- AbuKhater Menu: Phase 6 Data Alignment (Non-Destructive Migration)
-- 
-- Rules:
-- 1. NO DELETE on menu_items (Duplicates mapped to variants & set to status = 'hidden').
-- 2. Canonical Product UUIDs are explicitly preserved.
-- 3. All prices are taken directly from the existing real records.
-- 4. Category 'كـريب' renamed to 'الصواريخ' within existing category row.
-- ==============================================================================

BEGIN;

-- 1. Category Alignment: Rename 'كـريب' to 'الصواريخ'
UPDATE public.categories 
SET name = 'الصواريخ' 
WHERE id = 'e5e95a54-bf70-4aa1-9ab7-11a83e4d8553';

-- ------------------------------------------------------------------------------
-- 2. شاورما فراخ (Canonical UUID: ade87b63-64f7-417e-93a6-5b92cd71a594)
-- ------------------------------------------------------------------------------
DELETE FROM public.menu_item_variants WHERE menu_item_id = 'ade87b63-64f7-417e-93a6-5b92cd71a594';

INSERT INTO public.menu_item_variants (menu_item_id, name, price, display_order, is_available)
VALUES
    ('ade87b63-64f7-417e-93a6-5b92cd71a594', 'كيزر', 50.00, 1, true),
    ('ade87b63-64f7-417e-93a6-5b92cd71a594', 'فينو وسط', 60.00, 2, true),
    ('ade87b63-64f7-417e-93a6-5b92cd71a594', 'مخبوز أبو خاطر', 60.00, 3, true),
    ('ade87b63-64f7-417e-93a6-5b92cd71a594', 'فينو كبير', 70.00, 4, true),
    ('ade87b63-64f7-417e-93a6-5b92cd71a594', 'عيش سوري', 80.00, 5, true),
    ('ade87b63-64f7-417e-93a6-5b92cd71a594', 'كبير خاص', 85.00, 6, true);

-- Hide duplicate sandwich rows (preserve for historical FK / orders)
UPDATE public.menu_items 
SET status = 'hidden' 
WHERE id IN (
    'c04b8c24-2edd-40cc-adf1-033c6d5e9668', -- شاورما فراخ كيزر (50)
    'a8adc1e6-27d9-40bd-b4d0-17394bbf2559', -- شاورما فراخ فينو وسط (60)
    'c0f4ca81-754f-4001-ba24-4b399874c0be', -- شاورما فراخ مخبوز (60)
    'f8c3c907-bcbf-4fa0-b0b1-d106c9c3edbc', -- شاورما فراخ فينو كبير (70)
    'ecc83143-3822-434a-a075-0f05c4a2d34f'  -- شاورما فراخ عيش سوري (80)
);

-- ------------------------------------------------------------------------------
-- 3. برجر سادة (Canonical UUID: 1e772dbd-643c-4d2a-af71-6cf0666d0b60)
-- ------------------------------------------------------------------------------
DELETE FROM public.menu_item_variants WHERE menu_item_id = '1e772dbd-643c-4d2a-af71-6cf0666d0b60';

INSERT INTO public.menu_item_variants (menu_item_id, name, price, display_order, is_available)
VALUES
    ('1e772dbd-643c-4d2a-af71-6cf0666d0b60', 'كيزر', 30.00, 1, true),
    ('1e772dbd-643c-4d2a-af71-6cf0666d0b60', 'عيش سوري', 50.00, 2, true);

UPDATE public.menu_items 
SET status = 'hidden' 
WHERE id = 'f9618b3f-dcf6-48fc-8a3a-3895cf08cb0b'; -- برجر سادة سوري (50)

-- ------------------------------------------------------------------------------
-- 4. فرخة شيش (Canonical UUID: 47329087-a3ed-4663-9984-2c9c531d9f0c)
-- ------------------------------------------------------------------------------
DELETE FROM public.menu_item_variants WHERE menu_item_id = '47329087-a3ed-4663-9984-2c9c531d9f0c';

INSERT INTO public.menu_item_variants (menu_item_id, name, price, display_order, is_available)
VALUES
    ('47329087-a3ed-4663-9984-2c9c531d9f0c', 'نصف فرخة', 200.00, 1, true),
    ('47329087-a3ed-4663-9984-2c9c531d9f0c', 'فرخة كاملة', 370.00, 2, true);

UPDATE public.menu_items 
SET status = 'hidden' 
WHERE id = '589ce660-5420-4021-82d5-bc7747177197'; -- نصف فرخة شيش (200)

-- ------------------------------------------------------------------------------
-- 5. وجبة بروست (Canonical UUID: 6e55a581-17c4-4d56-a88a-252756803ef3)
-- ------------------------------------------------------------------------------
DELETE FROM public.menu_item_variants WHERE menu_item_id = '6e55a581-17c4-4d56-a88a-252756803ef3';

INSERT INTO public.menu_item_variants (menu_item_id, name, price, display_order, is_available)
VALUES
    ('6e55a581-17c4-4d56-a88a-252756803ef3', 'قطعتين (عيش وبطاطس)', 85.00, 1, true),
    ('6e55a581-17c4-4d56-a88a-252756803ef3', '3 قطع بروست', 125.00, 2, true),
    ('6e55a581-17c4-4d56-a88a-252756803ef3', 'قطعتين (أرز وكانز)', 135.00, 3, true),
    ('6e55a581-17c4-4d56-a88a-252756803ef3', '10 قطع عائلي', 400.00, 4, true);

UPDATE public.menu_items 
SET name = 'وجبة بروست', status = 'available'
WHERE id = '6e55a581-17c4-4d56-a88a-252756803ef3';

UPDATE public.menu_items 
SET status = 'hidden' 
WHERE id IN (
    '4812b0b7-560c-4cbe-8728-e697fd8d1e51', -- 3 قطع (125)
    '69202494-866a-48b1-9316-47bba61d69c1', -- قطعتين أرز (135)
    '2d4a9101-a0b5-4d0e-8878-bc8525f98dbf'  -- 10 قطع (400)
);

-- ------------------------------------------------------------------------------
-- 6. سلطة تومية (Canonical UUID: dc835622-ff7c-4383-8572-e46a31d4233c)
-- ------------------------------------------------------------------------------
DELETE FROM public.menu_item_variants WHERE menu_item_id = 'dc835622-ff7c-4383-8572-e46a31d4233c';

INSERT INTO public.menu_item_variants (menu_item_id, name, price, display_order, is_available)
VALUES
    ('dc835622-ff7c-4383-8572-e46a31d4233c', 'حجم عادي', 15.00, 1, true),
    ('dc835622-ff7c-4383-8572-e46a31d4233c', 'حجم كبير', 20.00, 2, true);

UPDATE public.menu_items 
SET status = 'hidden' 
WHERE id = 'd8170ca6-ee2b-4b63-84f0-921bbfafe855'; -- سلطة تومية كبير (20)

-- ------------------------------------------------------------------------------
-- 7. سلطة كلوسلو (Canonical UUID: 300fa3dc-eb77-4795-be93-18f8175d30cc)
-- ------------------------------------------------------------------------------
DELETE FROM public.menu_item_variants WHERE menu_item_id = '300fa3dc-eb77-4795-be93-18f8175d30cc';

INSERT INTO public.menu_item_variants (menu_item_id, name, price, display_order, is_available)
VALUES
    ('300fa3dc-eb77-4795-be93-18f8175d30cc', 'حجم عادي', 15.00, 1, true),
    ('300fa3dc-eb77-4795-be93-18f8175d30cc', 'حجم كبير', 20.00, 2, true);

UPDATE public.menu_items 
SET status = 'hidden' 
WHERE id = '22ce2f94-2752-4a96-a154-bf4c3fa6caac'; -- سلطة كلوسلو كبير (20)

COMMIT;
