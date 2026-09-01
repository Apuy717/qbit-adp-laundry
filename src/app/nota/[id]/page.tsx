"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  FaPrint,
  FaStore,
  FaUser,
  FaSearch,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaShareAlt,
  FaCheck,
} from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";
import { toast } from "react-toastify";

export type PublicReceiptItemStage = {
  id: string;
  order_item_id: string;
  name: string;
  status: string;
  log_machine?: any | null;
};

export type PublicReceiptItem = {
  id: string;
  product_name: string;
  product_sku_name: string;
  washer_duration?: number | null;
  dryer_duration?: number | null;
  iron_duration?: number | null;
  price: string | number;
  quantity: string | number;
  unit?: string | null;
  sub_total: string | number;
  product_sku?: {
    id: string;
    name: string;
    code: string;
  };
  stages?: PublicReceiptItemStage[];
};

export type PublicReceiptType = {
  id: string;
  invoice_id: string;
  identity_number?: string | null;
  no_polisi?: string | null;
  payment_status: string;
  status: string;
  total_item?: number | null;
  total: string | number;
  ref_id?: string | null;
  created_at: string;
  updated_at: string;
  cashier_name?: string;
  admin?: {
    id?: string;
    fullname?: string;
  } | null;
  outlet?: {
    id: string;
    name: string;
    city?: string;
    address?: string;
    dial_code?: string;
    phone_number?: string;
    google_review_link?: string | null;
  };
  customer?: {
    id: string;
    fullname: string;
    dial_code?: string;
    phone_number?: string;
  };
  payment_method?: {
    id: string;
    name: string;
    type: string;
    account_number?: string | null;
    account_name?: string | null;
  } | null;
  voucher?: any | null;
  items: PublicReceiptItem[];
  link_payment?: string | null;
};

export default function PublicReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [data, setData] = useState<PublicReceiptType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInvoice, setSearchInvoice] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const formatRupiah = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return "Rp 0";
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "Rp 0";
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
    }).format(numericValue);
    return `Rp ${result}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const parseCity = (cityStr?: string) => {
    if (!cityStr) return "";
    if (cityStr.includes("--")) {
      const parts = cityStr.split("--");
      return parts[1] || parts[0];
    }
    return cityStr;
  };

  useEffect(() => {
    if (!id) return;

    const fetchReceipt = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/nota/public/${encodeURIComponent(id)}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          setError(
            `Server tidak tersedia (HTTP ${response.status}). Silakan coba beberapa saat lagi.`
          );
          return;
        }

        const result = await response.json();

        if (response.ok && result.statusCode === 200 && result.data) {
          setData(result.data);
        } else {
          setError(result.err || result.msg || "Nota tidak ditemukan");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError("Gagal memuat data nota. Silakan periksa koneksi internet Anda.");
        toast.error("Gagal memuat data nota.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchInvoice.trim();
    if (cleanQuery) {
      router.push(`/nota/${cleanQuery}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Tautan nota berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <FaCheckCircle className="text-xs" /> Lunas (Paid)
        </span>
      );
    }
    if (s === "receivables") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/50 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <FaClock className="text-xs" /> Piutang (Receivables)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/50 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <FaClock className="text-xs" /> {status ? status.toUpperCase() : "PENDING"}
      </span>
    );
  };

  const getOrderStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/50 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <FaCheckCircle className="text-xs" /> Selesai (Completed)
        </span>
      );
    }
    if (s === "canceled") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/50 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <FaTimesCircle className="text-xs" /> Dibatalkan (Canceled)
        </span>
      );
    }
    if (s === "process") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-950/50 px-3 py-1 text-xs font-semibold text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
          <FaClock className="text-xs" /> Proses (In Progress)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {status ? status.toUpperCase() : "PENDING"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-boxdark-2 text-slate-800 dark:text-slate-100 p-4">
        <div className="rounded-2xl bg-white dark:bg-boxdark p-8 shadow-lg border border-slate-100 dark:border-strokedark flex flex-col items-center max-w-sm w-full text-center">
          <AiOutlineLoading3Quarters className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-bold">Memuat Nota Digital...</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mengambil data invoice #{id}
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-boxdark-2 p-4 text-slate-800 dark:text-slate-100">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-boxdark p-8 shadow-xl text-center border border-slate-100 dark:border-strokedark">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 mb-6">
            <FaExclamationTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Nota Tidak Ditemukan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {error || "Nomor invoice yang Anda cari tidak terdaftar atau telah kadaluarsa."}
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari contoh: INV-9CC13A57"
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-strokedark bg-slate-50 dark:bg-boxdark-2 py-3 pl-4 pr-12 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary p-2 text-white hover:bg-opacity-90 transition"
                title="Cari Nota"
              >
                <FaSearch className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const cashierDisplay = data.admin?.fullname || data.cashier_name || "-";
  const outletAddress =
    data.outlet?.address || parseCity(data.outlet?.city) || "-";
  const outletPhone =
    data.outlet?.phone_number
      ? `${data.outlet.dial_code || ""} ${data.outlet.phone_number}`.trim()
      : null;
  const customerPhone =
    data.customer?.phone_number
      ? `${data.customer.dial_code || ""} ${data.customer.phone_number}`.trim()
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-boxdark-2 dark:to-boxdark py-8 px-4 flex flex-col items-center justify-start text-slate-800 dark:text-slate-100">
      {/* Top Banner / Actions (Hidden during print) */}
      <div className="w-full max-w-2xl flex flex-wrap justify-between items-center gap-3 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <MdOutlineReceiptLong className="text-xl text-primary" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            E-Receipt Resmi
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-boxdark px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-strokedark shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {copied ? <FaCheck className="text-emerald-500" /> : <FaShareAlt />}
            {copied ? "Tersalin" : "Bagikan"}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-opacity-90 transition"
          >
            <FaPrint />
            Cetak Nota
          </button>
        </div>
      </div>

      {/* Printable Receipt Card */}
      <div
        id="printable"
        className="w-full max-w-2xl bg-white dark:bg-boxdark rounded-3xl shadow-xl border border-slate-100 dark:border-strokedark overflow-hidden print:shadow-none print:border-none print:bg-white print:text-black"
      >
        {/* Receipt Header styling */}
        <div className="bg-primary/5 dark:bg-primary/10 px-6 sm:px-8 py-8 border-b border-dashed border-slate-200 dark:border-strokedark text-center relative">
          <h2 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white mb-1">
            {data.outlet?.name || "Laundry Store"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {outletAddress}
          </p>
          {outletPhone && (
            <p className="text-xs font-medium mt-1 text-slate-600 dark:text-slate-300">
              Telp: {outletPhone}
            </p>
          )}

          {/* Status Badges */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
            {getPaymentStatusBadge(data.payment_status)}
            {getOrderStatusBadge(data.status)}
          </div>

          {/* Decorative receipt notch details */}
          <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-4 overflow-hidden print:hidden">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-boxdark-2 dark:to-boxdark transform translate-y-2 border border-transparent"
              />
            ))}
          </div>
        </div>

        {/* Receipt Body */}
        <div className="px-6 sm:px-8 py-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm border-b border-slate-100 dark:border-strokedark pb-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                No. Invoice
              </p>
              <p className="font-bold text-slate-700 dark:text-slate-200">
                {data.invoice_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Tanggal
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {formatDate(data.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Kasir
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {cashierDisplay}
              </p>
            </div>
            {/* <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                No. Polisi / Identitas
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {data.no_polisi || data.identity_number || "-"}
              </p>
            </div> */}
          </div>

          {/* Customer / Store Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-slate-100 dark:border-strokedark text-sm">
            <div className="bg-slate-50 dark:bg-boxdark-2 p-4 rounded-2xl border border-slate-100 dark:border-strokedark/50">
              <div className="flex items-center gap-2 mb-2 text-primary dark:text-white font-bold">
                <FaUser className="text-xs" />
                <span>Pelanggan</span>
              </div>
              <p className="font-semibold text-base">
                {data.customer?.fullname || "-"}
              </p>
              {customerPhone && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {customerPhone}
                </p>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-boxdark-2 p-4 rounded-2xl border border-slate-100 dark:border-strokedark/50">
              <div className="flex items-center gap-2 mb-2 text-primary dark:text-white font-bold">
                <FaStore className="text-xs" />
                <span>Outlet</span>
              </div>
              <p className="font-semibold text-base">
                {data.outlet?.name || "-"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {parseCity(data.outlet?.city) || data.outlet?.address || "-"}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-4">
              Rincian Layanan ({data.items?.length || 0} Item)
            </h3>
            <div className="space-y-4">
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-start justify-between text-sm py-3 border-b border-slate-100 dark:border-strokedark last:border-none"
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {item.product_name}
                      </p>
                      {item.product_sku_name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.product_sku_name}
                        </p>
                      )}
                      {/* Durations or stage info if present */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.washer_duration ? (
                          <span className="inline-flex items-center text-[10px] bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded font-medium">
                            Washer: {item.washer_duration}m
                          </span>
                        ) : null}
                        {item.dryer_duration ? (
                          <span className="inline-flex items-center text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-medium">
                            Dryer: {item.dryer_duration}m
                          </span>
                        ) : null}
                        {item.iron_duration ? (
                          <span className="inline-flex items-center text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-medium">
                            Iron: {item.iron_duration}m
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap min-w-[120px]">
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {formatRupiah(item.sub_total)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatRupiah(item.price)} x{item.quantity}{" "}
                        {item.unit || ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2">Tidak ada item</p>
              )}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 dark:bg-boxdark-2 rounded-2xl p-6 border border-slate-100 dark:border-strokedark/50 text-sm space-y-3 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Metode Pembayaran
              </span>
              <span className="font-semibold uppercase text-slate-700 dark:text-slate-200">
                {data.payment_method?.name || "-"}
              </span>
            </div>
            {data.total_item ? (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Total Pakaian / Satuan
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {data.total_item}
                </span>
              </div>
            ) : null}
            <div className="border-t border-slate-200 dark:border-strokedark my-2 pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                Total Tagihan
              </span>
              <span className="text-2xl font-extrabold text-primary dark:text-white">
                {formatRupiah(data.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="bg-slate-50 dark:bg-boxdark-2/40 border-t border-slate-100 dark:border-strokedark px-6 sm:px-8 py-6 text-center text-xs text-slate-400">
          <p className="font-medium text-slate-600 dark:text-slate-300">
            Terima kasih atas kepercayaan Anda di {data.outlet?.name || "kami"}!
          </p>
          <p className="mt-1">
            Nota digital ini sah dan diterbitkan secara elektronik.
          </p>

          {data.outlet?.google_review_link && (
            <div className="mt-4 print:hidden">
              <a
                href={data.outlet.google_review_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-boxdark px-4 py-2 border border-slate-200 dark:border-strokedark font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                ⭐ Beri Ulasan di Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

