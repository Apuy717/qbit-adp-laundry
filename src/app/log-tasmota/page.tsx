"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import TableSortable from "@/components/Tables/TableSortable";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";

export interface TasmotaLogType {
    machine_name: string;
    outlet_name: string;
    reason: "POWER_LOST" | "CRASH" | string;
    up_time: string;
    start_up: string;
    uptime_seconds: number;
    day_of_week: number;
    hour_of_day: number;
    created_at: string;
}

export default function LogTasmota() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [startDate, setStartDate] = useState<Date>(startOfMonth);
    const [endDate, setEndDate] = useState<Date>(endOfMonth);
    const [items, setItems] = useState<TasmotaLogType[]>([]);
    const [itemsRaw, setItemsRaw] = useState<TasmotaLogType[]>([]);
    const [orderBy, setOrderBy] = useState<{ key: string; value: "ASC" | "DESC" } | null>(null);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [currentOptionRange, setCurrentOptionRange] = useState<string>("Current Month");
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false); // 🆕 loading state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20); // jumlah data per halaman


    const rangeDateOptions = ["Today", "3 Days Ago", "7 Days Ago", "14 Days Ago", "Prev Month", "Current Month"];
    const filterReasons = ["POWER_LOST", "MANUAL", "CRASH", "WIFI", "MQTT"];

    const { auth, role } = useSelector((s: RootState) => s.auth);
    const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext);
    const router = useRouter();

    const totalPages = Math.ceil(items.length / itemsPerPage);
    const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePaginate = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };


    // === Redirect unauthorized role ===
    useEffect(() => {
        if (
            role.name !== ERoles.TECHNICIAN &&
            role.name !== ERoles.PROVIDER &&
            role.name !== ERoles.SUPER_ADMIN
        ) {
            router.push("/");
        }
    }, [role.name, router]);

    const columnKeys = ["created_at", "machine_name", "outlet_name", "reason", "start_up", "up_time"];

    // === Fetch data dari API ===
    useEffect(() => {
        async function GotLogTasmota() {
            setLoading(true); // 🆕 mulai loading
            const res = await PostWithToken<iResponse<TasmotaLogType[]>>({
                router,
                url: `/api/v2/tasmota/graph/got-all`,
                token: `${auth.access_token}`,
                data: {
                    outlet_ids:
                        selectedOutlets.length >= 1
                            ? selectedOutlets.map((o) => o.outlet_id)
                            : defaultSelectedOutlet.map((o) => o.outlet_id),
                    started_at: startDate.toISOString().split(".")[0],
                    ended_at: endDate.toISOString().split(".")[0],
                    order_by: orderBy || { key: "created_at", value: "DESC" },
                    reason: selectedReason || undefined,
                },
            });

            if (res?.statusCode === 200) {
                setItemsRaw(res.data);
                setItems(res.data);
                setSelectedReason("");
            }
            setLoading(false); // 🆕 selesai loading
        }

        if (!modal) GotLogTasmota();
    }, [
        startDate,
        endDate,
        auth.access_token,
        selectedOutlets,
        defaultSelectedOutlet,
        modal,
        orderBy,
        refresh,
    ]);

    // === Handle sort ===
    const handleSort = (index: number, direction: "asc" | "desc") => {
        const key = columnKeys[index];
        if (!key) return;
        setOrderBy({ key, value: direction.toUpperCase() as "ASC" | "DESC" });
    };

    // === Utility: buat range berdasarkan option ===
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

    const handleFilterByReason = (reason: string) => {
        const newReason = selectedReason === reason ? "" : reason;
        setSelectedReason(newReason);

        if (newReason === "") {
            setItems(itemsRaw);
        } else {
            const filtered = itemsRaw.filter((i) => i.reason === newReason);
            setItems(filtered);
        }
    };

    const handleFilterDataByDate = (option: string) => {
        const [s, e] = getRangeByOption(option);
        setStartDate(s);
        setEndDate(e);
        setCurrentOptionRange(option);
    };

    useEffect(() => {
        const sameDate = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 1000;
        const matched = rangeDateOptions.find((opt) => {
            const [s, e] = getRangeByOption(opt);
            return sameDate(s, startDate) && sameDate(e, endDate);
        });
        setCurrentOptionRange(matched || "");
    }, [startDate, endDate]);

    const formatUptime = (uptime: string): string => {
        if (!uptime) return "-";
        const [dayPart, timePart] = uptime.split("T");
        const days = parseInt(dayPart || "0", 10);
        const [hours, minutes, seconds] = (timePart || "00:00:00").split(":").map((n) => parseInt(n, 10));
        const parts: string[] = [];
        if (days) parts.push(`${days}d`);
        if (hours) parts.push(`${hours}h`);
        if (minutes) parts.push(`${minutes}m`);
        if (seconds) parts.push(`${seconds}s`);
        return parts.join(" ");
    };

    return (
        <div className="min-h-screen">
            <Breadcrumb pageName={"Log Tasmota"} />


            {/* Filter Range */}
            <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {rangeDateOptions.map((option) => {
                        const isActive = currentOptionRange === option;
                        return (
                            <button
                                key={option}
                                onClick={() => handleFilterDataByDate(option)}
                                type="button"
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700
                  ${isActive
                                        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 scale-95"
                                        : "bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Date Pickers */}
            <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <DatePickerOne label="Start" defaultDate={startDate} onChange={(val) => setStartDate(new Date(val))} />
                    <DatePickerOne label="End" defaultDate={endDate} onChange={(val) => setEndDate(new Date(val))} />
                </div>
            </div>

            {/* Filter Reason */}
            <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {filterReasons.map((reason) => {
                        const isActive = selectedReason === reason;
                        return (
                            <button
                                key={reason}
                                onClick={() => handleFilterByReason(reason)}
                                type="button"
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700
                                       ${isActive ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 scale-95"
                                        : "bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {reason}
                            </button>
                        );
                    })}

                    {/* Tombol Reset */}
                    <button
                        onClick={() => {
                            setSelectedReason("");
                            setRefresh(!refresh);
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700
                    ${selectedReason === ""
                                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 scale-95"
                                : "bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                            }`}
                    >
                        ALL
                    </button>
                </div>
            </div>


            {/* Table */}
            <TableSortable
                colls={["#", "Name", "Outlet", "Reason", "Start Up", "Uptime"]}
                currentPage={currentPage}
                totalItem={items.length}
                onPaginate={handlePaginate}
                showing={itemsPerPage}
                onSort={handleSort}
            >
                {loading ? (
                    // 🦴 Skeleton Rows
                    Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse border-b dark:border-gray-700">
                            <td className="px-6 py-4">
                                <div className="h-4 w-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                        </tr>
                    ))
                ) : paginatedItems.length === 0 ? (
                    // 🚫 No Data
                    <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No data found {selectedReason ? `for "${selectedReason}"` : ""}
                        </td>
                    </tr>
                ) : (
                    paginatedItems.map((i, k) => (
                        <tr
                            key={k}
                            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                        >
                            <td className="whitespace-nowrap px-6 py-4">{(currentPage - 1) * itemsPerPage + k + 1}</td>
                            <td className="whitespace-nowrap px-6 py-4 uppercase">{i.machine_name}</td>
                            <td className="whitespace-nowrap px-6 py-4 uppercase">{i.outlet_name}</td>
                            <td className="whitespace-nowrap px-6 py-4 uppercase">{i.reason}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                                {new Date(i.start_up).toLocaleString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                })}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">{formatUptime(i.up_time)}</td>
                        </tr>
                    ))
                )}
            </TableSortable>
        </div>
    );
}
