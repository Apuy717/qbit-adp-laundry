"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FilterComponent } from "@/components/Filters/FilterComponent";
import { Input } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Modal from "@/components/Modals/Modal";
import { FilterByOutletTableModal } from "@/components/Outlets/FilterByOutletTableModal";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { TypeProduct } from "@/types/product";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiEdit, FiEye } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";

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
  "Status",
  "Action",
];

export default function Product() {
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [products, setProducts] = useState<any>([])
  const [skusIdx, setSkusIdx] = useState<number>(0)
  const [skus, setSkus] = useState<any>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [fixValueSearch, setFixValueSearch] = useState("")
  const [totalProduct, setTotalProduct] = useState<number>(0);
  const [modalProduct, setModalProduct] = useState<boolean>(false)
  const [modalForm, setModalForm] = useState<boolean>(false)
  const [isViewDetail, setIsViewDetail] = useState<boolean>(false)
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter()


  useEffect(() => {
    const GotProduct = async () => {
      let urlwithQuery = `/api/product/filter?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/product/filter?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await PostWithToken<iResponse<TypeProduct>>({
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
        products[skusIdx].skus && setSkus(products[skusIdx].skus);

      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    };
    GotProduct()

    console.log(products);
    // console.log(products[skusIdx].skus);
  }, [currentPage, fixValueSearch, refresh, auth.auth.access_token, filterByOutlet, isViewDetail])

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

        {products.map((prod: any, index: any) => (
          <tr key={index}>
            <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
              <h5 className="font-medium text-black dark:text-white">
                {prod.name}
              </h5>
            </td>
            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
              <p className="text-black dark:text-white">
                {prod.description}
              </p>
            </td>
            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
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
            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
              <div className="w-1/2">
                <button
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(`/product/detail/${prod.id}`);
                  }}
                >
                  <FiEye size={18} />
                </button>
                <button
                  className="cursor-pointer pl-4"
                  onClick={() => {
                    setIsViewDetail(true)
                    setSkusIdx(index)
                  }}
                >
                  <FiEdit size={18} />
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

      <div className={`w-min h-full fixed right-0 top-0 z-[999]
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
          <Table colls={["#", "Kode", "Nama", "Harga", "Kuantitas", "Mesin cuci", "Pengering", "Setrika", "Deskripsi", "Action"]} currentPage={0} totalItem={0} onPaginate={function (page: number): void {
            throw new Error("Function not implemented.");
          }}>
            {skus.map((i: any, k: any) => (
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
                  {i.stock}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_washer}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_dryer}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_iron}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.description}
                </td>

              </tr>
            ))}

          </Table>
        </div>
      </div>

    </DefaultLayout >
  );
}
