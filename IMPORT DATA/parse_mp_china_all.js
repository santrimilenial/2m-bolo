const fs = require('fs');
const content = fs.readFileSync('/home/1m.clicco.co.id/public_html/IMPORT DATA/mp_china_shopee.csv', 'utf-8');
const lines = content.split('\n').map(l => l.trim());

const products = [
  { sku: 'ER', name: 'eracee', startCol: 0 },
  { sku: 'YH', name: 'ye huang su', startCol: 7 },
  { sku: 'GC', name: 'gentle care', startCol: 14 },
  { sku: 'PE', name: 'pearl eye', startCol: 21 },
  { sku: 'DR', name: 'dierdre', startCol: 28 },
  { sku: 'MD', name: 'maxdales', startCol: 35 },
  { sku: 'WJ', name: 'wanjiankang', startCol: 42 },
  { sku: 'VC', name: 'vitcore', startCol: 49 },
];

let sql = 'BEGIN;\n\n';

const sources = [
  { name: 'MP - SHOPEE', account: 'TOKOHERBALCHINA', startLine: 5, endLine: 32 },
  { name: 'MP - TIKTOK', account: 'TIKTOKOfficial', startLine: 42, endLine: 69 }
];

let totalCostAll = 0;
let totalPembelianAll = 0;
let totalRowsAll = 0;

for (const src of sources) {
  sql += `
-- Pastikan SalesSource ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "SalesSource" WHERE "name" = '${src.name}') THEN
    INSERT INTO "SalesSource" ("id", "name") VALUES (gen_random_uuid()::text, '${src.name}');
  END IF;
END $$;

-- Pastikan AdAccount ada
INSERT INTO "AdAccount" (
  "id", "sourceId", "groupName", "accountName", "productInfo", "status", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, ss."id", 'MARKETPLACE', '${src.account}', 'ALL', 'ON', NOW(), NOW()
FROM "SalesSource" ss
WHERE ss."name" = '${src.name}'
AND NOT EXISTS (
  SELECT 1 FROM "AdAccount" aa WHERE aa."sourceId" = ss."id" AND aa."accountName" = '${src.account}'
);

-- Pastikan AdSpendLog harian ada
INSERT INTO "AdSpendLog" ("id", "date", "sourceId", "amountSpent")
SELECT gen_random_uuid()::text, d."tanggal", ss."id", 0
FROM "SalesSource" ss
CROSS JOIN (
  SELECT generate_series('2026-02-01'::timestamp, '2026-02-28'::timestamp, '1 day'::interval) AS "tanggal"
) AS d
WHERE ss."name" = '${src.name}'
ON CONFLICT ("date", "sourceId") DO NOTHING;

-- Bersihkan data lama
DELETE FROM "AdSpendItem" asi
USING "AdSpendLog" asl, "SalesSource" ss, "Product" p, "AdAccount" aa
WHERE asi."adSpendLogId" = asl."id"
AND asl."sourceId" = ss."id"
AND asi."productId" = p."id"
AND asi."adAccountId" = aa."id"
AND ss."name" = '${src.name}'
AND p."sku" IN ('ER', 'YH', 'GC', 'PE', 'DR', 'MD', 'WJ', 'VC')
AND aa."accountName" = '${src.account}'
AND asl."date" >= '2026-02-01'::timestamp
AND asl."date" < '2026-03-01'::timestamp;

-- Insert Data
WITH data_iklan("tanggal", "sku", "biaya", "pembelian") AS (
  VALUES
`;

  let values = [];

  for (let i = src.startLine; i <= src.endLine; i++) {
    const cols = lines[i].split(',');
    const day = i - src.startLine + 1;
    const dateStr = `2026-02-${day.toString().padStart(2, '0')} 00:00:00`;
    
    for (const p of products) {
      if (p.startCol + 4 >= cols.length && src.name !== 'MP - TIKTOK') continue;
      
      let biayaStr = cols[p.startCol + 3];
      let pembelianStr = cols[p.startCol + 4];
      
      let biaya = 0;
      if (biayaStr && biayaStr.includes('Rp')) {
        biaya = parseInt(biayaStr.replace(/[^0-9]/g, ''));
        if (isNaN(biaya)) biaya = 0;
      }
      
      let pembelian = 0;
      if (pembelianStr) {
        pembelian = parseInt(pembelianStr);
        if (isNaN(pembelian)) pembelian = 0;
      }
      
      if (biaya > 0 || pembelian > 0) {
        values.push(`  ('${dateStr}'::timestamp, '${p.sku}', ${biaya}, ${pembelian})`);
        totalCostAll += biaya;
        totalPembelianAll += pembelian;
        totalRowsAll++;
      }
    }
  }

  if (values.length > 0) {
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
JOIN "SalesSource" ss ON ss."name" = '${src.name}'
JOIN "AdSpendLog" asl ON asl."sourceId" = ss."id" AND asl."date" = d."tanggal"
JOIN "Product" p ON p."sku" = d."sku"
JOIN "AdAccount" aa ON aa."sourceId" = ss."id" AND aa."accountName" = '${src.account}';
`;
  } else {
    sql += `  ('2026-02-01 00:00:00'::timestamp, 'NONE', 0, 0)\n) SELECT 1 WHERE false;\n`;
  }

  sql += `
-- Update total biaya harian
UPDATE "AdSpendLog" asl
SET "amountSpent" = COALESCE(x.total, 0)
FROM (
  SELECT "adSpendLogId", SUM("amountSpent") AS total
  FROM "AdSpendItem"
  GROUP BY "adSpendLogId"
) x
WHERE asl."id" = x."adSpendLogId"
AND asl."sourceId" = (SELECT "id" FROM "SalesSource" WHERE "name" = '${src.name}')
AND asl."date" >= '2026-02-01'::timestamp
AND asl."date" < '2026-03-01'::timestamp;
`;
}

sql += `
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

  IF v_rows <> ${totalRowsAll} THEN
    RAISE EXCEPTION 'Row salah: %, harus ${totalRowsAll}', v_rows;
  END IF;

  IF v_biaya <> ${totalCostAll} THEN
    RAISE EXCEPTION 'Total biaya salah: %, harus ${totalCostAll}', v_biaya;
  END IF;

  IF v_pembelian <> ${totalPembelianAll} THEN
    RAISE EXCEPTION 'Total pembelian salah: %, harus ${totalPembelianAll}', v_pembelian;
  END IF;
END $$;
`;

sql += '\nCOMMIT;\n';

fs.writeFileSync('/home/1m.clicco.co.id/public_html/IMPORT DATA/insert_mp_china_all.sql', sql);
console.log('Script generated at insert_mp_china_all.sql');
console.log({ totalRowsAll, totalCostAll, totalPembelianAll });
