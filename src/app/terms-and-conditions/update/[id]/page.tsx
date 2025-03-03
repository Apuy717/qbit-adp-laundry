"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  iDropdown,
  Input,
  InputDropdown,
  InputTextArea,
  InputTextArea2,
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
import { json } from "stream/consumers";
import { TNC } from "@/types/tnc";

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  err: string | string[];
}

export default function TermsAndConditions({
  params,
}: {
  params: { id: string };
}) {
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const [outlets, setOutlets] = useState<iDropdown[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [terms, setTerms] = useState<TNC>();

  useEffect(() => {
    const GotOutlets = async () => {
      let urlwithQuery = `/api/outlet`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const allOutlet = {
        label: "All",
        value: "all",
      };
      const mapingOutlet = res.data.map((i: any) => {
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

  useEffect(() => {
    const GotTerms = async () => {
      let urlwithQuery = `/api/t-and-c/detail/${params.id}`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 200) {
        setTerms(res.data);

        formik.setFieldValue("id", res.data.id);
        formik.setFieldValue("outlet_id", res.data.outlet_id);
        formik.setFieldValue("title", res.data.title);
        formik.setFieldValue("items", res.data.terms_and_conditions_items);
      }
    };
    GotTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formik = useFormik({
    initialValues: {
      id: "",
      outlet_id: "",
      title: "",
      items: [
        {
          label: "",
          text: "",
        },
      ],
    },
    validationSchema: Yup.object({
      outlet_id: Yup.string().required(),
      title: Yup.string().required(),
      items: Yup.array().of(
        Yup.object({
          label: Yup.string(),
          text: Yup.string(),
        }),
      ),
    }),
    onSubmit: async (values) => {
      const val = JSON.stringify(values);

      if (loading) return;
      setLoading(true);
      const updatedValues = {
        ...values,
        outlet_id: values.outlet_id === "all" ? null : values.outlet_id,
      };
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/t-and-c/create-update",
        data: updatedValues,
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

  return (
    <div>
      <Breadcrumb pageName="Terms and Conditions" />
      <div className="h-full w-full space-y-6 rounded-md bg-white p-4 dark:bg-boxdark">
        <InputDropdown
          label={"Outlets*"}
          name={"Outlets"}
          id={"Outlets"}
          value={
            formik.values.outlet_id
              ? formik.values.outlet_id
              : outlets.length >= 1
                ? outlets[0].value
                : ""
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
          value={formik.values.title ? formik.values.title : ""}
          onChange={(v) => formik.setFieldValue("title", v)}
          error={
            formik.touched.title && formik.errors.title
              ? formik.errors.title
              : null
          }
        />
        {formik.values.items.map((i, index) => (
          <div key={index}>
            <div className="h-full w-full space-y-6 rounded-lg p-4 outline outline-1 outline-slate-400">
              <div className="flex justify-between">
                <p className="font-bold">Items {index + 1}</p>
                {/* <div className="">
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
                </div> */}
              </div>
              <Input
                label={"Items Title*"}
                name={"label"}
                id={"label"}
                value={i.label ? i.label : ""}
                onChange={(v) =>
                  formik.setFieldValue(`items[${index}].label`, v)
                }
                error={
                  formik.touched.items?.[index]?.label &&
                  typeof formik.errors.items?.[index] === "object" &&
                  formik.errors.items[index]?.label
                    ? formik.errors.items[index].label
                    : null
                }
              />
              <InputTextArea2
                className="h-auto"
                label={"Items Content*"}
                name={"text"}
                id={"text"}
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
                  formik.errors.items[index]?.text
                    ? formik.errors.items[index].text
                    : null
                }
              />
            </div>
          </div>
        ))}

        {/* <div className="w-full">
          <button
            onClick={addVariant}
            className="w-auto rounded-md bg-blue-500 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            Add items
          </button>
        </div> */}
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
          <div className="w-auto rounded-md bg-gray-500 px-10 py-2 text-center font-medium text-white lg:px-8 xl:px-10">
            Preview
          </div>
        </div>
        <div className="h-full w-full space-y-6 rounded-lg p-4 text-black-2 outline outline-1 outline-slate-400  dark:text-gray-300">
          <p className="text-3xl font-bold">{formik.values.title}</p>
          {formik.values.items?.map((i, index) => (
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
