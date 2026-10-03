-- ==============================================================================
-- PHASE 1: CANONICAL DATA ALIGNMENT SCRIPT (Idempotent & Non-Destructive)
-- ZERO DELETE: Duplicates are mapped to variants and set to status = 'hidden'
-- ==============================================================================

-- 1. Insert Variants for Canonical Items (Sandwiches, Burgers, Grills)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order)
VALUES
  -- شاورما لحمة (bcfe5b69-143b-4954-8738-99692f941151)
  ('bcfe5b69-143b-4954-8738-99692f941151', 'كيزر', 60, true, 1),
  ('bcfe5b69-143b-4954-8738-99692f941151', 'فينو وسط', 70, true, 2),
  ('bcfe5b69-143b-4954-8738-99692f941151', 'فينو كبير', 80, true, 3),
  ('bcfe5b69-143b-4954-8738-99692f941151', 'عيش سوري', 90, true, 4),

  -- شيش طاووق ساندوتش (98a7e3e8-ba5b-4698-8671-0f5a272b63f9)
  ('98a7e3e8-ba5b-4698-8671-0f5a272b63f9', 'وسط', 60, true, 1),
  ('98a7e3e8-ba5b-4698-8671-0f5a272b63f9', 'كبير', 70, true, 2),

  -- فاهيتا فراخ ساندوتش (c252b00e-c274-4ecd-9f92-e420f8342c36)
  ('c252b00e-c274-4ecd-9f92-e420f8342c36', 'وسط', 80, true, 1),
  ('c252b00e-c274-4ecd-9f92-e420f8342c36', 'كبير', 100, true, 2),

  -- استربس ساندوتش (0af5f68c-5d32-487c-a049-c10d1c425eda)
  ('0af5f68c-5d32-487c-a049-c10d1c425eda', 'وسط', 40, true, 1),
  ('0af5f68c-5d32-487c-a049-c10d1c425eda', 'كبير', 55, true, 2),

  -- كرسبي ساندوتش (b13ed3d9-28ec-46a1-b845-8bcb72a1a55c)
  ('b13ed3d9-28ec-46a1-b845-8bcb72a1a55c', 'وسط', 35, true, 1),
  ('b13ed3d9-28ec-46a1-b845-8bcb72a1a55c', 'كبير', 50, true, 2),

  -- هوت دوج ساندوتش (b4f7b016-042b-46b3-b0b5-4f96438e2ee9)
  ('b4f7b016-042b-46b3-b0b5-4f96438e2ee9', 'عادي', 35, true, 1),

  -- لحم نعام مشوي (45000ac7-52eb-4c81-bdbc-9807dfbd6929)
  ('45000ac7-52eb-4c81-bdbc-9807dfbd6929', 'ثمن', 200, true, 1),
  ('45000ac7-52eb-4c81-bdbc-9807dfbd6929', 'ربع', 400, true, 2),
  ('45000ac7-52eb-4c81-bdbc-9807dfbd6929', 'نصف', 800, true, 3)
ON CONFLICT DO NOTHING;

-- 2. Mark Duplicate Sibling Rows as 'hidden' (NO DELETE)
UPDATE menu_items 
SET status = 'hidden'
WHERE id IN (
  '09cf1eb1-46c9-4af4-9568-695ccf721280', -- شاورما لحم 60
  'bc58760f-c491-462f-9e02-8abaa48e7c79', -- شيش طاووق 70
  '47e3941e-c5de-4e22-b231-5bbb3d425c6c', -- فاهيتا فراخ 75
  '4cc70f73-519f-4e6f-8790-85e5750d05be', -- فاهيتا فراخ 60
  '191497fb-1640-4fd0-9c0e-0ddc909f61e7', -- استربس 65
  '6674af39-ed86-4abf-8599-1e389a45afaf', -- كرسبي 55
  'a76d176a-e83c-49e7-9a7a-61800d2b8809', -- هوت دوج 40
  'c53e6ec4-8d0a-4e67-a8fe-0ffd624c130d'  -- لحم نعام 250
);
