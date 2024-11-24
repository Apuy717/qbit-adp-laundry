"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  Input,
  InputDropdown,
  InputTextArea,
  InputToggle,
} from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { GET, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import CountryList from "country-list-with-dial-code-and-flag";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

interface iDropdown {
  label: string;
  value: string;
}
[];

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  err: string | string[];
}

export default function CreateOutlet() {
  const [province, setProvince] = useState<iDropdown[]>([]);
  const [city, setCity] = useState<iDropdown[]>([]);
  const [subdistrict, setSubDistrict] = useState<iDropdown[]>([]);
  const [countrys, setCountrys] = useState<iDropdown[]>([]);
  const [dialCodes, setDialCodes] = useState<iDropdown[]>([]);
  const auth = useSelector((s: RootState) => s.auth);

  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (auth.role.name !== ERoles.PROVIDER) router.push("/outlet");
  }, [auth.role.name, router]);

  const formik = useFormik({
    initialValues: {
      name: "",
      country: "Indonesia",
      province: "",
      city: "",
      district: "",
      postal_code: "",
      address: "",
      dial_code: "+62",
      phone_number: "",
      email: "",
      latitude: "",
      longitude: "",
      is_deleted: false,
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .max(100, "max name 255 karakter!")
        .required("diperlukan!"),
      country: Yup.string().max(100, "Maksimal 100 karakter!").optional(),
      province: Yup.string().max(100, "Maksimal 100 karakter!").optional(),
      city: Yup.string().max(100, "Maksimal 100 karakter!").optional(),
      district: Yup.string().max(100, "Maksimal 100 karakter!").optional(),
      postal_code: Yup.string().max(100, "Maksimal 100 karakter!").optional(),
      address: Yup.string().max(255, "Maksimal 255 karakter!").optional(),
      dial_code: Yup.string()
        .max(100, "Maksimal 100 karakter!")
        .required("Harus diisi!"),
      phone_number: Yup.string()
        .max(100, "Maksimal 100 karakter!")
        .required("Harus diisi!"),
      email: Yup.string()
        .max(100, "Maksimal 100 karakter!")
        .optional()
        .email("Format email tidak valid!"),
      latitude: Yup.string().required("Harus diisi!"),
      longitude: Yup.string().required("Harus diisi!"),
      is_deleted: Yup.boolean().required("Harus diisi!"),
    }),
    onSubmit: async (values) => {
      if (loading) return;
      setLoading(true);
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/outlet/create-update",
        data: values,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Berhasil menambahkan data!");
        router.push("/outlet");
      }

      setLoading(false);
    },
  });

  useEffect(() => {
    async function GotProvince() {
      const res = await GET<MyResponse>({ url: "/api/address/province" });
      if (
        res.statusCode === 200 &&
        res?.data?.rajaongkir &&
        res?.data?.rajaongkir?.results
      ) {
        const maping = (
          res?.data?.rajaongkir?.results as {
            province: string;
            province_id: string;
          }[]
        ).map((i) => {
          return {
            label: i.province,
            value: `${i.province_id}--${i.province}`,
          };
        });
        if (maping.length >= 1) {
          formik.setFieldValue("province", `${maping[0]}`);
          if (maping[0].value.split("--").length >= 2)
            GotCity(maping[0].value.split("--")[0])
        }

        setProvince(maping);
      }
    }

    GotProvince();
    const country = CountryList.getAll();
    country.map((i) => {
      setDialCodes((old) => [
        ...old,
        { label: `${i.code} ${i.dial_code}`, value: i.dial_code },
      ]);
      setCountrys((old) => [...old, { label: i.name, value: i.name }]);
    });
  }, []);

  async function GotCity(province_id: string) {
    const res = await GET<MyResponse>({
      url: `/api/address/city?province_id=${province_id}`,
    });

    if (
      res?.statusCode === 200 &&
      res?.data?.rajaongkir &&
      res?.data?.rajaongkir?.results
    ) {
      const maping = (
        res?.data?.rajaongkir?.results as {
          type: string;
          city_name: string;
          city_id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.type} ${i.city_name}`,
          value: `${i.city_id}--${i.type} ${i.city_name}`,
        };
      });

      if (maping.length >= 1) {
        formik.setFieldValue("city", `${maping[0]}`);
        if (maping[0].value.split("--").length >= 2)
          GotSubDistrict(maping[0].value.split("--")[0])
      }
      setCity(maping);
    }
  }

  async function GotSubDistrict(city_id: string) {
    const res = await GET<MyResponse>({
      url: `/api/address/sub-district?city_id=${city_id}`,
    });

    if (
      res?.statusCode === 200 &&
      res?.data?.rajaongkir &&
      res?.data?.rajaongkir?.results
    ) {
      const maping = (
        res?.data?.rajaongkir?.results as {
          subdistrict_name: string;
          subdistrict_id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.subdistrict_name}`,
          value: `${i.subdistrict_id}--${i.subdistrict_name}`,
        };
      });
      if (maping.length >= 1) formik.setFieldValue("district", `${maping[0]}`);
      setSubDistrict(maping);
    }
  }

  return (
    <>
      <Breadcrumb pageName="Outlet" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 border-b-2 py-6 px-10">
          <p className="font-semibold">Form menambahkan data outlet</p>
        </div>
        <div className="px-10">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <Input
              label={"Nama*"}
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
            <div className="flex flex-row space-x-2">
              <div className="w-32">
                <InputDropdown
                  label={"Dial Code*"}
                  name={"dial_code"}
                  id={"dial_code"}
                  value={formik.values.dial_code}
                  onChange={(v) => formik.setFieldValue("dial_code", v)}
                  options={dialCodes}
                  error={
                    formik.touched.dial_code && formik.errors.dial_code
                      ? formik.errors.dial_code
                      : null
                  }
                />
              </div>
              <Input
                label={"No. Hp*"}
                name={"phone_number"}
                id={"phone_number"}
                type="number"
                value={formik.values.phone_number}
                onChange={(value) => {
                  // delete "0" first value
                  if (value.startsWith("0") && value.length > 1) {
                    value = value.replace(/^0+/, "");
                  }
                  formik.setFieldValue("phone_number", value);
                }}
                error={
                  formik.touched.phone_number && formik.errors.phone_number
                    ? formik.errors.phone_number
                    : null
                }
              />
            </div>

            <Input
              label={"Email*"}
              name={"email"}
              id={"email"}
              value={formik.values.email}
              onChange={(v) => formik.setFieldValue("email", v)}
              error={
                formik.touched.email && formik.errors.email
                  ? formik.errors.email
                  : null
              }
            />

            <InputDropdown
              label={"Negara"}
              name={"country"}
              id={"country"}
              value={formik.values.country}
              onChange={(v) => formik.setFieldValue("country", v)}
              options={countrys}
              error={
                formik.touched.country && formik.errors.country
                  ? formik.errors.country
                  : null
              }
            />
            <InputDropdown
              label={"Provinsi"}
              name={"province"}
              id={"province"}
              value={formik.values.province}
              options={province}
              onChange={(v) => {
                const val = v.split("--");
                if (val.length >= 2) {
                  formik.setFieldValue("province", v);
                  GotCity(val[0]);
                }
              }}
              error={
                formik.touched.province && formik.errors.province
                  ? formik.errors.province
                  : null
              }
            />
            <InputDropdown
              label={"Kab/Kota"}
              name={"city"}
              id={"city"}
              value={formik.values.city}
              options={city}
              onChange={(v) => {
                const val = v.split("--");
                if (val.length >= 2) {
                  formik.setFieldValue("city", v);
                  GotSubDistrict(val[0]);
                }
              }}
              error={null}
            />
            <InputDropdown
              label={"Kecamatan"}
              name={"district"}
              id={"district"}
              value={formik.values.district}
              options={subdistrict}
              onChange={(v) => {
                const val = v.split("--");
                if (val.length >= 2) {
                  formik.setFieldValue("district", v);
                }
              }}
              error={null}
            />
            <Input
              label={"Kode Pos"}
              name={"postal_code"}
              id={"postal_code"}
              value={formik.values.postal_code}
              onChange={(v) => formik.setFieldValue("postal_code", v)}
              error={
                formik.touched.postal_code && formik.errors.postal_code
                  ? formik.errors.postal_code
                  : null
              }
            />
            <Input
              label={"Lattitude*"}
              name={"latitude"}
              id={"latitude"}
              value={formik.values.latitude}
              onChange={(v) => formik.setFieldValue("latitude", v)}
              error={
                formik.touched.latitude && formik.errors.latitude
                  ? formik.errors.latitude
                  : null
              }
            />
            <Input
              label={"Longitude*"}
              name={"longitude"}
              id={"longitude"}
              value={formik.values.longitude}
              onChange={(v) => formik.setFieldValue("longitude", v)}
              error={
                formik.touched.longitude && formik.errors.longitude
                  ? formik.errors.longitude
                  : null
              }
            />
            <InputTextArea
              label={"Alamat / Nama Jalan"}
              name={"address"}
              id={"address"}
              value={formik.values.address}
              onChange={(v) => formik.setFieldValue("address", v)}
              error={
                formik.touched.address && formik.errors.address
                  ? formik.errors.address
                  : null
              }
            />
            <InputToggle
              value={!formik.values.is_deleted}
              onClick={(v) => formik.setFieldValue("is_deleted", !v)}
              label={"Status"}
            />
            <button
              onClick={formik.submitForm}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
