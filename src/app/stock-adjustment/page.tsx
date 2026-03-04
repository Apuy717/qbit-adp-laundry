"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Input } from "@/components/Inputs/InputComponent";
import { ERoles } from "@/stores/authReducer";
import moment from "moment";

interface StockAdjustmentLog {
    id: string;
    type: string;
    unit: string;
    quantity: number;
    old_stock: number;
    current_stock: number;
    created_at: string;
    product_sku: {
        id: string;
        code: string;
        name: string;
        description: string;
        product: {
            id: string;
            name: string;
            picture: string | null;
            description: string;
        }
    };
    created_by: {
        fullname: string;
        email: string;
        dial_code: string;
        phone_number: string;
    };
    outlet: {
        id: string;
        name: string;
        city: string;
    };
}

const CELLS = [
    "No",
    "Outlet",
    "Product & SKU",
    "Type",
    "Qty",
    "Old Stock",
    "Current Stock",
    "Created By",
    "Date",
];

export default function StockAdjustment() {
    const [logs, setLogs] = useState<StockAdjustmentLog[]>([]);
    const auth = useSelector((s: RootState) => s.auth);
    const router = useRouter();

    const [totalItem, setTotalItem] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState<string>("");
    const [fixValueSearch, setFixValueSearch] = useState<string>("");
    const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);

    useEffect(() => {
        const fetchLogs = async () => {
            let urlWithQuery = `/api/stock/logs?page=${currentPage}&limit=10`;
            if (fixValueSearch.length >= 1) {
                urlWithQuery += `&search=${fixValueSearch}`;
            }

            const res = await GetWithToken<iResponse<StockAdjustmentLog[]>>({
                router: router,
                url: urlWithQuery,
                token: `${auth.auth.access_token}`,
            });

            if (res?.statusCode === 200) {
                setLogs(res.data);
                if (res.total) setTotalItem(res.total);
                else setTotalItem(0);
            }
            setTimeout(() => {
                setLoadingSearch(false);
            }, 100);
        };

        fetchLogs();
    }, [currentPage, fixValueSearch, refresh, auth.auth.access_token, router]);

    const handleSearch = async () => {
        if (search.length === 0) {
            setCurrentPage(1);
            setLogs([]);
            setLoadingSearch(true);
            setFixValueSearch("");
            setRefresh((prev) => !prev);
        } else {
            if (search.length >= 1 && fixValueSearch !== search) {
                setLogs([]);
                setLoadingSearch(true);
                setFixValueSearch(search);
                setCurrentPage(1);
            }
        }
    };

    return (
        <>
            <Breadcrumb pageName="Stock Adjustment" />
            <div
                className={`${auth.role.name !== ERoles.PROVIDER && auth.role.name !== ERoles.SUPER_ADMIN && "hidden"} mb-4 w-full  rounded-t bg-white p-4 dark:bg-boxdark`}
            >
                <div className="flex w-full flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
                    <div className="lg:w-90">
                        <Input
                            label={"Search SKU, Product, or Outlet"}
                            name={"search"}
                            id={"search"}
                            value={search}
                            onChange={(v) => setSearch(v)}
                            error={null}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white dark:text-gray-400 hover:bg-opacity-90 lg:px-8 xl:px-10`}
                    >
                        Search
                    </button>
                    <Link
                        href={"/stock-adjustment/create"}
                        className={`${auth.role.name !== ERoles.PROVIDER && auth.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90
            dark:text-gray-400 lg:px-8 xl:px-10`}
                    >
                        Create Stock Adjustment
                    </Link>
                </div>
            </div>

            <Table
                colls={CELLS}
                onPaginate={(page) => setCurrentPage(page)}
                currentPage={currentPage}
                totalItem={totalItem}
            >
                {logs.map((log, index) => {
                    let typeColor = log.type === "addition" ? "text-green-500" : "text-red-500";
                    let badgeBg = log.type === "addition" ? "bg-green-100" : "bg-red-100";

                    return (
                        <tr
                            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                            key={index}
                        >
                            <td className="whitespace-nowrap px-6 py-4">
                                {(currentPage - 1) * 10 + index + 1}
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-bold">{log.outlet.name}</p>
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-bold">{log.product_sku.product.name} - {log.product_sku.name}</p>
                                <p className="text-sm text-gray-500">{log.product_sku.code}</p>
                            </td>
                            <td className={`whitespace-nowrap px-6 py-4 font-bold capitalize ${typeColor}`}>
                                <span className={`rounded-full px-3 py-1 text-xs ${badgeBg}`}>{log.type}</span>
                            </td>
                            <td className={`whitespace-nowrap px-6 py-4 font-bold ${typeColor}`}>
                                {log.type === "addition" ? "+" : "-"}{log.quantity} {log.unit}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                <span className="text-gray-500 font-medium">{log.old_stock}</span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                <span className="text-primary font-bold">{log.current_stock}</span>
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-medium text-gray-800 dark:text-gray-300">{log.created_by.fullname}</p>
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-medium text-gray-800 dark:text-gray-300"> {moment(log.created_at).format("DD MMM YYYY, HH:mm")}</p>
                            </td>
                        </tr>
                    )
                })}
            </Table>
        </>
    );
}
