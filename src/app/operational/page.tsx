"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PostWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

type OutletSopItem = {
  id: string;
  outlet_name: string;
  status: string;
  schedule_open_time: string;
  schedule_close_time: string;
  real_open_time: string;
  real_close_time: string;
  reported_by: string;
  is_late_opening: number;
  difference_closed_time: number;
  created_at: string | null;
};

type OperationalData = {
  outlet_opened: number;
  outlet_closed: number;
  outlet_total: number;
  total_late_opening: number;
  outlet_sop: OutletSopItem[];
};

type OperationalResponse = {
  statusCode: number;
  msg: string;
  data: OperationalData;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(time: string): string {
  if (!time || time === "-" || time === "00:00:00") return "-";
  return time.substring(0, 5);
}

function hasSchedule(item: OutletSopItem): boolean {
  return (
    item.schedule_open_time !== "00:00:00" ||
    item.schedule_close_time !== "00:00:00"
  );
}

function formatMinutes(mins: number | string | null | undefined): string {
  if (mins === undefined || mins === null || mins === "") return "-";
  const numMins = Number(mins);
  if (isNaN(numMins)) return "-";
  if (numMins === 0) return "0m";

  const isNegative = numMins < 0;
  const absMins = Math.abs(numMins);

  const h = Math.floor(absMins / 60);
  const m = absMins % 60;

  const sign = isNegative ? "-" : "";
  if (h > 0) return `${sign}${h}h ${m}m`;
  return `${sign}${m}m`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  color: "green" | "red" | "blue" | "yellow";
  icon: React.ReactNode;
}

function StatCard({ title, value, color, icon }: StatCardProps) {
  const colorMap = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  const valueColorMap = {
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-6 py-5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className={`mt-1 text-3xl font-bold ${valueColorMap[color]}`}>{value}</h3>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status?.toLowerCase() || "";

  if (normalizedStatus === "opened" || normalizedStatus === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        Opened
      </span>
    );
  }

  if (normalizedStatus === "late_opening") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
        Late Opening
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Closed
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperationalPage() {
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);

  const today = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "opened" | "late_opening" | "closed">("all");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "with-schedule" | "no-schedule">("all");
  const [sortKey, setSortKey] = useState<string>("status");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<OperationalData | null>(null);

  const fetchData = async (date: string) => {
    if (!auth.auth.access_token) return;
    setLoading(true);
    try {
      const [day, month, year] = [
        date.substring(8, 10),
        date.substring(5, 7),
        date.substring(0, 4),
      ];
      const formattedDate = `${year}-${month}-${day}`;

      const res = await PostWithToken<OperationalResponse>({
        router,
        url: `/api/report/monitoring`,
        token: `${auth.auth.access_token}`,
        data: {
          started_at: `${formattedDate}T00:00:00`,
          ended_at: `${formattedDate}T23:59:59`,
          outlet_ids: [],
        },
      });

      if (res?.statusCode === 200) {
        setData(res.data);
      } else {
        toast.error("Failed to load operational data");
      }
    } catch {
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.auth.access_token, selectedDate]);

  const filteredItems = useMemo(() => {
    if (!data?.outlet_sop) return [];
    let items = [...data.outlet_sop];

    if (search.trim()) {
      const kw = search.toLowerCase();
      items = items.filter((i) => i.outlet_name.toLowerCase().includes(kw));
    }

    if (statusFilter !== "all") {
      items = items.filter((i) => {
        const s = i.status?.toLowerCase() || "";
        if (statusFilter === "opened") return s === "opened" || s === "open";
        return s === statusFilter;
      });
    }

    if (scheduleFilter === "with-schedule") {
      items = items.filter(hasSchedule);
    } else if (scheduleFilter === "no-schedule") {
      items = items.filter((i) => !hasSchedule(i));
    }

    items.sort((a, b) => {
      let valA: any = a[sortKey as keyof OutletSopItem];
      let valB: any = b[sortKey as keyof OutletSopItem];

      if (sortKey === "status") {
        const w: Record<string, number> = { opened: 1, open: 1, late_opening: 2, closed: 3 };
        valA = w[valA?.toString().toLowerCase()] ?? 99;
        valB = w[valB?.toString().toLowerCase()] ?? 99;
      }

      if (valA === valB) return 0;

      if (valA === "-" || valA === "" || valA === null || valA === undefined) valA = sortOrder === "asc" ? "\uFFFF" : "";
      if (valB === "-" || valB === "" || valB === null || valB === undefined) valB = sortOrder === "asc" ? "\uFFFF" : "";

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [data, search, statusFilter, scheduleFilter, sortKey, sortOrder]);

  const openPercent =
    data && data.outlet_total > 0
      ? Math.round((data.outlet_opened / data.outlet_total) * 100)
      : 0;

  const renderSortableHeader = (label: string, key: string) => (
    <th
      className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-meta-4 select-none"
      onClick={() => {
        if (sortKey === key) {
          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
          setSortKey(key);
          setSortOrder("asc");
        }
      }}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="flex flex-col text-[8px] opacity-50 ml-1 leading-none">
          <span className={sortKey === key && sortOrder === "asc" ? "text-primary opacity-100" : ""}>▲</span>
          <span className={sortKey === key && sortOrder === "desc" ? "text-primary opacity-100" : ""}>▼</span>
        </span>
      </div>
    </th>
  );

  return (
    <div>
      <Breadcrumb pageName="Operational" />

      {/* ── Header & Date Filter ── */}
      <div className="mb-4 flex flex-col gap-4 rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Outlet Operational Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daily outlet opening &amp; closing schedule
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
            Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white"
          />
          <button
            onClick={() => fetchData(selectedDate)}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Outlet"
          value={data?.outlet_total ?? "-"}
          color="blue"
          icon={
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5l9-7.5 9 7.5v9a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 19.5v-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
            </svg>
          }
        />
        <StatCard
          title="Outlets Open"
          value={data?.outlet_opened ?? "-"}
          color="green"
          icon={
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Outlets Closed"
          value={data?.outlet_closed ?? "-"}
          color="red"
          icon={
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Late Opening"
          value={data?.total_late_opening ?? "-"}
          color="yellow"
          icon={
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Progress Bar ── */}
      {data && (
        <div className="mb-6 rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-black dark:text-white">
              Outlet Opening Rate
            </span>
            <span className="text-sm font-bold text-black dark:text-white">
              {openPercent}%
              <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
                ({data.outlet_opened}/{data.outlet_total})
              </span>
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-meta-4">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${openPercent}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Open: {data.outlet_opened}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              Closed: {data.outlet_closed}
            </span>
            {data.total_late_opening > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
                Late: {data.total_late_opening}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Table Header / Filters */}
        <div className="flex flex-col gap-3 border-b border-stroke px-5 py-4 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-black dark:text-white">
            Outlet List
            {filteredItems.length !== (data?.outlet_sop.length ?? 0) && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredItems.length} of {data?.outlet_sop.length ?? 0})
              </span>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search outlet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-md border border-stroke bg-transparent py-1.5 pl-8 pr-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white"
              />
              <svg
                className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-stroke bg-transparent px-3 py-1.5 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="opened">Opened</option>
              <option value="late_opening">Late Opening</option>
              <option value="closed">Closed</option>
            </select>
            {/* Schedule filter */}
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value as typeof scheduleFilter)}
              className="rounded-md border border-stroke bg-transparent px-3 py-1.5 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white"
            >
              <option value="all">All Schedules</option>
              <option value="with-schedule">With Schedule</option>
              <option value="no-schedule">Not Scheduled</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading data...</p>
            </div>
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            No data available. Select a date and click Refresh.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            No data matches the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                    #
                  </th>
                  {renderSortableHeader("Name", "outlet_name")}
                  {renderSortableHeader("Status", "status")}
                  {renderSortableHeader("Schedule Opening", "schedule_open_time")}
                  {renderSortableHeader("Opened", "real_open_time")}
                  {renderSortableHeader("Schedule Closed", "schedule_close_time")}
                  {renderSortableHeader("Closed", "real_close_time")}
                  {renderSortableHeader("Late Opening", "is_late_opening")}
                  {renderSortableHeader("Reported By", "reported_by")}
                  {renderSortableHeader("Difference Closed", "difference_closed_time")}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const scheduled = hasSchedule(item);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-stroke transition hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4 ${item.is_late_opening > 0 || item.status?.toLowerCase() === "late_opening"
                        ? "bg-yellow-50 dark:bg-yellow-900/10"
                        : ""
                        }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/operational/${item.id}`} className="text-sm font-medium text-primary hover:underline dark:text-primary">
                          {item.outlet_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        {scheduled ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            {formatTime(item.schedule_open_time)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.real_open_time && item.real_open_time !== "-" ? (
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {item.real_open_time}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {scheduled ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {formatTime(item.schedule_close_time)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.real_close_time && item.real_close_time !== "-" ? (
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {item.real_close_time}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-black dark:text-white">
                          {formatMinutes(item.is_late_opening)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-black dark:text-white">
                        {item.reported_by && item.reported_by !== "-" ? (
                          item.reported_by
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-black dark:text-white">
                          {formatMinutes(item.difference_closed_time)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {!loading && data && (
          <div className="border-t border-stroke px-5 py-3 dark:border-strokedark">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-black dark:text-white">{filteredItems.length}</span> of{" "}
              <span className="font-semibold text-black dark:text-white">{data.outlet_sop.length}</span> outlets for{" "}
              <span className="font-semibold text-black dark:text-white">{selectedDate}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
