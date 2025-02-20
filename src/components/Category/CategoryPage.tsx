"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GET, GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { CategoryType } from "@/types/category";
import { Outlet } from "@/types/outlet";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { Input, InputDropdown, InputToggle } from "../Inputs/InputComponent";
import Modal from "../Modals/Modal";
import Table from "../Tables/Table";

const CategoryPage: React.FC = () => {
  const { auth } = useSelector((s: RootState) => s.auth)
  const [category, setCategory] = useState<CategoryType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCategory, setTotalCategory] = useState<number>(0)
  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [createOrUpdate, setCreateOrUpdate] = useState<boolean>(true)
  const credential = useSelector((s: RootState) => s.auth)
  const [outlets, setOutlets] = useState<{ value: string | null, label: string }[]>([{ value: "null", label: "All" }])

  const router = useRouter()

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
        setOutlets((old) => old.concat(outletMaping))
      }
    }

    GotAllOutlet()
  }, [router, auth.access_token])

  useEffect(() => {
    async function GotAllCategory() {
      let urlwithQuery = `/api/category?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/category?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await GET<iResponse<CategoryType[]>>({ url: urlwithQuery })
      if (res?.statusCode === 200) {
        if (res.total)
          setTotalCategory(res.total);
        setCategory(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    GotAllCategory()
  }, [currentPage, fixValueSearch, refresh, credential.auth.access_token])


  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setCategory([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setCategory([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  const [modal, setModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const formikCategory = useFormik({
    initialValues: {
      id: null,
      name: "",
      // slug: "",
      is_deleted: false,
      outlet_id: "null"
    },
    validationSchema: Yup.object({
      name: Yup.string().max(100, "Maksimal 100 karakter!").required("Nama diperlukan!"),
      // slug: Yup.string().optional().max(100, "Maksimal 100 karakater!"),
      outlet_id: Yup.string().optional(),
      is_deleted: Yup.boolean().required("Status diperlukan!")
    }),
    onSubmit: async (values) => {
      if (loading) return
      setLoading(true)
      let updateId = {}
      if (values.id !== null) updateId = { id: values.id }
      const res = await PostWithToken<iResponse<CategoryType>>({
        router: router,
        url: "/api/category/create-update",
        data: {
          ...updateId,
          name: values.name,
          // slug: values.slug.length >= 1 ? values.slug : null,
          is_deleted: values.is_deleted,
          outlet_id: values.outlet_id === "null" ? null : values.outlet_id
        },
        token: `${auth.access_token}`
      })

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formikCategory.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        if (values.id === null) {
          setCategory(old => [...old, res.data]);
        } else {
          setCategory(prevItems =>
            prevItems.map(item =>
              item.id === res.data.id ? { ...item, ...res.data } : item
            )
          );
        }
        setModal(false);
        formikCategory.resetForm();
        toast.success("Add data success!");
      }

      setTimeout(() => setLoading(false), 1000)
    }
  })

  return (
    <div className="min-h-screen">
      <Breadcrumb pageName="Category" />
      <div className="w-full bg-white p-4 mb-4 rounded-t dark:bg-boxdark">
        <div className="lg:flex lg:flex-row lg:space-y-0 lg:space-x-2 items-center space-x-0 space-y-4">
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
            className={`inline-flex items-center justify-center rounded-md bg-black px-0 py-3 w-full lg:w-auto
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8`}
          >
            Search
          </button>
          <button
            className={`${credential.role.name !== ERoles.PROVIDER && credential.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-0 py-3 text-center font-medium text-white w-full lg:w-auto
            hover:bg-opacity-90 lg:px-8`}
            onClick={
              () => {
                setModal(true)
                setCreateOrUpdate(true)
              }
            }
          >
            Add Kategori
          </button>
        </div>
      </div>
      <div>
        <Table colls={["Name",  "Outlet", "Status", "Action"]}
          onPaginate={(page) => setCurrentPage(page)}
          currentPage={currentPage}
          totalItem={totalCategory}>
          {category.map((i, k) => (
            <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600"
              key={k}>
              <td className="whitespace-nowrap px-6 py-4">
                {i.name}
              </td>
              {/* <td className="whitespace-nowrap px-6 py-4">
                {i.slug && i.slug.length >= 1 ? i.slug : "-"}
              </td> */}
              <td className="whitespace-nowrap px-6 py-4">
                {i.outlet_id && i.outlet_id.length >= 1 ? outlets.find(f => f.value === i.outlet_id)?.label : "general"}
              </td>

              <td className="whitespace-nowrap px-6 py-4">
                {i.is_deleted ? (
                  <div className="px-2 w-min bg-red-500 rounded-xl text-center">
                    <p className="text-white">inactive</p>
                  </div>
                ) : (
                  <div className="px-2 w-min bg-green-500 rounded-xl text-center">
                    <p className="text-white">active</p>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap space-x-4">
                <div className="relative group">

                  <button
                    onClick={() => {
                      formikCategory.setFieldValue("id", i.id)
                      formikCategory.setFieldValue("name", i.name)
                      // formikCategory.setFieldValue("slug", i.slug === null ? "" : i.slug)
                      formikCategory.setFieldValue("is_deleted", i.is_deleted)
                      formikCategory.setFieldValue("outlet_id", i.outlet_id === null ? "null" : i.outlet_id)
                      setCreateOrUpdate(false)
                      setModal(true);
                    }}
                  >
                    <FiEdit size={23} />
                  </button>
                  <div className="absolute opacity-85 bottom-[70%] transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1">
                    Edit Category
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Modal isOpen={modal}>
        <div className="relative bg-white dark:bg-gray-800 shadow rounded-md h-min 
        md:h-min w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setModal(false)
              formikCategory.resetForm()
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={createOrUpdate ? `Add category` : `Edit Category`} />
          </div>
          <div className="flex flex-col space-y-8">
            <Input label={"Name*"} name={"name"} id={"name"}
              value={formikCategory.values.name}
              onChange={(v) => formikCategory.setFieldValue("name", v)}
              error={
                formikCategory.touched.name && formikCategory.errors.name
                  ? formikCategory.errors.name
                  : null
              } />

            {/* <Input label={"Slug*"} name={"slug"} id={"slug"}
              value={formikCategory.values.slug}
              onChange={(v) => formikCategory.setFieldValue("slug", v)}
              error={
                formikCategory.touched.slug && formikCategory.errors.slug
                  ? formikCategory.errors.slug
                  : null
              } /> */}

            <InputDropdown
              label={"Outlet*"}
              name={"outlet_od"}
              id={"outlet_od"}
              value={formikCategory.values.outlet_id}
              onChange={(v) => formikCategory.setFieldValue("outlet_id", v)}
              options={outlets}
              error={
                formikCategory.touched.outlet_id && formikCategory.errors.outlet_id
                  ? formikCategory.errors.outlet_id
                  : null
              }
            />

            <InputToggle
              value={!formikCategory.values.is_deleted}
              onClick={(v) => formikCategory.setFieldValue("is_deleted", !v)}
              label={"Status"} />
          </div>

          <button
            className={`${credential.role.name !== ERoles.PROVIDER && credential.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            w-full mt-5 justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={formikCategory.submitForm}
          >
            Submit
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryPage;
