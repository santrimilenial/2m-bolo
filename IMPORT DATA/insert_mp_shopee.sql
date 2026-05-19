BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "SalesSource" WHERE "name" = 'MP - SHOPEE') THEN
    RAISE EXCEPTION 'SalesSource MP - SHOPEE tidak ditemukan';
  END IF;
END $$;

-- Pastikan AdAccount ada
INSERT INTO "AdAccount" (
  "id", "sourceId", "groupName", "accountName", "productInfo", "status", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, ss."id", 'SHOPEE', 'TOKOHERBALCHINA', 'MD,WJ,VC', 'ON', NOW(), NOW()
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
AND p."sku" IN ('MD', 'WJ', 'VC')
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
  ('2026-02-09 00:00:00'::timestamp, 'MD', 1419318, 22),
  ('2026-02-09 00:00:00'::timestamp, 'WJ', 1632398, 39),
  ('2026-02-09 00:00:00'::timestamp, 'VC', 52185, 0),
  ('2026-02-10 00:00:00'::timestamp, 'MD', 1260106, 20),
  ('2026-02-10 00:00:00'::timestamp, 'WJ', 2214344, 36),
  ('2026-02-10 00:00:00'::timestamp, 'VC', 30615, 1),
  ('2026-02-11 00:00:00'::timestamp, 'MD', 1331736, 8),
  ('2026-02-11 00:00:00'::timestamp, 'WJ', 2024311, 24),
  ('2026-02-11 00:00:00'::timestamp, 'VC', 25400, 0),
  ('2026-02-12 00:00:00'::timestamp, 'MD', 1372949, 14),
  ('2026-02-12 00:00:00'::timestamp, 'WJ', 2579007, 30),
  ('2026-02-12 00:00:00'::timestamp, 'VC', 66853, 0),
  ('2026-02-13 00:00:00'::timestamp, 'MD', 619051, 11),
  ('2026-02-13 00:00:00'::timestamp, 'WJ', 1777636, 28),
  ('2026-02-13 00:00:00'::timestamp, 'VC', 40884, 0),
  ('2026-02-14 00:00:00'::timestamp, 'MD', 346172, 4),
  ('2026-02-14 00:00:00'::timestamp, 'WJ', 1648208, 12),
  ('2026-02-14 00:00:00'::timestamp, 'VC', 58988, 0),
  ('2026-02-15 00:00:00'::timestamp, 'MD', 509376, 0),
  ('2026-02-15 00:00:00'::timestamp, 'WJ', 1864309, 0),
  ('2026-02-15 00:00:00'::timestamp, 'VC', 33081, 0),
  ('2026-02-16 00:00:00'::timestamp, 'MD', 972472, 23),
  ('2026-02-16 00:00:00'::timestamp, 'WJ', 1572322, 47),
  ('2026-02-16 00:00:00'::timestamp, 'VC', 33530, 2),
  ('2026-02-17 00:00:00'::timestamp, 'MD', 552693, 0),
  ('2026-02-17 00:00:00'::timestamp, 'WJ', 1545764, 0),
  ('2026-02-17 00:00:00'::timestamp, 'VC', 52453, 0),
  ('2026-02-18 00:00:00'::timestamp, 'MD', 376517, 15),
  ('2026-02-18 00:00:00'::timestamp, 'WJ', 1182061, 48),
  ('2026-02-18 00:00:00'::timestamp, 'VC', 54709, 0),
  ('2026-02-19 00:00:00'::timestamp, 'MD', 642656, 9),
  ('2026-02-19 00:00:00'::timestamp, 'WJ', 1464763, 23),
  ('2026-02-19 00:00:00'::timestamp, 'VC', 56732, 0),
  ('2026-02-20 00:00:00'::timestamp, 'MD', 545338, 8),
  ('2026-02-20 00:00:00'::timestamp, 'WJ', 1648606, 25),
  ('2026-02-20 00:00:00'::timestamp, 'VC', 245913, 0),
  ('2026-02-21 00:00:00'::timestamp, 'MD', 302127, 6),
  ('2026-02-21 00:00:00'::timestamp, 'WJ', 1374021, 17),
  ('2026-02-21 00:00:00'::timestamp, 'VC', 18043, 0),
  ('2026-02-22 00:00:00'::timestamp, 'MD', 369704, 0),
  ('2026-02-22 00:00:00'::timestamp, 'WJ', 1643911, 0),
  ('2026-02-22 00:00:00'::timestamp, 'VC', 10261, 0),
  ('2026-02-23 00:00:00'::timestamp, 'MD', 520915, 19),
  ('2026-02-23 00:00:00'::timestamp, 'WJ', 1670432, 51),
  ('2026-02-23 00:00:00'::timestamp, 'VC', 11077, 0),
  ('2026-02-24 00:00:00'::timestamp, 'MD', 865204, 7),
  ('2026-02-24 00:00:00'::timestamp, 'WJ', 1689841, 12),
  ('2026-02-24 00:00:00'::timestamp, 'VC', 23256, 0),
  ('2026-02-25 00:00:00'::timestamp, 'MD', 1250148, 13),
  ('2026-02-25 00:00:00'::timestamp, 'WJ', 1787486, 26),
  ('2026-02-25 00:00:00'::timestamp, 'VC', 8584, 0),
  ('2026-02-26 00:00:00'::timestamp, 'MD', 395926, 10),
  ('2026-02-26 00:00:00'::timestamp, 'WJ', 976791, 16),
  ('2026-02-26 00:00:00'::timestamp, 'VC', 11254, 0),
  ('2026-02-27 00:00:00'::timestamp, 'MD', 619715, 15),
  ('2026-02-27 00:00:00'::timestamp, 'WJ', 974208, 17),
  ('2026-02-27 00:00:00'::timestamp, 'VC', 6980, 0),
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

COMMIT;

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
  WHERE ss."name" = 'MP - SHOPEE'
  AND p."sku" IN ('MD', 'WJ', 'VC')
  AND aa."accountName" = 'TOKOHERBALCHINA'
  AND asl."date" >= '2026-02-01'::timestamp
  AND asl."date" < '2026-03-01'::timestamp;

  IF v_rows <> 84 THEN
    RAISE EXCEPTION 'Row salah: %, harus 84', v_rows;
  END IF;

  IF v_biaya <> 74841449 THEN
    RAISE EXCEPTION 'Total biaya salah: %, harus 74841449', v_biaya;
  END IF;

  IF v_pembelian <> 976 THEN
    RAISE EXCEPTION 'Total pembelian salah: %, harus 976', v_pembelian;
  END IF;
END $$;
