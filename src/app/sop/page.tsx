"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

type SopItem = {
    id: string;
    name: string;
    required_picture: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type SopData = {
    id: string;
    name: string;
    outlet_id: string;
    created_at: string;
    outlet: {
        id: string;
        name: string;
    };
    sop_items: SopItem[];
};

export default function SopPage() {
    const router = useRouter();
    const auth = useSelector((s: RootState) => s.auth);

    const [search, setSearch] = useState<string>("");
    const [sopData, setSopData] = useState<SopData[]>([]);
    const [totalData, setTotalData] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const gotSopItems = async () => {
            if (!auth.auth.access_token) return;

            setLoading(true);
            const res = await GetWithToken<iResponse<SopData[]>>({
                router,
                url: "/api/sop/items",
                token: `${auth.auth.access_token}`,
            });

            if (res?.statusCode === 200) {
                setSopData(res.data || []);
                setTotalData(typeof res.total === "number" ? res.total : res.data?.length || 0);
            }
            setLoading(false);
        };

        gotSopItems();
    }, [auth.auth.access_token, router]);

    const filteredData = useMemo(() => {
        if (!search.trim()) return sopData;

        const keyword = search.toLowerCase();
        return sopData.filter((sop) => {
            const sopMatch = sop.name.toLowerCase().includes(keyword);
            const outletMatch = sop.outlet.name.toLowerCase().includes(keyword);
            const itemMatch = sop.sop_items.some((item) => item.name.toLowerCase().includes(keyword));
            return sopMatch || outletMatch || itemMatch;
        });
    }, [search, sopData]);

    return (
        <div>
            <Breadcrumb pageName="Standard Operating Procedure" />

            <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
                <div className="flex w-full flex-col gap-4 md:flex-row md:items-end">
                    <div className="w-full md:w-96">
                        <Input
                            label={"Search"}
                            name={"search"}
                            id={"search"}
                            value={search}
                            onChange={(v) => setSearch(v)}
                            error={null}
                        />
                    </div>

                    <button
                        onClick={() => router.push("/sop/create")}
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 text-center font-medium text-white hover:bg-opacity-90"
                    >
                        Create SOP
                    </button>
                </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow dark:bg-boxdark">
                <div className="mb-4 text-sm font-semibold text-blue-600">
                    Total SOP {totalData}
                </div>

                {loading && (
                    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500 dark:bg-meta-4 dark:text-gray-300">
                        Memuat data SOP...
                    </div>
                )}

                {!loading && filteredData.map((sop) => (
                    <div
                        key={sop.id}
                        className="mb-4 rounded-md border border-stroke p-4 dark:border-strokedark"
                    >
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold capitalize text-black dark:text-white">{sop.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-300">{sop.outlet == null ? "All Outlet" : sop.outlet.name}</p>
                                <p className="text-xs text-blue-500 dark:text-blue-300">Total Items {sop.sop_items.length}</p>

                            </div>
                            <button
                                onClick={() => router.push(`/sop/update/${sop.id}`)}
                                className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 text-white rounded text-xs"
                            >
                                Update
                            </button>
                        </div>

                        <p className="mb-3 text-xs text-gray-500">Created at {new Date(sop.created_at).toLocaleString("id", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}</p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                                <thead>
                                    <tr className="border-b border-stroke dark:border-strokedark">
                                        <th className="px-2 py-2">#</th>
                                        <th className="px-2 py-2">Item Name</th>
                                        <th className="px-2 py-2">Required Picture</th>
                                        <th className="px-2 py-2">Status</th>
                                        <th className="px-2 py-2">Update at</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sop.sop_items.map((item, idx) => (
                                        <tr key={item.id} className="border-b border-stroke/60 dark:border-strokedark/60">
                                            <td className="px-2 py-2">{idx + 1}</td>
                                            <td className="px-2 py-2">{item.name}</td>
                                            <td className="px-2 py-2">{item.required_picture ? "Yes" : "No"}</td>
                                            <td className="px-2 py-2">
                                                <span
                                                    className={item.is_active ? "rounded bg-green-600 px-2 py-1 text-xs text-white" : "rounded bg-gray-500 px-2 py-1 text-xs text-white"}
                                                >
                                                    {item.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2">{new Date(item.updated_at).toLocaleDateString("id", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}</td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {!loading && filteredData.length === 0 && (
                    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500 dark:bg-meta-4 dark:text-gray-300">
                        Data SOP tidak ditemukan.
                    </div>
                )}
            </div>
        </div>
    );
}
