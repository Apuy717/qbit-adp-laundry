"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { Input } from "@/components/Inputs/InputComponent";
import Table from "@/components/Tables/Table";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { IoCheckmark, IoClose } from "react-icons/io5";
import Modal from "@/components/Modals/Modal";


type ClosingStockItem = {
    id: string;
    outlet: {
        id: string;
        name: string;
    };
    sku: {
        id: string;
        name: string;
        product: {
            name: string;
        };
    };
    current_stock: number;
    real_stock: number;
    difference_stock: number;
    note: string | null;
    approved: boolean | null;
    created_by: {
        name: string;
        phone_number: string;
    };
    created_at: string;
    updated_at: string;
};

type ClosingStockResponse = {
    statusCode: number;
    msg: string;
    total: number;
    data: ClosingStockItem[];
};

const COLUMNS = [
    "No",
    "Outlet",
    "Product & SKU",
    "Current Stock",
    "Real Stock",
    "Difference",
    "Note",
    "Created By",
    "Actions",
];

function toApiDateTime(date: Date, hours: number, minutes: number, seconds: number) {
    const nextDate = new Date(date);
    nextDate.setHours(hours, minutes, seconds, 0);
    return nextDate.toISOString().split(".")[0];
}

function formatDateTime(value: string) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function DifferenceBadge({ value }: { value: number }) {
    const isPositive = value > 0;
    const isNegative = value < 0;

    const className = isPositive
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : isNegative
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";

    return (
        <span
            className={`inline-flex min-w-18 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}
        >
            {value > 0 ? `+${value}` : value}
        </span>
    );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
    return (
        <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-1 text-2xl font-bold text-black dark:text-white">{value}</p>
        </div>
    );
}

export default function ClosingStockPage() {
    let startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
    );
    let endOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate() + 1,
    );

    endOfMonth.setHours(6, 59, 59, 0);
    const offsetInMinutes = 7 * 60;
    startOfMonth = new Date(startOfMonth.getTime() + offsetInMinutes * 60 * 1000);

    const [startDate, setStartDate] = useState<Date | string>(
        startOfMonth.toISOString().split(".")[0],
    );
    const [endDate, setEndDate] = useState<Date | string>(
        endOfMonth.toISOString().split(".")[0],
    );
    const [items, setItems] = useState<ClosingStockItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalItem, setTotalItem] = useState<number>(0);
    const [search, setSearch] = useState<string>("");
    const [fixValueSearch, setFixValueSearch] = useState<string>("");
    const [refresh, setRefresh] = useState<boolean>(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(null);

    const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
        FilterByOutletContext,
    );
    const auth = useSelector((state: RootState) => state.auth);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            if (!auth.auth.access_token) return;

            setLoading(true);
            try {
                const res = await PostWithToken<ClosingStockResponse>({
                    router,
                    url: `/api/closing/get-outlet-stock?page=${currentPage}&limit=10&search=${fixValueSearch}`,
                    token: `${auth.auth.access_token}`,
                    data: {
                        started_at: startDate,
                        ended_at: endDate,
                        outlet_ids:
                            selectedOutlets.length >= 1
                                ? selectedOutlets.map((outlet) => outlet.outlet_id)
                                : defaultSelectedOutlet.map((outlet) => outlet.outlet_id),
                    },
                });

                if (res?.statusCode === 200) {
                    setItems(res.data ?? []);
                    setTotalItem(res.total ?? 0);
                } else {
                    setItems([]);
                    setTotalItem(0);
                    toast.error("Failed to load closing stock data");
                }
            } catch {
                setItems([]);
                setTotalItem(0);
                toast.error("An error occurred while loading closing stock data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [
        auth.auth.access_token,
        currentPage,
        defaultSelectedOutlet,
        endDate,
        fixValueSearch,
        modal,
        router,
        selectedOutlets,
        startDate,
        refresh,
    ]);

    const handleAdjustment = async (closingStockId: string, actionType: "approve" | "reject") => {
        if (!auth.auth.access_token) return;

        setActionLoadingId(closingStockId);
        try {
            const url = actionType === "approve"
                ? "/api/stock/adjustment-from-closing/"
                : "/api/stock/reject-from-closing";

            const res = await PostWithToken<{ statusCode: number; msg: string }>({
                router,
                url,
                data: {
                    closing_stock_id: closingStockId,
                },
                token: `${auth.auth.access_token}`,
            });

            if (res?.statusCode === 200) {
                toast.success(`${actionType === "approve" ? "Adjustment" : "Rejection"} processed successfully!`);
                setRefresh((prev) => !prev);
            } else {
                toast.error(res?.msg || `Failed to process stock ${actionType}`);
            }
        } catch {
            toast.error(`An error occurred while processing stock ${actionType}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleConfirm = async () => {
        if (!confirmId || !confirmType) return;
        setConfirmOpen(false);
        await handleAdjustment(confirmId, confirmType);
        setConfirmId(null);
        setConfirmType(null);
    };

    const handleSearch = async () => {
        if (search.length === 0) {
            setCurrentPage(1);
            setItems([]);
            setFixValueSearch("");
        } else {
            if (search.length >= 1) {
                setItems([]);
                setFixValueSearch(search);
                setCurrentPage(1);
            }
        }
    };

    const summary = useMemo(() => {
        return items.reduce(
            (accumulator, item) => {
                if (item.difference_stock > 0) accumulator.positive += 1;
                if (item.difference_stock < 0) accumulator.negative += 1;
                if (item.note) accumulator.withNote += 1;
                return accumulator;
            },
            { positive: 0, negative: 0, withNote: 0 },
        );
    }, [items]);

    return (
        <>
            <Breadcrumb pageName="Closing Stock" />

            <div className="mb-4 rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
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
                    <div className="w-full">
                        <Input
                            label={"Search"}
                            name={"search"}
                            id={"search"}
                            value={search}
                            onChange={(v) => setSearch(v)}
                            error={null}
                            onEnter={handleSearch}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className={`inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-3 text-center 
              font-medium text-white hover:bg-opacity-90 md:w-min lg:px-8 xl:px-10`}
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard title="Total Records" value={totalItem} />
                <StatCard title="Positive Difference" value={summary.positive} />
                <StatCard title="Negative Difference" value={summary.negative} />
                <StatCard title="With Note" value={summary.withNote} />
            </div>

            {loading ? (
                <div className="rounded-sm border border-stroke bg-white px-5 py-16 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading closing stock data...</p>
                    </div>
                </div>
            ) : (
                <Table
                    colls={COLUMNS}
                    currentPage={currentPage}
                    totalItem={totalItem}
                    onPaginate={(page) => setCurrentPage(page)}
                >
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <tr
                                className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                                key={item.id}
                            >
                                <td className="whitespace-nowrap px-6 py-4">
                                    {(currentPage - 1) * 10 + index + 1}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <p className="font-semibold text-black dark:text-white">{item.outlet.name}</p>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <p className="font-semibold text-black dark:text-white">
                                        {item.sku.product.name} - {item.sku.name}
                                    </p>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-center font-semibold text-black dark:text-white">
                                    {item.current_stock}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-center font-semibold text-black dark:text-white">
                                    {item.real_stock}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                    <DifferenceBadge value={item.difference_stock} />
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {item.note ? (
                                        <span className="text-sm text-black dark:text-white">{item.note}</span>
                                    ) : (
                                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <p className="font-medium text-black dark:text-white">{item.created_by.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.created_by.phone_number || "-"}
                                    </p>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {item.approved === true && (
                                        <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20">
                                            Approved
                                        </span>
                                    )}
                                    {item.approved === null && (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                className="flex items-center justify-center rounded bg-green-500 p-1.5 hover:bg-green-600 text-white disabled:opacity-50 transition-colors"
                                                title="Approve"
                                                disabled={actionLoadingId !== null}
                                                onClick={() => {
                                                    setConfirmId(item.id);
                                                    setConfirmType("approve");
                                                    setConfirmOpen(true);
                                                }}
                                            >
                                                <IoCheckmark size={18} />
                                            </button>
                                            <button
                                                className="flex items-center justify-center rounded bg-red-500 p-1.5 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                                                title="Reject"
                                                disabled={actionLoadingId !== null}
                                                onClick={() => {
                                                    setConfirmId(item.id);
                                                    setConfirmType("reject");
                                                    setConfirmOpen(true);
                                                }}
                                            >
                                                <IoClose size={18} />
                                            </button>
                                        </div>
                                    )}
                                    {item.approved === false && (
                                        <span className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/20">
                                            Rejected
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={COLUMNS.length}
                                className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                                No closing stock data found for the current filter.
                            </td>
                        </tr>
                    )}
                </Table>
            )}

            <Modal isOpen={confirmOpen}>
                <div className="relative w-[90%] max-w-md rounded-md bg-white p-6 shadow-default dark:bg-boxdark">
                    <div className="mb-6 text-center">
                        <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                            Confirm Action
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to {confirmType === "approve" ? "approve" : "reject"} this stock adjustment?
                        </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                setConfirmOpen(false);
                                setConfirmId(null);
                                setConfirmType(null);
                            }}
                            className="rounded border border-stroke px-6 py-2 text-center font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`rounded px-6 py-2 text-center font-medium text-white hover:bg-opacity-90 ${
                                confirmType === "approve" ? "bg-green-500" : "bg-red-500"
                            }`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}