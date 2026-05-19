const fs = require('fs');
const content = fs.readFileSync('/home/1m.clicco.co.id/public_html/IMPORT DATA/mp_china_shopee.csv', 'utf-8');
const lines = content.split('\n').map(l => l.trim());

// Columns for each product
// MD (Maxdales): Col 35-39 (TANGGAL, AKUN IKLAN, JUMLAH AI, BIAYA, PEMBELIAN)
// WJ (Wanjiankang): Col 42-46
// VC (Vitcore): Col 49-53

const products = [
  { sku: 'MD', startCol: 35 },
  { sku: 'WJ', startCol: 42 },
  { sku: 'VC', startCol: 49 },
];

let sql = `BEGIN;

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
`;

let values = [];

for (let i = 5; i <= 32; i++) { // Lines 6 to 33 (index 5 to 32)
  const cols = lines[i].split(',');
  const day = i - 4;
  const dateStr = `2026-02-${day.toString().padStart(2, '0')} 00:00:00`;
  
  for (const p of products) {
    const biayaStr = cols[p.startCol + 3];
    let pembelianStr = cols[p.startCol + 4];
    
    // Parse biaya (e.g. " Rp 1.876.177 ")
    if (!biayaStr || !biayaStr.includes('Rp')) continue;
    let biaya = parseInt(biayaStr.replace(/[^0-9]/g, ''));
    if (isNaN(biaya)) biaya = 0;
    
    // Parse pembelian
    let pembelian = parseInt(pembelianStr);
    if (isNaN(pembelian)) pembelian = 0;
    
    if (biaya > 0 || pembelian > 0) {
      values.push(`  ('${dateStr}'::timestamp, '${p.sku}', ${biaya}, ${pembelian})`);
    }
  }
}

sql += values.join(',\n');

sql += `
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
`;

fs.writeFileSync('/home/1m.clicco.co.id/public_html/IMPORT DATA/insert_mp_shopee.sql', sql);
console.log("SQL script generated at insert_mp_shopee.sql");
