"use client";

import {
    iDropdown,
    Input,
    InputDropdown,
    InputTextArea,
    InputToggle,
} from "@/components/Inputs/InputComponent";
import InputDropdownSearch from "@/components/Inputs/InputDropdownSearch";
import Modal from "@/components/Modals/Modal";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { EDepartmentEmployee } from "@/types/employee";
import { MachineType } from "@/types/machineType";
import { TypeProduct } from "@/types/product";
import { useFormik } from "formik";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

type MachineId = {
    machine_id: string;
    duration: number;
};

interface MyResponse {
    statusCode: number;
    msg: string;
    data: any;
    total: number;
    err: string | string[];
}

export default function UpdateSkuPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const auth = useSelector((s: RootState) => s.auth);
    const { selectedOutlets, defaultSelectedOutlet } = useContext(FilterByOutletContext);

    const [loading, setLoading] = useState<boolean>(false);
    const [fetchingData, setFetchingData] = useState<boolean>(true);
    const [outlets, setOutlets] = useState<iDropdown[]>([]);
    const [MapingProduct, setMapingProduct] = useState<iDropdown[]>([]);
    const [machineExclusive, setMachineExclusive] = useState<MachineType[]>([]);
    const [isViewSkuExclusive, setIsViewSkuExclusive] = useState<boolean>(false);

    const [productId, setProductId] = useState<string | null>(null);
    const [choosedOutletId, setChoosedOutletId] = useState<string>("");

    const [selectedRadioSelfService, setSelectedRadioSelfService] = useState<boolean>(false);

    const [searchExclusive, setSearchExclusive] = useState<string>("");
    const [checkedRowsMachine, setCheckedRowsMachine] = useState<{ id: string; duration: number }[]>([]);

    const serviceType = [
        { label: "services", value: "services" },
        { label: "goods", value: "goods" },
    ];

    const formik = useFormik({
        initialValues: {
            id: "",
            product_id: "",
            outlet_id: null,
            code: "",
            name: "",
            description: "",
            price: "",
            capital_price: 0,
            type: "",
            outlet_stocks: [] as any[],
            machine_washer: false,
            washer_duration: 0,
            machine_dryer: false,
            dryer_duration: 0,
            machine_iron: false,
            iron_duration: 0,
            is_deleted: false,
            is_self_service: false,
            is_quantity_decimal: false,
            machine_ids: [] as MachineId[],
        },
        validationSchema: Yup.object({

            outlet_id: Yup.string()
                .nullable()
                .required("Outlet is required"),

            product_id: Yup.string()
                .required("Select product"),

            code: Yup.string()
                .trim()
                .max(100, "Max 100 characters"),

            name: Yup.string()
                .trim()
                .max(100, "Max 100 characters")
                .required("Name is required"),

            description: Yup.string()
                .nullable(),

            price: Yup.number()
                .transform((value, originalValue) =>
                    originalValue === "" || originalValue === null ? undefined : value
                )
                .typeError("Price must be a number")
                .min(0, "Price cannot be negative")
                .required("Price is required"),

            type: Yup.string()
                .oneOf(["services", "goods"])
                .required("Type is required"),

            outlet_stocks: Yup.array().when("type", {
                is: "goods",
                then: () =>
                    Yup.array()
                        .of(
                            Yup.object({
                                outlet_id: Yup.string()
                                    .required("Outlet is required"),

                                stock: Yup.number()
                                    .transform((value, originalValue) =>
                                        originalValue === "" || originalValue === null ? undefined : value
                                    )
                                    .typeError("Stock must be a number")
                                    .min(0, "Stock cannot be negative")
                                    .required("Stock is required"),

                                unit: Yup.string()
                                    .required("Unit is required"),
                            })
                        )
                        .min(1, "At least 1 outlet stock is required"),
                otherwise: () => Yup.array().notRequired(),
            }),

            machine_washer: Yup.boolean(),

            washer_duration: Yup.number()
                .nullable()
                .when("machine_washer", {
                    is: true,
                    then: () =>
                        Yup.number()
                            .transform((value, originalValue) =>
                                originalValue === "" || originalValue === null ? undefined : value
                            )
                            .typeError("Duration must be a number")
                            .min(1, "Minimum duration is 1 minute")
                            .required("Washer duration is required"),
                }),

            machine_dryer: Yup.boolean(),

            dryer_duration: Yup.number()
                .nullable()
                .when("machine_dryer", {
                    is: true,
                    then: () =>
                        Yup.number()
                            .transform((value, originalValue) =>
                                originalValue === "" || originalValue === null ? undefined : value
                            )
                            .typeError("Duration must be a number")
                            .min(1, "Minimum duration is 1 minute")
                            .required("Dryer duration is required"),
                }),

            machine_iron: Yup.boolean(),

            iron_duration: Yup.number()
                .nullable()
                .when("machine_iron", {
                    is: true,
                    then: () =>
                        Yup.number()
                            .transform((value, originalValue) =>
                                originalValue === "" || originalValue === null ? undefined : value
                            )
                            .typeError("Duration must be a number")
                            .min(1, "Minimum duration is 1 minute")
                            .required("Iron duration is required"),
                }),

            is_deleted: Yup.boolean(),

            is_self_service: Yup.boolean(),

            is_quantity_decimal: Yup.boolean(),

            machine_ids: Yup.array().of(
                Yup.object({
                    machine_id: Yup.string()
                        .required("Machine is required"),

                    duration: Yup.number()
                        .transform((value, originalValue) =>
                            originalValue === "" || originalValue === null ? undefined : value
                        )
                        .typeError("Duration must be a number")
                        .min(0, "Duration cannot be negative")
                        .required("Duration is required"),
                })
            ),
        }),
        onSubmit: async (values) => {
            if (values.type === "services") {
                Object.assign(values, { outlet_stocks: [] });
            }
            if (!values.machine_washer) {
                Object.assign(values, { washer_duration: null });
            }
            if (!values.machine_dryer) {
                Object.assign(values, { dryer_duration: null });
            }
            if (!values.machine_iron) {
                Object.assign(values, { iron_duration: null });
            }

            if (loading) return;
            setLoading(true);

            const res = await PostWithToken<MyResponse>({
                router: router,
                url: "/api/product/update-sku",
                data: {
                    id: values.id,
                    product_id: values.product_id,
                    outlet_id: values.outlet_id === "all" || !values.outlet_id ? null : values.outlet_id,
                    code: values.code,
                    name: values.name,
                    description: values.description,
                    price: parseInt(values.price as string),
                    capital_price: values.capital_price,
                    type: values.type,
                    outlet_stocks: values.outlet_stocks,
                    machine_washer: values.machine_washer,
                    washer_duration: values.washer_duration,
                    machine_dryer: values.machine_dryer,
                    dryer_duration: values.dryer_duration,
                    machine_iron: values.machine_iron,
                    iron_duration: values.iron_duration,
                    is_deleted: values.is_deleted,
                    is_self_service: values.is_self_service,
                    is_quantity_decimal: values.is_quantity_decimal,
                    machine_ids: values.machine_ids,
                },
                token: `${auth.auth.access_token}`,
            });

            if (res.statusCode === 422) {
                (res.err as string[]).map((i) => {
                    const field = i.split(" ");
                    if (field.length >= 1) formik.setFieldError(field[0], i);
                });
            }

            if (res.statusCode === 200) {
                toast.success("Success update SKU!");
                router.push("/v2/product");
            }
            setLoading(false);
        },
    });

    useEffect(() => {
        const GotOutlets = async () => {
            let urlwithQuery = `/api/outlet`;
            const res = await GetWithToken<MyResponse>({
                router: router,
                url: urlwithQuery,
                token: `${auth.auth.access_token}`,
            });
            const allOutlet = { label: "All", value: "all" };
            const mapingOutlet = res.data.map((i: any) => ({
                label: i.name,
                value: i.id,
            }));
            mapingOutlet.unshift(allOutlet);

            if (mapingOutlet.length >= 1) {
                setOutlets(mapingOutlet);
            }
        };
        GotOutlets();
    }, [auth.auth.access_token, router]);

    useEffect(() => {
        const GotProduct = async () => {
            let urlwithQuery = `/api/product/filter?page=1&limit=100`;
            const res = await PostWithToken<iResponse<TypeProduct[]>>({
                router: router,
                url: urlwithQuery,
                token: `${auth.auth.access_token}`,
                data: {
                    outlet_ids:
                        selectedOutlets.length >= 1
                            ? selectedOutlets.map((o) => o.outlet_id)
                            : auth.department !== EDepartmentEmployee.HQ && auth.role.name !== ERoles.PROVIDER
                                ? defaultSelectedOutlet.map((o) => o.outlet_id)
                                : [],
                },
            });
            const productMap = res.data.map((i: any) => ({
                label: i.name,
                value: i.id,
            }));

            if (productMap.length >= 1) {
                setMapingProduct((prev) => {
                    const extra = prev.filter(p => !productMap.some((pm: any) => pm.value === p.value));
                    return [...productMap, ...extra];
                });
            }
        };
        if (auth) GotProduct();
    }, [auth, selectedOutlets, defaultSelectedOutlet, router]);


    useEffect(() => {
        const fetchSkuData = async () => {
            if (!id || outlets.length === 0) return;
            setFetchingData(true);

            const outletsPayload = selectedOutlets.length >= 1
                ? selectedOutlets.map((o) => o.outlet_id)
                : defaultSelectedOutlet.map((o) => o.outlet_id);

            // We know /api/product/got-skus exists and handles search/filter
            // BUT another way is asking the same API product list or simply doing what v2 does:
            // Since there's no clear getting SKU by ID, we use got-product and look for our SKU in the payload.

            try {
                const res = await PostWithToken<iResponse<any[]>>({
                    router: router,
                    url: `/api/v2/product/got-product`,
                    token: `${auth.auth.access_token}`,
                    data: {
                        outlet_ids: outletsPayload,
                    }
                });

                if (res.statusCode === 200 && res.data) {
                    let foundSku = null;
                    let productOfSku = null;

                    for (const item of res.data) {
                        if (item.skus) {
                            const sku = item.skus.find((s: any) => s.id === id);
                            if (sku) {
                                foundSku = sku;
                                productOfSku = sku.product || item.product;
                                break;
                            }
                        }
                    }

                    if (foundSku) {
                        const i = foundSku;
                        setMapingProduct((prev) => {
                            const pId = i.product?.id || i.product_id || (productOfSku ? (productOfSku as any).id : "");
                            const pName = i.product?.name || (productOfSku ? (productOfSku as any).name || (productOfSku as string) : "");
                            const exists = prev.find((p) => p.value === pId);
                            if (!exists && pId) {
                                return [...prev, { label: pName, value: pId }];
                            }
                            return prev;
                        });
                        formik.setFieldValue("id", i.id);
                        formik.setFieldValue("product_id", i.product?.id || i.product_id || (productOfSku ? (productOfSku as any).id : ""));
                        const o_id = i.outlet !== null ? i.outlet.id : "all";
                        formik.setFieldValue("outlet_id", o_id);
                        setChoosedOutletId(o_id);
                        setProductId(i.product_id);
                        formik.setFieldValue("code", i.code);
                        formik.setFieldValue("name", i.name);
                        formik.setFieldValue("description", i.description == null ? `` : i.description);
                        formik.setFieldValue("capital_price", i.capital_price || 0);
                        formik.setFieldValue("price", i.price);
                        formik.setFieldValue("type", i.type);

                        const mapOutletStocks = (i.OutletStocks || i.outlet_stocks || []).map((os: any) => ({
                            outlet_id: os.outlet_id || "",
                            stock: os.stock || "",
                            unit: os.unit || i.unit || ""
                        }));
                        formik.setFieldValue(
                            "outlet_stocks",
                            mapOutletStocks.length > 0 ? mapOutletStocks : [{ outlet_id: "", stock: "", unit: "" }]
                        );

                        formik.setFieldValue("machine_washer", i.machine_washer);
                        formik.setFieldValue("washer_duration", parseInt(i.washer_duration || 0));
                        formik.setFieldValue("machine_dryer", i.machine_dryer);
                        formik.setFieldValue("dryer_duration", parseInt(i.dryer_duration || 0));
                        formik.setFieldValue("machine_iron", i.machine_iron);
                        formik.setFieldValue("iron_duration", parseInt(i.iron_duration || 0));
                        formik.setFieldValue("is_deleted", i.is_deleted);
                        formik.setFieldValue("is_self_service", i.is_self_service);
                        setSelectedRadioSelfService(i.is_self_service);

                        // Fetch exclusive prices/machines if needed
                        // It was an array of machine IDs. Wait, to fetch `machine_ids` there was an API `/api/product/exclude/got/${skuId}`
                        const exRes = await GetWithToken<MyResponse>({
                            router,
                            url: `/api/product/exclude/got/${id}`,
                            token: `${auth.auth.access_token}`
                        });
                        if (exRes.statusCode === 200 && exRes.data) {
                            const exclusions = exRes.data;
                            const mappings = (exclusions.excludes || exclusions || []).map((ex: any) => ({
                                machine_id: ex.machine_id,
                                duration: ex.duration || 0
                            }))
                            formik.setFieldValue("machine_ids", mappings);
                            setCheckedRowsMachine(mappings.map((m: any) => ({ id: m.machine_id, duration: m.duration })));
                        }

                    } else {
                        toast.error("SKU Not found!");
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setFetchingData(false);
        };

        fetchSkuData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, outlets.length, auth.auth.access_token, router]);

    useEffect(() => {
        async function GotMachines() {
            let urlwithQuery = `/api/machine`;
            const res = await PostWithToken<iResponse<MachineType[]>>({
                router: router,
                url: urlwithQuery,
                token: `${auth.auth.access_token}`,
                data: {
                    outlet_ids:
                        choosedOutletId !== "" && choosedOutletId !== "all"
                            ? [choosedOutletId]
                            : outlets.slice(1).map((o: iDropdown) => o.value),
                },
            });

            if (res?.statusCode === 200) {
                setMachineExclusive(res.data);
            }
        }

        if (outlets.length > 0) GotMachines();
    }, [choosedOutletId, outlets, auth.auth.access_token, router]);


    const filteredMachine = machineExclusive.filter((i) => {
        const search = searchExclusive.toLowerCase();
        return (
            i.name.toLowerCase().includes(search) ||
            i.outlet.name.toLowerCase().includes(search)
        );
    });

    const checkboxRefMachine = useRef<HTMLInputElement>(null);
    const allCheckedmMachine = checkedRowsMachine.length === machineExclusive.length && machineExclusive.length > 0;
    const someCheckedMachine = checkedRowsMachine.length > 0 && !allCheckedmMachine;

    const toggleAllMachine = () => {
        if (allCheckedmMachine) {
            setCheckedRowsMachine([]);
            formik.setFieldValue("machine_ids", []);
        } else {
            const allRows = machineExclusive.map((item) => ({ id: item.id, duration: 0 }));
            setCheckedRowsMachine(allRows);
            formik.setFieldValue("machine_ids", allRows.map((m) => ({ machine_id: m.id, duration: m.duration })));
        }
    };

    const toggleRowMachine = (m: any) => {
        const isChecked = checkedRowsMachine.find((row) => row.id === m.id);
        let updated;
        if (isChecked) {
            updated = checkedRowsMachine.filter((rowId) => rowId.id !== m.id);
        } else {
            updated = [...checkedRowsMachine, { id: m.id, duration: 0 }];
        }
        setCheckedRowsMachine(updated);
        formik.setFieldValue("machine_ids", updated.map((item: any) => ({ machine_id: item.id, duration: item.duration })));
    };

    function updateMachineIds(newMachines: MachineId[]) {
        formik.setFieldValue("machine_ids", newMachines);
    }

    if (fetchingData) {
        return (
            <div className="flex justify-center items-center h-48">
                <p className="text-gray-500 font-medium">Loading SKU Details...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Update SKU
                </h2>
                <nav>
                    <ol className="flex items-center gap-2">
                        <li>
                            <Link className="font-medium hover:text-primary" href="/">
                                Dashboard /
                            </Link>
                        </li>
                        <li>
                            <Link className="font-medium hover:text-primary" href="/v2/product">
                                SKU /
                            </Link>
                        </li>
                        <li className="font-medium text-primary">Update SKU</li>
                    </ol>
                </nav>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
                <div className="space-y-5 py-2 pr-1">
                    <div className="flex flex-col gap-1 w-full">
                        <InputDropdownSearch
                            label="Outlets"
                            name="outlet_id"
                            id="outlet_id"
                            className="w-full"
                            value={formik.values.outlet_id}
                            onChange={(v) => {
                                formik.setFieldValue("outlet_id", v);
                                setChoosedOutletId(v);
                                if (v !== 'all' && v !== null && v !== '') {
                                    const currentStocks = formik.values.outlet_stocks || [];
                                    const existing = currentStocks.find((s: any) => s.outlet_id === v);
                                    let newStocks = [];
                                    if (existing) {
                                        newStocks = [existing];
                                    } else if (currentStocks.length > 0) {
                                        newStocks = [{ ...((currentStocks[0] as object) || {}), outlet_id: v }];
                                    } else {
                                        newStocks = [{ outlet_id: v, stock: "", unit: "" }];
                                    }
                                    formik.setFieldValue(`outlet_stocks`, newStocks);
                                }
                            }}
                            options={outlets}
                            error={
                                formik.touched.outlet_id && formik.errors.outlet_id
                                    ? formik.errors.outlet_id
                                    : null
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                        <InputDropdownSearch
                            label="Product*"
                            name="product_id"
                            id="product_id"
                            className="w-full"
                            value={formik.values.product_id !== null ? formik.values.product_id : ""}
                            onChange={(v) => {
                                setProductId(v);
                                formik.setFieldValue(`product_id`, v);
                            }}
                            options={MapingProduct}
                            error={
                                (formik.touched.product_id || formik.submitCount > 0) && formik.errors.product_id
                                    ? formik.errors.product_id
                                    : null
                            }
                        />
                    </div>
                    <Input
                        label={"Code"}
                        name={"code"}
                        id={"code"}
                        value={formik.values.code}
                        onChange={(v) => formik.setFieldValue(`code`, v)}
                        error={
                            (formik.touched.code || formik.submitCount > 0) && formik.errors.code
                                ? formik.errors.code
                                : null
                        }
                    />
                    <Input
                        label={"Name*"}
                        name={"name"}
                        id={"name"}
                        value={formik.values.name}
                        onChange={(v) => formik.setFieldValue(`name`, v)}
                        error={
                            (formik.touched.name || formik.submitCount > 0) && formik.errors.name
                                ? formik.errors.name
                                : null
                        }
                    />

                    <Input
                        label={"Price*"}
                        name={"price"}
                        id={"price"}
                        type="number"
                        value={formik.values.price as string}
                        onChange={(v) => formik.setFieldValue(`price`, v)}
                        error={
                            (formik.touched.price || formik.submitCount > 0) && formik.errors.price
                                ? formik.errors.price
                                : null
                        }
                    />

                    <InputDropdown
                        label={"Type*"}
                        name={"type"}
                        id={"type"}
                        value={formik.values.type}
                        onChange={(v) => formik.setFieldValue(`type`, v)}
                        options={serviceType}
                        error={
                            (formik.touched.type || formik.submitCount > 0) && formik.errors.type
                                ? formik.errors.type
                                : null
                        }
                    />
                    {formik.values.type === "goods" && (
                        <div className="col-span-1 md:col-span-2 space-y-4 rounded-md border p-4 border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-sm">Outlet Stocks</p>
                                {(formik.values.outlet_id === 'all' || formik.values.outlet_id === '' || formik.values.outlet_id === null) && (
                                    <button
                                        type="button"
                                        className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
                                        onClick={() => {
                                            const newOutletStocks = [...(formik.values.outlet_stocks || []), { outlet_id: "", stock: "", unit: "" }];
                                            formik.setFieldValue("outlet_stocks", newOutletStocks);
                                        }}
                                    >
                                        Add Outlet Stock
                                    </button>
                                )}
                            </div>
                            {formik.values.outlet_stocks?.map((os: any, osIndex: number) => {
                                const isAll = formik.values.outlet_id === 'all' || formik.values.outlet_id === '' || formik.values.outlet_id === null;
                                const selectedOutls = (formik.values.outlet_stocks || []).map((o: any) => o.outlet_id).filter((id: string) => id && id !== 'all');
                                const osOutletId = isAll ? os.outlet_id : formik.values.outlet_id;

                                return (
                                    <div key={osIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 mb-4 relative">
                                        <InputDropdownSearch
                                            label="Outlet*"
                                            name={`outlet_stocks[${osIndex}].outlet_id`}
                                            id={`outlet_id_stock_update_${osIndex}`}
                                            className="w-full"
                                            value={osOutletId}
                                            onChange={(v) => formik.setFieldValue(`outlet_stocks[${osIndex}].outlet_id`, v)}
                                            options={isAll ? outlets.filter(o => o.value !== 'all' && (o.value === os.outlet_id || !selectedOutls.includes(o.value))) : outlets.filter(o => o.value === formik.values.outlet_id)}
                                            error={
                                                ((formik.touched as any).outlet_stocks?.[osIndex]?.outlet_id || formik.submitCount > 0) &&
                                                    typeof formik.errors.outlet_stocks === "object" &&
                                                    (formik.errors.outlet_stocks as any)?.[osIndex]?.outlet_id
                                                    ? (formik.errors.outlet_stocks as any)[osIndex].outlet_id
                                                    : null
                                            }
                                        />
                                        <Input
                                            label="Stock*"
                                            name={`outlet_stocks[${osIndex}].stock`}
                                            type="number"
                                            id={`stock_update_${osIndex}`}
                                            value={os.stock === 0 ? "0" : (os.stock || "")}
                                            onChange={(v) => formik.setFieldValue(`outlet_stocks[${osIndex}].stock`, v === "" ? "" : parseInt(v))}
                                            error={
                                                ((formik.touched as any).outlet_stocks?.[osIndex]?.stock || formik.submitCount > 0) &&
                                                    typeof formik.errors.outlet_stocks === "object" &&
                                                    (formik.errors.outlet_stocks as any)?.[osIndex]?.stock
                                                    ? (formik.errors.outlet_stocks as any)[osIndex].stock
                                                    : null
                                            }
                                        />
                                        <Input
                                            label="Unit*"
                                            name={`outlet_stocks[${osIndex}].unit`}
                                            id={`unit_update_${osIndex}`}
                                            value={os.unit || ""}
                                            onChange={(v) => formik.setFieldValue(`outlet_stocks[${osIndex}].unit`, v)}
                                            error={
                                                ((formik.touched as any).outlet_stocks?.[osIndex]?.unit || formik.submitCount > 0) &&
                                                    typeof formik.errors.outlet_stocks === "object" &&
                                                    (formik.errors.outlet_stocks as any)?.[osIndex]?.unit
                                                    ? (formik.errors.outlet_stocks as any)[osIndex].unit
                                                    : null
                                            }
                                        />
                                        {osIndex > 0 && (
                                            <button
                                                type="button"
                                                className="absolute bg-red-500 rounded-full top-[1.1rem] right-4 p-1 text-white -mt-2 -mr-2"
                                                onClick={() => {
                                                    const newOutletStocks = [...formik.values.outlet_stocks];
                                                    newOutletStocks.splice(osIndex, 1);
                                                    formik.setFieldValue("outlet_stocks", newOutletStocks);
                                                }}
                                            >
                                                <IoCloseOutline size={20} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <InputTextArea
                        className="mt-6"
                        label={"Description"}
                        name={"description"}
                        id={"description"}
                        value={formik.values.description}
                        onChange={(v) => formik.setFieldValue(`description`, v)}
                        error={
                            (formik.touched.description || formik.submitCount > 0) && formik.errors.description
                                ? formik.errors.description
                                : null
                        }
                    />

                    <div className="my-4 flex gap-4 p-4 mt-6 rounded-md border-gray-200 border">
                        <label className="flex cursor-pointer items-center space-x-2">
                            <input
                                type="radio"
                                name="agreement"
                                value="false"
                                checked={selectedRadioSelfService === false}
                                onChange={() => {
                                    setSelectedRadioSelfService(false);
                                    formik.setFieldValue(`is_self_service`, false);
                                }}
                                className="h-5 w-5 checked:bg-blue-600"
                            />
                            <span className="text-sm">Full Service</span>
                        </label>
                        <label className="flex cursor-pointer items-center space-x-2">
                            <input
                                type="radio"
                                name="agreement"
                                value="true"
                                checked={selectedRadioSelfService === true}
                                onChange={() => {
                                    setSelectedRadioSelfService(true);
                                    formik.setFieldValue(`is_self_service`, true);
                                }}
                                className="h-5 w-5 checked:bg-blue-600"
                            />
                            <span className="text-sm">Self Service</span>
                        </label>
                    </div>
                    <div className="my-4 flex gap-4 p-4 mt-6 rounded-md border-gray-200 border">
                        <label className="flex cursor-pointer items-center space-x-2">
                            <input
                                type="radio"
                                name={`isDecimal`}
                                value="false"
                                checked={formik.values.is_quantity_decimal === false}
                                onChange={() => formik.setFieldValue(`is_quantity_decimal`, false)}
                                className="h-5 w-5 checked:bg-blue-600"
                            />
                            <span className="text-sm">Order Qty Non Decimal</span>
                        </label>
                        <label className="flex cursor-pointer items-center space-x-2">
                            <input
                                type="radio"
                                name={`isDecimal`}
                                value="true"
                                checked={formik.values.is_quantity_decimal === true}
                                onChange={() => formik.setFieldValue(`is_quantity_decimal`, true)}
                                className="h-5 w-5 checked:bg-blue-600"
                            />
                            <span className="text-sm">Order Qty Decimal</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 pt-4 md:grid-cols-2 border p-4 rounded-md border-gray-200 my-4">
                        <InputToggle
                            value={formik.values.machine_washer}
                            onClick={(v) => formik.setFieldValue(`machine_washer`, v)}
                            label={"Washer machine"}
                        />
                        <Input
                            className={formik.values.machine_washer ? `` : `w-1 opacity-0`}
                            label={formik.values.machine_washer ? "Time in minutes" : ""}
                            name={"washer_duration"}
                            type="number"
                            id={"washer_duration"}
                            value={formik.values.washer_duration !== null && formik.values.washer_duration !== undefined ? String(formik.values.washer_duration) : ""}
                            onChange={(v) => formik.setFieldValue(`washer_duration`, v === "" ? "" : parseInt(v, 10))}
                            error={
                                (formik.touched.washer_duration || formik.submitCount > 0) && formik.errors.washer_duration
                                    ? formik.errors.washer_duration
                                    : null
                            }
                        />
                        <InputToggle
                            value={formik.values.machine_dryer}
                            onClick={(v) => formik.setFieldValue(`machine_dryer`, v)}
                            label={"Dryer Machine"}
                        />
                        <Input
                            className={formik.values.machine_dryer ? `` : `w-1 opacity-0`}
                            label={formik.values.machine_dryer ? "Time in minutes" : ""}
                            name={"dryer_duration"}
                            type="number"
                            id={"dryer_duration"}
                            value={formik.values.dryer_duration !== null && formik.values.dryer_duration !== undefined ? String(formik.values.dryer_duration) : ""}
                            onChange={(v) => formik.setFieldValue(`dryer_duration`, v === "" ? "" : parseInt(v, 10))}
                            error={
                                (formik.touched.dryer_duration || formik.submitCount > 0) && formik.errors.dryer_duration
                                    ? formik.errors.dryer_duration
                                    : null
                            }
                        />
                        <InputToggle
                            value={formik.values.machine_iron}
                            onClick={(v) => formik.setFieldValue(`machine_iron`, v)}
                            label={"Iron Machine"}
                        />
                        <Input
                            className={formik.values.machine_iron ? `` : `w-1 opacity-0`}
                            label={formik.values.machine_iron ? "Time in minutes" : ""}
                            name={"iron_duration"}
                            type="number"
                            id={"iron_duration"}
                            value={formik.values.iron_duration !== null && formik.values.iron_duration !== undefined ? String(formik.values.iron_duration) : ""}
                            onChange={(v) => formik.setFieldValue(`iron_duration`, v === "" ? "" : parseInt(v, 10))}
                            error={
                                (formik.touched.iron_duration || formik.submitCount > 0) && formik.errors.iron_duration
                                    ? formik.errors.iron_duration
                                    : null
                            }
                        />
                    </div>

                    <div className={formik.values.machine_dryer || formik.values.machine_washer
                        ? "border p-4 rounded-md mb-6 border-gray-200 space-y-6"
                        : `hidden`}>
                        {formik.values.machine_ids && formik.values.machine_ids.length > 0 && (
                            <div className="mb-4">
                                <h4 className="mb-2 font-semibold">Exclusive Machines</h4>
                                <table className="w-full text-sm mt-3">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Machine</th>
                                            <th className="px-4 py-2 text-left">Outlet</th>
                                            <th className="px-4 py-2 text-left">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {formik.values.machine_ids.map((m, idx) => {
                                            const machine = machineExclusive.find((mc) => mc.id === m.machine_id);
                                            return (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">{machine ? machine.name : m.machine_id}</td>
                                                    <td className="px-4 py-2">{machine ? machine.outlet.name : "-"}</td>
                                                    <td className="px-4 py-2">{m.duration} menit</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <button
                            className="w-auto rounded-md bg-blue-500 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                            onClick={() => {
                                const selectedMachines = formik.values.machine_ids || [];
                                setCheckedRowsMachine(
                                    selectedMachines.map((m) => ({
                                        id: m.machine_id,
                                        duration: m.duration,
                                    }))
                                );
                                setIsViewSkuExclusive(true);
                            }}
                        >
                            Add Exclusive Machine
                        </button>
                    </div>

                    <button
                        onClick={formik.submitForm}
                        disabled={loading}
                        className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Submit"}
                    </button>
                </div>
            </div>

            <Modal isOpen={isViewSkuExclusive}>
                <div className="relative h-[80%] w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
                    <div
                        className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
                        onClick={() => setIsViewSkuExclusive(false)}
                    >
                        <IoCloseOutline color="white" size={20} />
                    </div>

                    <div>
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                                Exclusive SKU
                            </h2>
                        </div>
                        <div className="space-y-4 rounded-lg bg-white p-4 dark:bg-gray-700">
                            <Input
                                label={"Search Machine"}
                                name={"searchExclusive"}
                                id={"searchExclusive"}
                                value={searchExclusive}
                                onChange={(v) => setSearchExclusive(v)}
                                error={null}
                            />
                            <button
                                className="w-auto rounded-md bg-blue-500 px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
                                onClick={() => {
                                    updateMachineIds(checkedRowsMachine.map((m) => ({
                                        machine_id: m.id,
                                        duration: m.duration,
                                    })));
                                    setIsViewSkuExclusive(false);
                                }}
                            >
                                Submit Machine Selected
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 h-[60%] overflow-y-auto px-4">
                        <div className="w-full rounded-md border">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className={`px-6 py-3`}>
                                            <input
                                                ref={checkboxRefMachine}
                                                type="checkbox"
                                                checked={allCheckedmMachine}
                                                data-state={allCheckedmMachine ? "checked" : someCheckedMachine ? "indeterminate" : "unchecked"}
                                                onChange={toggleAllMachine}
                                            />
                                        </th>
                                        <th className={`px-6 py-3`}>Machine</th>
                                        <th className={`px-6 py-3`}>Outlet </th>
                                        <th className={`px-6 py-3`}>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMachine.map((m) => {
                                        const selected = checkedRowsMachine.find((row) => row.id === m.id);
                                        return (
                                            <tr key={m.id} className="border-b">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!checkedRowsMachine.find((row) => row.id === m.id)}
                                                        onChange={() => toggleRowMachine(m)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">{m.name}</td>
                                                <td className="px-6 py-4">{m.outlet?.name}</td>
                                                <td className="px-6 py-4">
                                                    {selected && (
                                                        <input
                                                            type="number"
                                                            value={selected?.duration ?? ""}
                                                            onChange={(e) => {
                                                                const newVal = Number(e.target.value);
                                                                const updated = checkedRowsMachine.map((row) =>
                                                                    row.id === m.id ? { ...row, duration: newVal } : row
                                                                );
                                                                setCheckedRowsMachine(updated);
                                                                formik.setFieldValue(
                                                                    "machine_ids",
                                                                    updated.map((row) => ({
                                                                        machine_id: row.id,
                                                                        duration: row.duration,
                                                                    }))
                                                                );
                                                            }}
                                                            className="w-20 rounded border border-gray-300 p-1"
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
