"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  Input,
  InputDropdown,
  InputTextArea,
} from "@/components/Inputs/InputComponent";
import ModalSelectOutlet from "@/components/Outlets/ModalOutlet";
import { GET, GetWithToken, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { EDepartmentEmployee } from "@/types/employee";
import { Outlet } from "@/types/outlet";
import { TRole } from "@/types/role";
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

interface iResponse<T> {
  statusCode: number;
  msg: string;
  data: T;
  err: string | string[];
}

export default function CreateEmployee() {
  const [province, setProvince] = useState<iDropdown[]>([]);
  const [city, setCity] = useState<iDropdown[]>([]);
  const [subdistrict, setSubDistrict] = useState<iDropdown[]>([]);
  const [countrys, setCountrys] = useState<iDropdown[]>([]);
  const [dialCodes, setDialCodes] = useState<iDropdown[]>([]);
  const auth = useSelector((s: RootState) => s.auth);
  const [listOutlet, setListOutlet] = useState<
    { area_id: string | null; outlet: string; outlet_id: string }[]
  >([]);
  const [roles, setRoles] = useState<iDropdown[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [modalOutlet, setModalOutlet] = useState<boolean>(false);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchOutlet, setSearchOutlet] = useState<string>("");

  useEffect(() => {
    if (
      auth.role.name !== ERoles.PROVIDER &&
      auth.role.name !== ERoles.SUPER_ADMIN
    )
      router.push("/employee");
  }, [auth.role.name, router]);

  const formik = useFormik({
    initialValues: {
      fullname: "",
      country: "Indonesia",
      province: "",
      city: "",
      district: "",
      postal_code: "",
      address: "",
      dial_code: "+62",
      phone_number: "",
      email: "",
      is_deleted: false,
      roles_id: "",
      department: EDepartmentEmployee.AM,
      password: "",
      cPassword: "",
    },
    validationSchema: Yup.object({
      fullname: Yup.string()
        .max(100, "max nama lengkap 255 karakter!")
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
      is_deleted: Yup.boolean().required("Harus diisi!"),
      password: Yup.string()
        .required("password required!")
        .min(6, "password min 6 character!")
        .max(50, "password max 50 character!"),
      cPassword: Yup.string()
        .required("Confirm password required!")
        .oneOf([Yup.ref("password"), ""], "Passwords do not match!"),
    }),
    onSubmit: async (values) => {
      if (
        listOutlet.length === 0 &&
        values.department !== EDepartmentEmployee.TECHNICIAN &&
        values.department !== EDepartmentEmployee.HQ
      ) {
        toast.error("Karyawan harus ditempatkan di outlet!");
        return;
      }
      if (loading) return;
      setLoading(true);
      if (values.department === EDepartmentEmployee.TECHNICIAN) {
        Object.assign(values, {
          outlet_id: [],
        });
      } else {
        Object.assign(values, {
          outlet_id: listOutlet.map((i) => i.outlet_id),
        });
      }

      const res = await PostWithToken<iResponse<any>>({
        router: router,
        url: "/api/auth/register",
        data: values,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1)
            formik.setFieldError(field[0].toLowerCase(), i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Berhasil menambahkan data!");
        router.push("/employee");
      }

      setTimeout(() => setLoading(false), 1000);
    },
  });

  useEffect(() => {
    if (roles.length >= 1) {
      formik.setFieldValue(
        "roles_id",
        roles.find((f) => f.label.includes(ERoles.OUTLET_ADMIN))?.value,
      );
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  useEffect(() => {
    async function GotProvince() {
      const res = await GET<iResponse<any>>({ url: "/api/address/province" });
      if (
        res.statusCode === 200 &&
        res?.data
      ) {
        const maping = (
          res?.data as {
            name: string;
            id: string;
          }[]
        ).map((i) => {
          return {
            label: i.name,
            value: `${i.id}--${i.name}`,
          };
        });
        if (maping.length >= 1) {
          formik.setFieldValue("province", `${maping[0].value}`);
          if (maping[0].value.split("--").length >= 2)
            GotCity(maping[0].value.split("--")[0]);
        }

        setProvince(maping);
      }
    }

    async function GotRoles() {
      const res = await GET<iResponse<TRole[]>>({ url: "/api/auth/roles" });
      if (res.statusCode === 200) {
        const mapingRoleToDropdown = res.data.map((i, k) => {
          if (k === 0) formik.setFieldValue("roles_id", i.id);
          return {
            label: i.name,
            value: i.id,
          };
        });
        setRoles(mapingRoleToDropdown);
      }
    }

    async function GotOutlets() {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet",
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        setOutlets(res.data);
      }
    }

    GotProvince();
    GotRoles();
    GotOutlets();
    const country = CountryList.getAll();
    country.map((i) => {
      setDialCodes((old) => [
        ...old,
        { label: `${i.code} ${i.dial_code}`, value: i.dial_code },
      ]);
      setCountrys((old) => [...old, { label: i.name, value: i.name }]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function GotCity(province_id: string) {
    const res = await GET<iResponse<any>>({
      url: `/api/address/city?province_id=${province_id}`,
    });

    if (
      res?.statusCode === 200 &&
      res?.data
    ) {
      const maping = (
        res?.data as {
          name: string;
          id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.name}`,
          value: `${i.id}--${i.name}`,
        };
      });

      if (maping.length >= 1) {
        formik.setFieldValue("city", `${maping[0].value}`);
        if (maping[0].value.split("--").length >= 2)
          GotSubDistrict(maping[0].value.split("--")[0]);
      }
      setCity(maping);
    }
  }

  async function GotSubDistrict(city_id: string) {
    const res = await GET<iResponse<any>>({
      url: `/api/address/sub-district?city_id=${city_id}`,
    });

    if (
      res?.statusCode === 200 &&
      res?.data
    ) {
      const maping = (
        res?.data as {
          name: string;
          id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.name}`,
          value: `${i.id}--${i.name}`,
        };
      });
      if (maping.length >= 1)
        formik.setFieldValue("district", `${maping[0].value}`);
      setSubDistrict(maping);
    }
  }

  function filterOutlet() {
    if (searchOutlet.length >= 3)
      return outlets.filter((f) =>
        f.name.toLowerCase().includes(searchOutlet.toLowerCase()),
      );

    return outlets;
  }

  return (
    <>
      <Breadcrumb pageName="Add Employee" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 border-b-2 px-10 py-6">
          <p className="font-semibold">Form to add employee data</p>
        </div>
        <div className="px-10">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <Input
              label={"Full Name*"}
              name={"fullname"}
              id={"fullname"}
              value={formik.values.fullname}
              onChange={(v) => formik.setFieldValue("fullname", v)}
              error={
                formik.touched.fullname && formik.errors.fullname
                  ? formik.errors.fullname
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
                label={"Phone Number*"}
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
              label={"Province"}
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
              label={"City"}
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
              label={"Postal Code"}
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

            {/* <InputToggle
              value={!formik.values.is_deleted}
              onClick={(v) => formik.setFieldValue("is_deleted", !v)}
              label={"Status"}
            /> */}

            <InputDropdown
              label={"Role"}
              name={"department"}
              id={"department"}
              value={formik.values.department}
              onChange={(v) => {
                switch (v) {
                  case EDepartmentEmployee.HQ:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.SUPER_ADMIN))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.FINANCE:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.FINANCE))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.AUDITOR:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.OUTLET_ADMIN))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.AM:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.OUTLET_ADMIN))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.SPV:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.OUTLET_ADMIN))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.HO:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.OUTLET_ADMIN))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.SV:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.EMPLOYEE))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.IS:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.EMPLOYEE))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.TECHNICIAN:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.TECHNICIAN))
                        ?.value,
                    );
                    break;
                  case EDepartmentEmployee.OWNER:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.OUTLET_ADMIN))
                        ?.value,
                    );
                    break;
                  default:
                    formik.setFieldValue(
                      "roles_id",
                      roles.find((f) => f.label.includes(ERoles.EMPLOYEE))
                        ?.value,
                    );
                    break;
                }
                formik.setFieldValue("department", v);
              }}
              options={Object.values(EDepartmentEmployee).map((i) => {
                return { label: i.toUpperCase(), value: i };
              })}
              error={
                formik.touched.department && formik.errors.department
                  ? formik.errors.department
                  : null
              }
            />
            {/* <InputDropdown
              label={"Role"}
              name={"roles_id"}
              id={"roles_id"}
              value={formik.values.roles_id}
              onChange={(v) => formik.setFieldValue("roles_id", v)}
              options={roles}
              error={
                formik.touched.roles_id && formik.errors.roles_id
                  ? formik.errors.roles_id
                  : null
              }
            /> */}

            <Input
              label={"Password*"}
              name={"password"}
              type="password"
              id={"password"}
              value={formik.values.password}
              onChange={(v) => formik.setFieldValue("password", v)}
              error={
                formik.touched.password && formik.errors.password
                  ? formik.errors.password
                  : null
              }
            />

            <Input
              label={"Confirm Password*"}
              type="password"
              name={"cPassword"}
              id={"cPassword"}
              value={formik.values.cPassword}
              onChange={(v) => formik.setFieldValue("cPassword", v)}
              error={
                formik.touched.cPassword && formik.errors.cPassword
                  ? formik.errors.cPassword
                  : null
              }
            />
          </div>

          <div className="mt-6">
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
          </div>
          {listOutlet.map((i, k) => (
            <div className="flex flex-row pt-8" key={k}>
              <div className="relative w-full rounded border-2 p-3">
                <p>{i.outlet}</p>
                <label
                  className={`text-md absolute -top-3 bg-white transition-all duration-500 dark:bg-gray-800`}
                >
                  Outlet {k + 1}
                </label>
              </div>
            </div>
          ))}
          <div
            className={
              formik.values.department === EDepartmentEmployee.TECHNICIAN ||
                formik.values.department === EDepartmentEmployee.HQ
                ? `hidden`
                : `mb-5 mt-2`
            }
          >
            <button
              className={`rounded bg-green-700 p-2 text-sm text-white`}
              onClick={() => setModalOutlet(true)}
            >
              Select Outlet
            </button>
          </div>
          <button
            onClick={formik.submitForm}
            className="inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            Submit
          </button>
        </div>
      </div>

      <ModalSelectOutlet
        modal={modalOutlet}
        closeModal={(d) => {
          setListOutlet([]);
          setModalOutlet(false);
        }}
        onSubmit={(d) => {
          setModalOutlet(false);
          setListOutlet(d);
        }}
      />
    </>
  );
}
