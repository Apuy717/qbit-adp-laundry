"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Table from "@/components/Tables/Table";
import { GetWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiEdit, FiEye } from "react-icons/fi";
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
  const [search, setSearch] = useState<string>("");
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [products, setProducts] = useState<any>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [fixValueSearch, setFixValueSearch] = useState("")
  const [totalProduct, setTotalProduct] = useState<number>(0);

  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter()
  useEffect(() => {
    const GotProduct = async () => {
      let urlwithQuery = `/api/product?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/product?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      if (res?.statusCode === 200) {
        setTotalProduct(res.total)
        setProducts(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    };
    GotProduct()
    console.log(products);
  }, [currentPage, fixValueSearch, refresh, auth.auth.access_token])

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
      <div className="flex flex-row items-center space-x-2 pb-4">
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
        <button
          onClick={handleSearch}
          className={` inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
        >
          Cari
        </button>
        <Link
          href={"/product/create"}
          className="inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          Buat Product
        </Link>
      </div>

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
                    router.push(`/product/${prod.id}`);
                  }}
                >
                  <FiEdit size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </DefaultLayout >
  );
}
