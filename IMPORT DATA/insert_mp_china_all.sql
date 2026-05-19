BEGIN;


-- Pastikan SalesSource ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "SalesSource" WHERE "name" = 'MP - SHOPEE') THEN
    INSERT INTO "SalesSource" ("id", "name") VALUES (gen_random_uuid()::text, 'MP - SHOPEE');
  END IF;
END $$;

-- Pastikan AdAccount ada
INSERT INTO "AdAccount" (
  "id", "sourceId", "groupName", "accountName", "productInfo", "status", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, ss."id", 'MARKETPLACE', 'TOKOHERBALCHINA', 'ALL', 'ON', NOW(), NOW()
FROM "SalesSource" ss
WHERE ss."name" = 'MP - SHOPEE'
AND NOT EXISTS (
  SELECT 1 FROM "AdAccount" aa WHERE aa."sourceId" = ss."id" AND aa."accountName" = 'TOKOHERBALCHINA'
);

-- Pastikan AdSpendLog harian ada
INSERT INTO "AdSpendLog" ("id", "date", "sourceId", "amountSpent")
SELECT gen_random_uuid()::text, d."tanggal", ss."id", 0
FROM "SalesSource" ss
CROSS JOIN (
  SELECT generate_series('2026-02-01'::timestamp, '2026-02-28'::timestamp, '1 day'::interval) AS "tanggal"
) AS d
WHERE ss."name" = 'MP - SHOPEE'
ON CONFLICT ("date", "sourceId") DO NOTHING;

-- Bersihkan data lama
DELETE FROM "AdSpendItem" asi
USING "AdSpendLog" asl, "SalesSource" ss, "Product" p, "AdAccount" aa
WHERE asi."adSpendLogId" = asl."id"
AND asl."sourceId" = ss."id"
AND asi."productId" = p."id"
AND asi."adAccountId" = aa."id"
AND ss."name" = 'MP - SHOPEE'
AND p."sku" IN ('ER', 'YH', 'GC', 'PE', 'DR', 'MD', 'WJ', 'VC')
AND aa."accountName" = 'TOKOHERBALCHINA'
AND asl."date" >= '2026-02-01'::timestamp
AND asl."date" < '2026-03-01'::timestamp;

-- Insert Data
WITH data_iklan("tanggal", "sku", "biaya", "pembelian") AS (
  VALUES
  ('2026-02-01 00:00:00'::timestamp, 'MD', 1876177, 0),
  ('2026-02-01 00:00:00'::timestamp, 'WJ', 1184514, 0),
  ('2026-02-01 00:00:00'::timestamp, 'VC', 59911, 0),
  ('2026-02-02 00:00:00'::timestamp, 'MD', 3699160, 43),
  ('2026-02-02 00:00:00'::timestamp, 'WJ', 2188799, 48),
  ('2026-02-02 00:00:00'::timestamp, 'VC', 16226, 0),
  ('2026-02-03 00:00:00'::timestamp, 'MD', 1557576, 27),
  ('2026-02-03 00:00:00'::timestamp, 'WJ', 1015465, 22),
  ('2026-02-03 00:00:00'::timestamp, 'VC', 24100, 0),
  ('2026-02-04 00:00:00'::timestamp, 'MD', 1626274, 9),
  ('2026-02-04 00:00:00'::timestamp, 'WJ', 2234511, 23),
  ('2026-02-04 00:00:00'::timestamp, 'VC', 102872, 0),
  ('2026-02-05 00:00:00'::timestamp, 'MD', 1515040, 15),
  ('2026-02-05 00:00:00'::timestamp, 'WJ', 2157953, 38),
  ('2026-02-05 00:00:00'::timestamp, 'VC', 64631, 2),
  ('2026-02-06 00:00:00'::timestamp, 'MD', 1531263, 8),
  ('2026-02-06 00:00:00'::timestamp, 'WJ', 1778326, 21),
  ('2026-02-06 00:00:00'::timestamp, 'VC', 43561, 0),
  ('2026-02-07 00:00:00'::timestamp, 'MD', 653465, 10),
  ('2026-02-07 00:00:00'::timestamp, 'WJ', 1389493, 28),
  ('2026-02-07 00:00:00'::timestamp, 'VC', 27887, 0),
  ('2026-02-08 00:00:00'::timestamp, 'MD', 804868, 0),
  ('2026-02-08 00:00:00'::timestamp, 'WJ', 1518872, 0),
  ('2026-02-08 00:00:00'::timestamp, 'VC', 18156, 0),
  ('2026-02-09 00:00:00'::timestamp, 'ER', 91097, 2),
  ('2026-02-09 00:00:00'::timestamp, 'YH', 11055, 1),
  ('2026-02-09 00:00:00'::timestamp, 'GC', 30602, 0),
  ('2026-02-09 00:00:00'::timestamp, 'PE', 12710, 0),
  ('2026-02-09 00:00:00'::timestamp, 'MD', 1419318, 22),
  ('2026-02-09 00:00:00'::timestamp, 'WJ', 1632398, 39),
  ('2026-02-09 00:00:00'::timestamp, 'VC', 52185, 0),
  ('2026-02-10 00:00:00'::timestamp, 'ER', 61843, 0),
  ('2026-02-10 00:00:00'::timestamp, 'YH', 26773, 0),
  ('2026-02-10 00:00:00'::timestamp, 'GC', 126404, 0),
  ('2026-02-10 00:00:00'::timestamp, 'PE', 32543, 0),
  ('2026-02-10 00:00:00'::timestamp, 'MD', 1260106, 20),
  ('2026-02-10 00:00:00'::timestamp, 'WJ', 2214344, 36),
  ('2026-02-10 00:00:00'::timestamp, 'VC', 30615, 1),
  ('2026-02-11 00:00:00'::timestamp, 'ER', 150285, 0),
  ('2026-02-11 00:00:00'::timestamp, 'YH', 61158, 1),
  ('2026-02-11 00:00:00'::timestamp, 'GC', 151938, 3),
  ('2026-02-11 00:00:00'::timestamp, 'PE', 12230, 0),
  ('2026-02-11 00:00:00'::timestamp, 'MD', 1331736, 8),
  ('2026-02-11 00:00:00'::timestamp, 'WJ', 2024311, 24),
  ('2026-02-11 00:00:00'::timestamp, 'VC', 25400, 0),
  ('2026-02-12 00:00:00'::timestamp, 'ER', 128738, 0),
  ('2026-02-12 00:00:00'::timestamp, 'YH', 83854, 1),
  ('2026-02-12 00:00:00'::timestamp, 'GC', 119327, 1),
  ('2026-02-12 00:00:00'::timestamp, 'PE', 8524, 0),
  ('2026-02-12 00:00:00'::timestamp, 'DR', 6117, 0),
  ('2026-02-12 00:00:00'::timestamp, 'MD', 1372949, 14),
  ('2026-02-12 00:00:00'::timestamp, 'WJ', 2579007, 30),
  ('2026-02-12 00:00:00'::timestamp, 'VC', 66853, 0),
  ('2026-02-13 00:00:00'::timestamp, 'ER', 51348, 1),
  ('2026-02-13 00:00:00'::timestamp, 'YH', 252062, 8),
  ('2026-02-13 00:00:00'::timestamp, 'GC', 96283, 1),
  ('2026-02-13 00:00:00'::timestamp, 'PE', 3131, 0),
  ('2026-02-13 00:00:00'::timestamp, 'DR', 18277, 0),
  ('2026-02-13 00:00:00'::timestamp, 'MD', 619051, 11),
  ('2026-02-13 00:00:00'::timestamp, 'WJ', 1777636, 28),
  ('2026-02-13 00:00:00'::timestamp, 'VC', 40884, 0),
  ('2026-02-14 00:00:00'::timestamp, 'ER', 5463, 1),
  ('2026-02-14 00:00:00'::timestamp, 'YH', 97351, 3),
  ('2026-02-14 00:00:00'::timestamp, 'GC', 115948, 3),
  ('2026-02-14 00:00:00'::timestamp, 'PE', 4, 0),
  ('2026-02-14 00:00:00'::timestamp, 'DR', 1168, 0),
  ('2026-02-14 00:00:00'::timestamp, 'MD', 346172, 4),
  ('2026-02-14 00:00:00'::timestamp, 'WJ', 1648208, 12),
  ('2026-02-14 00:00:00'::timestamp, 'VC', 58988, 0),
  ('2026-02-15 00:00:00'::timestamp, 'ER', 876, 0),
  ('2026-02-15 00:00:00'::timestamp, 'YH', 363549, 0),
  ('2026-02-15 00:00:00'::timestamp, 'GC', 350281, 0),
  ('2026-02-15 00:00:00'::timestamp, 'DR', 816, 0),
  ('2026-02-15 00:00:00'::timestamp, 'MD', 509376, 0),
  ('2026-02-15 00:00:00'::timestamp, 'WJ', 1864309, 0),
  ('2026-02-15 00:00:00'::timestamp, 'VC', 33081, 0),
  ('2026-02-16 00:00:00'::timestamp, 'ER', 10687, 1),
  ('2026-02-16 00:00:00'::timestamp, 'YH', 143442, 2),
  ('2026-02-16 00:00:00'::timestamp, 'GC', 254050, 6),
  ('2026-02-16 00:00:00'::timestamp, 'DR', 5111, 1),
  ('2026-02-16 00:00:00'::timestamp, 'MD', 972472, 23),
  ('2026-02-16 00:00:00'::timestamp, 'WJ', 1572322, 47),
  ('2026-02-16 00:00:00'::timestamp, 'VC', 33530, 2),
  ('2026-02-17 00:00:00'::timestamp, 'ER', 68034, 0),
  ('2026-02-17 00:00:00'::timestamp, 'YH', 10234, 0),
  ('2026-02-17 00:00:00'::timestamp, 'GC', 140599, 0),
  ('2026-02-17 00:00:00'::timestamp, 'DR', 8702, 0),
  ('2026-02-17 00:00:00'::timestamp, 'MD', 552693, 0),
  ('2026-02-17 00:00:00'::timestamp, 'WJ', 1545764, 0),
  ('2026-02-17 00:00:00'::timestamp, 'VC', 52453, 0),
  ('2026-02-18 00:00:00'::timestamp, 'ER', 43292, 4),
  ('2026-02-18 00:00:00'::timestamp, 'YH', 62614, 1),
  ('2026-02-18 00:00:00'::timestamp, 'GC', 467252, 10),
  ('2026-02-18 00:00:00'::timestamp, 'DR', 5281, 2),
  ('2026-02-18 00:00:00'::timestamp, 'MD', 376517, 15),
  ('2026-02-18 00:00:00'::timestamp, 'WJ', 1182061, 48),
  ('2026-02-18 00:00:00'::timestamp, 'VC', 54709, 0),
  ('2026-02-19 00:00:00'::timestamp, 'ER', 73990, 1),
  ('2026-02-19 00:00:00'::timestamp, 'YH', 3361, 0),
  ('2026-02-19 00:00:00'::timestamp, 'GC', 114817, 3),
  ('2026-02-19 00:00:00'::timestamp, 'DR', 14349, 2),
  ('2026-02-19 00:00:00'::timestamp, 'MD', 642656, 9),
  ('2026-02-19 00:00:00'::timestamp, 'WJ', 1464763, 23),
  ('2026-02-19 00:00:00'::timestamp, 'VC', 56732, 0),
  ('2026-02-20 00:00:00'::timestamp, 'ER', 73803, 0),
  ('2026-02-20 00:00:00'::timestamp, 'YH', 45534, 0),
  ('2026-02-20 00:00:00'::timestamp, 'GC', 121691, 3),
  ('2026-02-20 00:00:00'::timestamp, 'DR', 53161, 5),
  ('2026-02-20 00:00:00'::timestamp, 'MD', 545338, 8),
  ('2026-02-20 00:00:00'::timestamp, 'WJ', 1648606, 25),
  ('2026-02-20 00:00:00'::timestamp, 'VC', 245913, 0),
  ('2026-02-21 00:00:00'::timestamp, 'ER', 74706, 1),
  ('2026-02-21 00:00:00'::timestamp, 'YH', 3247, 2),
  ('2026-02-21 00:00:00'::timestamp, 'GC', 68160, 1),
  ('2026-02-21 00:00:00'::timestamp, 'DR', 80638, 2),
  ('2026-02-21 00:00:00'::timestamp, 'MD', 302127, 6),
  ('2026-02-21 00:00:00'::timestamp, 'WJ', 1374021, 17),
  ('2026-02-21 00:00:00'::timestamp, 'VC', 18043, 0),
  ('2026-02-22 00:00:00'::timestamp, 'ER', 79631, 0),
  ('2026-02-22 00:00:00'::timestamp, 'YH', 5495, 0),
  ('2026-02-22 00:00:00'::timestamp, 'GC', 56835, 0),
  ('2026-02-22 00:00:00'::timestamp, 'DR', 88879, 0),
  ('2026-02-22 00:00:00'::timestamp, 'MD', 369704, 0),
  ('2026-02-22 00:00:00'::timestamp, 'WJ', 1643911, 0),
  ('2026-02-22 00:00:00'::timestamp, 'VC', 10261, 0),
  ('2026-02-23 00:00:00'::timestamp, 'ER', 110210, 6),
  ('2026-02-23 00:00:00'::timestamp, 'YH', 27826, 3),
  ('2026-02-23 00:00:00'::timestamp, 'GC', 75430, 5),
  ('2026-02-23 00:00:00'::timestamp, 'DR', 63144, 4),
  ('2026-02-23 00:00:00'::timestamp, 'MD', 520915, 19),
  ('2026-02-23 00:00:00'::timestamp, 'WJ', 1670432, 51),
  ('2026-02-23 00:00:00'::timestamp, 'VC', 11077, 0),
  ('2026-02-24 00:00:00'::timestamp, 'ER', 96095, 3),
  ('2026-02-24 00:00:00'::timestamp, 'YH', 33099, 2),
  ('2026-02-24 00:00:00'::timestamp, 'GC', 63648, 4),
  ('2026-02-24 00:00:00'::timestamp, 'DR', 82407, 2),
  ('2026-02-24 00:00:00'::timestamp, 'MD', 865204, 7),
  ('2026-02-24 00:00:00'::timestamp, 'WJ', 1689841, 12),
  ('2026-02-24 00:00:00'::timestamp, 'VC', 23256, 0),
  ('2026-02-25 00:00:00'::timestamp, 'ER', 27425, 1),
  ('2026-02-25 00:00:00'::timestamp, 'YH', 3896, 1),
  ('2026-02-25 00:00:00'::timestamp, 'GC', 35651, 1),
  ('2026-02-25 00:00:00'::timestamp, 'DR', 115454, 10),
  ('2026-02-25 00:00:00'::timestamp, 'MD', 1250148, 13),
  ('2026-02-25 00:00:00'::timestamp, 'WJ', 1787486, 26),
  ('2026-02-25 00:00:00'::timestamp, 'VC', 8584, 0),
  ('2026-02-26 00:00:00'::timestamp, 'ER', 32122, 0),
  ('2026-02-26 00:00:00'::timestamp, 'YH', 10316, 0),
  ('2026-02-26 00:00:00'::timestamp, 'GC', 32806, 2),
  ('2026-02-26 00:00:00'::timestamp, 'DR', 64720, 2),
  ('2026-02-26 00:00:00'::timestamp, 'MD', 395926, 10),
  ('2026-02-26 00:00:00'::timestamp, 'WJ', 976791, 16),
  ('2026-02-26 00:00:00'::timestamp, 'VC', 11254, 0),
  ('2026-02-27 00:00:00'::timestamp, 'ER', 34933, 1),
  ('2026-02-27 00:00:00'::timestamp, 'YH', 6137, 0),
  ('2026-02-27 00:00:00'::timestamp, 'GC', 50943, 2),
  ('2026-02-27 00:00:00'::timestamp, 'DR', 113441, 8),
  ('2026-02-27 00:00:00'::timestamp, 'MD', 619715, 15),
  ('2026-02-27 00:00:00'::timestamp, 'WJ', 974208, 17),
  ('2026-02-27 00:00:00'::timestamp, 'VC', 6980, 0),
  ('2026-02-28 00:00:00'::timestamp, 'ER', 36215, 2),
  ('2026-02-28 00:00:00'::timestamp, 'YH', 1172, 0),
  ('2026-02-28 00:00:00'::timestamp, 'GC', 19047, 1),
  ('2026-02-28 00:00:00'::timestamp, 'DR', 149798, 3),
  ('2026-02-28 00:00:00'::timestamp, 'MD', 669019, 12),
  ('2026-02-28 00:00:00'::timestamp, 'WJ', 687482, 12),
  ('2026-02-28 00:00:00'::timestamp, 'VC', 12508, 0)
)
INSERT INTO "AdSpendItem" (
  "id", "adSpendLogId", "productId", "adAccountId",
  "jumlahAi", "amountSpent", "form", "pembelian"
)
SELECT
  gen_random_uuid()::text,
  asl."id",
  p."id",
  aa."id",
  1,
  d."biaya",
  0,
  d."pembelian"
FROM data_iklan d
JOIN "SalesSource" ss ON ss."name" = 'MP - SHOPEE'
JOIN "AdSpendLog" asl ON asl."sourceId" = ss."id" AND asl."date" = d."tanggal"
JOIN "Product" p ON p."sku" = d."sku"
JOIN "AdAccount" aa ON aa."sourceId" = ss."id" AND aa."accountName" = 'TOKOHERBALCHINA';

-- Update total biaya harian
UPDATE "AdSpendLog" asl
SET "amountSpent" = COALESCE(x.total, 0)
FROM (
  SELECT "adSpendLogId", SUM("amountSpent") AS total
  FROM "AdSpendItem"
  GROUP BY "adSpendLogId"
) x
WHERE asl."id" = x."adSpendLogId"
AND asl."sourceId" = (SELECT "id" FROM "SalesSource" WHERE "name" = 'MP - SHOPEE')
AND asl."date" >= '2026-02-01'::timestamp
AND asl."date" < '2026-03-01'::timestamp;

-- Pastikan SalesSource ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "SalesSource" WHERE "name" = 'MP - TIKTOK') THEN
    INSERT INTO "SalesSource" ("id", "name") VALUES (gen_random_uuid()::text, 'MP - TIKTOK');
  END IF;
END $$;

-- Pastikan AdAccount ada
INSERT INTO "AdAccount" (
  "id", "sourceId", "groupName", "accountName", "productInfo", "status", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, ss."id", 'MARKETPLACE', 'TIKTOKOfficial', 'ALL', 'ON', NOW(), NOW()
FROM "SalesSource" ss
WHERE ss."name" = 'MP - TIKTOK'
AND NOT EXISTS (
  SELECT 1 FROM "AdAccount" aa WHERE aa."sourceId" = ss."id" AND aa."accountName" = 'TIKTOKOfficial'
);

-- Pastikan AdSpendLog harian ada
INSERT INTO "AdSpendLog" ("id", "date", "sourceId", "amountSpent")
SELECT gen_random_uuid()::text, d."tanggal", ss."id", 0
FROM "SalesSource" ss
CROSS JOIN (
  SELECT generate_series('2026-02-01'::timestamp, '2026-02-28'::timestamp, '1 day'::interval) AS "tanggal"
) AS d
WHERE ss."name" = 'MP - TIKTOK'
ON CONFLICT ("date", "sourceId") DO NOTHING;

-- Bersihkan data lama
DELETE FROM "AdSpendItem" asi
USING "AdSpendLog" asl, "SalesSource" ss, "Product" p, "AdAccount" aa
WHERE asi."adSpendLogId" = asl."id"
AND asl."sourceId" = ss."id"
AND asi."productId" = p."id"
AND asi."adAccountId" = aa."id"
AND ss."name" = 'MP - TIKTOK'
AND p."sku" IN ('ER', 'YH', 'GC', 'PE', 'DR', 'MD', 'WJ', 'VC')
AND aa."accountName" = 'TIKTOKOfficial'
AND asl."date" >= '2026-02-01'::timestamp
AND asl."date" < '2026-03-01'::timestamp;

-- Insert Data
WITH data_iklan("tanggal", "sku", "biaya", "pembelian") AS (
  VALUES
  ('2026-02-01 00:00:00'::timestamp, 'MD', 0, 10),
  ('2026-02-01 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-02 00:00:00'::timestamp, 'MD', 0, 17),
  ('2026-02-02 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-03 00:00:00'::timestamp, 'MD', 0, 11),
  ('2026-02-03 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-04 00:00:00'::timestamp, 'MD', 0, 8),
  ('2026-02-04 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-05 00:00:00'::timestamp, 'MD', 0, 14),
  ('2026-02-06 00:00:00'::timestamp, 'MD', 0, 15),
  ('2026-02-06 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-07 00:00:00'::timestamp, 'MD', 0, 5),
  ('2026-02-08 00:00:00'::timestamp, 'MD', 0, 6),
  ('2026-02-09 00:00:00'::timestamp, 'MD', 0, 13),
  ('2026-02-10 00:00:00'::timestamp, 'ER', 0, 1),
  ('2026-02-10 00:00:00'::timestamp, 'MD', 0, 9),
  ('2026-02-11 00:00:00'::timestamp, 'MD', 0, 9),
  ('2026-02-12 00:00:00'::timestamp, 'MD', 0, 5),
  ('2026-02-13 00:00:00'::timestamp, 'MD', 0, 9),
  ('2026-02-13 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-14 00:00:00'::timestamp, 'MD', 0, 7),
  ('2026-02-15 00:00:00'::timestamp, 'ER', 0, 2),
  ('2026-02-15 00:00:00'::timestamp, 'MD', 0, 2),
  ('2026-02-15 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-16 00:00:00'::timestamp, 'GC', 0, 2),
  ('2026-02-16 00:00:00'::timestamp, 'MD', 0, 8),
  ('2026-02-17 00:00:00'::timestamp, 'MD', 0, 5),
  ('2026-02-18 00:00:00'::timestamp, 'MD', 0, 9),
  ('2026-02-19 00:00:00'::timestamp, 'GC', 0, 2),
  ('2026-02-19 00:00:00'::timestamp, 'MD', 0, 6),
  ('2026-02-20 00:00:00'::timestamp, 'MD', 0, 3),
  ('2026-02-21 00:00:00'::timestamp, 'MD', 0, 4),
  ('2026-02-21 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-22 00:00:00'::timestamp, 'MD', 0, 4),
  ('2026-02-22 00:00:00'::timestamp, 'WJ', 0, 2),
  ('2026-02-23 00:00:00'::timestamp, 'MD', 0, 4),
  ('2026-02-24 00:00:00'::timestamp, 'YH', 0, 1),
  ('2026-02-24 00:00:00'::timestamp, 'DR', 0, 1),
  ('2026-02-24 00:00:00'::timestamp, 'MD', 0, 5),
  ('2026-02-25 00:00:00'::timestamp, 'DR', 0, 1),
  ('2026-02-25 00:00:00'::timestamp, 'MD', 0, 8),
  ('2026-02-26 00:00:00'::timestamp, 'DR', 0, 1),
  ('2026-02-26 00:00:00'::timestamp, 'MD', 0, 8),
  ('2026-02-26 00:00:00'::timestamp, 'WJ', 0, 1),
  ('2026-02-27 00:00:00'::timestamp, 'MD', 0, 2),
  ('2026-02-28 00:00:00'::timestamp, 'MD', 0, 10)
)
INSERT INTO "AdSpendItem" (
  "id", "adSpendLogId", "productId", "adAccountId",
  "jumlahAi", "amountSpent", "form", "pembelian"
)
SELECT
  gen_random_uuid()::text,
  asl."id",
  p."id",
  aa."id",
  1,
  d."biaya",
  0,
  d."pembelian"
FROM data_iklan d
JOIN "SalesSource" ss ON ss."name" = 'MP - TIKTOK'
JOIN "AdSpendLog" asl ON asl."sourceId" = ss."id" AND asl."date" = d."tanggal"
JOIN "Product" p ON p."sku" = d."sku"
JOIN "AdAccount" aa ON aa."sourceId" = ss."id" AND aa."accountName" = 'TIKTOKOfficial';

-- Update total biaya harian
UPDATE "AdSpendLog" asl
SET "amountSpent" = COALESCE(x.total, 0)
FROM (
  SELECT "adSpendLogId", SUM("amountSpent") AS total
  FROM "AdSpendItem"
  GROUP BY "adSpendLogId"
) x
WHERE asl."id" = x."adSpendLogId"
AND asl."sourceId" = (SELECT "id" FROM "SalesSource" WHERE "name" = 'MP - TIKTOK')
AND asl."date" >= '2026-02-01'::timestamp
AND asl."date" < '2026-03-01'::timestamp;

-- Validasi Akhir
DO $$
DECLARE
  v_rows INT;
  v_biaya BIGINT;
  v_pembelian INT;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(asi."amountSpent"), 0)::BIGINT, COALESCE(SUM(asi."pembelian"), 0)::INT
  INTO v_rows, v_biaya, v_pembelian
  FROM "AdSpendItem" asi
  JOIN "AdSpendLog" asl ON asl."id" = asi."adSpendLogId"
  JOIN "SalesSource" ss ON ss."id" = asl."sourceId"
  JOIN "Product" p ON p."id" = asi."productId"
  JOIN "AdAccount" aa ON aa."id" = asi."adAccountId"
  WHERE ss."name" IN ('MP - SHOPEE', 'MP - TIKTOK')
  AND p."sku" IN ('ER', 'YH', 'GC', 'PE', 'DR', 'MD', 'WJ', 'VC')
  AND aa."accountName" IN ('TOKOHERBALCHINA', 'TIKTOKOfficial')
  AND asl."date" >= '2026-02-01'::timestamp
  AND asl."date" < '2026-03-01'::timestamp;

  IF v_rows <> 213 THEN
    RAISE EXCEPTION 'Row salah: %, harus 213', v_rows;
  END IF;

  IF v_biaya <> 80776734 THEN
    RAISE EXCEPTION 'Total biaya salah: %, harus 80776734', v_biaya;
  END IF;

  IF v_pembelian <> 1350 THEN
    RAISE EXCEPTION 'Total pembelian salah: %, harus 1350', v_pembelian;
  END IF;
END $$;

COMMIT;
