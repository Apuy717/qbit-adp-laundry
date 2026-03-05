"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input, InputDropdown } from "@/components/Inputs/InputComponent";
import { InputDropdownSearch } from "@/components/Inputs/InputDropdownSearch";
import { GetWithToken, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

interface iDropdown {
    label: string;
    value: string;
}

const creationTypes = [
    { label: "Addition (+)", value: "addition" },
    { label: "Subtraction (-)", value: "subtraction" },
];

export default function CreateStockAdjustment() {
    const [loading, setLoading] = useState<boolean>(false);
    const [outlets, setOutlets] = useState<iDropdown[]>([]);
    const [outletLoading, setOutletLoading] = useState<boolean>(false);
    const [skus, setSkus] = useState<iDropdown[]>([]);

    // States for searching
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const auth = useSelector((s: RootState) => s.auth);
    const router = useRouter();

    // Fetch outlets for the selected SKU
    const fetchOutletsBySkuId = async (skuId: string) => {
        if (!skuId) {
            setOutlets([]);
            return;
        }
        setOutletLoading(true);
        try {
            const res = await GetWithToken<any>({
                router: router,
                url: `/api/outlet/outlet-with-stock/${skuId}`,
                token: `${auth.auth.access_token}`,
            });

            const mappingOutlet: iDropdown[] = (res.data || []).map((i: any) => ({
                label: i.outlet_name,
                value: i.outlet_id,
            }));

            setOutlets(mappingOutlet);
            if (mappingOutlet.length > 0) {
                formik.setFieldValue("outlet_id", mappingOutlet[0].value);
            } else {
                formik.setFieldValue("outlet_id", "");
            }
        } catch (error) {
            console.error("Failed to fetch outlets by SKU", error);
            setOutlets([]);
        } finally {
            setOutletLoading(false);
        }
    };

    // Fetch SKUs when searching
    const fetchSkus = async (searchQuery: string) => {
        try {
            // Note: We use the endpoint we spec'd out: /api/product/skus/filter-by-type
            // This might return a 404 until the backend is implemented, but it fulfills the specification request
            const urlWithQuery = `/api/product/skus/filter?type=goods&search=${searchQuery}`;
            const res = await GetWithToken<any>({
                router: router,
                url: urlWithQuery,
                token: `${auth.auth.access_token}`,
            });

            if (res?.statusCode === 200 && Array.isArray(res.data)) {
                const mappingSkus = res.data.map((i: any) => ({
                    label: `${i.code} - ${i.name}`,
                    value: i.id,
                }));
                setSkus(mappingSkus);
            } else {
                setSkus([]);
            }
        } catch (error) {
            console.error("Failed to fetch SKUs", error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchSkus("");
    }, []);

    const handleSkuSearchChange = (value: string) => {
        // Debounce the search using ref to prevent unnecessary re-renders
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            fetchSkus(value);
        }, 500);
    };

    const formik = useFormik({
        initialValues: {
            type: "addition",
            sku_id: "",
            outlet_id: "",
            quantity: 1,
        },
        validationSchema: Yup.object({
            type: Yup.string().required("Adjustment type is required"),
            sku_id: Yup.string().required("SKU is required"),
            outlet_id: Yup.string().required("Outlet is required"),
            quantity: Yup.number().min(1, "Minimum quantity is 1").required("Quantity is required"),
        }),
        onSubmit: async (values) => {
            if (loading) return;
            setLoading(true);

            const res = await PostWithToken<any>({
                router: router,
                url: "/api/stock/create",
                data: values,
                token: `${auth.auth.access_token}`,
            });

            if (res.statusCode === 422) {
                toast.error(res.err?.[0] || "Validation Error");
            } else if (res.statusCode === 200) {
                toast.success("Stock adjustment created successfully!");
                router.push("/stock-adjustment");
            } else {
                toast.error(res.msg || "Failed to create stock adjustment.");
            }

            setLoading(false);
        },
    });

    return (
        <div className="p-4 min-h-screen">
            <Breadcrumb pageName="Create Stock Adjustment" />
            <div className="relative border-t border-white bg-white pb-10 shadow-md dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg ">
                <div className="mb-8 border-b-2 px-10 py-6">
                    <p className="font-semibold text-lg">Add Stock Adjustment</p>
                </div>
                <div className="px-10">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-1">
                        <InputDropdownSearch
                            label="Search SKU (Type: Goods)*"
                            name="sku_id"
                            id="sku_id"
                            value={formik.values.sku_id}
                            onChange={(v) => {
                                formik.setFieldValue("sku_id", v);
                                formik.setFieldValue("outlet_id", "");
                                setOutlets([]);
                                fetchOutletsBySkuId(v);
                            }}
                            onSearchChange={handleSkuSearchChange}
                            searchPlaceholder={"Search SKU by name/code..."}
                            options={skus.length > 0 ? skus : [{ label: "No SKUs Found", value: "" }]}
                            error={
                                formik.touched.sku_id && formik.errors.sku_id
                                    ? formik.errors.sku_id
                                    : null
                            }
                        />

                        <InputDropdownSearch
                            label={outletLoading ? "Outlet* (Loading...)" : "Outlet*"}
                            name="outlet_id"
                            id="outlet_id"
                            value={formik.values.outlet_id}
                            onChange={(v) => formik.setFieldValue("outlet_id", v)}
                            options={outlets.length > 0 ? outlets : (formik.values.sku_id && !outletLoading ? [{ label: "No outlets with stock", value: "" }] : [])}
                            error={
                                formik.touched.outlet_id && formik.errors.outlet_id
                                    ? formik.errors.outlet_id
                                    : null
                            }
                        />

                        <InputDropdown
                            label="Adjustment Type*"
                            name="type"
                            id="type"
                            value={formik.values.type}
                            onChange={(v) => formik.setFieldValue("type", v)}
                            options={creationTypes}
                            error={
                                formik.touched.type && formik.errors.type
                                    ? formik.errors.type
                                    : null
                            }
                        />

                        <Input
                            label="Quantity*"
                            name="quantity"
                            id="quantity"
                            type="number"
                            value={formik.values.quantity.toString()}
                            onChange={(v) => formik.setFieldValue("quantity", Number(v))}
                            error={
                                formik.touched.quantity && formik.errors.quantity
                                    ? formik.errors.quantity
                                    : null
                            }
                        />
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => formik.handleSubmit()}
                            disabled={loading}
                            className={`inline-flex items-center justify-center rounded-md bg-primary px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? "Submitting..." : "Submit Adjustment"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
