"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { iDropdown, Input, InputDropdown } from "@/components/Inputs/InputComponent";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import { log } from "console";
import { getIn, useFormik } from "formik";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

type SopItem = {
    id: string;
    name: string;
    required_picture: boolean;
    is_active: boolean;
    is_staff?: boolean;
};

type SopData = {
    id: string;
    name: string;
    outlet_id: string;
    sop_items: SopItem[];
};

type FormItem = {
    id?: string;
    name: string;
    required_picture: boolean;
    is_active: boolean;
    is_staff: boolean;
};

type FormValues = {
    outlet_id: string;
    sop_group_name: string;
    sop_items: FormItem[];
};

const defaultItem = (): FormItem => ({
    name: "",
    required_picture: true,
    is_active: true,
    is_staff: false,
});

const validationSchema = Yup.object({
    outlet_id: Yup.string().trim().required("Outlet wajib dipilih"),
    sop_group_name: Yup.string().trim().required("Nama grup SOP wajib diisi"),
    sop_items: Yup.array()
        .of(
            Yup.object({
                id: Yup.string().optional(),
                name: Yup.string().trim().required("Nama item wajib diisi"),
                required_picture: Yup.boolean().required(),
                is_active: Yup.boolean().required(),
                is_staff: Yup.boolean().required(),
            }),
        )
        .min(1, "Minimal 1 item SOP harus diisi")
        .required(),
});

export default function UpdateSopPage() {
    const router = useRouter();
    const params = useParams();
    const sopId = params.id as string;
    const auth = useSelector((s: RootState) => s.auth);

    const [loading, setLoading] = useState<boolean>(true);
    const [outlets, setOutlets] = useState<iDropdown[]>([]);
    const [initialValues, setInitialValues] = useState<FormValues>({
        outlet_id: "",
        sop_group_name: "",
        sop_items: [defaultItem()],
    });

    const formik = useFormik<FormValues>({
        initialValues,
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            console.log("Submitting form with values:", values);
            const validItems = values.sop_items.filter((item) => item.name.trim().length > 0);

            if (validItems.length === 0) {
                toast.warn("Minimal 1 item SOP harus diisi");
                setSubmitting(false);
                return;
            }

            const payload: any = {
                id: sopId,
                sop_group_name: values.sop_group_name.trim(),
                sop_items: validItems.map((item) => {
                    const itemPayload: any = {
                        name: item.name.trim(),
                        required_picture: item.required_picture,
                        is_active: item.is_active,
                        is_staff: item.is_staff,
                    };
                    if (item.id) {
                        itemPayload.id = item.id;
                    }
                    return itemPayload;
                }),
            };
            if (values.outlet_id !== "null") {
                payload.outlet_id = values.outlet_id;
            }

            const res = await PostWithToken<iResponse<any>>({
                router,
                url: "/api/sop/items",
                token: `${auth.auth.access_token}`,
                data: payload,
            });

            if (res.statusCode === 200) {
                toast.success("Success update data!");
                router.push("/sop");
            } else {
                toast.error("Failed to update data. Please try again.");
            }

            setSubmitting(false);
        },
    });

    useEffect(() => {
        const initData = async () => {
            if (!auth.auth.access_token || !sopId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const [outletRes, sopRes] = await Promise.all([
                GetWithToken<iResponse<Outlet[]>>({
                    router,
                    url: "/api/outlet",
                    token: `${auth.auth.access_token}`,
                }),
                GetWithToken<iResponse<SopData[]>>({
                    router,
                    url: "/api/sop/items",
                    token: `${auth.auth.access_token}`,
                }),
            ]);

            if (outletRes?.statusCode === 200) {
                const allOutlet = {
                    label: "All",
                    value: "null",
                };
                const outletOptions = [allOutlet, ...outletRes.data.map((item) => ({
                    label: item.name,
                    value: item.id,
                }))];
                setOutlets(outletOptions);
            }

            if (sopRes?.statusCode === 200) {
                const selectedSop = sopRes.data.find((item) => item.id === sopId);

                if (!selectedSop) {
                    toast.warn("Data SOP tidak ditemukan");
                    router.push("/sop");
                    setLoading(false);
                    return;
                }

                const mappedItems = selectedSop.sop_items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    required_picture: item.required_picture,
                    is_active: item.is_active,
                    is_staff: !!item.is_staff,
                }));

                setInitialValues({
                    outlet_id: selectedSop.outlet_id ?? "null",
                    sop_group_name: selectedSop.name,
                    sop_items: mappedItems.length >= 1 ? mappedItems : [defaultItem()],
                });
            }

            setLoading(false);
        };

        initData();
    }, [auth.auth.access_token, router, sopId]);

    const updateItemName = (index: number, value: string) => {
        formik.setFieldValue(`sop_items.${index}.name`, value);
    };

    const updateItemRequiredPicture = (index: number, checked: boolean) => {
        formik.setFieldValue(`sop_items.${index}.required_picture`, checked);
    };

    const updateItemActive = (index: number, checked: boolean) => {
        formik.setFieldValue(`sop_items.${index}.is_active`, checked);
    };

    const updateItemStaff = (index: number, checked: boolean) => {
        formik.setFieldValue(`sop_items.${index}.is_staff`, checked);
    };

    const addItem = () => {
        formik.setFieldValue("sop_items", [...formik.values.sop_items, defaultItem()]);
    };

    const removeItem = (index: number) => {
        const updatedItems = formik.values.sop_items.filter((_, idx) => idx !== index);
        formik.setFieldValue("sop_items", updatedItems);
    };

    return (
        <div>
            <Breadcrumb pageName="Update SOP" />

            <div className="rounded-sm border border-stroke bg-white px-5 pb-6 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
                {loading ? (
                    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500 dark:bg-meta-4 dark:text-gray-300">
                        Loading SOP data...
                    </div>
                ) : (
                    <form onSubmit={formik.handleSubmit}>
                        <div className="mb-5">
                            <InputDropdown
                                label={"Outlet"}
                                name={"outlet_id"}
                                id={"outlet_id"}
                                value={formik.values.outlet_id}
                                onChange={(v) => formik.setFieldValue("outlet_id", v)}
                                options={outlets}
                                error={
                                    formik.submitCount > 0 && typeof formik.errors.outlet_id === "string"
                                        ? formik.errors.outlet_id
                                        : null
                                }
                            />
                        </div>

                        <div className="mb-5">
                            <Input
                                label={"SOP Group Name"}
                                name={"sop_group_name"}
                                id={"sop_group_name"}
                                value={formik.values.sop_group_name}
                                onChange={(v) => formik.setFieldValue("sop_group_name", v)}
                                error={
                                    formik.submitCount > 0 && typeof formik.errors.sop_group_name === "string"
                                        ? formik.errors.sop_group_name
                                        : null
                                }
                            />
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-black dark:text-white">SOP Items</p>

                            {formik.values.sop_items.map((item, idx) => (
                                <div key={item.id || `new-item-${idx}`} className="rounded-md border border-stroke p-3 dark:border-strokedark">
                                    <div className="flex justify-between">
                                        <div className="mb-2 text-xs text-gray-500">Item {idx + 1}</div>
                                        <button
                                            onClick={() => removeItem(idx)}
                                            className="inline-flex items-center justify-center rounded-md bg-danger p-1 text-xs font-medium text-white hover:bg-opacity-90"
                                            type="button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-end">
                                        <Input
                                            label={"Item Name"}
                                            name={`item-${idx}`}
                                            id={`item-${idx}`}
                                            value={item.name}
                                            onChange={(v) => updateItemName(idx, v)}
                                            error={
                                                formik.submitCount > 0
                                                    ? (getIn(formik.errors, `sop_items.${idx}.name`) as string) || null
                                                    : null
                                            }
                                        />

                                        <label className="inline-flex items-center gap-2 text-sm text-black dark:text-white">
                                            <input
                                                type="checkbox"
                                                checked={item.required_picture}
                                                onChange={(e) => updateItemRequiredPicture(idx, e.target.checked)}
                                            />
                                            Required Picture
                                        </label>

                                        <label className="inline-flex items-center gap-2 text-sm text-black dark:text-white">
                                            <input
                                                type="checkbox"
                                                checked={item.is_active}
                                                onChange={(e) => updateItemActive(idx, e.target.checked)}
                                            />
                                            Active
                                        </label>

                                        <label className="inline-flex items-center gap-2 text-sm text-black dark:text-white">
                                            <input
                                                type="checkbox"
                                                checked={item.is_staff}
                                                onChange={(e) => updateItemStaff(idx, e.target.checked)}
                                            />
                                            Staff
                                        </label>
                                    </div>
                                </div>
                            ))}

                            {formik.submitCount > 0 && typeof formik.errors.sop_items === "string" && (
                                <p className="text-sm text-red-500">{formik.errors.sop_items}</p>
                            )}
                            <button
                                onClick={addItem}
                                className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                type="button"
                            >
                                Add Item
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                            <button
                                type="button"
                                onClick={() => router.push("/sop")}
                                className="inline-flex items-center justify-center rounded-md bg-gray-200 px-6 py-2 text-sm font-medium text-black hover:bg-opacity-90"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={formik.isSubmitting}
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                            >
                                {formik.isSubmitting ? "Saving..." : "Update"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
