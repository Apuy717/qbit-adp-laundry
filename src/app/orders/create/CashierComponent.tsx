
'use client';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { Employee } from "@/types/employee";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";

interface iModalCashier {
  showModal: boolean;
  coleModal: () => void;
  onSelected: (cashier: Employee) => void;
  outletId: string | null
}


export function ModalCashierComponent(props: iModalCashier) {
  const [items, setItems] = useState<Employee[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItem, setTotalItem] = useState<number>(1)
  const router = useRouter()
  const { access_token } = useSelector((s: RootState) => s.auth.auth)
  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);

  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  useEffect(() => {
    if (!props.showModal) return

    async function GotItems() {
      let urlwithQuery = `/api/auth/employee?page=${currentPage}&limit=${10}&outlet_id=${props.outletId}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/auth/employee?page=${currentPage}&limit=${10}&search=${fixValueSearch}&outlet_id=${props.outletId}`;
      }
      const res = await GetWithToken<iResponse<Employee[]>>({
        url: urlwithQuery,
        router: router,
        token: `${access_token}`
      })

      if (res.statusCode === 200) {
        setItems(res.data)
        if (res.total)
          setTotalItem(res.total)
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    GotItems()

  }, [props.showModal, access_token, router, currentPage, fixValueSearch, refresh, props.outletId])

  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setItems([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1 && fixValueSearch !== search) {
        setItems([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  return (
    <Modal isOpen={props.showModal}>
      <div className="h-screen w-full flex items-center justify-center">
        <div className="relative p-7 bg-white dark:bg-gray-800 shadow rounded-md 
      h-[80%] w-[95%] md:h-[90%] md:w-[70%]">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setSearch("");
              setFixValueSearch("");
              setLoadingSearch(false);
              props.coleModal()
            }
            }
          >
            <IoCloseOutline color="white" size={20} />
          </div>
          <div className="h-[80%]">
            <Breadcrumb pageName={"Select Cashier"} />
            <div className="flex flex-row mb-4 space-x-4">
              <Input
                label={"Search"}
                name={"search"}
                id={"search"} value={search} onChange={(v) => setSearch(v)}
                error={null}
              />
              <button className="px-4 bg-blue-500 text-white rounded uppercase"
                onClick={handleSearch}>
                Search
              </button>
            </div>
            <div className="overflow-y-auto h-full">
              {!loadingSearch && (
                <Table
                  colls={["#", "Full Name", "Phone Number", "Department"]}
                  onPaginate={(page) => setCurrentPage(page)}
                  currentPage={currentPage}
                  totalItem={totalItem}>
                  {items.map((i, k) => (
                    <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => {
                        setSearch("");
                        setFixValueSearch("");
                        setLoadingSearch(false);
                        props.onSelected(i);

                      }}
                      key={k}>
                      <td className="whitespace-nowrap px-6 py-4">
                        {k + 1}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {i.fullname}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {i.dial_code} {i.phone_number}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {i.department}
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}