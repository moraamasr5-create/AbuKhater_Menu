-- PHASE 8.5 COMMERCIAL VARIANT ALIGNMENT SCRIPT
-- Idempotent INSERTs for menu_item_variants using exact DB Canonical UUIDs

-- Canonical Product: [bcfe5b69-143b-4954-8738-99692f941151] "شاورما لحمة" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('bcfe5b69-143b-4954-8738-99692f941151', 'كيزر', 60, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('bcfe5b69-143b-4954-8738-99692f941151', 'فينو وسط', 70, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('bcfe5b69-143b-4954-8738-99692f941151', 'فينو كبير', 80, true, 3) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('bcfe5b69-143b-4954-8738-99692f941151', 'عيش سوري', 90, true, 4) ON CONFLICT DO NOTHING;

-- Canonical Product: [98a7e3e8-ba5b-4698-8671-0f5a272b63f9] "شيش طاووق" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('98a7e3e8-ba5b-4698-8671-0f5a272b63f9', 'فينو وسط', 60, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('98a7e3e8-ba5b-4698-8671-0f5a272b63f9', 'فينو كبير', 70, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [c252b00e-c274-4ecd-9f92-e420f8342c36] "فاهيتا فراخ" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('c252b00e-c274-4ecd-9f92-e420f8342c36', 'فينو وسط', 80, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('c252b00e-c274-4ecd-9f92-e420f8342c36', 'فينو كبير', 100, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [61caab9d-d228-4139-b2cf-e8bfc64eb919] "فراخ بانية" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('61caab9d-d228-4139-b2cf-e8bfc64eb919', 'فينو وسط', 50, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('61caab9d-d228-4139-b2cf-e8bfc64eb919', 'فينو كبير', 55, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [6c6ca6d3-5bbc-46f8-bf6b-4265dcedf6aa] "كبدة جريل" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('6c6ca6d3-5bbc-46f8-bf6b-4265dcedf6aa', 'فينو وسط', 35, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('6c6ca6d3-5bbc-46f8-bf6b-4265dcedf6aa', 'فينو كبير', 50, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [f4867473-f5f2-4697-b41c-0a80d8a95a28] "كفتة جريل" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('f4867473-f5f2-4697-b41c-0a80d8a95a28', 'فينو وسط', 35, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('f4867473-f5f2-4697-b41c-0a80d8a95a28', 'فينو كبير', 50, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [6674af39-ed86-4abf-8599-1e389a45afaf] "كرسبي" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('6674af39-ed86-4abf-8599-1e389a45afaf', 'فينو وسط', 35, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('6674af39-ed86-4abf-8599-1e389a45afaf', 'فينو كبير', 50, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [191497fb-1640-4fd0-9c0e-0ddc909f61e7] "استربس" (سندوتشات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('191497fb-1640-4fd0-9c0e-0ddc909f61e7', 'فينو وسط', 40, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('191497fb-1640-4fd0-9c0e-0ddc909f61e7', 'فينو كبير', 55, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [bc1d5849-a6bc-4d96-ba60-a486ffb0275b] "كفتة بلدي" (الصواريخ)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('bc1d5849-a6bc-4d96-ba60-a486ffb0275b', 'صغير', 40, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('bc1d5849-a6bc-4d96-ba60-a486ffb0275b', 'كبير', 85, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [e5cc5b76-2a20-49d9-8b54-60d568098d4b] "شاورما لحمة" (الصواريخ)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('e5cc5b76-2a20-49d9-8b54-60d568098d4b', 'صغير', 50, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('e5cc5b76-2a20-49d9-8b54-60d568098d4b', 'كبير', 90, true, 2) ON CONFLICT DO NOTHING;

-- Canonical Product: [29f14017-9d6c-4100-b298-7f11d499c4c1] "ريش ضاني" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('29f14017-9d6c-4100-b298-7f11d499c4c1', 'ثمن كيلو', 155, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('29f14017-9d6c-4100-b298-7f11d499c4c1', 'ربع كيلو', 300, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('29f14017-9d6c-4100-b298-7f11d499c4c1', 'نصف كيلو', 600, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [6eaa2900-6204-4129-b78a-917f29b36275] "كباب ضاني" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('6eaa2900-6204-4129-b78a-917f29b36275', 'ثمن كيلو', 130, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('6eaa2900-6204-4129-b78a-917f29b36275', 'ربع كيلو', 250, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('6eaa2900-6204-4129-b78a-917f29b36275', 'نصف كيلو', 500, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [611085b6-e64f-4047-a7c3-2c9c25369ea7] "كباب أستيك" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('611085b6-e64f-4047-a7c3-2c9c25369ea7', 'ثمن كيلو', 120, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('611085b6-e64f-4047-a7c3-2c9c25369ea7', 'ربع كيلو', 225, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('611085b6-e64f-4047-a7c3-2c9c25369ea7', 'نصف كيلو', 450, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [0858c1f2-8719-44ca-a63a-49bd8c35fd22] "نيفا" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('0858c1f2-8719-44ca-a63a-49bd8c35fd22', 'ثمن كيلو', 120, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('0858c1f2-8719-44ca-a63a-49bd8c35fd22', 'ربع كيلو', 225, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('0858c1f2-8719-44ca-a63a-49bd8c35fd22', 'نصف كيلو', 450, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [9428d449-4999-46ba-a668-8a56bd743c29] "كفتة ضاني" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('9428d449-4999-46ba-a668-8a56bd743c29', 'ثمن كيلو', 90, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('9428d449-4999-46ba-a668-8a56bd743c29', 'ربع كيلو', 175, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('9428d449-4999-46ba-a668-8a56bd743c29', 'نصف كيلو', 350, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [82453393-716f-4b56-88af-6ecc7d7d5526] "كفتة كاندوز" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('82453393-716f-4b56-88af-6ecc7d7d5526', 'ثمن كيلو', 80, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('82453393-716f-4b56-88af-6ecc7d7d5526', 'ربع كيلو', 150, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('82453393-716f-4b56-88af-6ecc7d7d5526', 'نصف كيلو', 300, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [13343dec-8dd6-473a-b4e4-f10cb615de6e] "طرب" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('13343dec-8dd6-473a-b4e4-f10cb615de6e', 'ثمن كيلو', 100, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('13343dec-8dd6-473a-b4e4-f10cb615de6e', 'ربع كيلو', 200, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('13343dec-8dd6-473a-b4e4-f10cb615de6e', 'نصف كيلو', 400, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [a271aa98-1e1d-4db6-a57a-be55c47e743f] "سجق مشوي" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('a271aa98-1e1d-4db6-a57a-be55c47e743f', 'ثمن كيلو', 90, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('a271aa98-1e1d-4db6-a57a-be55c47e743f', 'ربع كيلو', 175, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('a271aa98-1e1d-4db6-a57a-be55c47e743f', 'نصف كيلو', 350, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [4e02a5b9-c6dd-437d-9fb1-4c697c7a8c53] "مشكل حلويات" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('4e02a5b9-c6dd-437d-9fb1-4c697c7a8c53', 'ثمن كيلو', 80, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('4e02a5b9-c6dd-437d-9fb1-4c697c7a8c53', 'ربع كيلو', 150, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('4e02a5b9-c6dd-437d-9fb1-4c697c7a8c53', 'نصف كيلو', 300, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [fbf548de-63d2-42d2-b33c-9ee6ab33ec56] "فيلية مشوي" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('fbf548de-63d2-42d2-b33c-9ee6ab33ec56', 'ثمن كيلو', 65, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('fbf548de-63d2-42d2-b33c-9ee6ab33ec56', 'ربع كيلو', 130, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('fbf548de-63d2-42d2-b33c-9ee6ab33ec56', 'نصف كيلو', 250, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [58a0a6a6-6b33-47f0-a82e-3c777d12deeb] "شيش طاووق" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('58a0a6a6-6b33-47f0-a82e-3c777d12deeb', 'ثمن كيلو', 65, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('58a0a6a6-6b33-47f0-a82e-3c777d12deeb', 'ربع كيلو', 130, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('58a0a6a6-6b33-47f0-a82e-3c777d12deeb', 'نصف كيلو', 250, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [45000ac7-52eb-4c81-bdbc-9807dfbd6929] "لحم نعام" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('45000ac7-52eb-4c81-bdbc-9807dfbd6929', 'ثمن كيلو', 200, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('45000ac7-52eb-4c81-bdbc-9807dfbd6929', 'ربع كيلو', 400, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('45000ac7-52eb-4c81-bdbc-9807dfbd6929', 'نصف كيلو', 800, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [54e72690-4485-4f71-9e04-313729039ddb] "ممبار" (طـواجـن)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('54e72690-4485-4f71-9e04-313729039ddb', 'ربع كيلو', 75, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('54e72690-4485-4f71-9e04-313729039ddb', 'نصف كيلو', 150, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('54e72690-4485-4f71-9e04-313729039ddb', 'كيلو ممبار', 300, true, 3) ON CONFLICT DO NOTHING;

-- Canonical Product: [4482224a-3f20-4606-a807-100b746d8d42] "بطـة مشوي" (مشويـات)
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('4482224a-3f20-4606-a807-100b746d8d42', 'ربع بطة', 250, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) VALUES ('4482224a-3f20-4606-a807-100b746d8d42', 'نصف بطة', 500, true, 2) ON CONFLICT DO NOTHING;
