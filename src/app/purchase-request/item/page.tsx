'use client'
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { iDropdown, Input, InputDropdown, InputTextArea, InputToggle } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GET, GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { CategoryType } from "@/types/category";
import { Outlet } from "@/types/outlet";
import { EStatusPRs, PRItemType } from "@/types/PRItemType";
import { ERoles } from "@/types/Roles";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";


const BasicChartPage: React.FC = () => {
  const { auth } = useSelector((s: RootState) => s.auth)
  const [items, setItems] = useState<PRItemType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItem, setTotalItem] = useState<number>(0)
  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const credential = useSelector((s: RootState) => s.auth)
  const [outlets, setOutlets] = useState<iDropdown[]>([])
  const [category, setCategory] = useState<iDropdown[]>([]);
  const [status, setStatus] = useState<iDropdown[]>([])
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([])
  const router = useRouter()
  const [filterByStatus, setFilterByStatus] = useState<string>("all")

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

    async function GotAllCategory() {
      const res = await GET<iResponse<CategoryType[]>>({ url: "/api/category" })
      if (res?.statusCode === 200) {
        const categoryDropdown = res?.data.map(i => { return { value: i.id, label: i.name } })
        setCategory(categoryDropdown);
        if (categoryDropdown.length >= 1)
          formik.setFieldValue("category_id", categoryDropdown[0].value)
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }


    GotAllCategory();
    GotAllOutlet();
    const statusMaping = Object.values(EStatusPRs).map(i => { return { value: i, label: i } })
    setStatus(statusMaping)
  }, [])

  useEffect(() => {
    async function GotPRItems() {
      let urlwithQuery = `/api/pr?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/pr?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      let sttsFilter = {}
      if (filterByStatus !== "all") sttsFilter = { status: filterByStatus }

      console.log({ outlet_ids: filterByOutlet, ...sttsFilter });
      const res = await PostWithToken<iResponse<PRItemType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: { outlet_ids: filterByOutlet, ...sttsFilter }
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
    GotPRItems()


  }, [currentPage, fixValueSearch, refresh, credential.auth.access_token, filterByOutlet, filterByStatus])


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

  const [modal, setModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const formik = useFormik({
    initialValues: {
      id: null,
      name: "",
      slug: "",
      is_deleted: false,
      outlet_id: "",
      status: EStatusPRs.ACCEPTED,
      category_id: "",
      description: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().max(100, "Maksimal 100 karakter!").required("Nama diperlukan!"),
      slug: Yup.string().optional().max(100, "Maksimal 100 karakater!"),
      outlet_id: Yup.string().required("Outlet diperlukan!"),
      is_deleted: Yup.boolean().required("Status diperlukan!"),
      status: Yup.string().required("Status diperlukan!"),
      category_id: Yup.string().required("kategori diperlukan!"),
      description: Yup.string().optional().max(255, "Maksimal 225 karakter!"),
    }),
    onSubmit: async (values) => {

      if (loading) return
      setLoading(true)
      let idUpdate = {}
      if (values.id !== null) idUpdate = { id: values.id }


      const res = await PostWithToken<iResponse<PRItemType>>({
        router: router,
        url: "/api/pr/create-update",
        data: {
          ...idUpdate,
          name: values.name,
          slug: values.slug,
          is_deleted: values.is_deleted,
          outlet_id: values.outlet_id,
          status: values.status,
          category_id: values.category_id,
          description: values.description,
        },
        token: `${auth.access_token}`
      })

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        if (values.id === null) {
          setItems(old => [...old, res.data]);
        } else {
          setItems(prevItems =>
            prevItems.map(item =>
              item.id === res.data.id ? { ...item, ...res.data } : item
            )
          );
        }
        setModal(false);
        resetForm()
        toast.success("Berhasil menambahkan item");
      }

      setTimeout(() => setLoading(false), 1000)
    }
  })


  function resetForm() {
    formik.resetForm();
    if (category.length >= 1)
      formik.setFieldValue("category_id", category[0].value)

    if (outlets.length >= 1)
      formik.setFieldValue("outlet_id", outlets[0].value)

  }

  const [modalOutlet, setModalOutlet] = useState<boolean>(false)
  const [searchOutlet, setSearchOutlet] = useState<string>("")
  function filterOutlet() {
    if (searchOutlet.length >= 3)
      return outlets.filter(f => f.label.toLowerCase().includes(searchOutlet.toLowerCase()))
    return outlets

  }

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Purchase Request" />
      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
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
          <InputDropdown
            label={"Status"}
            name={"status"}
            id={"status"}
            value={filterByStatus}
            onChange={(v) => setFilterByStatus(v)}
            options={[...status, { label: "all", value: "all" }]}
            error={null}
          />

          <div className="flex-1 cursor-pointer" onClick={() => setModalOutlet(true)}>
            <div className="flex flex-row">
              <div className="w-full p-3 border-2 rounded-md relative">
                <label
                  className={`text-md  transition-all duration-500`}
                >
                  Filter By Outlet
                </label>
              </div>
            </div>
          </div>
          <button
            onClick={handleSearch}
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Cari
          </button>
          <button
            className={`${credential.role.name !== ERoles.PROVIDER && credential.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={() => setModal(true)}
          >
            Tambah Item
          </button>
        </div>
      </div>
      <div>
        <Table colls={["Nama", "Slug", "Outlet", "Status", "Req By", "Acc", "Aksi"]}
          onPaginate={(page) => setCurrentPage(page)}
          currentPage={currentPage}
          totalItem={totalItem}>
          {items.map((i, k) => (
            <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600"
              key={k}>
              <td className="whitespace-nowrap px-6 py-4">
                {i.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.slug && i.slug.length >= 1 ? i.slug : "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.outlet?.name}
                <span className="font-light">
                  {" "} ({i.outlet && i.outlet.city.split("--").length >= 2 ? i.outlet.city.split("--")[1] : i.outlet?.city})
                </span>
              </td>

              <td className="whitespace-nowrap px-6 py-4">
                {i.status}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.request_by}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.accept_by}
              </td>
              <td className="px-6 py-4 whitespace-nowrap space-x-4">
                <button
                  onClick={() => {
                    formik.setFieldValue("id", i.id)
                    formik.setFieldValue("name", i.name)
                    formik.setFieldValue("slug", i.slug === null ? "" : i.slug)
                    formik.setFieldValue("is_deleted", i.is_deleted)
                    formik.setFieldValue("outlet_id", i.outlet_id === null ? "null" : i.outlet_id)
                    formik.setFieldValue("status", i.status)
                    formik.setFieldValue("category_id", i.category_id)
                    formik.setFieldValue("description", i.description === null ? "" : i.description)
                    setModal(true);
                  }}
                >
                  <FiEdit size={23} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Modal isOpen={modal}>
        <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-min w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setModal(false)
              resetForm()
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName="Tambah Item" />
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

            <Input label={"Slug*"} name={"slug"} id={"slug"}
              value={formik.values.slug}
              onChange={(v) => formik.setFieldValue("slug", v)}
              error={
                formik.touched.slug && formik.errors.slug
                  ? formik.errors.slug
                  : null
              } />

            <InputDropdown
              label={"Kategori*"}
              name={"category"}
              id={"category"}
              value={formik.values.category_id}
              onChange={(v) => formik.setFieldValue("category_id", v)}
              options={category}
              error={
                formik.touched.category_id && formik.errors.category_id
                  ? formik.errors.category_id
                  : null
              }
            />

            <InputDropdown
              label={"Status*"}
              name={"status"}
              id={"status"}
              value={formik.values.status}
              onChange={(v) => formik.setFieldValue("status", v)}
              options={status}
              error={
                formik.touched.status && formik.errors.status
                  ? formik.errors.status
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
              label={"Activated"} />

            <InputTextArea
              label={"Deskripsi*"}
              name={"description"}
              id={"description"}
              value={formik.values.description}
              onChange={(v) => formik.setFieldValue("description", v)}
              options={outlets}
              error={
                formik.touched.description && formik.errors.description
                  ? formik.errors.description
                  : null
              } />
          </div>

          <button
            className={`${credential.role.name !== ERoles.PROVIDER && credential.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            w-full mt-5 justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={formik.submitForm}
          >
            Submit
          </button>
        </div>
      </Modal>

      <Modal isOpen={modalOutlet}>
        <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-[90vh] 
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
            <p className="font-semibold">Filter Berdasarkan Outlet</p>
          </div>

          <div className="p-2">
            <Input label={"Cari Outlet"} name={"search"} id={"search"}
              value={searchOutlet}
              onChange={(v) => {
                setSearchOutlet(v)
              }} error={null} />
          </div>
          <Table colls={["#", "Nama Outlet"]} currentPage={0} totalItem={1} onPaginate={() => null}>
            {filterOutlet().map((i, k) => (
              <tr
                className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                key={k}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <input type="checkbox" value={`${i.value}`}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilterByOutlet(old => [...old, e.target.value])
                      } else {
                        setFilterByOutlet(old => old.filter(f => f !== e.target.value))
                      }
                    }} />
                </td>
                <td className="whitespace-nowrap px-6 py-4">{i.label}</td>
              </tr>
            ))}
          </Table>
        </div>
      </Modal>
    </DefaultLayout>
  );
};

export default BasicChartPage;