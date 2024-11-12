'use client'

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FilterComponent } from "@/components/Filters/FilterComponent";
import { iDropdown, Input, InputDropdown, InputToggle } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Modal from "@/components/Modals/Modal";
import { FilterByOutletTableModal } from "@/components/Outlets/FilterByOutletTableModal";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import { EPaymentMethodType, PaymentMethodType } from "@/types/paymentMethod";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiEdit, FiEye } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

export default function PagePaymentMethod() {
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([]);
  const [modalOutlet, setModalOutlet] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const [items, setItems] = useState<PaymentMethodType[]>([])
  const [totalItem, setTotalItem] = useState<number>(0)
  const { auth, role } = useSelector((s: RootState) => s.auth)
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterIsDeleted, setFilterIsDeleted] = useState<boolean | undefined>()
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter()

  const [outlets, setOutlets] = useState<iDropdown[]>([])

  useEffect(() => {
    async function GotAllOutlet() {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet",
        token: `${auth.access_token}`
      })

      if (res?.statusCode === 200) {
        const outletMaping = res.data.map(i => {
          const city = i.city.split("--")
          return {
            value: i.id,
            label: `${i.name} ${city.length >= 2 ? city[1] : city}`
          }
        })

        if (outletMaping.length >= 1) formik.setFieldValue("outlet_id", outletMaping[0].value)
        setOutlets(outletMaping)
      }
    }

    GotAllOutlet()
  }, [])

  useEffect(() => {
    async function GotPRItems() {
      let urlwithQuery = `/api/payment-method/filter?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/payment-method/filter?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      let sttsFilter = {}
      if (filterIsDeleted) sttsFilter = { is_deleted: filterIsDeleted }

      const res = await PostWithToken<iResponse<PaymentMethodType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: { outlet_ids: filterByOutlet, ...sttsFilter }
      })

      console.log(res);

      if (res?.statusCode === 200) {
        if (res.total)
          setTotalItem(res.total);
        setItems(res.data);
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    GotPRItems()

  }, [currentPage, fixValueSearch, refresh, auth.access_token, filterByOutlet, filterIsDeleted])

  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setItems([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setItems([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  const FormatDecimal = (number: number) => {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR"
    }).format(number);

    return result
  }

  const [loading, setLoading] = useState<boolean>(false)
  const formik = useFormik({
    initialValues: {
      id: null,
      outlet_id: "",
      name: "",
      type: EPaymentMethodType.CASH,
      account_number: "",
      account_name: "",
      icon: null,
      is_deleted: false
    },
    validationSchema: Yup.object({
      name: Yup.string().max(100, "Maksimal 100 karakter").required("Tidak boleh kosong!"),
      outlet_id: Yup.string().required("Tidak boleh kosong!"),
      type: Yup.string().required("Tidak boleh kosong!"),
      account_number: Yup.string().when("type", (type, schema) => {
        return type.length >= 1 && type[0] === EPaymentMethodType.CASHLESS ? schema.required("Tidak boleh Kosong") : schema
      }),
      account_name: Yup.string().when("type", (type, schema) => {
        return type.length >= 1 && type[0] === EPaymentMethodType.CASHLESS ? schema.required("Tidak boleh Kosong") : schema
      }),
    }),
    onSubmit: async (values) => {
      console.log(values);
      if (loading) return
      setLoading(true)
      let idUpdate = {}
      if (values.id !== null) idUpdate = { id: values.id }

      const res = await PostWithToken<iResponse<any>>({
        router: router,
        url: "/api/payment-method/create-update",
        token: `${auth.access_token}`,
        data: {
          ...idUpdate,
          outlet_id: values.outlet_id,
          name: values.name,
          type: values.type,
          account_number: values.account_number,
          account_name: values.account_name,
          icon: null,
          is_deleted: values.is_deleted
        },
      })

      console.log(res);
      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        handleSearch();
        setModalForm(false);
        resetForm()
        toast.success("Berhasil menambahkan item");
      }
      setTimeout(() => setLoading(false), 1000)
    }
  })

  function resetForm() {
    formik.resetForm();
    if (outlets.length >= 1)
      formik.setFieldValue("outlet_id", outlets[0].value)

  }

  const [modalForm, setModalForm] = useState<boolean>(false)
  return (
    <DefaultLayout>
      <Breadcrumb pageName={"Payment Method"} />
      <FilterComponent
        search={search}
        setSearch={(e) => setSearch(e)}
        onClickFilterOutlet={() => setModalOutlet(true)}
        handleSearch={handleSearch} >

        <button
          className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
            text-center font-edium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          onClick={() => setModalForm(true)}
        >
          Submit
        </button>

      </FilterComponent>

      <Table colls={["#", "Nama", "Tipe", "No Akun/No Rek", "Akun", "Outlet", "Status", "Updated At", "Aksi"]}
        currentPage={currentPage} totalItem={totalItem} onPaginate={() => null}>

        {items.map((i, k) => (
          <tr
            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600"
            key={k}
          >
            <td className="whitespace-nowrap px-6 py-4">{k + 1}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.name}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.type}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.account_number ? i.account_number : "-"}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.account_name ? i.account_name : "-"}</td>
            <td className="px-6 py-4">{i.outlet.name}</td>
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
            <td className="px-6 py-4">
              {new Date(i.updated_at).toLocaleDateString("id", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </td>

            <td className="px-6 py-4 whitespace-nowrap space-x-4">
              <button
                onClick={() => {
                  formik.setFieldValue("id", i.id)
                  formik.setFieldValue("outlet_id", i.outlet_id)
                  formik.setFieldValue("name", i.name)
                  formik.setFieldValue("type", i.type)
                  formik.setFieldValue("account_name", `${i.account_name}`)
                  formik.setFieldValue("account_number", `${i.account_number}`)
                  formik.setFieldValue("icon", `${i.icon}`)
                  formik.setFieldValue("is_deleted", i.is_deleted)
                  setModalForm(true);
                }}
              >
                <FiEdit size={23} />
              </button>
            </td>
          </tr>
        ))}

      </Table>

      <FilterByOutletTableModal modalOutlet={modalOutlet}
        closeModal={(isOpen) => setModalOutlet(isOpen)}
        setFilterByOutlet={(isChecked, value) => {
          if (isChecked) {
            setFilterByOutlet(old => [...old, value])
          } else {
            setFilterByOutlet(old => old.filter(f => f !== value))
          }
        }} />

      <Modal isOpen={modalForm}>
        <div className="relative bg-white dark:bg-gray-800 shadow rounded-md h-min 
        md:h-min w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setModalForm(false);
              resetForm();
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName="Metode Pembayaran" />
          </div>
          <div className="flex flex-col space-y-8">

            <Input label={"Nama*"} name={"name"} id={"name"}
              value={formik.values.name}
              onChange={(v) => formik.setFieldValue("name", v)}
              error={
                formik.touched.name && formik.errors.name
                  ? formik.errors.name
                  : null
              } />

            <InputDropdown
              label={"Tipe Pembayaran*"}
              name={"type"}
              id={"type"}
              value={formik.values.type}
              onChange={(v) => formik.setFieldValue("type", v)}
              options={Object.values(EPaymentMethodType).map(i => { return { label: i, value: i } })}
              error={
                formik.touched.type && formik.errors.type
                  ? formik.errors.type
                  : null
              }
            />

            <div className={`${formik.values.type !== EPaymentMethodType.CASHLESS && "hidden"} flex flex-row space-x-3`}>
              <Input label={"Nama Akun*"} name={"account_name"} id={"account_name"}
                value={formik.values.account_name}
                onChange={(v) => formik.setFieldValue("account_name", v)}
                error={
                  formik.touched.account_name && formik.errors.account_name
                    ? formik.errors.account_name
                    : null
                } />

              <Input label={"No Rek/Akun*"} name={"account_number"} id={"account_number"}
                value={formik.values.account_number}
                onChange={(v) => formik.setFieldValue("account_number", v)}
                error={
                  formik.touched.account_number && formik.errors.account_number
                    ? formik.errors.account_number
                    : null
                } />
            </div>

            <InputDropdown
              label={"Outlet*"}
              name={"outlet_id"}
              id={"outlet_id"}
              value={formik.values.outlet_id}
              onChange={(v) => formik.setFieldValue("outlet_id", v)}
              options={outlets}
              error={
                formik.touched.outlet_id && formik.errors.outlet_id
                  ? formik.errors.outlet_id
                  : null
              }
            />

            <InputToggle
              value={!formik.values.is_deleted}
              onClick={(v) => formik.setFieldValue("is_deleted", !v)}
              label={"Status"} />
          </div>

          <button
            className={`${role.name !== ERoles.PROVIDER && role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            w-full mt-5 justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={formik.submitForm}
          >
            Submit
          </button>
        </div>
      </Modal>
    </DefaultLayout>
  )
}