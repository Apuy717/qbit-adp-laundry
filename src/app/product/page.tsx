"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FilterComponent } from "@/components/Filters/FilterComponent";
import { Input, InputDropdown, InputFile, InputTextArea, InputToggle } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Modal from "@/components/Modals/Modal";
import { FilterByOutletTableModal } from "@/components/Outlets/FilterByOutletTableModal";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { TypeProduct } from "@/types/product";
import { useFormik } from "formik";
import { url } from "inspector";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { FaArrowLeft, FaRegPlusSquare } from "react-icons/fa";
import { FiEdit, FiEye } from "react-icons/fi";
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
const CELLS = [
  "Nama",
  "Deskripsi",
  "Total SKU",
  "Dibuat Pada",
  "Status",
  "Aksi",
];

export default function Product() {
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [products, setProducts] = useState<TypeProduct[]>([])
  const [filterSkus, setfilterSkus] = useState<any>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [fixValueSearch, setFixValueSearch] = useState("")
  const [totalProduct, setTotalProduct] = useState<number>(0);
  const [modalProduct, setModalProduct] = useState<boolean>(false)
  const [modalForm, setModalForm] = useState<boolean>(false)
  const [isViewDetail, setIsViewDetail] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false);
  const [updateModal, setUpdateModal] = useState<boolean>(false)
  const [productOrSku, setProductOrSku] = useState<boolean>(false)
  const [updateOrAddSku, setUpdateOrAddSku] = useState<boolean>(false)

  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter()

  const serviceType = [
    {
      label: "",
      value: ""
    }, {
      label: "services",
      value: "services"
    }, {
      label: "goods",
      value: "goods"
    }
  ]


  useEffect(() => {
    const GotProduct = async () => {
      let urlwithQuery = `/api/product/filter?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/product/filter?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await PostWithToken<iResponse<TypeProduct[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
        data: {
          outlet_ids: filterByOutlet
        }
      });
      if (res?.statusCode === 200) {
        if (res.total) setTotalProduct(res.total)
        else setTotalProduct(0)
        setProducts(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    };
    GotProduct()

    console.log(products);
    // console.log(products[skusIdx].skus);
  }, [loading, currentPage, fixValueSearch, refresh, auth.auth.access_token, filterByOutlet, isViewDetail])

  const handleSearch = async () => {
    console.log(products);

    if (search.length === 0) {
      setCurrentPage(1);
      setProducts([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setProducts([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
    console.log(search);

  };


  const formik = useFormik({
    initialValues: {
      id: "",
      outlet_id: "",
      name: "",
      slug: "",
      picture: "",
      description: "",
      is_deleted: "",
      category_id: "",

      product_id: "",
      code: "",
      price: "",
      type: "services",
      stock: "",
      unit: "",
      machine_washer: false,
      washer_duration: 0,
      machine_dryer: false,
      dryer_duration: 0,
      machine_iron: false,
      iron_duration: 0,
    },
    validationSchema: Yup.object({
      outlet_id: Yup.string(),
      name: Yup.string().max(100, "Maksimal 225 karakter!"),
      slug: Yup.string().max(100, "Maksimal 225 karakter!"),
      description: Yup.string().max(100, "Maksimal 255 karakter!").optional(),
      category_id: Yup.string(),
      variants: Yup.array().of(
        Yup.object({
          code: Yup.string().max(100, "Maksimal 100 karakter!"),
          name: Yup.string().max(100, "Maksimal 100 karakter!"),
          description: Yup.string().max(100, "Maksimal 225 karakter!").optional(),
          price: Yup.number().min(0),
          type: Yup.string().max(100, "Maksimal 100 karakter!"),
          stock: Yup.string().max(100, "Maksimal 100 karakter!"),
          unit: Yup.string().max(100, "Maksimal 100 karakter!"),
          washer_duration: Yup.number().min(0),
          dryer_duration: Yup.number().min(0),
          iron_duration: Yup.number().min(0),
        })
      ),

    }),
    onSubmit: async (values) => {
      console.log(values);

      if (loading) return;
      setLoading(true);
      let res = null
      if (productOrSku) {
        res = await PostWithToken<MyResponse>({
          router: router,
          url: "/api/product/update-product",
          data: {
            id: values.id,
            outlet_id: values.outlet_id,
            name: values.name,
            picture: values.picture,
            slug: values.slug,
            description: values.description,
            is_deleted: values.is_deleted,
            category_id: values.category_id
          },
          token: `${auth.auth.access_token}`,
        });
      } else {
        if (updateOrAddSku) {
          res = await PostWithToken<MyResponse>({
            router: router,
            url: "/api/product/update-sku",
            data: {
              id: values.id,
              code: values.code,
              name: values.name,
              description: values.description,
              price: parseInt(values.price),
              type: values.type,
              stock: values.stock,
              unit: values.unit,
              machine_washer: values.machine_washer,
              washer_duration: values.washer_duration,
              machine_dryer: values.machine_dryer,
              dryer_duration: values.dryer_duration,
              machine_iron: values.machine_iron,
              iron_duration: values.iron_duration,
              is_deleted: values.is_deleted
            },
            token: `${auth.auth.access_token}`,
          });
        } else {
          res = await PostWithToken<MyResponse>({
            router: router,
            url: "/api/product/add-sku",
            data: {
              product_id: values.product_id,
              code: values.code,
              name: values.name,
              description: values.description,
              price: parseInt(values.price),
              type: values.type,
              stock: values.stock,
              unit: values.unit,
              machine_washer: values.machine_washer,
              washer_duration: values.washer_duration,
              machine_dryer: values.machine_dryer,
              dryer_duration: values.dryer_duration,
              machine_iron: values.machine_iron,
              iron_duration: values.iron_duration,
              is_deleted: values.is_deleted
            },
            token: `${auth.auth.access_token}`,
          });
        }

      }


      console.log(res.err);


      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Berhasil menambahkan data!");
        router.push("/product");
      }
      console.log(res.data);


      setLoading(false);
      setIsViewDetail(false)
      setUpdateModal(false);
    },
  });
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Product" />
      <FilterComponent
        search={search}
        setSearch={(e) => setSearch(e)}
        onClickFilterOutlet={() => setModalProduct(true)}
        handleSearch={handleSearch} >

        <button
          className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
            text-center font-edium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          onClick={() => {
            router.push("/product/create")
          }}
        >
          Tambah Product
        </button>

      </FilterComponent>

      <Table
        colls={CELLS}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        totalItem={totalProduct}>

        {products.map((prod, index) => (
          <tr key={index} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600">
            <td className="px-6 py-4">
              {prod.name}
            </td>
            <td className="px-6 py-4">
              {prod.description}
            </td>
            <td className="px-6 py-4">
              {prod.skus.length + " SKU"}
            </td>
            <td className="px-6 py-4">
              {new Date(prod.created_at).toLocaleString("id", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </td>
            <td className="px-6 py-4">
              {prod.is_deleted ? (
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
              <div className=" flex flex-row items-center space-x-2">
                <button
                  className="cursor-pointer"
                  onClick={() => {
                    setIsViewDetail(true)
                    const filter = products.filter((f: any) => f.id == prod.id)
                    setfilterSkus(filter[0].skus);
                  }}
                >
                  <FiEye size={18} />
                </button>
                <button
                  onClick={() => {
                    formik.setFieldValue("id", prod.id)
                    formik.setFieldValue("outlet_id", prod.outlet_id)
                    formik.setFieldValue("name", prod.name)
                    formik.setFieldValue("slug", prod.slug)
                    formik.setFieldValue("description", prod.description == null ? `` : prod.description)
                    formik.setFieldValue("category_id", prod.category_id)
                    formik.setFieldValue("is_deleted", prod.is_deleted)
                    setUpdateModal(true)
                    setProductOrSku(true)
                  }}
                >
                  <FiEdit size={18} />
                </button>
                <button
                  onClick={() => {
                    console.log("product_id ", prod.id);

                    formik.setFieldValue("product_id", prod.id)
                    formik.setFieldValue("is_deleted", false)
                    setProductOrSku(false)
                    setUpdateOrAddSku(false)
                    setUpdateModal(true)
                  }}>
                  <FaRegPlusSquare size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <FilterByOutletTableModal modalOutlet={modalProduct}
        closeModal={(isOpen) => setModalProduct(isOpen)}
        setFilterByOutlet={(isChecked, value) => {
          if (isChecked) {
            setFilterByOutlet(old => [...old, value])
          } else {
            setFilterByOutlet(old => old.filter(f => f !== value))
          }
        }} />

      <div className={`w-min h-full fixed right-0 top-0 z-[9999] overflow-y-auto
        transition-all duration-500 shadow bg-white dark:bg-boxdark
        ${isViewDetail ? "" : "translate-x-full"}`}>
        <div className="p-4 bg-white dark:bg-boxdark shadow">
          <button onClick={() => setIsViewDetail(false)}>
            <FaArrowLeft size={20} />
          </button>
        </div>
        <div className="mt-4 p-4">
          <h3 className="mb-4 text-2xl font-semibold text-black dark:text-white">
            Product SKU
          </h3>
        </div>

        <div className="px-4">
          <p className="text-lg font-semibold text-black dark:text-white">
            Item
          </p>
          <Table colls={["#", "Kode", "Nama", "Harga", "Kuantitas", "Pencuci", "Pengering", "Setrika", "Deskripsi", "Aksi"]} currentPage={0} totalItem={0} onPaginate={function (page: number): void {
            throw new Error("Function not implemented.");
          }}>
            {filterSkus.map((i: any, k: any) => (
              <tr key={k}>
                <td className="px-6 py-4">
                  {k + 1}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.code}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.price}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.stock + ' ' + i.unit}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_washer ? (
                    <div className="px-0 bg-green-500 rounded-xl text-center max-w-14 ">
                      <p className="text-white">{`${i.washer_duration}`} Mnt</p>
                    </div>
                  ) : (
                    <div className="px-2 bg-red-500 rounded-xl text-center max-w-14">
                      <p className="text-white">Tidak</p>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_dryer ? (
                    <div className="px-0 bg-green-500 rounded-xl text-center max-w-14 ">
                      <p className="text-white">{`${i.dryer_duration}`} Mnt</p>
                    </div>
                  ) : (
                    <div className="px-2 bg-red-500 rounded-xl text-center max-w-14">
                      <p className="text-white">Tidak</p>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_iron ? (
                    <div className="px-0 bg-green-500 rounded-xl text-center max-w-14 ">
                      <p className="text-white">{`${i.iron_duration}`} Mnt</p>
                    </div>
                  ) : (
                    <div className="px-2 bg-red-500 rounded-xl text-center max-w-14">
                      <p className="text-white">Tidak</p>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.description}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <button
                    className="cursor-pointer pl-4"
                    onClick={() => {
                      formik.setFieldValue("id", i.id)
                      formik.setFieldValue("code", i.code)
                      formik.setFieldValue("name", i.name)
                      formik.setFieldValue("description", i.description == null ? `` : i.description)
                      formik.setFieldValue("price", i.price)
                      formik.setFieldValue("type", i.type)
                      formik.setFieldValue("stock", i.stock)
                      formik.setFieldValue("unit", i.unit)
                      formik.setFieldValue("machine_washer", i.machine_washer)
                      formik.setFieldValue("washer_duration", parseInt(i.washer_duration))
                      formik.setFieldValue("machine_dryer", i.machine_dryer)
                      formik.setFieldValue("dryer_duration", parseInt(i.dryer_duration))
                      formik.setFieldValue("machine_iron", i.machine_iron)
                      formik.setFieldValue("is_deleted", i.is_deleted)
                      setUpdateModal(true)
                      setUpdateOrAddSku(true)
                      setProductOrSku(false)
                    }}
                  >
                    <FiEdit size={18} />
                  </button>
                </td>
              </tr>
            ))}

          </Table>
        </div>
      </div>

      <Modal isOpen={updateModal}>
        {productOrSku ? (
          <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-min w-[90%] md:w-[50%] p-4">
            <div
              className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
              onClick={() => {
                setUpdateModal(false)
                // resetForm()
              }}
            >
              <IoCloseOutline color="white" size={20} />
            </div>

            <div className="flex flex-col space-y-8">
              <Breadcrumb pageName={productOrSku ? `Update Product` : `Update SKU`} />
            </div>

            <div className="">
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
                <Input
                  label={"Nama*"}
                  name={"name"}
                  id={"name"}
                  value={formik.values.name}
                  onChange={(v) => formik.setFieldValue("name", v)}
                  error={
                    formik.touched.name && formik.errors.name
                      ? formik.errors.name
                      : null
                  }
                />
                <Input
                  label={"slug*"}
                  name={"slug"}
                  id={"slug"}
                  value={formik.values.slug}
                  onChange={(v) => formik.setFieldValue("slug", v)}
                  error={
                    formik.touched.slug && formik.errors.slug
                      ? formik.errors.slug
                      : null
                  }
                />

                <InputFile
                  label={""}
                  name={""}
                  id={""}
                  onChange={function (e: ChangeEvent<HTMLInputElement>): void {
                    throw new Error("Function not implemented.");
                  }}
                  error={null}>
                </InputFile>

                <InputToggle
                  value={!formik.values.is_deleted}
                  onClick={(v) => formik.setFieldValue("is_deleted", !v)}
                  label={"Status"}
                />
              </div>
              <div className="pt-6">
                <InputTextArea
                  label={"Deskripsi Produk"}
                  name={"description"}
                  id={"description"}
                  value={formik.values.description}
                  onChange={(v) => formik.setFieldValue("description", v)}
                  error={
                    formik.touched.description && formik.errors.description
                      ? formik.errors.description
                      : null
                  }
                />
              </div>

              <button
                onClick={formik.submitForm}
                className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-min w-[90%] md:w-[50%] p-4">
            <div
              className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
              onClick={() => {
                setUpdateModal(false)
                // resetForm()
              }}
            >
              <IoCloseOutline color="white" size={20} />
            </div>

            <div className="flex flex-col space-y-8">
              <Breadcrumb pageName={productOrSku ? `Update Product` : `Update SKU`} />
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
              <Input
                label={"Kode SKU*"}
                name={"code"}
                id={"code"}
                value={formik.values.code}
                onChange={(v) => formik.setFieldValue(`code`, v)}
                error={formik.touched.code &&
                  (typeof formik.errors.code === 'object' && formik.errors.code)
                  ? formik.errors.code
                  : null} />
              <Input
                label={"Nama SKU*"}
                name={"name"}
                id={"name"}
                value={formik.values.name}
                onChange={(v) => formik.setFieldValue(`name`, v)}
                error={formik.touched.name &&
                  (typeof formik.errors.name === 'object' && formik.errors.name)
                  ? formik.errors.name
                  : null} />

              <Input
                label={"Harga*"}
                name={"price"}
                id={"price"}
                value={formik.values.price}
                onChange={(v) => formik.setFieldValue(`price`, parseInt(v))}
                error={formik.touched.price &&
                  (typeof formik.errors.price === 'object' && formik.errors.price)
                  ? formik.errors.price
                  : null} />

              <InputDropdown
                label={"Tipe*"}
                name={"type"}
                id={"type"}
                value={formik.values.type}
                onChange={(v) => formik.setFieldValue(`type`, v)}
                options={serviceType}
                error={formik.touched.type &&
                  (typeof formik.errors.type === 'object' && formik.errors.type)
                  ? formik.errors.type
                  : null} />
              <Input
                className={formik.values.type}
                label={"Stok*"}
                name={"stock"}
                id={"stock"}
                value={formik.values.stock}
                onChange={(v) => formik.setFieldValue(`stock`, parseInt(v))}
                error={formik.touched.stock &&
                  (typeof formik.errors.stock === 'object' && formik.errors.stock)
                  ? formik.errors.stock
                  : null} />
              <Input
                label={"Unit*"}
                name={"unit"}
                id={"unit"}
                value={formik.values.unit}
                onChange={(v) => formik.setFieldValue(`unit`, v)}
                error={formik.touched.unit &&
                  (typeof formik.errors.unit === 'object' && formik.errors.unit)
                  ? formik.errors.unit
                  : null} />
            </div><div className="pt-6">
              <InputTextArea
                label={"Deskripsi SKU"}
                name={"description"}
                id={"description"}
                value={formik.values.description}
                onChange={(v) => formik.setFieldValue(`description`, v)}
                error={formik.touched.description &&
                  (typeof formik.errors.description === 'object' && formik.errors.description)
                  ? formik.errors.description
                  : null} />
            </div><div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2 pt-4">
              <InputToggle
                value={formik.values.machine_washer}
                onClick={(v) => {
                  formik.setFieldValue(`machine_washer`, v);
                }}
                label={"Mesin Cuci"} />
              <Input
                className={formik.values.machine_washer ? `` : `opacity-0 w-1`}
                label={formik.values.machine_washer ? "Durasi mesin cuci*" : ""}
                name={"washer_duration"}
                id={"washer_duration"}
                value={`${formik.values.washer_duration ? formik.values.washer_duration : ""}`}
                onChange={(v) => formik.setFieldValue(`washer_duration`, parseInt(v))}
                error={formik.touched.washer_duration &&
                  (typeof formik.errors.washer_duration === 'object' && formik.errors.washer_duration)
                  ? formik.errors.washer_duration
                  : null} />
              <InputToggle
                value={formik.values.machine_dryer}
                onClick={(v) => {
                  formik.setFieldValue(`machine_dryer`, v);
                }}
                label={"Mesin Pengering"} />
              <Input
                className={formik.values.machine_dryer ? `` : `opacity-0 w-1`}
                label={formik.values.machine_dryer ? "Durasi mesin pengering*" : ""}
                name={"dryer_duration"}
                id={"dryer_duration"}
                value={formik.values.dryer_duration ? formik.values.dryer_duration : ``}
                onChange={(v) => formik.setFieldValue(`dryer_duration`, parseInt(v))}
                error={formik.touched.dryer_duration &&
                  (typeof formik.errors.dryer_duration === 'object' && formik.errors.dryer_duration)
                  ? formik.errors.dryer_duration
                  : null} />
              <InputToggle
                value={formik.values.machine_iron}
                onClick={(v) => {
                  formik.setFieldValue(`machine_iron`, v);
                }}
                label={"Setrika"} />
              <Input
                className={formik.values.machine_iron ? `` : `opacity-0 w-1`}
                label={formik.values.machine_iron ? "Durasi Setrika*" : ""}
                name={"iron_duration"}
                id={"iron_duration"}
                value={formik.values.iron_duration}
                onChange={(v) => formik.setFieldValue(`iron_duration`, parseInt(v))}
                error={formik.touched.iron_duration &&
                  (typeof formik.errors.iron_duration === 'object' && formik.errors.iron_duration)
                  ? formik.errors.iron_duration
                  : null} />

            </div>
            <button
              onClick={formik.submitForm}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
              Simpan
            </button>
          </div>
        )}
      </Modal>

    </DefaultLayout >
  );
}
