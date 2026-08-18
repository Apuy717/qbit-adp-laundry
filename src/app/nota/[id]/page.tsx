"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaPrint, FaStore, FaUser, FaSearch, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";

type PublicReceiptType = {
  id: string;
  invoice_id: string;
  identity_number: string | null;
  no_polisi: string | null;
  payment_status: string;
  status: string;
  total_item: number;
  total: string;
  ref_id: string | null;
  created_at: string;
  updated_at: string;
  cashier_name: string;
  outlet: {
    id: string;
    name: string;
    city: string;
    address: string;
    dial_code: string;
    phone_number: string;
    google_review_link: string | null;
  };
  customer: {
    id: string;
    fullname: string;
    dial_code: string;
    phone_number: string;
  };
  payment_method: {
    id: string;
    name: string;
    type: string;
  } | null;
  items: {
    id: string;
    product_name: string;
    product_sku_name: string;
    washer_duration: number | null;
    dryer_duration: number | null;
    iron_duration: number | null;
    price: string;
    quantity: string | number;
    unit: string | null;
    sub_total: string;
  }[];
};

// Dummy data for development (API endpoint not available yet)
const DUMMY_DATA: PublicReceiptType = {
  id: "ord-001",
  invoice_id: "INV-2026-0001",
  identity_number: "ORD-12345",
  no_polisi: null,
  payment_status: "paid",
  status: "completed",
  total_item: 3,
  total: "85000",
  ref_id: null,
  created_at: "2026-08-18T10:30:00+07:00",
  updated_at: "2026-08-18T12:00:00+07:00",
  cashier_name: "Siti Rahayu",
  outlet: {
    id: "outlet-001",
    name: "Depth Clean Laundry - Cabang Utama",
    city: "ID--Jakarta Selatan",
    address: "Jl. Sudirman No. 123, Kebayoran Baru, Jakarta Selatan 12190",
    dial_code: "+62",
    phone_number: "812-3456-7890",
    google_review_link: "https://g.page/r/example-review",
  },
  customer: {
    id: "cust-001",
    fullname: "Budi Santoso",
    dial_code: "+62",
    phone_number: "856-1234-5678",
  },
  payment_method: {
    id: "pm-001",
    name: "Cash",
    type: "cash",
  },
  items: [
    {
      id: "item-001",
      product_name: "Cuci Kering",
      product_sku_name: "Regular - 5kg",
      washer_duration: 30,
      dryer_duration: 45,
      iron_duration: null,
      price: "15000",
      quantity: 2,
      unit: "kg",
      sub_total: "30000",
    },
    {
      id: "item-002",
      product_name: "Setrika",
      product_sku_name: "Standard Iron",
      washer_duration: null,
      dryer_duration: null,
      iron_duration: 30,
      price: "10000",
      quantity: 3,
      unit: "pcs",
      sub_total: "30000",
    },
    {
      id: "item-003",
      product_name: "Pewangi Premium",
      product_sku_name: "Lavender Scent",
      washer_duration: null,
      dryer_duration: null,
      iron_duration: null,
      price: "25000",
      quantity: 1,
      unit: null,
      sub_total: "25000",
    },
  ],
};

export default function PublicReceiptPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<PublicReceiptType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInvoice, setSearchInvoice] = useState<string>("");

  const formatRupiah = (value: string | number) => {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "Rp 0";
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
    }).format(numericValue);
    return `Rp ${result}`;
  };

  const formatDate = (dateStr: string) => {
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

  useEffect(() => {
    if (!id) return;

    // TODO: Replace with actual API call when endpoint is available
    // const fetchReceipt = async () => {
    //   setLoading(true);
    //   setError(null);
    //   try {
    //     const response = await fetch(`/api/nota/public/${id}`);
    //     const result = await response.json();
    //
    //     if (result.statusCode === 200 && result.data) {
    //       setData(result.data);
    //     } else {
    //       setError(result.msg || result.err || "Nota tidak ditemukan");
    //     }
    //   } catch (err) {
    //     console.error("Error fetching receipt:", err);
    //     toast.error("Gagal memuat data nota. Silakan coba beberapa saat lagi.");
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    //
    // fetchReceipt();

    // Using dummy data for now
    const loadDummyData = () => {
      setLoading(true);
      setError(null);
      setTimeout(() => {
        // Simulate: if id is "not-found", show error state
        if (id === "not-found") {
          setError("Nota tidak ditemukan");
        } else {
          setData({ ...DUMMY_DATA, id, invoice_id: `INV-${id.toUpperCase()}` });
        }
        setLoading(false);
      }, 800);
    };

    loadDummyData();
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInvoice.trim()) {
      window.location.href = `/nota/${searchInvoice.trim()}`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-boxdark-2 text-slate-800 dark:text-slate-100 p-4">
        <AiOutlineLoading3Quarters className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Memuat data nota...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-boxdark-2 p-4 text-slate-800 dark:text-slate-100">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-boxdark p-8 shadow-xl text-center border border-slate-100 dark:border-strokedark">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 mb-6">
            <FaExclamationTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Nota Tidak Ditemukan</h1>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Masukkan Nomor Invoice"
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-strokedark bg-slate-50 dark:bg-boxdark-2 py-3 pl-4 pr-12 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary p-2 text-white hover:bg-opacity-90 transition"
              >
                <FaSearch className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-boxdark-2 dark:to-boxdark py-10 px-4 flex flex-col items-center justify-start text-slate-800 dark:text-slate-100">
      {/* Top Banner / Actions (Hidden during print) */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            E-Receipt Resmi
          </span>
        </div>
      </div>

      {/* Printable Receipt Card */}
      <div
        id="printable"
        className="w-full max-w-2xl bg-white dark:bg-boxdark rounded-3xl shadow-xl border border-slate-100 dark:border-strokedark overflow-hidden print:shadow-none print:border-none print:bg-white print:text-black"
      >
        {/* Receipt Header styling */}
        <div className="bg-primary/5 dark:bg-primary/10 px-8 py-8 border-b border-dashed border-slate-200 dark:border-strokedark text-center relative">
          <h2 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white mb-1">
            {data.outlet.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto line-clamp-2">
            {data.outlet.address}
          </p>
          <p className="text-xs font-semibold mt-1 text-slate-600 dark:text-slate-300">
            Telp: {data.outlet.dial_code} {data.outlet.phone_number}
          </p>

          {/* Status Badges */}
          <div className="flex justify-center gap-3 mt-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${data.status === "completed"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : data.status === "canceled"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                }`}
            >
              Order: {data.status}
            </span>
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
        <div className="px-8 py-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm border-b border-slate-100 dark:border-strokedark pb-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">No. Invoice</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{data.invoice_id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tanggal</p>
              <p className="font-medium">{formatDate(data.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Kasir</p>
              <p className="font-medium">{data.cashier_name || "-"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">No. Polisi / Identitas</p>
              <p className="font-medium">{data.no_polisi || data.identity_number || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Order ID</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{data.identity_number || "-"}</p>
            </div>
          </div>

          {/* Customer / Store Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-100 dark:border-strokedark text-sm">
            <div className="bg-slate-50 dark:bg-boxdark-2 p-4 rounded-2xl border border-slate-100 dark:border-strokedark/50">
              <div className="flex items-center gap-2 mb-2 text-primary dark:text-white font-bold">
                <FaUser className="text-xs" />
                <span>Informasi Pelanggan</span>
              </div>
              <p className="font-semibold text-base">{data.customer.fullname}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {data.customer.dial_code} {data.customer.phone_number}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-boxdark-2 p-4 rounded-2xl border border-slate-100 dark:border-strokedark/50">
              <div className="flex items-center gap-2 mb-2 text-primary dark:text-white font-bold">
                <FaStore className="text-xs" />
                <span>Informasi Outlet</span>
              </div>
              <p className="font-semibold text-base">{data.outlet.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {data.outlet.city.split("--")[1] || data.outlet.city}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-4">Daftar Item</h3>
            <div className="space-y-4">
              {data.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between text-sm py-2 border-b border-slate-100 dark:border-strokedark last:border-none"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.product_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.product_sku_name}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap min-w-[120px]">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatRupiah(item.sub_total)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatRupiah(item.price)} x{item.quantity} {item.unit || ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 dark:bg-boxdark-2 rounded-2xl p-6 border border-slate-100 dark:border-strokedark/50 text-sm space-y-3 mt-4">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Metode Pembayaran</span>
              <span className="font-semibold uppercase">{data.payment_method?.name || "-"}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-strokedark my-2 pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">Total Tagihan</span>
              <span className="text-2xl font-extrabold text-primary dark:text-white">
                {formatRupiah(data.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="bg-slate-50 dark:bg-boxdark-2/40 border-t border-slate-100 dark:border-strokedark px-8 py-6 text-center text-xs text-slate-400">
          <p className="font-medium">Terima kasih atas kepercayaan Anda di {data.outlet.name}!</p>
          <p className="mt-1">Nota digital ini sah dan diterbitkan secara elektronik.</p>

          {data.outlet.google_review_link && (
            <div className="mt-4 print:hidden">
              <a
                href={data.outlet.google_review_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-boxdark px-4 py-2 border border-slate-200 dark:border-strokedark font-semibold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
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
