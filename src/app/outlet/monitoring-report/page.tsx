"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useContext } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";

// ─── Types ──────────────────────────────────────────────────────────────────

type User = {
  id: string;
  fullname: string;
};

type SopReportItem = {
  id: string;
  sop_group_name: string;
  sop_item_name: string;
  picture: string | null;
  checklist: boolean;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user: User | null;
};

type Outlet = {
  id: string;
  name: string;
};

type Report = {
  id: string;
  report_date: string;
  closing_date: string | null;
  created_at: string;
  updated_at: string;
  outlet: Outlet;
  user: User;
  sop_report_items: SopReportItem[];
};

type ApiResponse = {
  statusCode: number;
  msg: string;
  total: number;
  data: Report[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-GB", options).replace(",", "");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutletMonitoringReport() {
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);
  const { selectedOutlets } = useContext(FilterByOutletContext);

  const today = toLocalDateString(new Date());
  const [startedAt, setStartedAt] = useState<string>(today);
  const [endedAt, setEndedAt] = useState<string>(today);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Report[]>([]);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const limit = 10;

  const fetchData = async () => {
    if (!auth.auth.access_token) return;
    setLoading(true);
    try {
      // If search text exists, we filter the selected outlets by name
      let baseOutlets = selectedOutlets;
      if (baseOutlets.length === 0) {
        // Fallback to all outlets if needed, or backend handles empty as all
      }
      
      const filteredOutlets = baseOutlets.filter(o => 
        search.trim() === "" || o.outlet.toLowerCase().includes(search.toLowerCase())
      );
      
      const outletIds = filteredOutlets.map((o) => o.outlet_id);

      // If there's a search but no matched outlets locally, we send an invalid ID or handle it
      if (search.trim() !== "" && outletIds.length === 0) {
        setData([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const payload = {
        started_at: `${startedAt}T00:00:00`,
        ended_at: `${endedAt}T23:59:59`,
        outlet_ids: outletIds,
      };

      const res = await PostWithToken<ApiResponse>({
        router,
        url: `/api/sop/reports/list?page=${page}&limit=${limit}`,
        token: `${auth.auth.access_token}`,
        data: payload,
      });

      if (res?.statusCode === 200) {
        setData(res.data);
        setTotal(res.total || 0);
      } else {
        toast.error("Failed to load SOP reports");
      }
    } catch {
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.auth.access_token, startedAt, endedAt, selectedOutlets, page]);

  const handleSearchClick = () => {
    setPage(1);
    fetchData();
  };

  return (
    <div>
      <Breadcrumb pageName="Outlet Monitoring Report" />

      {/* ── Filter Card ── */}
      <div className="mb-6 flex flex-col gap-4 rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Start Date
            </label>
            <input
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              End Date
            </label>
            <input
              type="date"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Search Outlet
            </label>
            <input
              type="text"
              placeholder="Search outlet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white w-full sm:w-60"
            />
          </div>
        </div>
        <button
          onClick={handleSearchClick}
          disabled={loading}
          className="inline-flex h-9.5 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Filter"}
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          No reports found.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {data.map((report) => {
            // Group SOP items by group name
            const groupedItems: Record<string, SopReportItem[]> = {};
            report.sop_report_items?.forEach((item) => {
              if (!groupedItems[item.sop_group_name]) {
                groupedItems[item.sop_group_name] = [];
              }
              groupedItems[item.sop_group_name].push(item);
            });

            return (
              <div
                key={report.id}
                className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark"
              >
                {/* Report Header */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Opening</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {formatDateTime(report.report_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Closing</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {formatDateTime(report.closing_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Outlet</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {report.outlet?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Report By</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {report.user?.fullname || "-"}
                    </p>
                  </div>
                </div>

                {/* Grouped Tables */}
                <div className="flex flex-col gap-5">
                  {Object.keys(groupedItems).length === 0 ? (
                    <div className="rounded border border-stroke bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4">
                      No SOP Report Items available.
                    </div>
                  ) : (
                    Object.keys(groupedItems).map((groupName, gIdx) => {
                      const items = groupedItems[groupName];
                      return (
                        <div
                          key={gIdx}
                          className="rounded border border-stroke dark:border-strokedark overflow-hidden"
                        >
                          <div className="bg-gray-50 px-4 py-3 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                            <h4 className="font-semibold text-black dark:text-white">
                              {groupName}
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                              <thead>
                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 w-12">
                                    #
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 min-w-[200px]">
                                    Item Name
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Picture
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Checklist
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    User
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Created At
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, iIdx) => (
                                  <tr
                                    key={item.id}
                                    className="border-b border-stroke last:border-0 dark:border-strokedark transition hover:bg-gray-50 dark:hover:bg-meta-4"
                                  >
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                      {iIdx + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-black dark:text-white">
                                      {item.sop_item_name}
                                    </td>
                                    <td className="px-4 py-3">
                                      {item.picture ? (
                                        <a className="block w-16 h-16 bg-gray-100 relative rounded overflow-hidden" href={`/api/file/${item.picture}`} target="_blank" rel="noreferrer">
                                          <Image
                                            priority
                                            className="object-cover"
                                            fill
                                            alt={item.sop_item_name}
                                            src={`/api/file/${item.picture}`}
                                            sizes="64px"
                                          />
                                        </a>
                                      ) : (
                                        <span className="text-sm text-gray-400 italic">No picture</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {item.checklist ? (
                                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                          Checked
                                        </span>
                                      ) : (
                                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                          Unchecked
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                      {item.user?.fullname || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                      {formatDateTime(item.created_at)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {total > 0 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-black dark:text-white">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-black dark:text-white">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-black dark:text-white">{total}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="flex items-center justify-center rounded-md border border-stroke bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-meta-4"
            >
              Prev
            </button>
            <span className="text-sm font-medium text-black dark:text-white">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(total / limit)))}
              disabled={page === Math.ceil(total / limit)}
              className="flex items-center justify-center rounded-md border border-stroke bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-meta-4"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
