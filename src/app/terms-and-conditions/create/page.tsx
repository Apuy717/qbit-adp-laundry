"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  iDropdown,
  Input,
  InputDropdown,
  InputTextArea,
  InputTextAreaWithKeydown,
} from "@/components/Inputs/InputComponent";
import { GetWithToken, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CreateUpdateTAndCDTO } from "@/types/tnc";
import type { Outlet } from "@/types/outlet";

interface MyResponse<TData = unknown> {
  statusCode: number;
  msg: string;
  data: TData;
  err: string | string[];
}

type TAndCItemForm = {
  label: string;
  text: string;
};

type TAndCFormValues = {
  outlet_id: string;
  title: string;
  address: string;
  phone_number: string;
  icon: string | null;
  receipt_icon: string | null;
  items: TAndCItemForm[];
};

export default function TermsAndConditions() {
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const [outlets, setOutlets] = useState<iDropdown[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const GotOutlets = async () => {
      let urlwithQuery = `/api/outlet`;
      const res = await GetWithToken<MyResponse<Outlet[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const allOutlet = {
        label: "All",
        value: "all",
      };
      const mapingOutlet = res.data.map((i) => {
        return {
          label: i.name,
          value: i.id,
        };
      });
      mapingOutlet.unshift(allOutlet);

      if (mapingOutlet.length >= 1) {
        setOutlets(mapingOutlet);
      }
    };
    GotOutlets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const formik = useFormik<TAndCFormValues>({
    initialValues: {
      outlet_id: "all",
      title: "",
      address: "",
      phone_number: "",
      icon: null,
      receipt_icon: null,
      items: [
        {
          label: "",
          text: "",
        },
      ],
    },
    validationSchema: Yup.object({
      outlet_id: Yup.string().required("Outlet is required"),
      title: Yup.string()
        .required("Title is required")
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be at most 100 characters"),
      address: Yup.string().nullable(),
      phone_number: Yup.string().nullable(),
      icon: Yup.string().nullable(),
      receipt_icon: Yup.string().nullable(),
      items: Yup.array()
        .of(
          Yup.object({
            label: Yup.string()
              .required("Item title is required")
              .min(3, "Item title must be at least 3 characters")
              .max(100, "Item title must be at most 100 characters"),
            text: Yup.string()
              .required("Item content is required")
              .min(3, "Item content must be at least 3 characters")
              .max(5000, "Item content must be at most 5000 characters"),
          }),
        )
        .min(1, "At least one item is required"),
    }),
    onSubmit: async (values) => {
      if (loading) return;
      setLoading(true);

      const payload: CreateUpdateTAndCDTO = {
        outlet_id: values.outlet_id === "all" ? null : values.outlet_id,
        title: values.title,
        address: values.address || null,
        phone_number: values.phone_number || null,
        icon: values.icon || null,
        receipt_icon: values.receipt_icon || null,
        items: values.items.map((item) => ({
          label: item.label,
          text: item.text,
        })),
      };

      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/t-and-c/create-update",
        data: payload,
        token: `${auth.auth.access_token}`,
      });
      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Success create Terms and Conditions!");
        router.push("/terms-and-conditions");
      }
      setLoading(false);
    },
  });

  const addVariant = () => {
    formik.setFieldValue("items", [
      ...formik.values.items,
      {
        label: "",
        text: "",
      },
    ]);
  };

  const removeVariant = (index: any) => {
    const items = [...formik.values.items];
    items.splice(index, 1);
    formik.setFieldValue("items", items);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "icon" | "receipt_icon",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64Only = result.includes(",") ? result.split(",")[1] : result;
      formik.setFieldValue(field, base64Only);
    };
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <Breadcrumb pageName="Terms and Conditions" />
      <div className="h-full w-full space-y-6 rounded-md bg-white p-4 dark:bg-boxdark">
        <InputDropdown
          label={"Outlets*"}
          name={"Outlets"}
          id={"Outlets"}
          value={
            formik.values.outlet_id === ""
              ? outlets.length < 1
                ? ""
                : outlets[0].value
              : formik.values.outlet_id
          }
          onChange={(v) => formik.setFieldValue(`outlet_id`, v)}
          options={outlets}
          error={
            formik.touched.outlet_id && formik.errors.outlet_id
              ? formik.errors.outlet_id
              : null
          }
        />
        <Input
          label={"Terms and Conditions Title*"}
          name={"title"}
          id={"title"}
          value={formik.values.title}
          onChange={(v) => formik.setFieldValue("title", v)}
          error={
            formik.touched.title && formik.errors.title
              ? formik.errors.title
              : null
          }
        />
        <Input
          label={"Address"}
          name={"address"}
          id={"address"}
          value={formik.values.address}
          onChange={(v) => formik.setFieldValue("address", v)}
          error={
            formik.touched.address && formik.errors.address
              ? (formik.errors.address as string)
              : null
          }
        />
        <Input
          label={"Phone Number"}
          name={"phone_number"}
          id={"phone_number"}
          value={formik.values.phone_number}
          onChange={(v) => formik.setFieldValue("phone_number", v)}
          error={
            formik.touched.phone_number && formik.errors.phone_number
              ? (formik.errors.phone_number as string)
              : null
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-black-2 dark:text-gray-300">
              Icon (base64 image)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "icon")}
              className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-opacity-90 dark:text-gray-300"
            />
            {formik.values.icon && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-gray-500">Icon preview:</p>
                <img
                  src={`data:image/*;base64,${formik.values.icon}`}
                  alt="Icon preview"
                  className="h-16 w-16 rounded object-contain border border-gray-200"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black-2 dark:text-gray-300">
              Receipt Icon (base64 image)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "receipt_icon")}
              className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-opacity-90 dark:text-gray-300"
            />
            {formik.values.receipt_icon && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-gray-500">Receipt icon preview:</p>
                <img
                  src={`data:image/*;base64,${formik.values.receipt_icon}`}
                  alt="Receipt icon preview"
                  className="h-16 w-16 rounded object-contain border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
        {formik.values.items.map((i, index) => (
          <div key={index}>
            <div className="h-full w-full space-y-6 rounded-lg p-4 outline outline-1 outline-slate-400">
              <div className="flex justify-between">
                <p className="font-bold">Items {index + 1}</p>
                <div className="">
                  <button
                    className={
                      index == 0
                        ? `hidden`
                        : `rounded bg-red-700 p-2 text-sm text-white`
                    }
                    onClick={() => removeVariant(index)}
                  >
                    Delete items
                  </button>
                </div>
              </div>
              <Input
                label={"Items Title*"}
                name={`label${index}`}
                id={`label${index}`}
                value={i.label}
                onChange={(v) =>
                  formik.setFieldValue(`items[${index}].label`, v)
                }
                error={
                  formik.touched.items?.[index]?.label &&
                    typeof formik.errors.items?.[index] === "object" &&
                    (formik.errors.items[index] as any)?.label
                    ? (formik.errors.items[index] as any).label
                    : null
                }
              />
              <InputTextArea
                label={"Items Content*"}
                name={`text${index}`}
                id={`text${index}`}
                value={i.text}
                onChange={(v) =>
                  formik.setFieldValue(`items[${index}].text`, v)
                }
                // onKeydown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                //   if (e.key === "Enter") {
                //     e.preventDefault();
                //     formik.setFieldValue(
                //       `items[${index}].text`,
                //       `${formik.values.items[index].text} \n`,
                //     );
                //   }
                // }}
                error={
                  formik.touched.items?.[index]?.text &&
                    typeof formik.errors.items?.[index] === "object" &&
                    (formik.errors.items[index] as any)?.text
                    ? (formik.errors.items[index] as any).text
                    : null
                }
              />
            </div>
          </div>
        ))}

        <div className="w-full">
          <button
            onClick={addVariant}
            className="w-auto rounded-md bg-blue-500 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            Add items
          </button>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-1">
          <button
            onClick={formik.submitForm}
            className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="mt-6 h-full w-full space-y-6 rounded-md bg-white p-4 dark:bg-boxdark">
        <div className="w-full">
          <button
            onClick={() => { }}
            className="w-auto rounded-md bg-gray-500 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            Preview
          </button>
        </div>
        <div className="h-full w-full space-y-6 rounded-lg p-4 text-black-2 outline outline-1 outline-slate-400  dark:text-gray-300">
          <p className="text-3xl font-bold">{formik.values.title}</p>
          {formik.values.items.map((i, index) => (
            <div key={index}>
              <p className="text-xl font-bold">
                {index + 1 + ". " + formik.values.items[index].label}
              </p>
              <p className="">
                {formik.values.items[index].text
                  .split("\n")
                  .map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
