
'use client';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { iSku, TypeProduct } from "@/types/product";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";

interface iModalProduct {
  showModal: boolean;
  coleModal: () => void;
  onSelected: (product: iSku) => void;
  isSelfService: boolean;
  outlet_id: string;
}

export function ModalProductComponent(props: iModalProduct) {
  const [items, setItems] = useState<TypeProduct[]>([])
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
      let urlwithQuery = `/api/product/outlet?outlet_id=${props.outlet_id}&page=${currentPage}&limit=${10}&is_self_service=${props.isSelfService}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/product/outlet?outlet_id=${props.outlet_id}&page=${currentPage}&limit=${10}&search=${fixValueSearch}&is_self_service=${props.isSelfService}`;
      }

      console.log(urlwithQuery);


      const res = await GetWithToken<iResponse<TypeProduct[]>>({
        router: router,
        url: urlwithQuery,
        token: `${access_token}`,
      })

      console.log(res);


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

  }, [props.showModal, access_token, router, currentPage, fixValueSearch, refresh, props.outlet_id, props.isSelfService])

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
            <Breadcrumb pageName={"Select Product"} />
            <div className="flex flex-row mb-4 space-x-4">
              <Input
                label={"Search"}
                name={"search"}
                id={"search"} value={search} onChange={(v) => setSearch(v)}
                error={null}
              />
              <button className="px-4 bg-blue-500 text-white rounded capitalize"
                onClick={handleSearch}>
                Search
              </button>
            </div>
            <div className="overflow-y-auto h-full">
              {!loadingSearch && (
                <Table
                  colls={["Code", "Name", "Price", "Washer", "Dryer", "Iron", "Description"]}
                  onPaginate={(page) => setCurrentPage(page)}
                  currentPage={currentPage}
                  totalItem={totalItem}>
                  {
                    items.map((item, k) => (
                      <React.Fragment key={k}>
                        <tr className="text-center border-b bg-gray-200 dark:bg-boxdark dark:border-gray-700">
                          <td colSpan={7} className="font-bold whitespace-nowrap px-6 py-4">{item.name}</td>
                        </tr>
                        {
                          item.skus.map((sku, i) => (
                            <tr key={i} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600 cursor-pointer"
                              onClick={() => props.onSelected(sku)}>
                              <td className="whitespace-nowrap px-6 py-4">{sku.code}</td>
                              <td className="whitespace-nowrap px-6 py-4">{sku.name}</td>
                              <td className="whitespace-nowrap px-6 py-4">{sku.outlet_price_skus.length >= 1 ? sku.outlet_price_skus[0].price : sku.price}</td>
                              <td className="px-6 py-4">
                                {
                                  sku.machine_washer ?
                                    <p className="text-green-500">{sku.washer_duration} Mnt</p> :
                                    <p className="text-red-500">None</p>
                                }
                              </td>
                              <td className="px-6 py-4">
                                {
                                  sku.dryer_duration ?
                                    <p className="text-green-500">{sku.dryer_duration} Mnt</p> :
                                    <p className="text-red-500">None</p>
                                }
                              </td>
                              <td className="px-6 py-4">
                                {
                                  sku.machine_iron ?
                                    <p className="text-green-500">Yes</p> :
                                    <p className="text-red-500">No</p>
                                }
                              </td>
                              <td className="px-6 py-4">{sku.description}</td>
                              {/* <td className="whitespace-nowrap px-6 py-4">{sku.price}</td>
                              <td className="whitespace-nowrap px-6 py-4">{sku.price}</td>
                              <td className="whitespace-nowrap px-6 py-4">{sku.price}</td> */}
                            </tr>
                          ))
                        }
                      </React.Fragment>
                    ))
                  }
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal >
  )
}