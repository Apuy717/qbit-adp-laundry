"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Table from "@/components/Tables/Table";
import { GetWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { useSelector } from "react-redux";

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  total: number;
  err: string | string[];
}

export default function OutletPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const auth = useSelector((s: RootState) => s.auth);
  const [totalOutlet, setTotalOutlet] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const CELLS = [
    "Nama",
    "Email",
    "No. Hp",
    "Alamat",
    "Lokasi",
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

    GotOutlets();
  }, [currentPage, fixValueSearch, refresh, auth.auth.access_token]);

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

  return (
    <>
      <Breadcrumb pageName="Outlet" />
      <div className="w-full bg-white dark:bg-black p-4 mb-4 rounded-t">
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
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Cari
          </button>
          <Link
            href={"/outlet/create"}
            className={`${auth.role.name !== ERoles.PROVIDER && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white 
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Buat Outlet
          </Link>
        </div>
      </div>

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
            <td className="px-6 py-4">{i.email}</td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.dial_code} {i.phone_number}
            </td>
            <td className="px-6 py-4">
              {i.address} {" "}
              {i.district.split("--").length >= 2 ? i.district.split("--")[1] : i.district},{" "}
              {i.city.split("--").length >= 2 ? i.city.split("--")[1] : i.city},{" "}
              {i.province.split("--").length >= 2 ? i.province.split("--")[1] : i.province},{" "}
              {i.postal_code}
            </td>
            <td className="px-6 py-4">
              {i.latitude} {i.longitude}
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
              <button
                onClick={() => {
                  router.push(`/outlet/${i.id}`);
                }}
              >
                <FiEdit size={23} />
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
