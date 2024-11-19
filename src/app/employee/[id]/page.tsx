"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  Input,
  InputDropdown,
  InputTextArea,
  InputToggle,
} from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GET, GetWithToken, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { Employee } from "@/types/employee";
import { Outlet } from "@/types/outlet";
import { TRole } from "@/types/role";
import CountryList from "country-list-with-dial-code-and-flag";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
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

export default function UpdateEmployee({ params }: { params: { id: string } }) {
  const [province, setProvince] = useState<iDropdown[]>([]);
  const [city, setCity] = useState<iDropdown[]>([]);
  const [subdistrict, setSubDistrict] = useState<iDropdown[]>([]);
  const [countrys, setCountrys] = useState<iDropdown[]>([]);
  const [dialCodes, setDialCodes] = useState<iDropdown[]>([]);
  const auth = useSelector((s: RootState) => s.auth);
  const [listOutlet, setListOutlet] = useState<string[]>([])
  const [roles, setRoles] = useState<iDropdown[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [modalOutlet, setModalOutlet] = useState<boolean>(false)
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [searchOutlet, setSearchOutlet] = useState<string>("")


  useEffect(() => {
    if (auth.role.name !== ERoles.SUPER_ADMIN && auth.role.name !== ERoles.PROVIDER)
      router.push("/employee");
  }, [auth.role.name, router]);

  const formik = useFormik({
    initialValues: {
      id: "",
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
    }),
    onSubmit: async (values) => {
      if (listOutlet.length === 0) {
        toast.error("Karyawan harus ditempatkan di outlet!");
        return;
      }
      if (loading) return
      setLoading(true)
      Object.assign(values, { outlet_id: listOutlet.map(i => i.split("//")[0]) })

      const res = await PostWithToken<iResponse<any>>({
        router: router,
        url: "/api/auth/update-employee",
        data: values,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0].toLowerCase(), i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Berhasil menambahkan data!");
        router.push("/employee");
      }

      setTimeout(() => setLoading(false), 1000)
    },
  });

  const [isMount, setIsMount] = useState<boolean>(false)
  useEffect(() => {
    setIsMount(true)
  }, [])
  useEffect(() => {
    if (!isMount) return;
    async function GotDetailEmployee() {
      const res = await GetWithToken<iResponse<Employee>>({
        router: router,
        url: `/api/auth/employee/${params.id}`,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        formik.setFieldValue("id", `${res.data.id}`)
        formik.setFieldValue("fullname", `${res.data.fullname}`)
        formik.setFieldValue("country", `${res.data.country}`)
        formik.setFieldValue("province", `${res.data.province}`)
        formik.setFieldValue("city", `${res.data.city}`)
        formik.setFieldValue("district", `${res.data.district}`)
        formik.setFieldValue("postal_code", `${res.data.postal_code}`)
        formik.setFieldValue("address", `${res.data.address}`)
        formik.setFieldValue("dial_code", `${res.data.dial_code}`)
        formik.setFieldValue("phone_number", `${res.data.phone_number}`)
        formik.setFieldValue("email", `${res.data.email}`)
        formik.setFieldValue("is_deleted", res.data.is_deleted)
        formik.setFieldValue("roles_id", `${res.data.roles_id}`)

        if (res.data.province && res.data.province.split("--").length >= 2)
          GotCity(res.data.province.split("--")[0])

        if (res.data.city && res.data.city.split("--").length >= 2)
          GotSubDistrict(res.data.city.split("--")[0])

        const employeeOutlet = res.data.employee_outlets.map(i => {
          const input = document.getElementById(i.outlet.id) as HTMLInputElement | null
          if (input && input.getAttribute("type") === "checkbox")
            input.checked = true
          const district = i.outlet.district.split("--")
          return `${i.outlet.id}//${i.outlet.name} - ${district.length >= 2 ? district[1] : i.outlet.district}`
        })
        setListOutlet(employeeOutlet)
      }
    }

    async function GotProvince() {
      const res = await GET<iResponse<any>>({ url: "/api/address/province" });
      if (res.statusCode === 200 && res?.data?.rajaongkir && res?.data?.rajaongkir?.results) {
        const maping = (
          res?.data?.rajaongkir?.results as { province: string; province_id: string; }[]
        ).map((i) => {
          return {
            label: i.province,
            value: `${i.province_id}--${i.province}`,
          };
        });
        setProvince(maping);
      }
    }

    async function GotRoles() {
      const res = await GET<iResponse<TRole[]>>({ url: "/api/auth/roles" });
      if (res.statusCode === 200) {
        const mapingRoleToDropdown = res.data.map((i, k) => {
          if (k === 0)
            formik.setFieldValue("roles_id", i.id)
          return {
            label: i.name,
            value: i.id
          }
        })
        setRoles(mapingRoleToDropdown)
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

    GotRoles()
    GotProvince()
    GotOutlets().then(() => GotDetailEmployee())

    const country = CountryList.getAll();
    country.map((i) => {
      setDialCodes((old) => [
        ...old,
        { label: `${i.code} ${i.dial_code}`, value: i.dial_code },
      ]);
      setCountrys((old) => [...old, { label: i.name, value: i.name }]);
    });
  }, [isMount]);

  async function GotCity(province_id: string) {
    const res = await GET<iResponse<any>>({
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
      setCity(maping);
    }
  }

  async function GotSubDistrict(city_id: string) {
    const res = await GET<iResponse<any>>({
      url: `/api/address/sub-district?city_id=${city_id}`,
    });

    if (res?.statusCode === 200 && res?.data?.rajaongkir && res?.data?.rajaongkir?.results) {
      const maping = (
        res?.data?.rajaongkir?.results as {
          subdistrict_name: string; subdistrict_id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.subdistrict_name}`,
          value: `${i.subdistrict_id}--${i.subdistrict_name}`,
        };
      });

      setSubDistrict(maping);
    }
  }

  function filterOutlet() {
    if (searchOutlet.length >= 3)
      return outlets.filter(f => f.name.toLowerCase().includes(searchOutlet.toLowerCase()))

    return outlets
  }

  return (
    <>
      <Breadcrumb pageName="Tambah Karyawan" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 border-b-2 py-6 px-10">
          <p className="font-semibold">Form merubah data karyawan</p>
        </div>
        <div className="px-10">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <Input
              label={"Nama Lengkap*"}
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
                label={"No. Hp*"}
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

            <InputDropdown
              label={"Jabatan"}
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
            />
            <InputToggle
              value={!formik.values.is_deleted}
              onClick={(v) => formik.setFieldValue("is_deleted", !v)}
              label={"Status"}
            />
          </div>

          <div className="mt-6">
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
          </div>
          {listOutlet.map((i, k) => (
            <div className="flex flex-row pt-8" key={k}>
              <div className="w-full p-3 border-2 rounded relative">
                <p>{i.split("//").length >= 2 ? i.split("//")[1] : i}</p>
                <label

                  className={`text-md absolute bg-white transition-all duration-500 dark:bg-gray-800 -top-3`}
                >
                  Outlet {k + 1}
                </label>
              </div>
            </div>
          ))}
          <div className="mb-5 mt-2" >
            <button className={`bg-green-700 p-2 text-sm rounded text-white`} onClick={() => setModalOutlet(true)}>
              Outlet
            </button>
          </div>
          <button
            onClick={formik.submitForm}
            className="w-full inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            Simpan
          </button>
        </div>
      </div>

      <Modal isOpen={modalOutlet}>
        <div className="relative bg-white dark:bg-gray-800 shadow rounded-md h-[90vh] 
        md:h-[40rem] w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setModalOutlet(false)
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="p-2 mb-5 text-lg">
            <p className="font-semibold">Tempatkan karwayan pada outlet</p>
          </div>

          <div className="p-2">
            <Input label={"Cari Outlet"} name={"search"} id={"search"}
              value={searchOutlet}
              onChange={(v) => {
                setSearchOutlet(v)
              }} error={null} />
          </div>
          <Table colls={["#", "Nama", "Kota", "Kecamatan"]} currentPage={0} totalItem={1} onPaginate={() => null}>
            {filterOutlet().map((i, k) => (
              <tr
                className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                key={k}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <input id={i.id} type="checkbox" value={`${i.id}//${i.name} - ${i.district.split("--").length >= 2 ? i.district.split("--")[1] : i.district}`}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setListOutlet(old => [...old, e.target.value])
                      } else {
                        setListOutlet(old => old.filter(f => f !== e.target.value))
                      }
                    }} />
                </td>
                <td className="whitespace-nowrap px-6 py-4">{i.name}</td>
                <td className="px-6 py-4"> {i.city.split("--").length >= 2 ? i.city.split("--")[1] : i.city}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.district.split("--").length >= 2 ? i.district.split("--")[1] : i.district}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </Modal>
    </>
  );
}
