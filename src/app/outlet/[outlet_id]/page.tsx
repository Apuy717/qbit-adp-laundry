"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input, InputDropdown, InputTextArea, InputToggle } from "@/components/Inputs/InputComponent";
import { GET, GetWithToken, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import CountryList from "country-list-with-dial-code-and-flag";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

interface iResponseOutlet {
  statusCode: number,
  msg: string,
  data: Outlet,
  err: string | string[]
}

interface iResponseAddress {
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

export default function UpdateOutlet({ params }: { params: { outlet_id: string } }) {
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const credential = useSelector((s: RootState) => s.auth)
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)

  const [province, setProvince] = useState<iDropdown[]>([]);
  const [city, setCity] = useState<iDropdown[]>([]);
  const [subdistrict, setSubDistrict] = useState<iDropdown[]>([]);
  const [countrys, setCountrys] = useState<iDropdown[]>([]);
  const [dialCodes, setDialCodes] = useState<iDropdown[]>([]);

  useEffect(() => {
    async function GotDetailOutlet(isupdate: boolean) {
      const res = await GetWithToken<iResponseOutlet>({
        router: router,
        url: `/api/outlet/${params.outlet_id}`,
        token: `${credential.auth.access_token}`
      });

      if (res.statusCode === 404) toast.warning("Outlet not found, try again!")

      formik.setFieldValue("id", res.data.id)
      formik.setFieldValue("name", res.data.name)
      formik.setFieldValue("country", res.data.country)
      formik.setFieldValue("province", res.data.province)
      formik.setFieldValue("city", res.data.city)
      formik.setFieldValue("district", res.data.district)
      formik.setFieldValue("postal_code", res.data.postal_code)
      formik.setFieldValue("address", res.data.address)
      formik.setFieldValue("dial_code", res.data.dial_code)
      formik.setFieldValue("phone_number", res.data.phone_number)
      formik.setFieldValue("email", res.data.email)
      formik.setFieldValue("latitude", res.data.latitude)
      formik.setFieldValue("longitude", res.data.longitude)
      formik.setFieldValue("is_deleted", res.data.is_deleted)

      if (res.data.province && res.data.province.split("--").length >= 2)
        GotCity(res.data.province.split("--")[0], isupdate)

      if (res.data.city && res.data.city.split("--").length >= 2)
        GotSubDistrict(res.data.city.split("--")[0], isupdate)

      setLoading(false)
    }

    async function GotProvince(isupdate: boolean) {
      const res = await GET<iResponseAddress>({ url: "/api/address/province" });
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
        if (formik.values.province) {
          formik.setFieldValue("province", formik.values.province)
        }
        setProvince(maping);
        GotDetailOutlet(isupdate)
      }
    }


    const country = CountryList.getAll();
    country.map((i) => {
      setDialCodes((old) => [
        ...old,
        { label: `${i.code} ${i.dial_code}`, value: i.dial_code },
      ]);
      setCountrys((old) => [...old, { label: i.name, value: i.name }]);
    });

    GotProvince(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const formik = useFormik({
    initialValues: {
      id: "",
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
        .max(100, "max name 255 character!")
        .required("required!"),
      country: Yup.string().max(100, "Max 100 character!").optional(),
      province: Yup.string().max(100, "Max 100 character!").optional(),
      city: Yup.string().max(100, "Max 100 character!").optional(),
      district: Yup.string().max(100, "Max 100 character!").optional(),
      postal_code: Yup.string().max(100, "Max 100 character!").optional(),
      address: Yup.string().max(255, "Max 255 character!").optional(),
      dial_code: Yup.string()
        .max(100, "Max 100 character!")
        .required("Must be filled!"),
      phone_number: Yup.string()
        .max(100, "Max 100 character!")
        .required("Must be filled!"),
      email: Yup.string()
        .max(100, "Max 100 character!")
        .optional()
        .email("invalid email!"),
      latitude: Yup.string().required("Must be filled!"),
      longitude: Yup.string().required("Must be filled!"),
      is_deleted: Yup.boolean().required("Must be filled!"),
    }),
    onSubmit: async (values) => {
      if (loading) return;
      setLoading(true);
      const res = await PostWithToken<iResponseOutlet>({
        router: router,
        url: "/api/outlet/update",
        data: values,
        token: `${credential.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Update data success!");
        router.push("/outlet");
        console.log(res.data);
      }
      setLoading(false);
    },
  });


  async function GotCity(province_id: string, isupdate: boolean) {
    const res = await GET<iResponseAddress>({
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
      if (isupdate) {
        formik.setFieldValue("city", maping[0].value)
        GotSubDistrict(maping[0].value.split("--")[0], true)
      }
      setCity(maping);
    }
  }

  async function GotSubDistrict(city_id: string, isupdate: boolean) {
    const res = await GET<iResponseAddress>({
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
      console.log(city_id === formik.values.city.split("--")[0]);

      if (isupdate) {
        formik.setFieldValue("district", maping[0].value.split("--")[1])
      }
      setSubDistrict(maping);
    }
  }

  return (
    <>
      <Breadcrumb pageName="Edit Outlet" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 border-b-2 py-6 px-10">
          <p className="font-semibold">Edit Outlet</p>
        </div>

        <div className="grid grid-cols-1 px-10 gap-6 md:grid-cols-2">
          <Input
            label={"Name*"}
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
              label={"Phone*"}
              name={"phone_number"}
              type="number"
              id={"phone_number"}
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
            label={"Country"}
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
            label={"Province"}
            name={"province"}
            id={"province"}
            value={formik.values.province}
            options={province}
            onChange={(v) => {
              const val = v.split("--");
              if (val.length >= 2) {
                formik.setFieldValue("province", v);
                GotCity(val[0], true);
              }
            }}
            error={
              formik.touched.province && formik.errors.province
                ? formik.errors.province
                : null
            }
          />
          <InputDropdown
            label={"City"}
            name={"city"}
            id={"city"}
            value={formik.values.city}
            options={city}
            onChange={(v) => {
              const val = v.split("--");
              if (val.length >= 2) {
                formik.setFieldValue("city", v);
                GotSubDistrict(val[0], true);
              }
            }}
            error={null}
          />
          <InputDropdown
            label={"District"}
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
            label={"Pos"}
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
            label={"Latitude*"}
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
            label={"Address"}
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
            Submit
          </button>
        </div>
      </div>
    </>
  );
}
