"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GetWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiClock, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

type OutletDetail = {
    id: string;
    name: string;
    country: string | null;
    province: string | null;
    city: string | null;
    district: string | null;
    postal_code: string | null;
    address: string | null;
    dial_code: string | null;
    phone_number: string | null;
    email: string | null;
    latitude: string | null;
    longitude: string | null;
    is_deleted: boolean;
    total_washer: number | null;
    total_dryer: number | null;
    opening_schedule: string | null;
    created_at: string | null;
    updated_at: string | null;
    outlet_area_grouping: {
        id: string;
        outlet_area: {
            id: string;
            name: string;
        };
    } | null;
};

type OutletDetailResponse = {
    statusCode: number;
    msg: string;
    data: OutletDetail;
    err?: string | string[];
};

type OutletScheduleItem = {
    id: string;
    status: "open" | "closed";
    day: number;
    opened_time: string;
    closed_time: string;
    created_at: string;
    updated_at: string;
};

type OutletScheduleResponse = {
    statusCode: number;
    msg: string;
    data: OutletScheduleItem[];
    err?: string | string[];
};

const dayNames: Record<number, string> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
};

function safeText(value: unknown): string {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
}

function normalizeRegionName(value: string | null): string {
    if (!value) return "-";
    const parts = value.split("--");
    return parts.length >= 2 ? parts[1] : value;
}

function formatDate(value: string | null): string {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTime(value: string | null): string {
    if (!value) return "-";
    if (value === "00:00:00") return "00:00";
    return value.slice(0, 5);
}

function DetailItem({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-md border border-stroke bg-gray-50 px-4 py-3 dark:border-strokedark dark:bg-meta-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {icon}
                {label}
            </p>
            <p className="mt-1 break-words text-sm font-medium text-black dark:text-white">{value}</p>
        </div>
    );
}

export default function OutletDetailPage() {
    const params = useParams();
    const router = useRouter();
    const auth = useSelector((s: RootState) => s.auth);

    const [loading, setLoading] = useState(true);
    const [outlet, setOutlet] = useState<OutletDetail | null>(null);
    const [schedules, setSchedules] = useState<OutletScheduleItem[]>([]);

    const outletId = useMemo(() => String(params.outletid || ""), [params.outletid]);

    useEffect(() => {
        const getDetail = async () => {
            if (!auth.auth.access_token || !outletId) return;

            setLoading(true);
            const [detailRes, scheduleRes] = await Promise.all([
                GetWithToken<OutletDetailResponse>({
                    router,
                    url: `/api/outlet/${outletId}`,
                    token: `${auth.auth.access_token}`,
                }),
                GetWithToken<OutletScheduleResponse>({
                    router,
                    url: `/api/schedule/outlet/${outletId}`,
                    token: `${auth.auth.access_token}`,
                }),
            ]);

            if (detailRes?.statusCode === 200) {
                setOutlet(detailRes.data);
            } else {
                toast.warning("Outlet detail not found");
                router.push("/outlet");
            }

            if (scheduleRes?.statusCode === 200 && Array.isArray(scheduleRes.data)) {
                const sortedSchedule = [...scheduleRes.data].sort((a, b) => a.day - b.day);
                setSchedules(sortedSchedule);
            } else {
                setSchedules([]);
            }

            setLoading(false);
        };

        getDetail();
    }, [auth.auth.access_token, outletId, router]);

    return (
        <div className="mx-auto max-w-242.5">
            <Breadcrumb pageName="Outlet Detail" />

            {loading ? (
                <div className="rounded-sm border border-stroke bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-default dark:border-strokedark dark:bg-boxdark dark:text-gray-400">
                    Loading outlet detail...
                </div>
            ) : !outlet ? (
                <div className="rounded-sm border border-stroke bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-default dark:border-strokedark dark:bg-boxdark dark:text-gray-400">
                    Outlet detail is not available.
                </div>
            ) : (
                <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="relative z-20 h-35">
                        <div className="absolute left-8 top-4">
                            <button
                                onClick={() => router.push("/outlet")}
                                className="inline-flex items-center gap-2 rounded-md bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-black"
                                type="button"
                            >
                                <FaArrowLeft size={14} />
                                Back
                            </button>
                        </div>
                    </div>

                    <div className="px-5 pb-7 pt-0 md:px-8">
                        <div className="relative -mt-12 mb-5 flex flex-col gap-4 md:-mt-16 md:flex-row md:items-end md:justify-between">
                            <div className="flex items-end gap-4">
                                <div className="pb-1">
                                    <h2 className="text-2xl font-semibold text-black dark:text-white">{safeText(outlet.name)}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {safeText(outlet.outlet_area_grouping?.outlet_area?.name)} • {normalizeRegionName(outlet.city)}
                                    </p>
                                </div>
                            </div>

                            {outlet.is_deleted ? (
                                <span className="rounded-full bg-red-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    Inactive Outlet
                                </span>
                            ) : (
                                <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Active Outlet
                                </span>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-md border border-stroke bg-gradient-to-br from-white to-gray-50 p-5 dark:border-strokedark dark:from-boxdark dark:to-meta-4">
                                <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Contact & Location</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    <DetailItem
                                        label="Phone"
                                        value={`${safeText(outlet.dial_code)} ${safeText(outlet.phone_number)}`.trim()}
                                        icon={<FiPhone size={13} />}
                                    />
                                    <DetailItem label="Email" value={safeText(outlet.email)} icon={<FiUser size={13} />} />
                                    <DetailItem label="Country" value={safeText(outlet.country)} />
                                    <DetailItem label="Province" value={normalizeRegionName(outlet.province)} />
                                    <DetailItem label="City" value={normalizeRegionName(outlet.city)} />
                                    <DetailItem label="District" value={normalizeRegionName(outlet.district)} />
                                </div>
                            </div>

                            <div className="rounded-md border border-stroke p-5 dark:border-strokedark">
                                <h3 className="mb-3 text-base font-semibold text-black dark:text-white">Address</h3>
                                <p className="rounded-md border border-stroke bg-gray-50 px-4 py-3 text-sm leading-relaxed text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">
                                    {safeText(outlet.address)}
                                </p>
                            </div>

                            <div className="rounded-md border border-stroke p-5 dark:border-strokedark">
                                <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Operational Summary</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <DetailItem label="Total Nozzle" value={safeText(outlet.total_washer)} />
                                    <DetailItem label="Outlet Area" value={safeText(outlet.outlet_area_grouping?.outlet_area?.name)} />
                                </div>
                            </div>

                            <div className="rounded-md border border-stroke p-5 dark:border-strokedark">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Weekly Schedule</h3>
                                    <button
                                        onClick={() => router.push(`/outlet/detail/${outletId}/schedule`)}
                                        className="inline-flex items-center gap-2 rounded-md bg-green-700/70 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-green-700"
                                        type="button"
                                    >
                                        Set Schedule
                                    </button>
                                </div>

                                {schedules.length === 0 ? (
                                    <p className="rounded-md border border-stroke bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-gray-400">
                                        Schedule is not available.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                                        {schedules.map((sch) => {
                                            const isOpen = sch.status === "open";
                                            return (
                                                <div
                                                    key={sch.id}
                                                    className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${isOpen
                                                        ? "border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-900/10"
                                                        : "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-900/10"
                                                        }`}
                                                >
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <p className="text-sm font-semibold text-black dark:text-white">
                                                            {dayNames[sch.day] || `Day ${sch.day}`}
                                                        </p>
                                                        {isOpen ? (
                                                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                Open
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                Closed
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="rounded-md border border-stroke bg-white/70 p-3 dark:border-strokedark dark:bg-boxdark/50">
                                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                            <span>Open Time</span>
                                                            <span>Close Time</span>
                                                        </div>
                                                        <div className="mt-1 flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-black dark:text-white">{formatTime(sch.opened_time)}</p>
                                                            <p className="text-sm font-semibold text-black dark:text-white">{formatTime(sch.closed_time)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
