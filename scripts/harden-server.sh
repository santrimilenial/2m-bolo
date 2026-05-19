#!/bin/bash
# ==============================================
# FIREWALL HARDENING SCRIPT — Clicco Finance
# ==============================================
# CATATAN: Jalankan sebagai root
# TIDAK mengubah SSH config (sesuai permintaan)
# ==============================================

set -e

echo "=========================================="
echo "  FIREWALL HARDENING - Clicco Finance"
echo "=========================================="
echo ""

# --- Flush existing rules ---
echo "[1/6] Flushing existing iptables rules..."
iptables -F
iptables -X

# --- Default policies ---
echo "[2/6] Setting default policies (DROP input, ACCEPT output)..."
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# --- Allow loopback ---
echo "[3/6] Allowing loopback interface..."
iptables -A INPUT -i lo -j ACCEPT

# --- Allow established connections ---
echo "[4/6] Allowing established/related connections..."
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# --- Allow essential services ---
echo "[5/6] Opening essential ports..."

# SSH (port 22) — tetap terbuka
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
echo "  ✅ Port 22 (SSH) — OPEN"

# HTTP (port 80)
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
echo "  ✅ Port 80 (HTTP) — OPEN"

# HTTPS (port 443)
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
echo "  ✅ Port 443 (HTTPS) — OPEN"

# LiteSpeed Admin (port 7080) — hanya dari localhost
iptables -A INPUT -p tcp --dport 7080 -s 127.0.0.1 -j ACCEPT
echo "  ✅ Port 7080 (LiteSpeed Admin) — LOCALHOST ONLY"

# Mail ports (jika diperlukan)
iptables -A INPUT -p tcp --dport 25 -j ACCEPT
iptables -A INPUT -p tcp --dport 465 -j ACCEPT
iptables -A INPUT -p tcp --dport 587 -j ACCEPT
iptables -A INPUT -p tcp --dport 110 -j ACCEPT
iptables -A INPUT -p tcp --dport 143 -j ACCEPT
iptables -A INPUT -p tcp --dport 993 -j ACCEPT
iptables -A INPUT -p tcp --dport 995 -j ACCEPT
echo "  ✅ Mail ports (25,465,587,110,143,993,995) — OPEN"

# --- BLOCK dangerous ports from public access ---
echo "[6/6] Blocking dangerous ports from public..."

# MySQL/MariaDB (port 3306) — BLOCK from public
iptables -A INPUT -p tcp --dport 3306 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3306 -j DROP
echo "  🔒 Port 3306 (MySQL) — BLOCKED (localhost only)"

# Next.js direct (port 3000) — BLOCK from public, only via reverse proxy
iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
echo "  🔒 Port 3000 (Next.js) — BLOCKED (localhost only)"

# PostgreSQL (port 5432) — already localhost but double-protect
iptables -A INPUT -p tcp --dport 5432 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 5432 -j DROP
echo "  🔒 Port 5432 (PostgreSQL) — BLOCKED (localhost only)"

# Redis (port 6379) — BLOCK from public
iptables -A INPUT -p tcp --dport 6379 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 6379 -j DROP
echo "  🔒 Port 6379 (Redis) — BLOCKED (localhost only)"

# Python debug (port 8888) — BLOCK from public
iptables -A INPUT -p tcp --dport 8888 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 8888 -j DROP
echo "  🔒 Port 8888 (Python) — BLOCKED (localhost only)"

# RPC (port 111) — BLOCK from public
iptables -A INPUT -p tcp --dport 111 -j DROP
iptables -A INPUT -p udp --dport 111 -j DROP
echo "  🔒 Port 111 (RPC) — BLOCKED"

# FTP (port 21) — BLOCK from public (gunakan SFTP via SSH)
iptables -A INPUT -p tcp --dport 21 -j DROP
echo "  🔒 Port 21 (FTP) — BLOCKED (use SFTP instead)"

# Sieve (port 4190) — BLOCK from public
iptables -A INPUT -p tcp --dport 4190 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 4190 -j DROP
echo "  🔒 Port 4190 (Sieve) — BLOCKED (localhost only)"

# LiteSpeed WebAdmin (port 8090) — BLOCK from public
iptables -A INPUT -p tcp --dport 8090 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 8090 -j DROP
echo "  🔒 Port 8090 (LSPanel) — BLOCKED (localhost only)"

echo ""
echo "=========================================="
echo "  ✅ FIREWALL HARDENING COMPLETE!"
echo "=========================================="
echo ""
echo "Ports OPEN to public: 22(SSH), 80(HTTP), 443(HTTPS), Mail"
echo "Ports BLOCKED: 3000, 3306, 5432, 6379, 8888, 111, 21, 4190, 8090"
echo ""
echo "CATATAN: Rules ini hilang setelah reboot."
echo "Untuk persist, jalankan: iptables-save > /etc/iptables.rules"
echo "Dan tambahkan ke /etc/rc.local: iptables-restore < /etc/iptables.rules"
