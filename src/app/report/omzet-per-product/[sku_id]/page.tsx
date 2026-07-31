"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { Input } from "@/components/Inputs/InputComponent";
import { GetWithToken, PostWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSelector } from "react-redux";
import { IoMdDownload } from "react-icons/io";
import { toast } from "react-toastify";
import { SkeletonTableRow } from "../../components/skeleton/SkeletonTableRow";
import { toRupiah } from "../../utils/toRupiah";
import { FaArrowLeft } from "react-icons/fa";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { useContext } from "react";

interface CustomerType {
  id: string;
  fullname: string;
  dial_code: string;
  phone_number: string;
}

interface ProductSkuType {
  id: string;
  name: string;
  code: string;
}

interface OrderItemType {
  id: string;
  product_name: string;
  product_sku_name: string;
  washer_duration: number | null;
  dryer_duration: number | null;
  price: string;
  quantity: string;
  unit: string;
  sub_total: string;
  product_sku: ProductSkuType;
}

interface OrderSalesType {
  id: string;
  outlet_id: string;
  invoice_id: string;
  payment_status: string;
  status: string;
  total_item: number | null;
  total: string;
  created_at: string;
  updated_at: string;
  customer: CustomerType;
  items: OrderItemType[];
  outlet?: {
    id: string;
    name: string;
  };
}

function SkuSalesPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const skuId = params.sku_id as string;

  const auth = useSelector((s: RootState) => s.auth);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );

  const startedAtParam = searchParams.get("started_at");
  const endedAtParam = searchParams.get("ended_at");

  let startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  let endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  );
  endOfMonth.setHours(23, 59, 59, 0);
  startOfMonth.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = useState<Date>(
    startedAtParam ? new Date(startedAtParam) : startOfMonth
  );
  const [endDate, setEndDate] = useState<Date>(
    endedAtParam ? new Date(endedAtParam) : endOfMonth
  );

  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [salesData, setSalesData] = useState<OrderSalesType[]>([]);
  const [totalItem, setTotalItem] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentOptionRange, setCurrentOptionRange] = useState<string>("");
  const [loadingDownload, setLoadingDownload] = useState<boolean>(false);

  const itemsPerPage = 15;

  const rangeDateOptions = ["Today", "3 Days Ago", "7 Days Ago", "14 Days Ago", "Prev Month", "Current Month"];

  useEffect(() => {
    async function fetchSkuSales() {
      if (!auth.auth.access_token || !skuId) return;
      setIsLoading(true);

      const pad = (n: any) => n.toString().padStart(2, "0");
      const stdDate = new Date(startDate);
      const eDate = new Date(endDate);
      const startedStr = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())}`;
      const endedStr = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())}`;

      let url = `/api/v2/order/product-sku/${skuId}`;

      try {
        const res = await PostWithToken<iResponse<OrderSalesType[]>>({
          router,
          url,
          token: `${auth.auth.access_token}`,
          data: {
            outlet_ids:
              selectedOutlets.length >= 1
                ? selectedOutlets.map((o: any) => o.outlet_id)
                : defaultSelectedOutlet.map((o: any) => o.outlet_id),
            started_at: startedStr,
            ended_at: endedStr,
            page: currentPage,
            limit: itemsPerPage,
            search: fixValueSearch
          },
        });

        if (res?.statusCode === 200) {
          setSalesData(res.data || []);
          setTotalItem(res.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch SKU sales:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!modal) {
      fetchSkuSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuId, currentPage, fixValueSearch, startDate, endDate, auth.auth.access_token, router, selectedOutlets, defaultSelectedOutlet, modal]);

  const handleSearch = () => {
    setCurrentPage(1);
    setFixValueSearch(search);
  };

  const handleKeyDownSearch = () => {
    handleSearch();
  };

  // === Range date helper ===
  const getRangeByOption = (option: string): [Date, Date] => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    switch (option) {
      case "Today":
        return [startOfDay(now), endOfDay(now)];
      case "3 Days Ago":
        return [startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)), endOfDay(now)];
      case "7 Days Ago":
        return [startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)), endOfDay(now)];
      case "14 Days Ago":
        return [startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)), endOfDay(now)];
      case "Prev Month":
        return [
          new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0),
          new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        ];
      case "Current Month":
      default:
        return [
          new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
          new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        ];
    }
  };

  const handleFilterDataByDate = (option: string) => {
    const [s, e] = getRangeByOption(option);
    setStartDate(s);
    setEndDate(e);
    setCurrentOptionRange(option);
    setCurrentPage(1);
  };

  useEffect(() => {
    const sameDate = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 1000;
    const matched = rangeDateOptions.find((opt) => {
      const [s, e] = getRangeByOption(opt);
      return sameDate(s, startDate) && sameDate(e, endDate);
    });
    setCurrentOptionRange(matched || "");
  }, [startDate, endDate]);

  const totalPages = Math.ceil(totalItem / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItem);

  function getPaginationRange(current: number, total: number) {
    const siblingCount = 2;
    const totalNumbers = siblingCount * 2 + 5;

    if (total <= totalNumbers) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const leftSibling = Math.max(current - siblingCount, 1);
    const rightSibling = Math.min(current + siblingCount, total);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < total - 1;

    const pages = [];
    pages.push(1);

    if (showLeftDots) {
      pages.push("...");
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }

    if (showRightDots) {
      pages.push("...");
    }

    pages.push(total);
    return pages;
  }

  const pages = getPaginationRange(currentPage, totalPages);

  async function DownloadXLXS() {
    if (!auth.auth.access_token || !skuId) return;
    setLoadingDownload(true);

    const pad = (n: any) => n.toString().padStart(2, "0");
    const stdDate = new Date(startDate);
    const eDate = new Date(endDate);
    const startedStr = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())}`;
    const endedStr = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())}`;

    const url = `/api/v2/order/product-sku/${skuId}/download`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.auth.access_token}`,
        },
        body: JSON.stringify({
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : defaultSelectedOutlet.map((o) => o.outlet_id),
          started_at: startedStr,
          ended_at: endedStr,
          page: currentPage,
          limit: itemsPerPage,
          search: fixValueSearch
        }),
      });

      if (response.status === 401) {
        toast.error("Sesi login anda telah habis!");
        router.push("/auth/signin");
        return;
      }
      if (response.status === 403) {
        toast.warning("Akun anda tidak memiliki hak akses untuk ini!");
        return;
      }
      if (!response.ok) {
        toast.error("Gagal mengunduh data!");
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (result?.statusCode === 200) {
          if (result.data?.filename) {
            const downloadUrl = `${window.location.origin}/download/${result.data.filename}`;
            window.open(downloadUrl, "_blank");
          } else if (result.data?.url) {
            window.open(result.data.url, "_blank");
          } else {
            toast.error("Format data unduhan tidak valid.");
          }
        } else {
          toast.warning(result?.err || "Terjadi kesalahan!");
        }
      } else {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;

        let filename = `sales-report-${skuId}.xlsx`;
        const disposition = response.headers.get("content-disposition");
        if (disposition && disposition.indexOf("attachment") !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, "");
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Terjadi kesalahan saat mengunduh berkas.");
    } finally {
      setLoadingDownload(false);
    }
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleDateString("id", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Extract metadata from the first result if available
  const firstMatchingItem = salesData[0]?.items?.find(it => it.product_sku?.id === skuId) || salesData[0]?.items?.[0];
  const productName = firstMatchingItem?.product_name || "Product SKU Sales";
  const skuName = firstMatchingItem?.product_sku_name || "";
  const skuCode = firstMatchingItem?.product_sku?.code || "";

  return (
    <main className="relative min-h-screen">
      <Breadcrumb pageName="Report Outlet - Sales by Product SKU" />

      <div className="mb-4">
        <button
          onClick={() => router.push("/report/omzet-per-product")}
          className="flex items-center gap-2 rounded bg-white hover:bg-slate-100 dark:bg-boxdark dark:hover:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <FaArrowLeft /> Back to Product Omzet Report
        </button>
      </div>

      {firstMatchingItem && (
        <div className="mb-4 rounded bg-white p-6 shadow-sm dark:bg-boxdark border border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{productName}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            {skuName && (
              <div>
                <span className="font-semibold">SKU Name: </span>
                {skuName}
              </div>
            )}
            {skuCode && (
              <div>
                <span className="font-semibold">SKU Code: </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{skuCode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Filter Quick Options */}
      <div className="mb-4 w-full rounded bg-white p-4 dark:bg-boxdark">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {rangeDateOptions.map((option) => {
            const isActive = currentOptionRange === option;
            return (
              <button
                key={option}
                onClick={() => handleFilterDataByDate(option)}
                type="button"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700
                 ${isActive
                    ? "bg-slate-800 text-gray-100 dark:bg-slate-200 dark:text-slate-900 scale-95"
                    : "bg-white text-gray-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
                  }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Pickers & Search */}
      <div className="mb-4 w-full rounded bg-white p-4 dark:bg-boxdark">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePickerOne
              label="Start"
              defaultDate={startDate}
              onChange={(val) => {
                setStartDate(new Date(val));
                setCurrentPage(1);
              }}
            />
            <DatePickerOne
              label="End"
              defaultDate={endDate}
              onChange={(val) => {
                setEndDate(new Date(val));
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap gap-2 items-end">
            <div className="w-full md:w-60">
              <Input
                label="Search Invoice/Customer"
                name="search"
                id="search"
                value={search}
                onChange={(val) => setSearch(val)}
                onEnter={handleKeyDownSearch}
                error={null}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={handleSearch}
                className="inline-flex flex-1 md:flex-initial items-center justify-center rounded bg-black px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 whitespace-nowrap"
              >
                Search
              </button>
              <button
                onClick={DownloadXLXS}
                disabled={loadingDownload}
                className="inline-flex flex-1 md:flex-initial items-center justify-center rounded bg-black px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 whitespace-nowrap gap-2 disabled:opacity-50"
              >
                {loadingDownload ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-white"></div>
                ) : (
                  <IoMdDownload />
                )}
                <span>Download xls</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <section>
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Outlet</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Invoice ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Sub Total</th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider">Payment</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salesData.length > 0 ? (
                  salesData.map((order, index) => {
                    const item = order.items?.find(it => it.product_sku?.id === skuId) || order.items?.[0];
                    return (
                      <tr
                        key={order.id}
                        className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          {order.outlet?.name || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 uppercase font-semibold text-slate-800 dark:text-slate-200">
                          {order.invoice_id}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {order.customer?.fullname || "-"}
                            </span>
                            {order.customer?.phone_number && (
                              <span className="text-xs text-gray-400">
                                {order.customer.dial_code} {order.customer.phone_number}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          {item ? toRupiah(item.price) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          {item ? item.quantity : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-800 dark:text-slate-100">
                          {item ? toRupiah(item.sub_total) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center uppercase">
                          <span
                            className={`inline-block rounded px-2.5 py-1 text-xs font-semibold text-center
                              ${order.payment_status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"}
                            `}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={i} howMuch={9} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500 dark:text-gray-400 dark:bg-slate-850">
                      No sales records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {salesData.length > 0 && (
          <div className="flex flex-col md:flex-row items-center lg:justify-between justify-center w-full mt-4 px-8 py-4 rounded-lg bg-white dark:bg-slate-800 shadow overflow-x-auto">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-bold text-slate-800 dark:text-slate-100">{startIdx} - {endIdx}</span> of{" "}
                <span className="font-bold text-slate-800 dark:text-slate-100">{totalItem}</span> items
              </span>
            </div>

            <div className="flex items-center gap-1 mt-4 md:mt-0">
              {/* Prev Button */}
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                type="button"
                className={`flex h-8 items-center justify-center rounded-l border border-gray-300 px-3 text-sm font-medium transition-colors
                  ${currentPage <= 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                    : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  }`}
              >
                Prev
              </button>

              {/* Page Numbers */}
              <ul className="flex items-center">
                {pages.map((p, i) => {
                  if (p === "...") {
                    return (
                      <li key={`dots-${i}`}>
                        <span className="flex h-8 items-center justify-center border border-gray-300 dark:border-gray-700 px-3 text-gray-500 leading-tight">
                          ...
                        </span>
                      </li>
                    );
                  }

                  const pageNum = Number(p);
                  const isActive = currentPage === pageNum;

                  return (
                    <li key={`page-${pageNum}`}>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`flex h-8 items-center justify-center border px-3 text-sm font-medium transition-colors
                          ${isActive
                            ? "bg-slate-800 border-slate-800 text-white dark:bg-slate-200 dark:border-slate-200 dark:text-slate-900"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                          }`}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Next Button */}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                type="button"
                className={`flex h-8 items-center justify-center rounded-r border border-gray-300 px-3 text-sm font-medium transition-colors
                  ${currentPage >= totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                    : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function SkuSalesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800"></div>
      </div>
    }>
      <SkuSalesPageContent />
    </Suspense>
  );
}
