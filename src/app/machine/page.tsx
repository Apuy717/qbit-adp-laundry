'use client'

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FilterComponent } from "@/components/Filters/FilterComponent";
import { iDropdown, Input, InputDropdown, InputToggle } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import { FilterByOutletTableModal } from "@/components/Outlets/FilterByOutletTableModal";
import Table from "@/components/Tables/Table";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { EMachineType, MachineType } from "@/types/machineType";
import { Outlet } from "@/types/outlet";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { FiEdit, FiEye } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

export default function PageMachine() {
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([]);
  const [modalOutlet, setModalOutlet] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const [items, setItems] = useState<MachineType[]>([])
  const [totalItem, setTotalItem] = useState<number>(0)
  const { auth, role } = useSelector((s: RootState) => s.auth)
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterIsDeleted, setFilterIsDeleted] = useState<boolean | undefined>()
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)

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
      let urlwithQuery = `/api/machine?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/machine?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      let sttsFilter = {}
      if (filterIsDeleted) sttsFilter = { is_deleted: filterIsDeleted }

      const res = await PostWithToken<iResponse<MachineType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map((o: any) => o.outlet_id) : defaultSelectedOutlet.map((o: any) => o.outlet_id),
        }
      })

      if (res?.statusCode === 200) {
        if (res.total)
          setTotalItem(res.total);
        setItems(res.data);
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }
    if (!modal)
      GotPRItems()

  }, [currentPage, fixValueSearch, refresh, auth.access_token, filterByOutlet, filterIsDeleted,
    selectedOutlets, defaultSelectedOutlet, modal])


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
      machine_id: "",
      name: "",
      ip: "",
      default_duration: "50",
      type: EMachineType.WASHER,
      is_deleted: false
    },
    validationSchema: Yup.object({
      name: Yup.string().max(100, "Maksimal 100 karakter").required("Tidak boleh kosong!"),
      machine_id: Yup.string().max(100, "Maksimal 100 karakter").required("Tidak boleh kosong!"),
      ip: Yup.string().required("Tidak boleh kosong!"),
      default_duration: Yup.string().required("Tidak boleh kosong!"),
      outlet_id: Yup.string().required("Tidak boleh kosong!"),
      type: Yup.string().required("Tidak boleh kosong!")
    }),
    onSubmit: async (values) => {
      if (loading) return
      setLoading(true)
      let idUpdate = {}
      if (values.id !== null) idUpdate = { id: values.id }

      const res = await PostWithToken<iResponse<any>>({
        router: router,
        url: "/api/machine/create-update",
        token: `${auth.access_token}`,
        data: {
          ...idUpdate,
          outlet_id: values.outlet_id,
          machine_id: values.machine_id,
          name: values.name,
          ip: values.ip,
          default_duration: parseInt(values.default_duration),
          type: values.type,
          is_deleted: values.is_deleted
        },
      })

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
        toast.success("Berhasil menambahkan machine");
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
    <div className="min-h-screen">
      <Breadcrumb pageName={"Machine"} />
      <div className="w-full bg-white  dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row w-full md:space-x-4">
          <div className="lg:w-90">
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
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white dark:text-gray-400 hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <button
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
            text-center font-edium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={() => setModalForm(true)}
          >
            Add Machine
          </button>
        </div>
      </div>

      <Table colls={role.name === ERoles.PROVIDER ? [
        "#", "Name", "Code", "IP", "Type", "Outlet", "Relay Cycle", "Machine Cycle", "Status", "Action"] :
        ["#", "Name", "Code", "Type", "Outlet", "Relay Cycle", "Machine Cycle", "Status", "Action"]}
        currentPage={currentPage} totalItem={totalItem} onPaginate={(page) => setCurrentPage(page)}>

        {items.map((i, k) => (
          <tr
            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600"
            key={k}
          >
            <td className="whitespace-nowrap px-6 py-4">{k + 1}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.name}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.machine_id}</td>
            {role.name === ERoles.PROVIDER && <td className="whitespace-nowrap px-6 py-4">{i.ip}</td>}
            <td className="px-6 py-4">{i.type}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.outlet.name}</td>
            <td className="whitespace-nowrap px-6 py-4">
              {FormatDecimal(parseInt(i.cycles))} cycle{" / "}
              {i.relay_time_used ? FormatDecimal(parseInt(i.relay_time_used)) : 0} Menit
            </td>

            <td className="whitespace-nowrap px-6 py-4">
              {FormatDecimal(parseInt(i.cyles_machine))} cycle{" / "}
              {i.runtime ? FormatDecimal(parseInt(i.runtime)) : 0} Menit
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
                onClick={() => {
                  formik.setFieldValue("id", i.id)
                  formik.setFieldValue("name", i.name)
                  formik.setFieldValue("ip", i.ip)
                  formik.setFieldValue("is_deleted", i.is_deleted)
                  formik.setFieldValue("outlet_id", i.outlet_id === null ? "null" : i.outlet_id)
                  formik.setFieldValue("default_duration", `${i.default_duration}`)
                  formik.setFieldValue("type", i.type)
                  formik.setFieldValue("machine_id", i.machine_id)

                  setModalForm(true);
                }}
              >
                <FiEdit size={23} />
              </button>
            </td>
          </tr>
        ))}

      </Table >

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
            <Breadcrumb pageName="Relay Machine" />
          </div>

          <div className="h-80 overflow-y-auto mt-4 p-2">
            <div className="flex flex-col space-y-8">
              <Input label={"Code*"} name={"machine_id"} id={"machine_id"}
                value={formik.values.machine_id}
                onChange={(v) => formik.setFieldValue("machine_id", v)}
                error={
                  formik.touched.machine_id && formik.errors.machine_id
                    ? formik.errors.machine_id
                    : null
                } />

              <Input label={"Name*"} name={"name"} id={"name"}
                value={formik.values.name}
                onChange={(v) => formik.setFieldValue("name", v)}
                error={
                  formik.touched.name && formik.errors.name
                    ? formik.errors.name
                    : null
                } />

              <Input label={"IP*"} name={"ip"} id={"ip"}
                value={formik.values.ip}
                onChange={(v) => formik.setFieldValue("ip", v)}
                error={
                  formik.touched.ip && formik.errors.ip
                    ? formik.errors.ip
                    : null
                } />

              <Input label={"Default Duration*"} type="number" name={"default_duration"} id={"default_duration"}
                value={formik.values.default_duration}
                onChange={(v) => formik.setFieldValue("default_duration", v)}
                error={
                  formik.touched.default_duration && formik.errors.default_duration
                    ? formik.errors.default_duration
                    : null
                } />

              <InputDropdown
                label={"Machin Type*"}
                name={"type"}
                id={"type"}
                value={formik.values.type}
                onChange={(v) => formik.setFieldValue("type", v)}
                options={Object.values(EMachineType).map(i => { return { label: i, value: i } })}
                error={
                  formik.touched.type && formik.errors.type
                    ? formik.errors.type
                    : null
                }
              />

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
        </div>
      </Modal>
    </div>
  )
}