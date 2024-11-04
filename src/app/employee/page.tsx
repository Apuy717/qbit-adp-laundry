'use client'

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb"
import { Input } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout"
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table"
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { Employee } from "@/types/employee";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiEdit, FiEye, FiKey, FiLock } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from 'yup';
import { useFormik } from "formik";

interface iResponseEmployee {
  statusCode: number;
  msg: string;
  data: any;
  total: number;
  err: string | string[];
}


export default function PageEmployee() {
  const [currentPage, setCurrentPage] = useState(1);
  const credential = useSelector((s: RootState) => s.auth)
  const router = useRouter()

  const [employee, setEmployee] = useState<Employee[]>([])
  const [totalEmployee, setTotalEmployee] = useState<number>(0)


  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);

  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  useEffect(() => {
    async function GotAllEmployee() {
      let urlwithQuery = `/api/auth/employee?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/auth/employee?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      const res = await GetWithToken<iResponseEmployee>({
        router: router, url: urlwithQuery,
        token: `${credential.auth.access_token}`
      })

      if (res?.statusCode === 200) {
        setTotalEmployee(res.total);
        setEmployee(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    GotAllEmployee()
  }, [currentPage, fixValueSearch, refresh, credential.auth.access_token])


  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setEmployee([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setEmployee([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  const [modal, setModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const formik = useFormik({
    initialValues: {
      id: "",
      password: "",
      cPassword: ""
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .required("password required!")
        .min(6, "password min 6 character!")
        .max(50, "password max 50 character!"),
      cPassword: Yup.string()
        .required("Confirm password required!")
        .oneOf([Yup.ref('password'), ""], "Passwords do not match!")
    }),
    onSubmit: async (values) => {
      if (formik.values.id.length === 0) {
        toast("user not selected, please try again!")
        setModal(false)
      }

      if (loading) return
      setLoading(true)
      const res = await PostWithToken<iResponse<any>>({
        router: router,
        url: "/api/auth/bind-reset-password",
        data: values,
        token: `${credential.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0].toLowerCase(), i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Berhasil merubah data!");
        formik.resetForm()
        setModal(false)
      }

      setTimeout(() => setLoading(false), 1000)
    }
  })
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Karyawan" />
      <div className="w-full bg-white p-4 mb-4 rounded-t">
        <div className="flex flex-row items-center space-x-2">
          <div className="w-90">
            <Input
              label={"Pencarian"}
              name={"search"}
              id={"search"}
              value={search}
              onChange={(v) => setSearch(v)}
              error={null}
            />
          </div>
          <button
            onClick={handleSearch}
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Cari
          </button>
          <Link
            href={"/employee/create"}
            className={`${credential.role.name === ERoles.PROVIDER || ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Tambah Karyawan
          </Link>
        </div>
      </div>
      <Table
        colls={["Nama", "No. Hp", "Email", "Jabatan", "Outlet", "Status", "Aksi"]}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        totalItem={totalEmployee}>
        {employee.map((i, k) => (
          <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600"
            key={k}>
            <td className="whitespace-nowrap px-6 py-4">
              {i.fullname}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.dial_code} {i.phone_number}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.email}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {i.role.name}
            </td>
            <td className="px-6 py-4">
              {i.employee_outlets.map((i, key) => (
                <div className="p-1 bg-gray-300 rounded-lg text-center my-2" key={key}>
                  <p>{i.outlet.name}</p>
                </div>
              ))}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.is_deleted ? (
                <div className="px-2 bg-red-500 rounded-xl text-center">
                  <p className="text-white">inactive</p>
                </div>
              ) : (
                <div className="px-2 bg-green-500 rounded-xl text-center">
                  <p className="text-white">active</p>
                </div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap space-x-4">
              <button
                className="cursor-pointer"
                onClick={() => {
                  router.push(`/employee/detail/${i.id}`);
                }}
              >
                <FiEye size={23} />
              </button>
              <button
                onClick={() => {
                  router.push(`/employee/${i.id}`);
                }}
              >
                <FiEdit size={23} />
              </button>

              <button
                onClick={() => {
                  formik.setFieldValue("id", i.id)
                  setModal(true)
                }}
              >
                <FiLock size={23} />
              </button>
            </td>
          </tr>
        ))}
      </Table>
      <Modal isOpen={modal}>
        <div className="relative bg-white dark:bg-gray-800 shadow rounded-md h-min 
        md:h-min w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setModal(false)
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName="Reset Kata Sandi" />
            <Input
              label={"Kata Sandi*"}
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
              label={"Ulangi Kata Sandi*"}
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
            <button
              onClick={formik.submitForm}
              className="w-full inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Simpan
            </button>
          </div>

        </div>
      </Modal>

    </DefaultLayout>
  )
}