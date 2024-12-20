"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input, InputDropdown, InputFile, InputTextArea, InputToggle } from "@/components/Inputs/InputComponent";
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

const dropdown = [
  {
    label: "",
    value: "",
  }
]
export default function CreateProduct() {
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<iDropdown[]>(dropdown)
  const [categorys, setCategorys] = useState<iDropdown[]>(dropdown)
  const [showImage, setShowImage] = useState<string>("")

  const auth = useSelector((s: RootState) => s.auth);
  const serviceType = [
    {
      label: "services",
      value: "services"
    }, {
      label: "goods",
      value: "goods"
    }
  ]

  const router = useRouter();
  useEffect(() => {

    const GotCategorys = async () => {
      let urlwithQuery = `/api/category`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const mapingCategory = (res.data).map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      }) as iDropdown[]

      if (mapingCategory.length >= 1) formik.setFieldValue("category_id", mapingCategory[0].value)

      setCategorys(mapingCategory)
      // console.log(categorys);
    };

    GotCategorys();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formik = useFormik({
    initialValues: {
      name: "",
      slug: "",
      picture: "",
      description: "",
      is_deleted: false,
      category_id: "",
      variants: [
        {
          code: "",
          name: "",
          description: "",
          price: "",
          type: "services",
          stock: "",
          unit: "",
          machine_washer: false,
          washer_duration: 0,
          machine_dryer: false,
          dryer_duration: 0,
          machine_iron: false,
          iron_duration: 0,
        },
      ],
    },
    validationSchema: Yup.object({
      name: Yup.string().max(100, "Maksimal 225 karakter!").required('Harus diisi'),
      slug: Yup.string(),
      description: Yup.string().max(100, "Maksimal 255 karakter!").optional(),
      category_id: Yup.string().required('Harus pilih category'),
      variants: Yup.array().of(
        Yup.object({
          code: Yup.string().max(100, "Maksimal 100 karakter!"),
          name: Yup.string().max(100, "Maksimal 100 karakter!").required('Harus diisi'),
          description: Yup.string().max(100, "Maksimal 225 karakter!").optional(),
          price: Yup.number().min(0).required('Harus diisi'),
          type: Yup.string().max(100, "Maksimal 100 karakter!"),
          stock: Yup.number().max(100, "Maksimal 100 karakter!"),
          unit: Yup.string().max(100, "Maksimal 100 karakter!"),
          washer_duration: Yup.number().min(0),
          dryer_duration: Yup.number().min(0),
          iron_duration: Yup.number().min(0),
        })
      ),

    }),
    onSubmit: async (values) => {
      console.log(values);
      const data = values.variants.map((i) => {
        if (i.type == "services") {
          Object.assign(i, { stock: null, unit: null })
        }
        if (!i.machine_washer) {
          Object.assign(i, { washer_duration: null })
        }
        if (!i.machine_dryer) {
          Object.assign(i, { dryer_duration: null })
        }
        if (!i.machine_iron) {
          Object.assign(i, { iron_duration: null })
        }
      })
      console.log(values);

      if (loading) return;
      setLoading(true);
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/product/create",
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
        toast.success("Success create product!");
        router.push("/product");
      }
      console.log(res.data);


      setLoading(false);
    },
  });
  const addVariant = () => {
    formik.setFieldValue('variants', [
      ...formik.values.variants,
      {
        code: "",
        name: "",
        description: "",
        capital_price: "",
        price: "",
        type: "services",
        stock: "",
        unit: "",
        machine_washer: false,
        washer_duration: 0,
        machine_dryer: false,
        dryer_duration: 0,
        machine_iron: false,
        iron_duration: 0,
      },
    ]);
    console.log(formik.values);

  };

  const removeVariant = (index: any) => {
    const variants = [...formik.values.variants];
    variants.splice(index, 1);
    formik.setFieldValue('variants', variants);
  };

  const handleChangeFileImage = (
    event: ChangeEvent<HTMLInputElement>,
    callBack: (file: File | undefined, result: string) => void
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callBack(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      callBack(undefined, "");
    }
    console.log(file);
    console.log(formik.values.picture);
  };
  return (
    <>
      <Breadcrumb pageName="Product" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 border-b-2 py-6 px-10">
          <p className="font-semibold">Add Product</p>
        </div>
        <div className="px-10">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">

            <Input
              label={"Product Name*"}
              name={"name"}
              id={"name"}
              value={formik.values.name}
              onChange={(v) => formik.setFieldValue("name", v)}
              error={
                formik.touched.name && formik.errors.name
                  ? formik.errors.name
                  : null
              }
            />
            <Input
              label={"Slug"}
              name={"slug"}
              id={"slug"}
              value={formik.values.slug}
              onChange={(v) => formik.setFieldValue("slug", v)}
              error={
                formik.touched.slug && formik.errors.slug
                  ? formik.errors.slug
                  : null
              }
            />

            <InputFile
              label={"Picture"}
              name={"picture"}
              id={"picture"}
              onChange={(e) =>
                handleChangeFileImage(e, (file, result) => {
                  formik.setFieldValue("picture", result.replace(/^data:image\/\w+;base64,/, ""));
                  setShowImage(result)
                })}
              error={formik.touched.picture && formik.errors.picture
                ? formik.errors.picture
                : null}>
            </InputFile>

            <InputDropdown
              label={"Category*"}
              name={"category_id"}
              id={"category_id"}
              value={formik.values.category_id}
              onChange={(v) => formik.setFieldValue("category_id", v)}
              options={categorys}
              error={
                formik.touched.category_id && formik.errors.category_id
                  ? formik.errors.category_id
                  : null
              }
            />
            <InputToggle
              value={!formik.values.is_deleted}
              onClick={(v) => formik.setFieldValue("is_deleted", !v)}
              label={"Status"}
            />
          </div>
          <div className="pt-6">
            <InputTextArea
              label={"Description"}
              name={"description"}
              id={"description"}
              value={formik.values.description}
              onChange={(v) => formik.setFieldValue("description", v)}
              error={
                formik.touched.description && formik.errors.description
                  ? formik.errors.description
                  : null
              }
            />
          </div>
          <div className={formik.values.picture ? `mt-6 py-4 bg-sky-100 rounded-lg` : `hidden`}>
            <div className="relative aspect-square h-48 flex justify-center w-full">
              <NextImage
                src={showImage ? showImage : "/images/user/user-01.png"}
                alt="input-picture"
                fill
                className="h-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
          {formik.values.variants.map((variant, index) => (
            <div key={index}>
              <hr className="my-8 border-b-2 border-apps-primary dark:bg-gray-2"></hr>
              <div className="mb-5 mt-2" >
                <button className={index == 0 ? `hidden` : `bg-red-700 p-2 text-sm rounded text-white`} onClick={() => removeVariant(index)}>
                  Hapus SKU
                </button>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
                <Input
                  label={"SKU Code"}
                  name={`code ${index}`}
                  id={`code ${index}`}
                  value={formik.values.variants[index].code}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].code`, v)}
                  error={
                    formik.touched.variants?.[index]?.code &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.code)
                      ? formik.errors.variants[index].code
                      : null
                  }
                />
                <Input
                  label={"SKU Name*"}
                  name={`name ${index}`}
                  id={`name ${index}`}
                  value={formik.values.variants[index].name}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].name`, v)}
                  error={
                    formik.touched.variants?.[index]?.name &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.name)
                      ? formik.errors.variants[index].name
                      : null
                  }
                />

                <Input
                  label={"Price*"}
                  name={`price ${index}`}
                  id={`price ${index}`}
                  value={formik.values.variants[index].price ? formik.values.variants[index].price : ``}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].price`, parseInt(v))}
                  error={
                    formik.touched.variants?.[index]?.price &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.price)
                      ? formik.errors.variants[index].price
                      : null
                  }
                />

                <InputDropdown
                  label={"Type*"}
                  name={`type ${index}`}
                  id={`type ${index}`}
                  value={formik.values.variants[index].type}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].type`, v)}
                  options={serviceType}
                  error={
                    formik.touched.variants?.[index]?.type &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.type)
                      ? formik.errors.variants[index].type
                      : null
                  }
                />
                <Input
                  className={formik.values.variants[index].type === "goods" ? "" : "hidden"}
                  label={"Stock*"}
                  name={`stock ${index}`}
                  id={`stock ${index}`}
                  value={formik.values.variants[index].stock ? formik.values.variants[index].stock : ""}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].stock`, parseInt(v))}
                  error={
                    formik.touched.variants?.[index]?.stock &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.stock)
                      ? formik.errors.variants[index].stock
                      : null
                  }
                />
                <Input
                  className={formik.values.variants[index].type === "goods" ? "" : "hidden"}
                  label={"Unit*"}
                  name={`unit ${index}`}
                  id={`unit ${index}`}
                  value={formik.values.variants[index].unit}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].unit`, v)}
                  error={
                    formik.touched.variants?.[index]?.unit &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.unit)
                      ? formik.errors.variants[index].unit
                      : null
                  }
                />
              </div>
              <div className="pt-6">
                <InputTextArea
                  label={"SKU Description"}
                  name={`description ${index}`}
                  id={`description ${index}`}
                  value={formik.values.variants[index].description}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].description`, v)}
                  error={
                    formik.touched.variants?.[index]?.description &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.description)
                      ? formik.errors.variants[index].description
                      : null
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2 pt-4">
                <InputToggle
                  value={formik.values.variants[index].machine_washer}
                  onClick={(v) => {
                    formik.setFieldValue(`variants[${index}].machine_washer`, v)
                  }}
                  label={"Washer Machine"}
                />
                <Input
                  className={formik.values.variants[index].machine_washer ? `` : `opacity-0 w-1`}
                  label={formik.values.variants[index].machine_washer ? "Time in minutes*" : ""}
                  name={`washer time${index}`}
                  id={`washer time${index}`}
                  value={`${formik.values.variants[index].washer_duration ? formik.values.variants[index].washer_duration : ""}`}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].washer_duration`, parseInt(v))}
                  error={
                    formik.touched.variants?.[index]?.washer_duration &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.washer_duration)
                      ? formik.errors.variants[index].washer_duration
                      : null
                  }
                />
                <InputToggle
                  value={formik.values.variants[index].machine_dryer}
                  onClick={(v) => {
                    formik.setFieldValue(`variants[${index}].machine_dryer`, v)
                  }}
                  label={"Dryer machine"}
                />
                <Input
                  className={formik.values.variants[index].machine_dryer ? `` : `opacity-0 w-1`}
                  label={formik.values.variants[index].machine_dryer ? "Time in minutes*" : ""}
                  name={`dryer time${index}`}
                  id={`dryer time${index}`}
                  value={formik.values.variants[index].dryer_duration ? formik.values.variants[index].dryer_duration : ``}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].dryer_duration`, parseInt(v))}
                  error={
                    formik.touched.variants?.[index]?.dryer_duration &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.dryer_duration)
                      ? formik.errors.variants[index].dryer_duration
                      : null
                  }
                />
                <InputToggle
                  value={formik.values.variants[index].machine_iron}
                  onClick={(v) => {
                    formik.setFieldValue(`variants[${index}].machine_iron`, v)
                  }}
                  label={"Iron Machine"}
                />
                <Input
                  className={formik.values.variants[index].machine_iron ? `` : `opacity-0 w-1`}
                  label={formik.values.variants[index].machine_iron ? "Time in minutes*" : ""}
                  name={`iron time${index}`}
                  id={`iron time${index}`}
                  value={formik.values.variants[index].iron_duration ? formik.values.variants[index].iron_duration : ""}
                  onChange={(v) => formik.setFieldValue(`variants[${index}].iron_duration`, parseInt(v))}
                  error={
                    formik.touched.variants?.[index]?.iron_duration &&
                      (typeof formik.errors.variants?.[index] === 'object' && formik.errors.variants[index]?.iron_duration)
                      ? formik.errors.variants[index].iron_duration
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
              Add SKU
            </button>
            <button
              onClick={formik.submitForm}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
