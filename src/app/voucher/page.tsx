"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { Input, InputDropdown, InputToggle } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { Voucher } from "@/types/voucher";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
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
const discTypeList = [
  {
    label: "percentage",
    value: "percentage"
  }, {
    label: "direct discount",
    value: "direct discount"
  }
]

const CELLS = [
  "Code",
  "Name",
  "Start from",
  "Expired at",
  "Quota",
  "Discount",
  "Discount Type",
  "Created at",
  "Status",
  "Action",
];

export default function Vouchers() {
  const [search, setSearch] = useState<string>("");
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [voucher, setVoucher] = useState<Voucher[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [fixValueSearch, setFixValueSearch] = useState("")
  const [totalProduct, setTotalProduct] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [updateModal, setUpdateModal] = useState<boolean>(false)
  const [updateOrAddVoucher, setUpdateOrAddVoucher] = useState<boolean>(true)
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter()

  useEffect(() => {
    const GotVoucher = async () => {
      let urlwithQuery = `/api/voucher/filter?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/voucher/filter?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await PostWithToken<iResponse<Voucher[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
        data: {
          outlet_ids: [],
        }
      });
      if (res?.statusCode === 200) {
        if (res.total) setTotalProduct(res.total)
        else setTotalProduct(0)
        setVoucher(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    };

    GotVoucher()

  }, [loading, currentPage, fixValueSearch, refresh, auth.auth.access_token, updateOrAddVoucher, router])

  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setVoucher([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setVoucher([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };


  const formik = useFormik({
    initialValues: {
      id: "",
      name: "",
      code: "",
      started_at: "",
      ended_at: "",
      quota: 0,
      discount: 0,
      discount_type: "percentage",
      is_deleted: false
    },
    validationSchema: Yup.object({
      name: Yup.string().max(100, "Max 100 karakter!").required(),
      code: Yup.string().max(100, "Max 100 karakter!").required(),
      started_at: Yup.string().max(100, "Max 100 karakter!").required(),
      ended_at: Yup.string().max(100, "Max 100 karakter!").required(),
      quota: Yup.number().required(),
      discount: Yup.number().required(),
      discount_type: Yup.string().required(),
      is_deleted: Yup.boolean(),

    }),

    onSubmit: async (values) => {

      if (loading) return;
      let newValues: any = values
      if (!updateOrAddVoucher) {
        const { id, ...addValues } = newValues
        newValues = addValues
      }

      setLoading(true);
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/voucher/create-update",
        data: newValues,
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
        router.push("/voucher");
      }
      setLoading(false);
      setUpdateModal(false);
    },
  });
  return (
    <>
      <Breadcrumb pageName="Voucher" />
      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row w-full md:space-x-4">
          <div className="w-full md:w-96">
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
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <button
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
            text-center font-edium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={() => {
              formik.setFieldValue("id", "")
              formik.setFieldValue("name", "")
              formik.setFieldValue("code", "")
              formik.setFieldValue("started_at", "")
              formik.setFieldValue("ended_at", "")
              formik.setFieldValue("quota", 0)
              formik.setFieldValue("discount", 0)
              formik.setFieldValue("discount_type", "percentage")
              formik.setFieldValue("is_deleted", false)
              setUpdateModal(true)
              setUpdateOrAddVoucher(false)
            }}
          >
            Add Voucher
          </button>
        </div>
      </div>

      <Table
        colls={CELLS}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        totalItem={totalProduct}>

        {voucher.map((vou, index) => (
          <tr key={index} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600">
            <td className="px-6 py-4">
              {vou.code}
            </td>
            <td className="px-6 py-4">
              {vou.name}
            </td>
            <td className="px-6 py-4">
              {new Date(vou.started_at).toLocaleString("id", {
                minute: "numeric",
                hour: "numeric",
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </td>
            <td className="px-6 py-4">
              {new Date(vou.ended_at).toLocaleString("id", {
                minute: "numeric",
                hour: "numeric",
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </td>
            <td className="px-6 py-4">
              {vou.quota}
            </td>
            <td className="px-6 py-4">
              {vou.discount}
            </td>
            <td className="px-6 py-4">
              {vou.discount_type}
            </td>
            <td className="px-6 py-4">
              {new Date(vou.created_at).toLocaleString("id", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </td>
            <td className="px-6 py-4">
              {vou.is_deleted ? (
                <div className="px-2 bg-red-500 rounded-xl text-center max-w-14 ">
                  <p className="text-white">inactive</p>
                </div>
              ) : (
                <div className="px-2 bg-green-500 rounded-xl text-center max-w-14">
                  <p className="text-white">active</p>
                </div>
              )}
            </td>
            <td className="px-6 py-4">
              <div className=" flex flex-row items-center space-x-2 relative group">
                <button
                  onClick={() => {
                    formik.setFieldValue("id", vou.id)
                    formik.setFieldValue("name", vou.name)
                    formik.setFieldValue("code", vou.code)
                    formik.setFieldValue("started_at", vou.started_at)
                    formik.setFieldValue("ended_at", vou.ended_at)
                    formik.setFieldValue("quota", vou.quota)
                    formik.setFieldValue("discount", vou.discount)
                    formik.setFieldValue("discount_type", vou.discount_type)
                    formik.setFieldValue("is_deleted", vou.is_deleted)

                    // console.log("formik " + formik.values.started_at.split(".")[0]);
                    // console.log("start " + startDate);
                    // console.log("end " + endDate);
                    // console.log("startvou " + vou.started_at);
                    // console.log(updateOrAddVoucher);

                    setUpdateModal(true)
                    setUpdateOrAddVoucher(true)
                  }}
                >
                  <FiEdit size={18} />
                </button>
                <div className="absolute opacity-85 bottom-[70%] transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1">
                  Edit Voucher
                </div>
              </div>
            </td>
          </tr>
        ))}
      </Table >

      <Modal isOpen={updateModal}>
        <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-min w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setUpdateModal(false)
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={updateOrAddVoucher ? `Update Voucher` : `Add Voucher`} />
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <Input
              label={"Name*"}
              name={"name"}
              id={"name"}
              value={formik.values.name}
              onChange={(v) => {
                formik.setFieldValue("name", v)
              }}
              error={formik.touched.name && formik.errors.name
                ? formik.errors.name
                : null}>
            </Input>
            <Input
              label={"Code*"}
              name={"code"}
              id={"code"}
              value={formik.values.code}
              onChange={(v) => { formik.setFieldValue("code", v) }}
              error={formik.touched.code && formik.errors.code
                ? formik.errors.code
                : null}>
            </Input>
            <DatePickerOne
              label={"Start from"}
              defaultDate={formik.values.started_at.split(".")[0]}
              onChange={(val) => {
                formik.setFieldValue("started_at", val)
              }} />
            <DatePickerOne
              label={"Expired at"}
              defaultDate={formik.values.ended_at.split(".")[0]}
              onChange={(val) => {
                formik.setFieldValue("ended_at", val)
              }} />
            <Input
              label={"Quota*"}
              name={"quota"}
              id={"quota"}
              value={formik.values.quota ? formik.values.quota : 0}
              onChange={(v) => { formik.setFieldValue("quota", parseInt(v)) }}
              error={formik.touched.quota && formik.errors.quota
                ? formik.errors.quota
                : null}>
            </Input>
            <Input
              label={"Discount*"}
              name={"discount"}
              id={"discount"}
              value={formik.values.discount ? formik.values.discount : 0}
              onChange={(v) => { formik.setFieldValue("discount", parseInt(v)) }}
              error={formik.touched.discount && formik.errors.discount
                ? formik.errors.discount
                : null}>
            </Input>
            <InputDropdown
              label={"Discount Type*"}
              name={"discount_type"}
              id={"discount_type"}
              value={formik.values.discount_type}
              onChange={(v) => { formik.setFieldValue("discount_type", v) }}
              options={discTypeList}
              error={formik.touched.discount_type && formik.errors.discount_type
                ? formik.errors.discount_type
                : null}>
            </InputDropdown>
            <InputToggle
              value={!formik.values.is_deleted}
              onClick={(v) => formik.setFieldValue("is_deleted", !v)}
              label={"Status"}
            />
            <div className="">
              <button
                onClick={formik.submitForm}
                className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
                Submit
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </ >
  );
}
