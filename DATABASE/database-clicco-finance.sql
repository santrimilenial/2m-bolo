--
-- PostgreSQL database dump
--

\restrict CLeyXbBLwfpsPTRqCgFTsAJqrkyvub8GcA6IqdXHxuRJfvu7v7gM7vWR76LTNko

-- Dumped from database version 13.23
-- Dumped by pg_dump version 13.23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CategoryType; Type: TYPE; Schema: public; Owner: clicco
--

CREATE TYPE public."CategoryType" AS ENUM (
    'INCOME',
    'EXPENSE'
);


ALTER TYPE public."CategoryType" OWNER TO clicco;

--
-- Name: DebtMutationType; Type: TYPE; Schema: public; Owner: clicco
--

CREATE TYPE public."DebtMutationType" AS ENUM (
    'ADD_DEBT',
    'PAYMENT'
);


ALTER TYPE public."DebtMutationType" OWNER TO clicco;

--
-- Name: DebtType; Type: TYPE; Schema: public; Owner: clicco
--

CREATE TYPE public."DebtType" AS ENUM (
    'HUTANG',
    'PIUTANG'
);


ALTER TYPE public."DebtType" OWNER TO clicco;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: clicco
--

CREATE TYPE public."Role" AS ENUM (
    'OWNER',
    'ADMIN',
    'STAFF'
);


ALTER TYPE public."Role" OWNER TO clicco;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: clicco
--

CREATE TYPE public."TransactionType" AS ENUM (
    'INCOME',
    'EXPENSE'
);


ALTER TYPE public."TransactionType" OWNER TO clicco;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AdAccount; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."AdAccount" (
    id text NOT NULL,
    "sourceId" text NOT NULL,
    "groupName" text NOT NULL,
    "accountName" text NOT NULL,
    "productInfo" text NOT NULL,
    status text DEFAULT 'ON'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdAccount" OWNER TO clicco;

--
-- Name: AdAccountTopUp; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."AdAccountTopUp" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "adAccountId" text NOT NULL,
    amount double precision NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AdAccountTopUp" OWNER TO clicco;

--
-- Name: AdSpendItem; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."AdSpendItem" (
    id text NOT NULL,
    "adSpendLogId" text NOT NULL,
    "productId" text NOT NULL,
    "jumlahAi" integer DEFAULT 0 NOT NULL,
    "amountSpent" double precision NOT NULL,
    form integer DEFAULT 0 NOT NULL,
    pembelian integer DEFAULT 0 NOT NULL,
    "adAccountId" text
);


ALTER TABLE public."AdSpendItem" OWNER TO clicco;

--
-- Name: AdSpendLog; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."AdSpendLog" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "sourceId" text NOT NULL,
    "amountSpent" double precision NOT NULL
);


ALTER TABLE public."AdSpendLog" OWNER TO clicco;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    qty integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    holder text,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Asset" OWNER TO clicco;

--
-- Name: BankAccount; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."BankAccount" (
    id text NOT NULL,
    name text NOT NULL,
    "realBalance" double precision DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."BankAccount" OWNER TO clicco;

--
-- Name: Budget; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."Budget" (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "categoryId" text NOT NULL,
    "subCategoryId" text,
    amount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Budget" OWNER TO clicco;

--
-- Name: CashSalesItem; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."CashSalesItem" (
    id text NOT NULL,
    "cashSalesLogId" text NOT NULL,
    "productId" text NOT NULL,
    qty integer DEFAULT 0 NOT NULL,
    amount double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."CashSalesItem" OWNER TO clicco;

--
-- Name: CashSalesLog; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."CashSalesLog" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "sourceId" text NOT NULL,
    qty integer DEFAULT 0 NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CashSalesLog" OWNER TO clicco;

--
-- Name: CashTransaction; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."CashTransaction" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    type public."TransactionType" NOT NULL,
    amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "proofUrl" text,
    "bankAccountId" text NOT NULL,
    "categoryId" text NOT NULL,
    "subCategoryId" text
);


ALTER TABLE public."CashTransaction" OWNER TO clicco;

--
-- Name: CashflowAssumption; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."CashflowAssumption" (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "hppPerPcs" double precision DEFAULT 0 NOT NULL,
    "feeCsPerPcs" double precision DEFAULT 0 NOT NULL,
    "feePackingPerPcs" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CashflowAssumption" OWNER TO clicco;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    type public."CategoryType" NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO clicco;

--
-- Name: DebtEntity; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."DebtEntity" (
    id text NOT NULL,
    name text NOT NULL,
    type public."DebtType" NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DebtEntity" OWNER TO clicco;

--
-- Name: DebtMutation; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."DebtMutation" (
    id text NOT NULL,
    "entityId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL,
    type public."DebtMutationType" NOT NULL,
    description text NOT NULL,
    "cashTransactionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DebtMutation" OWNER TO clicco;

--
-- Name: MonitoringAssumption; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."MonitoringAssumption" (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    gapok double precision NOT NULL,
    "bebanLain" double precision NOT NULL,
    "feeCsPerPcs" double precision NOT NULL,
    "biayaReturPerPcs" double precision NOT NULL,
    "rtsRate1" double precision NOT NULL,
    "rtsRate2" double precision NOT NULL,
    "rtsRate3" double precision NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MonitoringAssumption" OWNER TO clicco;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    cogs double precision DEFAULT 0 NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Product" OWNER TO clicco;

--
-- Name: SalesItem; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."SalesItem" (
    id text NOT NULL,
    "salesLogId" text NOT NULL,
    "productId" text NOT NULL,
    qty integer NOT NULL,
    "priceAtSale" double precision NOT NULL,
    "cogsAtSale" double precision NOT NULL,
    "diskonOngkir" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."SalesItem" OWNER TO clicco;

--
-- Name: SalesLog; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."SalesLog" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "sourceId" text NOT NULL,
    "isZeroSales" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."SalesLog" OWNER TO clicco;

--
-- Name: SalesSource; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."SalesSource" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."SalesSource" OWNER TO clicco;

--
-- Name: StockMutation; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."StockMutation" (
    id text NOT NULL,
    "productId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    qty integer NOT NULL,
    type text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockMutation" OWNER TO clicco;

--
-- Name: SubCategory; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."SubCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "categoryId" text NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SubCategory" OWNER TO clicco;

--
-- Name: User; Type: TABLE; Schema: public; Owner: clicco
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'OWNER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "accessConfig" jsonb
);


ALTER TABLE public."User" OWNER TO clicco;

--
-- Name: AdAccountTopUp AdAccountTopUp_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdAccountTopUp"
    ADD CONSTRAINT "AdAccountTopUp_pkey" PRIMARY KEY (id);


--
-- Name: AdAccount AdAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdAccount"
    ADD CONSTRAINT "AdAccount_pkey" PRIMARY KEY (id);


--
-- Name: AdSpendItem AdSpendItem_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdSpendItem"
    ADD CONSTRAINT "AdSpendItem_pkey" PRIMARY KEY (id);


--
-- Name: AdSpendLog AdSpendLog_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdSpendLog"
    ADD CONSTRAINT "AdSpendLog_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: BankAccount BankAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."BankAccount"
    ADD CONSTRAINT "BankAccount_pkey" PRIMARY KEY (id);


--
-- Name: Budget Budget_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY (id);


--
-- Name: CashSalesItem CashSalesItem_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashSalesItem"
    ADD CONSTRAINT "CashSalesItem_pkey" PRIMARY KEY (id);


--
-- Name: CashSalesLog CashSalesLog_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashSalesLog"
    ADD CONSTRAINT "CashSalesLog_pkey" PRIMARY KEY (id);


--
-- Name: CashTransaction CashTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashTransaction"
    ADD CONSTRAINT "CashTransaction_pkey" PRIMARY KEY (id);


--
-- Name: CashflowAssumption CashflowAssumption_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashflowAssumption"
    ADD CONSTRAINT "CashflowAssumption_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: DebtEntity DebtEntity_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."DebtEntity"
    ADD CONSTRAINT "DebtEntity_pkey" PRIMARY KEY (id);


--
-- Name: DebtMutation DebtMutation_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."DebtMutation"
    ADD CONSTRAINT "DebtMutation_pkey" PRIMARY KEY (id);


--
-- Name: MonitoringAssumption MonitoringAssumption_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."MonitoringAssumption"
    ADD CONSTRAINT "MonitoringAssumption_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: SalesItem SalesItem_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SalesItem"
    ADD CONSTRAINT "SalesItem_pkey" PRIMARY KEY (id);


--
-- Name: SalesLog SalesLog_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SalesLog"
    ADD CONSTRAINT "SalesLog_pkey" PRIMARY KEY (id);


--
-- Name: SalesSource SalesSource_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SalesSource"
    ADD CONSTRAINT "SalesSource_pkey" PRIMARY KEY (id);


--
-- Name: StockMutation StockMutation_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."StockMutation"
    ADD CONSTRAINT "StockMutation_pkey" PRIMARY KEY (id);


--
-- Name: SubCategory SubCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SubCategory"
    ADD CONSTRAINT "SubCategory_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: AdSpendLog_date_sourceId_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "AdSpendLog_date_sourceId_key" ON public."AdSpendLog" USING btree (date, "sourceId");


--
-- Name: BankAccount_name_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "BankAccount_name_key" ON public."BankAccount" USING btree (name);


--
-- Name: Budget_month_year_categoryId_subCategoryId_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "Budget_month_year_categoryId_subCategoryId_key" ON public."Budget" USING btree (month, year, "categoryId", "subCategoryId");


--
-- Name: CashSalesLog_date_sourceId_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "CashSalesLog_date_sourceId_key" ON public."CashSalesLog" USING btree (date, "sourceId");


--
-- Name: CashflowAssumption_month_year_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "CashflowAssumption_month_year_key" ON public."CashflowAssumption" USING btree (month, year);


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: DebtMutation_cashTransactionId_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "DebtMutation_cashTransactionId_key" ON public."DebtMutation" USING btree ("cashTransactionId");


--
-- Name: MonitoringAssumption_month_year_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "MonitoringAssumption_month_year_key" ON public."MonitoringAssumption" USING btree (month, year);


--
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "Product_sku_key" ON public."Product" USING btree (sku);


--
-- Name: SalesLog_date_sourceId_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "SalesLog_date_sourceId_key" ON public."SalesLog" USING btree (date, "sourceId");


--
-- Name: SalesSource_name_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "SalesSource_name_key" ON public."SalesSource" USING btree (name);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: clicco
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: AdAccountTopUp AdAccountTopUp_adAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdAccountTopUp"
    ADD CONSTRAINT "AdAccountTopUp_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES public."AdAccount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AdAccount AdAccount_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdAccount"
    ADD CONSTRAINT "AdAccount_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES public."SalesSource"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AdSpendItem AdSpendItem_adAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdSpendItem"
    ADD CONSTRAINT "AdSpendItem_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES public."AdAccount"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AdSpendItem AdSpendItem_adSpendLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdSpendItem"
    ADD CONSTRAINT "AdSpendItem_adSpendLogId_fkey" FOREIGN KEY ("adSpendLogId") REFERENCES public."AdSpendLog"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AdSpendItem AdSpendItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdSpendItem"
    ADD CONSTRAINT "AdSpendItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AdSpendLog AdSpendLog_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."AdSpendLog"
    ADD CONSTRAINT "AdSpendLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES public."SalesSource"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Budget Budget_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Budget Budget_subCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES public."SubCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashSalesItem CashSalesItem_cashSalesLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashSalesItem"
    ADD CONSTRAINT "CashSalesItem_cashSalesLogId_fkey" FOREIGN KEY ("cashSalesLogId") REFERENCES public."CashSalesLog"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashSalesItem CashSalesItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashSalesItem"
    ADD CONSTRAINT "CashSalesItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashSalesLog CashSalesLog_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashSalesLog"
    ADD CONSTRAINT "CashSalesLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES public."SalesSource"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashTransaction CashTransaction_bankAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashTransaction"
    ADD CONSTRAINT "CashTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES public."BankAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashTransaction CashTransaction_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashTransaction"
    ADD CONSTRAINT "CashTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashTransaction CashTransaction_subCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."CashTransaction"
    ADD CONSTRAINT "CashTransaction_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES public."SubCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DebtMutation DebtMutation_cashTransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."DebtMutation"
    ADD CONSTRAINT "DebtMutation_cashTransactionId_fkey" FOREIGN KEY ("cashTransactionId") REFERENCES public."CashTransaction"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DebtMutation DebtMutation_entityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."DebtMutation"
    ADD CONSTRAINT "DebtMutation_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES public."DebtEntity"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesItem SalesItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SalesItem"
    ADD CONSTRAINT "SalesItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesItem SalesItem_salesLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SalesItem"
    ADD CONSTRAINT "SalesItem_salesLogId_fkey" FOREIGN KEY ("salesLogId") REFERENCES public."SalesLog"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesLog SalesLog_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SalesLog"
    ADD CONSTRAINT "SalesLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES public."SalesSource"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMutation StockMutation_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."StockMutation"
    ADD CONSTRAINT "StockMutation_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubCategory SubCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicco
--

ALTER TABLE ONLY public."SubCategory"
    ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict CLeyXbBLwfpsPTRqCgFTsAJqrkyvub8GcA6IqdXHxuRJfvu7v7gM7vWR76LTNko

