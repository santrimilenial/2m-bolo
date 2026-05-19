BEGIN;


DELETE FROM "StockMutation"
WHERE "description" LIKE '[MIGRASI PRODUK AWAL]%';

INSERT INTO "Product" ("id", "sku", "name", "stock", "price", "cogs", "isDeleted")
VALUES
(gen_random_uuid()::text, 'KK', 'KANGPER KAPSUL', 1000, 0, 0, false),
(gen_random_uuid()::text, 'KT', 'KANGPER TETES', 1000, 0, 0, false),
(gen_random_uuid()::text, 'WJ', 'WAN JIANKANG', 1000, 0, 0, false),
(gen_random_uuid()::text, 'LL3', 'LI LIANG 30', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MK', 'MINYAK KEMIRI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'KU', 'KUMIS KUCING', 1000, 0, 0, false),
(gen_random_uuid()::text, 'ZK', 'ZHIKANG', 1000, 0, 0, false),
(gen_random_uuid()::text, 'XA', 'XIMONTH AURIDRIT', 1000, 0, 0, false),
(gen_random_uuid()::text, 'XE', 'XIMONTH ECHO EASE', 1000, 0, 0, false),
(gen_random_uuid()::text, 'CX', 'CORTEXI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'PP', 'PRIMAX PRO', 1000, 0, 0, false),
(gen_random_uuid()::text, 'SZ', 'SHENZANG', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MPJB', 'MADU JAMBU BIJI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'ANH', 'MADU HITAM', 1000, 0, 0, false),
(gen_random_uuid()::text, 'NC', 'NIROCI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'ED', 'EAR RINGING', 1000, 0, 0, false),
(gen_random_uuid()::text, 'HR', 'HEMOROLIT', 1000, 0, 0, false),
(gen_random_uuid()::text, 'WJR', 'WAN JIANKANG (RUSAK)', 1000, 0, 0, false),
(gen_random_uuid()::text, 'RT', 'RATULI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'BB', 'BILBERRY', 1000, 0, 0, false),
(gen_random_uuid()::text, 'TD', 'TINNIDROP', 1000, 0, 0, false),
(gen_random_uuid()::text, 'LL6', 'LI LIANG 60', 1000, 0, 0, false),
(gen_random_uuid()::text, 'ZH3', 'ZHI WU 30', 1000, 0, 0, false),
(gen_random_uuid()::text, 'ZH6', 'ZHI WU 60', 1000, 0, 0, false),
(gen_random_uuid()::text, 'BF3', 'BAOCHI FEI 30', 1000, 0, 0, false),
(gen_random_uuid()::text, 'BF6', 'BAOCHI FEI 60', 1000, 0, 0, false),
(gen_random_uuid()::text, 'EC', 'EAR CLEANER', 1000, 0, 0, false),
(gen_random_uuid()::text, 'EP', 'EAR PLUG', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MG', 'MINI GOLD', 1000, 0, 0, false),
(gen_random_uuid()::text, 'GK', 'JAMU', 1000, 0, 0, false),
(gen_random_uuid()::text, 'GL', 'GELANG KESEHATAN', 1000, 0, 0, false),
(gen_random_uuid()::text, 'WJM', 'WAN JIANKANG (MAKASAR)', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MP', 'MAPROFIT', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MD', 'MAXDALES', 1000, 0, 0, false),
(gen_random_uuid()::text, 'AT', 'ATEXIM', 1000, 0, 0, false),
(gen_random_uuid()::text, 'BK', 'BOLA KESEHATAN', 1000, 0, 0, false),
(gen_random_uuid()::text, 'LP', 'LIMAXPRO', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MDR', 'MAXDALES (RUSAK)', 1000, 0, 0, false),
(gen_random_uuid()::text, 'ALP', 'ROLL PIJAT', 1000, 0, 0, false),
(gen_random_uuid()::text, 'BM', 'BUKU MAXDALES', 1000, 0, 0, false),
(gen_random_uuid()::text, 'BW', 'BUKU WJ', 1000, 0, 0, false),
(gen_random_uuid()::text, 'VC', 'VITCORE', 1000, 0, 0, false),
(gen_random_uuid()::text, 'DM', 'DOMPET', 1000, 0, 0, false),
(gen_random_uuid()::text, 'DK', 'DEKER KAKI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'AK', 'KESET TERAPI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'APE', 'ALAT PIJAT', 1000, 0, 0, false),
(gen_random_uuid()::text, 'APK', 'PIJAK KAKI', 1000, 0, 0, false),
(gen_random_uuid()::text, 'KL', 'KALENDER MAX', 1000, 0, 0, false),
(gen_random_uuid()::text, 'TEM', 'TEMBAK PIJIT', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MAXS', 'SAMPLE MAXDALES', 1000, 0, 0, false),
(gen_random_uuid()::text, 'KW', 'KALENDER WJ', 1000, 0, 0, false),
(gen_random_uuid()::text, 'LC', 'LINGCARE', 1000, 0, 0, false),
(gen_random_uuid()::text, 'KD', 'KONDOM', 1000, 0, 0, false),
(gen_random_uuid()::text, 'MAX', 'MAXDALES BATCH SALAH', 1000, 0, 0, false),
(gen_random_uuid()::text, 'GC', 'GENTLE CARE', 1000, 0, 0, false),
(gen_random_uuid()::text, 'YH', 'YE HUANG SUE', 1000, 0, 0, false),
(gen_random_uuid()::text, 'ER', 'ERACEE', 1000, 0, 0, false)
ON CONFLICT ("sku") DO UPDATE SET
"name" = EXCLUDED."name",
"stock" = 1000,
"price" = 0,
"cogs" = 0,
"isDeleted" = false;

INSERT INTO "StockMutation" ("id", "productId", "date", "qty", "type", "description", "createdAt")
SELECT
  gen_random_uuid()::text,
  p."id",
  '2026-02-01T00:00:00.000Z'::timestamp,
  1000,
  'ADD',
  '[MIGRASI PRODUK AWAL] Stok awal 1000 pcs untuk ' || p."sku" || ' - ' || p."name",
  NOW()
FROM "Product" p
WHERE p."sku" IN (
  'KK','KT','WJ','LL3','MK','KU','ZK','XA','XE','CX','PP','SZ','MPJB','ANH','NC','ED','HR','WJR',
  'RT','BB','TD','LL6','ZH3','ZH6','BF3','BF6','EC','EP','MG','GK','GL','WJM','MP','MD','AT','BK',
  'LP','MDR','ALP','BM','BW','VC','DM','DK','AK','APE','APK','KL','TEM','MAXS','KW','LC','KD','MAX',
  'GC','YH','ER'
);

COMMIT;
