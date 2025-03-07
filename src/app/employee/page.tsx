"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { EDepartmentEmployee, Employee } from "@/types/employee";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { FiEdit, FiEye, FiLock } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

interface iResponseEmployee {
  statusCode: number;
  msg: string;
  data: any;
  total: number;
  err: string | string[];
}

export default function PageEmployee() {
  const [currentPage, setCurrentPage] = useState(1);
  const credential = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee[]>([]);
  const [totalEmployee, setTotalEmployee] = useState<number>(0);
  const [showDetailOutlet, setShowDetailOutlet] = useState<number>();

  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);

  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );

  useEffect(() => {

    async function GotAllEmployee() {
      let urlwithQuery = `/api/auth/employee?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/auth/employee?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      const res = await PostWithToken<iResponseEmployee>({
        router: router,
        url: urlwithQuery,
        token: `${credential.auth.access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : credential.department !== EDepartmentEmployee.HQ &&
                  credential.role.name !== ERoles.PROVIDER
                ? defaultSelectedOutlet.map((o) => o.outlet_id)
                : [],
        },
      });

      if (res?.statusCode === 200) {
        setTotalEmployee(res.total);
        setEmployee(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }
    if (!modal && credential) {
      GotAllEmployee();
    }
  }, [
    currentPage,
    fixValueSearch,
    refresh,
    credential.auth.access_token,
    router,
    modal,
    defaultSelectedOutlet,
    selectedOutlets,
    credential,
  ]);

  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setEmployee([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1 && fixValueSearch !== search) {
        setEmployee([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  const [modalEdit, setModalEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const formik = useFormik({
    initialValues: {
      id: "",
      password: "",
      cPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .required("password required!")
        .min(6, "password min 6 character!")
        .max(50, "password max 50 character!"),
      cPassword: Yup.string()
        .required("Confirm password required!")
        .oneOf([Yup.ref("password"), ""], "Passwords do not match!"),
    }),
    onSubmit: async (values) => {
      if (formik.values.id.length === 0) {
        toast("user not selected, please try again!");
        setModalEdit(false);
      }

      if (loading) return;
      setLoading(true);
      const res = await PostWithToken<iResponse<any>>({
        router: router,
        url: "/api/auth/bind-reset-password",
        data: values,
        token: `${credential.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1)
            formik.setFieldError(field[0].toLowerCase(), i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Berhasil merubah data!");
        formik.resetForm();
        setModalEdit(false);
      }

      setTimeout(() => setLoading(false), 1000);
    },
  });
  return (
    <>
      <Breadcrumb pageName="Employee" />
      <div className="mb-4 w-full rounded-lg bg-white p-4 dark:bg-boxdark">
        <div className="items-center space-y-2 lg:flex lg:flex-row lg:space-x-2 lg:space-y-0">
          <div className="lg:w-90">
            <Input
              label={"Search Employee"}
              name={"search"}
              id={"search"}
              value={search}
              onChange={(v) => setSearch(v)}
              error={null}
            />
          </div>
          <button
            onClick={handleSearch}
            className={`inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-3 text-center 
              font-medium text-white hover:bg-opacity-90 lg:w-auto lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <Link
            href={"/employee/create"}
            className={`${credential.role.name !== ERoles.PROVIDER && credential.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex w-full 
            items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90
            lg:w-auto lg:px-8 xl:px-10`}
          >
            Add Employee
          </Link>
        </div>
      </div>
      <Table
        colls={
          credential.department === EDepartmentEmployee.OWNER
            ? ["Full Name", "Phone Number", "Email", "Department", "Outlet", "Status"]
            : [
                "Full Name",
                "Phone Number",
                "Email",
                "Role",
                "Outlet",
                "Status",
                "Action",
              ]
        }
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        totalItem={totalEmployee}
      >
        {employee.map((i, k) => (
          <tr
            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600"
            key={k}
          >
            <td className="whitespace-nowrap px-6 py-4">{i.fullname}</td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.dial_code} {i.phone_number}
            </td>
            <td className="whitespace-nowrap px-6 py-4">{i.email}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.department.toUpperCase()}</td>
            <td className="flex flex-wrap space-x-2 px-6 py-4">
              {showDetailOutlet == k ? (
                i.employee_outlets.map((i, key) => (
                  <button
                    className={`m-2 rounded-lg bg-gray-300 p-1 text-center hover:bg-green-500  hover:text-white dark:bg-boxdark`}
                    key={key}
                    onClick={() => setShowDetailOutlet(-1)}
                  >
                    <p>{i.outlet.name}</p>
                  </button>
                ))
              ) : (
                <button
                  className={`my-2 rounded-lg bg-gray-300 px-2 text-center hover:bg-green-500 hover:text-white dark:bg-boxdark`}
                  onClick={() => setShowDetailOutlet(k)}
                >
                  <p>Show</p>
                </button>
              )}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.is_deleted ? (
                <div className="rounded-xl bg-red-500 px-2 text-center">
                  <p className="text-white">inactive</p>
                </div>
              ) : (
                <div className="rounded-xl bg-green-500 px-2 text-center">
                  <p className="text-white">active</p>
                </div>
              )}
            </td>
            <td
              className={
                credential.department !== EDepartmentEmployee.OWNER
                  ? `flex items-center space-x-2 whitespace-nowrap px-6 py-4`
                  : `hidden`
              }
            >
              <div className="group relative">
                <button
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(`/employee/detail/${i.id}`);
                  }}
                >
                  <FiEye size={23} />
                </button>
                <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                  View detail
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={() => {
                    router.push(`/employee/${i.id}`);
                  }}
                >
                  <FiEdit size={23} />
                </button>
                <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                  Edit employee
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={() => {
                    formik.setFieldValue("id", i.id);
                    setModalEdit(true);
                  }}
                >
                  <FiLock size={23} />
                </button>
                <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                  Reset password
                </div>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <Modal isOpen={modalEdit}>
        <div
          className="relative h-min w-[90%] rounded-md bg-white p-4 
        shadow dark:bg-gray-800 md:h-min md:w-[50%]"
        >
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setModalEdit(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName="Reset Password" />
            <Input
              label={"New Password*"}
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
              label={"Re-Enter new password*"}
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
              className="inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
