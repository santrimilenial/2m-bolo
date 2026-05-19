BEGIN;

-- Step 1: Pindahkan data form & pembelian dari baris summary ke baris biaya yang sesuai (baris pertama per produk per tanggal)
WITH summary_rows AS (
  SELECT a."id" AS summary_id, a."adSpendLogId", a."productId", a."form", a."pembelian"
  FROM "AdSpendItem" a
  WHERE a."adAccountId" IS NULL AND a."amountSpent" = 0 AND (a."form" > 0 OR a."pembelian" > 0)
),
cost_rows AS (
  SELECT a."id" AS cost_id, a."adSpendLogId", a."productId",
         ROW_NUMBER() OVER(PARTITION BY a."adSpendLogId", a."productId" ORDER BY a."amountSpent" DESC) as rn
  FROM "AdSpendItem" a
  WHERE a."adAccountId" IS NOT NULL
),
matched AS (
  SELECT s.summary_id, s."form", s."pembelian", c.cost_id
  FROM summary_rows s
  JOIN cost_rows c ON s."adSpendLogId" = c."adSpendLogId" AND s."productId" = c."productId" AND c.rn = 1
)
UPDATE "AdSpendItem" a
SET "form" = m."form",
    "pembelian" = m."pembelian"
FROM matched m
WHERE a."id" = m.cost_id;

-- Step 2: Hapus baris summary yang datanya sudah dipindahkan ke baris biaya
WITH summary_rows AS (
  SELECT a."id" AS summary_id, a."adSpendLogId", a."productId"
  FROM "AdSpendItem" a
  WHERE a."adAccountId" IS NULL AND a."amountSpent" = 0
),
cost_rows AS (
  SELECT a."id" AS cost_id, a."adSpendLogId", a."productId",
         ROW_NUMBER() OVER(PARTITION BY a."adSpendLogId", a."productId" ORDER BY a."amountSpent" DESC) as rn
  FROM "AdSpendItem" a
  WHERE a."adAccountId" IS NOT NULL
),
matched AS (
  SELECT s.summary_id
  FROM summary_rows s
  JOIN cost_rows c ON s."adSpendLogId" = c."adSpendLogId" AND s."productId" = c."productId" AND c.rn = 1
)
DELETE FROM "AdSpendItem"
WHERE "id" IN (SELECT summary_id FROM matched);

COMMIT;
