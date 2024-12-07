"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input, InputToggle } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GetWithToken, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaLocationDot, FaLocationPin } from "react-icons/fa6";
import { FiDelete, FiEdit, FiTrash } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";


interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  total: number;
  err: string | string[];
}

export default function OutletPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [areas, setAreas] = useState<any[]>([])
  const auth = useSelector((s: RootState) => s.auth);
  const [totalOutlet, setTotalOutlet] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [areaModal, setAreaModal] = useState<boolean>(false)
  const CELLS = [
    "Name",
    // "Email",
    "Phone",
    // "Address",
    // "Location",
    "Status",
    "Action",
  ];

  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const GotOutlets = async () => {
      let urlwithQuery = `/api/outlet?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/outlet?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        setTotalOutlet(res.total);
        setOutlets(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    };
    const GotAreas = async () => {
      let urlwithQuery = `/api/outlet/area/get-areas?page=1&limit=10`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        setAreas(res.data);
      }
    };

    GotOutlets();
    GotAreas()
  }, [currentPage, areaModal, fixValueSearch, refresh, auth.auth.access_token]);

  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setOutlets([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setOutlets([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      area_id: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Username shouldn't empty"),
    }),
    onSubmit: async (values) => {
      let data: any = values
      let url = "api/outlet/create-or-update-area"

      if (values.area_id != "" && values.name != "") {
        data = {
          name: values.name,
          id: values.area_id
        }
      }

      const res = await PostWithToken<MyResponse>({
        router: router,
        url: url,
        data: data,
        token: `${auth.auth.access_token}`
      })
      if (res?.statusCode === 200) {
        toast.success("Berhasil menambahkan data!");
        setAreaModal(false)
        formik.setFieldValue("name", "")
        formik.setFieldValue("area_id", "")
      }
    },
  })
  const deleteArea = async (id: any) => {
    const data = {
      area_id: id
    }
    console.log(data);

    const res = await PostWithToken<MyResponse>({
      router: router,
      url: "api/outlet/remove-area",
      data: data,
      token: `${auth.auth.access_token}`
    })
    if (res?.statusCode === 200) {
      toast.success("Berhasil menghapus data!");
      setAreaModal(false)
      formik.setFieldValue("name", "")
      formik.setFieldValue("area_id", "")
    }

  }

  return (
    <>
      <Breadcrumb pageName="Outlet" />
      <div className="w-full bg-white dark:bg-black p-4 mb-4 rounded-t">
        <div className="flex flex-row items-center space-x-2 pb-4">
          <div className="w-90">
            <Input
              label={"Search"}
              name={"search"}
              id={"search"}
              value={search}
              onChange={(v) => setSearch(v)}
              error={null}
            />
          </div>
          <button
            onClick={handleSearch}
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <Link
            href={"/outlet/create"}
            className={`${auth.role.name !== ERoles.PROVIDER && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Create Outlet
          </Link>
          <button
            onClick={() => setAreaModal(true)}
            className={`${auth.role.name !== ERoles.PROVIDER && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Create Group Area
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Table
            colls={CELLS}
            onPaginate={(page) => setCurrentPage(page)}
            currentPage={currentPage}
            totalItem={totalOutlet}
          >
            {outlets.map((i, k) => (
              <tr
                className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                key={k}
              >
                <td className="whitespace-nowrap px-6 py-4">{i.name}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.dial_code} {i.phone_number}
                </td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4">
                  <div className=" relative group">
                    <button
                      onClick={() => {
                        router.push(`/outlet/${i.id}`);
                      }}
                      className="flex items-center"
                    >
                      <FiEdit size={23} />
                    </button>
                    <div className="absolute opacity-85 bottom-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1">
                      Edit Outlet
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>

        <div className="bg-white rounded-md shadow-3 space-y-4 pb-4 h-fit">
          <div className="w-full p-4 bg-gray-50 text-sm font-medium text-black-2">
            AREA
          </div>
          {areas.map((i, k) => (
            <div key={k} className="flex space-x-4 items-center mx-4">
              <FaLocationDot size={28} color="teal" />
              <p className="w-3/5">{i.name}</p>

              <div className="relative group">
                <button
                  onClick={() => {
                    formik.setFieldValue("name", i.name);
                    formik.setFieldValue("area_id", i.id);
                    setAreaModal(true);
                  }}
                >
                  <FiEdit size={23} />
                </button>
                <div className="absolute opacity-85 bottom-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1">
                  Edit Area
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={() => {
                    deleteArea(i.id);
                    setRefresh(!refresh);
                  }}
                >
                  <FiTrash size={23} />
                </button>
                <div className="absolute opacity-85 bottom-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1">
                  Delete Area
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>



      <Modal isOpen={areaModal}>
        <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-min w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setAreaModal(false)
              formik.setFieldValue("name", "")
              formik.setFieldValue("area_id", "")
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={`Create Area`} />
          </div>

          <div className="gap-y-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6">
              <Input
                label={"Nama*"}
                name={"name"}
                id={"name"}
                value={formik.values.name ? formik.values.name : ""}
                onChange={(v) => formik.setFieldValue("name", v)}
                error={
                  formik.touched.name && formik.errors.name
                    ? formik.errors.name
                    : null
                }
              />
            </div>

            <button
              onClick={formik.submitForm}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 mt-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
