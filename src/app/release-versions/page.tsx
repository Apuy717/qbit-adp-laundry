"use client"

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb"
import { Input, InputDropdown, InputTextArea } from "@/components/Inputs/InputComponent"
import Modal from "@/components/Modals/Modal"
import Table from "@/components/Tables/Table"
import { FilterByOutletContext } from "@/contexts/selectOutletContex"
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData"
import { RootState } from "@/stores/store"
import { useFormik } from "formik"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { FiEdit } from "react-icons/fi"
import { IoMdDownload } from "react-icons/io"
import { IoCloseOutline } from "react-icons/io5"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import * as Yup from "yup";


const optPlatform = [
  {
    value: "mobile",
    label: "mobile",
  },
  {
    value: "adp",
    label: "adp",
  },
  {
    value: "api",
    label: "api",
  },
]
export default function ReleaseVersions() {

  const [data, setData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState<string>("");


  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const [totalData, setTotalData] = useState<number>(0)
  const [updateModal, setUpdateModal] = useState<boolean>(false)
  const [createModal, setCreateModal] = useState<boolean>(false)
  const [isUpload, setIsUpload] = useState<boolean>(false)
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)

  useEffect(() => {
    async function GotData() {
      let urlwithQuery = `/api/version/got-all?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/version/got-all?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await GetWithToken<iResponse<any[]>>({
        url: urlwithQuery,
        router: router,
        token: `${auth.access_token}`,
      })
      // console.log(res.data);


      if (res?.statusCode === 200) {
        if (res.data.length >= 1 && res.total)
          setTotalData(res.total)
        else
          setTotalData(0)

        setData(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    if (!modal)
      GotData()
  }, [currentPage, fixValueSearch, refresh, auth.access_token, selectedOutlets, defaultSelectedOutlet, modal, router])

  const formikCreate = useFormik({
    initialValues: {
      platform: optPlatform[0].value,
      version: "",
      label: "",
      apk: null as File | null,
      description: "",
    },
    validationSchema: Yup.object({
      platform: Yup.string().required("Platform shouldn't be empty"),
      version: Yup.string().required("Version shouldn't be empty"),
      label: Yup.string().required("Label shouldn't be empty"),
      description: Yup.string().required("Description shouldn't be empty"),
    }),
    onSubmit: async (values) => {
      if (isUpload) {
        return
      }
      const formData = new FormData();
      formData.append("platform", values.platform);
      formData.append("version", values.version);
      formData.append("label", values.label);
      formData.append("description", values.description);
      if (values.apk) {
        formData.append("apk", values.apk);
      }
      setIsUpload(true)

      try {
        let url = "api/version/create-update";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${auth.access_token}`,
          },
          body: formData,
        });

        if (res?.status === 200) {
          setRefresh(!refresh)
          toast.success("Create version success!");
          setCreateModal(false);
          setIsUpload(false)
          resetForm()
          setRefresh(!refresh)
        } else {
          toast.error(res.status)
          setCreateModal(false)
        }
      } catch (error: any) {
        console.log(error);
        toast.error(error)
      }
    },
  });
  const formikUpdate = useFormik({
    initialValues: {
      id: "",
      platform: "",
      version: "",
      label: "",
      apk: null as File | null,
      description: "",
    },
    validationSchema: Yup.object({
      platform: Yup.string().required("Platform shouldn't be empty"),
      version: Yup.string().required("Version shouldn't be empty"),
      label: Yup.string().required("Label shouldn't be empty"),
      description: Yup.string().required("Description shouldn't be empty"),
    }),
    onSubmit: async (values) => {
      if (isUpload) {
        return
      }
      const formData = new FormData();
      formData.append("id", values.id);
      formData.append("platform", values.platform);
      formData.append("version", values.version);
      formData.append("label", values.label);
      formData.append("description", values.description);
      if (values.apk) {
        formData.append("apk", values.apk);
      }

      setIsUpload(true)

      try {
        let url = "api/version/create-update";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${auth.access_token}`,
          },
          body: formData,
        });

        if (res?.status === 200) {
          setRefresh(!refresh)
          toast.success("Update version success!");
          setUpdateModal(false);
          setIsUpload(false)
          resetForm()
          setRefresh(!refresh)
        } else {
          toast.error(res.status)
          setCreateModal(false)
        }
      } catch (error: any) {
        console.log(error);
        toast.error(error)
      }
    },
  });

  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setData([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setData([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  const resetForm = () => {
    formikCreate.setFieldValue("version", "")
    formikCreate.setFieldValue("label", "")
    formikCreate.setFieldValue("apk", null)
    formikCreate.setFieldValue("description", "")
  }


  return (
    <div className="min-h-screen">
      <Breadcrumb pageName={"Release Versions"} />

      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-96">
            <Input
              label={"Search Version"}
              name={"search"}
              id={"search"}
              value={search}
              onChange={(v) => setSearch(v)}
              error={null}
            />
          </div>
          <button
            onClick={handleSearch}
            className={`w-full md:w-fit inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
                text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <button
            className={`w-full md:w-fit font-edium inline-flex items-center justify-center rounded-md bg-black px-10 
            py-3 text-center text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={() => {
              setCreateModal(true)
            }}
          >
            Add Version
          </button>
        </div>
      </div>

      <Table
        colls={["version", "platform", "label", "description", "release", "action"]}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        totalItem={totalData}>
        {data.map((i, k) => (
          <tr key={k} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600">
            <td className="px-6 py-4 capitalize">
              <div className="p-2 bg-blue-600 text-white rounded-md w-full text-center font-medium hover:cursor-pointer hover:bg-blue-800">
                {i.version}
              </div>
            </td>
            <td className="px-6 py-4">
              {i.platform}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {i.label}
            </td>
            <td className="px-6 py-4 capitalize">
              <p className="text-xs font-medium">
                Changes:
              </p>
              <p className="text-xs font-thin whitespace-nowrap">
                {i.description
                  .split("\n")
                  .map((line: string, index: number) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}</p>
            </td>
            <td className="px-6 py-4">
              {
                new Date(i.created_at!).toLocaleDateString("id", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              }
            </td>
            <td className="flex space-x-2 px-6 py-4">
              <div className="group relative">
                <Link href={i.download}>
                  <IoMdDownload size={24} className="text-blue-600" />
                </Link >
                <div className="opacity-50 absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                  Download
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={() => {
                    setUpdateModal(true)
                    formikUpdate.setFieldValue("id", i.id)
                    formikUpdate.setFieldValue("platform", i.platform)
                    formikUpdate.setFieldValue("version", i.version)
                    formikUpdate.setFieldValue("label", i.label)
                    formikUpdate.setFieldValue("apk", null)
                    formikUpdate.setFieldValue("description", i.description)
                  }}
                >
                  <FiEdit size={22} />
                </button>
                <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-50 group-hover:block">
                  Edit Version
                </div>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal isOpen={createModal}>
        <div className="relative w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-0 -top-0 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              resetForm()
              setCreateModal(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8 pt-6">
            <Breadcrumb
              pageName={`Create Release Version`}
            />
          </div>
          <div className={isUpload ? `w-full h-full` : `hidden`}>
            <div className="absolute bg-white rounded-md opacity-80 w-full h-full top-0 left-0 z-99"></div>
            <svg
              className="absolute animate-spin h-50 w-50 text-blue-600 z-999 inset-0 m-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-50"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <h1 className="absolute text-blue-600 px-6 opacity-75 font-bold text-xl bottom-25 left-[38%] z-999"> Uploading</h1>
          </div>


          <div className=" h-96 overflow-y-scroll py-2">

            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-1">
              <InputDropdown
                label={"Platform*"}
                name={`Platform`}
                id={`Platform`}
                value={formikCreate.values.platform}
                options={optPlatform}
                onChange={(v) =>
                  formikCreate.setFieldValue(`platform`, v)
                }
                error={
                  formikCreate.touched.platform && formikCreate.errors.platform
                    ? formikCreate.errors.platform
                    : null}
              />
              <Input
                label={"Version*"}
                name={`version`}
                id={`version`}
                value={formikCreate.values.version}
                onChange={(v) =>
                  formikCreate.setFieldValue(`version`, v)
                }
                error={
                  formikCreate.touched.version && formikCreate.errors.version
                    ? formikCreate.errors.version
                    : null}
              />
              <Input
                label={"Label*"}
                name={`label`}
                id={`label`}
                value={formikCreate.values.label}
                onChange={(v) =>
                  formikCreate.setFieldValue(`label`, v)
                }
                error={
                  formikCreate.touched.label && formikCreate.errors.label
                    ? formikCreate.errors.label
                    : null}
              />
              <input
                type="file"
                name="apk"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0] || null;
                  formikCreate.setFieldValue("apk", file);
                  console.log(formikCreate.values.apk);

                }}
              />

              <InputTextArea
                label={"Description*"}
                name={`Description`}
                id={`Description`}
                value={formikCreate.values.description}
                onChange={(v) =>
                  formikCreate.setFieldValue(`description`, v)
                }
                error={
                  formikCreate.touched.description && formikCreate.errors.description
                    ? formikCreate.errors.description
                    : null}
              />
            </div>

            <button
              onClick={formikCreate.submitForm}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>

        </div>
      </Modal>

      <Modal isOpen={updateModal}>
        <div className="relative w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              formikUpdate.setFieldValue("id", "")
              resetForm()
              setUpdateModal(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8 pt-6">
            <Breadcrumb
              pageName={`Update Release Version`}
            />
          </div>

          <div className={isUpload ? `w-full h-full` : `hidden`}>
            <div className="absolute bg-white rounded-md opacity-80 w-full h-full top-0 left-0 z-99"></div>
            <svg
              className="absolute animate-spin h-50 w-50 text-blue-600 z-999 inset-0 m-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-50"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <h1 className="absolute text-blue-600 px-6 opacity-75 font-bold text-xl bottom-25 left-[38%] z-999"> Uploading</h1>
          </div>

          <div className=" h-96 overflow-y-scroll py-2">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-1">
              <InputDropdown
                label={"Platform*"}
                name={`Platform`}
                id={`Platform`}
                value={formikUpdate.values.platform}
                options={optPlatform}
                onChange={(v) =>
                  formikUpdate.setFieldValue(`platform`, v)
                }
                error={
                  formikUpdate.touched.platform && formikUpdate.errors.platform
                    ? formikUpdate.errors.platform
                    : null}
              />
              <Input
                label={"Version*"}
                name={`version`}
                id={`version`}
                value={formikUpdate.values.version}
                onChange={(v) =>
                  formikUpdate.setFieldValue(`version`, v)
                }
                error={
                  formikUpdate.touched.version && formikUpdate.errors.version
                    ? formikUpdate.errors.version
                    : null}
              />
              <Input
                label={"Label*"}
                name={`label`}
                id={`label`}
                value={formikUpdate.values.label}
                onChange={(v) =>
                  formikUpdate.setFieldValue(`label`, v)
                }
                error={
                  formikUpdate.touched.label && formikUpdate.errors.label
                    ? formikUpdate.errors.label
                    : null}
              />
              <input
                type="file"
                name="apk"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0] || null;
                  formikUpdate.setFieldValue("apk", file);
                }}
              />
              <InputTextArea
                label={"Description*"}
                name={`Description`}
                id={`Description`}
                value={formikUpdate.values.description}
                onChange={(v) =>
                  formikUpdate.setFieldValue(`description`, v)
                }
                error={
                  formikUpdate.touched.description && formikUpdate.errors.description
                    ? formikUpdate.errors.description
                    : null}
              />
            </div>

            <button
              onClick={formikUpdate.submitForm}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>

        </div>
      </Modal>
    </div>
  )
}