"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DatePickerOne } from "@/components/FormElements/DatePicker/DatePickerOne";
import { Input, InputDropdown, InputFile } from "@/components/Inputs/InputComponent";
import { GetWithToken, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  err: string | string[];
}
interface iDropdown {
  label: string;
  value: string;
}
[];


export default function CreateProduct() {
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<iDropdown[]>([])
  const [purReq, setPurReq] = useState<iDropdown[]>([])
  const [showImage, setShowImage] = useState<string>("")
  const [outletId, setOutletId] = useState<string>("")

  const auth = useSelector((s: RootState) => s.auth);

  const router = useRouter();

  useEffect(() => {
    const GotOutlets = async () => {
      let urlwithQuery = `/api/outlet`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const mapingOutlet = (res.data).map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      })

      if (mapingOutlet.length >= 1) {
        formik.setFieldValue("outlet_id", mapingOutlet[0].value)
        setOutlets(mapingOutlet)
        setOutletId(mapingOutlet[0].value)
      }
      console.log(outletId);
    };
    GotOutlets();
  }, [])

  useEffect(() => {
    if (outletId) {
      const GotIdPurchaseItem = async () => {
        let urlwithQuery = `/api/pr/outlet/${outletId}`;
        const res = await GetWithToken<MyResponse>({
          router: router,
          url: urlwithQuery,
          token: `${auth.auth.access_token}`,
        });
        const mapingPurReq = (res.data).map((i: any) => {
          return {
            label: i.name,
            value: i.id,
          };
        })
        if (mapingPurReq.length >= 1) {
          formik.setFieldValue(`items[0].purchase_request_id`, mapingPurReq[0].value)
          console.log(formik.values.items[0].purchase_request_id);

        }
        setPurReq(mapingPurReq)
      };
      GotIdPurchaseItem();
    }

  }, [outletId, outlets])

  const formik = useFormik({
    initialValues: {
      outlet_id: "",
      trx_date: "",
      note_file: "",
      items: [
        {
          purchase_request_id: "",
          price: "",
          quantity: "",
          unit: "",
        },
      ],
    },
    validationSchema: Yup.object({
      outlet_id: Yup.string().required('Harus pilih outlet'),
      trx_date: Yup.string().required('Harus diisi'),
      note_file: Yup.string(),
      items: Yup.array().of(
        Yup.object({
          purchase_request_id: Yup.string().max(100, "Maksimal 100 karakter!"),
          price: Yup.number().min(0).required('Harus diisi'),
          quantity: Yup.number().min(0).required('Harus diisi'),
          unit: Yup.string().required('Harus diisi'),
        })
      ),

    }),
    onSubmit: async (values) => {
      console.log(values.note_file);


      if (loading) return;
      setLoading(true);
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/pr/create-trx-pr",
        data: values,
        token: `${auth.auth.access_token}`,
      });

      console.log(res.err);


      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Berhasil menambahkan data!");
        router.push("/purchase-request/trx");
      }
      console.log(res.data);


      setLoading(false);
    },
  });
  const addVariant = () => {
    formik.setFieldValue('items', [
      ...formik.values.items,
      {
        purchase_request_id: "",
        price: "",
        quantity: "",
        unit: "",
        sub_total: "",
      },
    ]);
    console.log(formik.values);

  };

  const removeVariant = (index: any) => {
    const variants = [...formik.values.items];
    variants.splice(index, 1);
    formik.setFieldValue('items', variants);
  };

  const handleChangeFileImage = (
    event: ChangeEvent<HTMLInputElement>,
    callBack: (file: File | undefined, result: string) => void
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // const result = reader.result as string
        // const base64 = result.split("base64,/")[1]
        callBack(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      callBack(undefined, "");
    }
    console.log(file);
    console.log(formik.values.note_file);
  };
  return (
    <>
      <Breadcrumb pageName="Transaksi" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 border-b-2 py-6 px-10">
          <p className="font-semibold">Form menambahkan Transaksi</p>
        </div>
        <div className="px-10">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <InputDropdown
              label={"Outlet"}
              name={"outlet_id"}
              id={"outlet_id"}
              value={formik.values.outlet_id == "" ? "" : formik.values.outlet_id}
              onChange={
                (v) => {
                  formik.setFieldValue("outlet_id", v)
                  setOutletId(v)
                }
              }
              options={outlets}
              error={
                formik.touched.outlet_id && formik.errors.outlet_id
                  ? formik.errors.outlet_id
                  : null
              }
            />

            <DatePickerOne
              label={"Tanggal Transaksi"}
              defaultDate={formik.values.trx_date}
              onChange={(val) => {
                formik.setFieldValue("trx_date", val)
                console.log(val);

              }} />
          </div>
          {!!formik.values.note_file ? (
            <div className="relative aspect-square h-48 mt-6 flex justify-center w-full bg-sky-100 rounded-lg ">
              <NextImage
                src={showImage}
                alt="input-picture"
                fill
                className="h-auto max-w-full rounded-lg object-contain py-2"
              />
            </div>
          ) : (

            <InputFile
              className="pt-6"
              label={"note_file"}
              name={"note_file"}
              id={"note_file"}
              onChange={(e) =>
                handleChangeFileImage(e, (file, result) => {
                  formik.setFieldValue("note_file", result.replace(/^data:image\/\w+;base64,/, ""));
                  setShowImage(result)
                })}
              error={formik.touched.note_file && formik.errors.note_file
                ? formik.errors.note_file
                : null}>
            </InputFile>
          )}
          {formik.values.items.map((variant, index) => (
            <div key={index}>
              <hr className="my-8 border-b-2 border-apps-primary dark:bg-gray-2"></hr>
              <div className="mb-5 mt-2" >
                <button className={index == 0 ? `hidden` : `bg-red-700 p-2 text-sm rounded text-white`} onClick={() => removeVariant(index)}>
                  Hapus Item
                </button>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
                <InputDropdown
                  label={"ID Purchase Request*"}
                  name={`purchase_request_id ${index}`}
                  id={`purchase_request_id ${index}`}
                  value={formik.values.items[index].purchase_request_id == "" && purReq[0] != undefined ? purReq[0].value : formik.values.items[index].purchase_request_id}
                  onChange={
                    (v) => {
                      formik.setFieldValue(`items[${index}].purchase_request_id`, v)
                      console.log(v);
                    }
                  }
                  options={purReq}
                  error={
                    formik.touched.items?.[index]?.purchase_request_id &&
                      (typeof formik.errors.items?.[index] === 'object' && formik.errors.items[index]?.purchase_request_id)
                      ? formik.errors.items[index].purchase_request_id
                      : null
                  }
                />
                <Input
                  label={"harga*"}
                  name={`price ${index}`}
                  id={`price ${index}`}
                  value={formik.values.items[index].price ? formik.values.items[index].price : ""}
                  onChange={(v) => formik.setFieldValue(`items[${index}].price`, parseInt(v))}
                  error={
                    formik.touched.items?.[index]?.price &&
                      (typeof formik.errors.items?.[index] === 'object' && formik.errors.items[index]?.price)
                      ? formik.errors.items[index].price
                      : null
                  }
                />
                <Input
                  label={"Kuantitas*"}
                  name={`quantity ${index}`}
                  id={`quantity ${index}`}
                  value={formik.values.items[index].quantity ? formik.values.items[index].quantity : ""}
                  onChange={(v) => formik.setFieldValue(`items[${index}].quantity`, parseInt(v))}
                  error={
                    formik.touched.items?.[index]?.quantity &&
                      (typeof formik.errors.items?.[index] === 'object' && formik.errors.items[index]?.quantity)
                      ? formik.errors.items[index].quantity
                      : null
                  }
                />
                <Input
                  label={"Unit*"}
                  name={`unit ${index}`}
                  id={`unit ${index}`}
                  value={formik.values.items[index].unit}
                  onChange={(v) => formik.setFieldValue(`items[${index}].unit`, v)}
                  error={
                    formik.touched.items?.[index]?.unit &&
                      (typeof formik.errors.items?.[index] === 'object' && formik.errors.items[index]?.unit)
                      ? formik.errors.items[index].unit
                      : null
                  }
                />
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2 pt-6">
            <button
              onClick={addVariant}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
              Tambah Item
            </button>
            <button
              onClick={formik.submitForm}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
              Simpan
            </button>
          </div>
        </div>
      </div >
    </>)
}
