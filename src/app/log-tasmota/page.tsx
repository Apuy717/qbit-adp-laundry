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
    reason: "POWER_LOST" | "NETWORK_ERROR" | "MAINTENANCE" | string;
    up_time: string;
    start_up: string;
    uptime_seconds: number;
    day_of_week: number;
    hour_of_day: number;
    created_at: string;
}

export default function LogTasmota() {
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

    const [startDate, setStartDate] = useState<Date | string>(startOfMonth);
    const [endDate, setEndDate] = useState<Date | string>(endOfMonth);

    // === data & state ===
    const [items, setItems] = useState<TasmotaLogType[]>([]);
    const [orderBy, setOrderBy] = useState<{ key: string; value: "ASC" | "DESC" } | null>(null);
    const [refresh, setRefresh] = useState<boolean>(false);

    const { auth, role } = useSelector((s: RootState) => s.auth);
    const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
        FilterByOutletContext
    );
    const router = useRouter();

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

    // === Mapping index kolom ke nama field di backend ===
    const columnKeys = [
        "created_at",
        "machine_name",
        "outlet_name",
        "reason",
        "start_up",
        "up_time",
    ];

    // === Ambil data ===
    useEffect(() => {
        async function GotLogTasmota() {
            const res = await PostWithToken<iResponse<TasmotaLogType[]>>({
                router,
                url: `/api/v2/tasmota/graph/got-all`,
                token: `${auth.access_token}`,
                data: {
                    outlet_ids:
                        selectedOutlets.length >= 1
                            ? selectedOutlets.map((o) => o.outlet_id)
                            : defaultSelectedOutlet.map((o) => o.outlet_id),
                    started_at: startDate,
                    ended_at: endDate,
                    order_by: orderBy || {
                        "key": "created_at",
                        "value": "DESC"
                    },
                },
            });

            if (res?.statusCode === 200) {
                setItems(res.data);
            }
        }

        if (!modal) GotLogTasmota();
    }, [
        refresh,
        auth.access_token,
        selectedOutlets,
        defaultSelectedOutlet,
        modal,
        startDate,
        endDate,
        orderBy,
        router,
    ]);

    // === Format uptime ===
    function formatUptime(uptime: string): string {
        if (!uptime) return "-";

        const [dayPart, timePart] = uptime.split("T");
        const days = parseInt(dayPart || "0", 10);
        const [hours, minutes, seconds] = (timePart || "00:00:00")
            .split(":")
            .map((n) => parseInt(n, 10));

        const parts: string[] = [];
        if (days) parts.push(`${days}d`);
        if (hours) parts.push(`${hours}h`);
        if (minutes) parts.push(`${minutes}m`);
        if (seconds) parts.push(`${seconds}s`);
        return parts.join(" ");
    }

    // === Handle sort dari table ===
    const handleSort = (index: number, direction: "asc" | "desc") => {
        const key = columnKeys[index];
        if (!key) return;

        setOrderBy({
            key,
            value: direction.toUpperCase() as "ASC" | "DESC",
        });
    };

    return (
        <div className="min-h-screen">
            <Breadcrumb pageName={"Log Tasmota"} />

            {/* Filter tanggal */}
            <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <DatePickerOne
                        label={"Start"}
                        defaultDate={new Date(startDate)}
                        onChange={(val) => setStartDate(val)}
                    />
                    <DatePickerOne
                        label={"End"}
                        defaultDate={new Date(endDate)}
                        onChange={(val) => setEndDate(val)}
                    />
                </div>
            </div>

            {/* Tabel dengan sorting */}
            <TableSortable
                colls={["#", "Name", "Outlet", "Reason", "Start Up", "Uptime"]}
                currentPage={0}
                totalItem={items.length}
                onPaginate={() => { }}
                showing={100}
                onSort={handleSort}
            >
                {items.map((i, k) => (
                    <tr
                        key={k}
                        className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                    >
                        <td className="whitespace-nowrap px-6 py-4">{k + 1}</td>
                        <td className="whitespace-nowrap px-6 py-4 uppercase">
                            {i.machine_name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 uppercase">
                            {i.outlet_name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 uppercase">
                            {i.reason}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                            {new Date(i.start_up).toLocaleDateString("id", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                            {formatUptime(i.up_time)}
                        </td>
                    </tr>
                ))}
            </TableSortable>
        </div>
    );
}
