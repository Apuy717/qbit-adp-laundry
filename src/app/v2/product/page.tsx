'use client';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { CiCircleAlert } from "react-icons/ci";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const PrintButton = dynamic(() => import("../../../components/Button/ButtonPrint"), {
  ssr: false,
});

export default function ProductV2Page() {
  const [data, setData] = useState<GroupedLaundryData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const router = useRouter()
  const { access_token } = useSelector((s: RootState) => s.auth.auth);

  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext);
  function FormatIDR(number: string) {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR",
    }).format(parseInt(number));

    return `Rp. ${result}`;
  }

  useEffect(() => {
    async function GotData() {
      let urlwithQuery = `/api/v2/product/got-product`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/v2/product/got-product?search=${fixValueSearch}`;
      }
      const res = await PostWithToken<iResponse<GroupedLaundryData[]>>({
        router: router,
        url: urlwithQuery,
        token: `${access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : defaultSelectedOutlet.map((o) => o.outlet_id),
        }
      })

      if (res.statusCode === 200) {
        setData(res.data);
        if (typeof res.total === "number")
          setTotal(res.total)
      }
    }

    if (!modal)
      GotData();
  }, [access_token, refresh, defaultSelectedOutlet, fixValueSearch, modal, router, selectedOutlets]);



  const handleSearch = async () => {
    if (search.length === 0) {
      setData([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1 && fixValueSearch !== search) {
        setData([]);
        setLoadingSearch(true);
        setFixValueSearch(search);

      }
    }
  };

  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deletePayload, setDeletePayload] = useState<{ skuId: string; isDeleted: boolean } | undefined>(undefined)

  function DeleteData(skuId: string, isDeleted: boolean) {
    setDeleteModal(true);
    setDeletePayload({ skuId: skuId, isDeleted: isDeleted });
  }

  function CancelDeleteData() {
    setDeleteModal(false);
    setDeletePayload(undefined);
  }

  async function HandleDelete() {
    if (!deletePayload) {
      toast.warn("Failed, try again!");
      return
    }

    const res = await PostWithToken<iResponse<{ id: string, is_deleted: boolean }>>({
      router: router,
      url: "/api/product/remove-sku",
      token: `${access_token}`,
      data: {
        sku_id: deletePayload.skuId,
        is_deleted: deletePayload.isDeleted
      }
    });
    if (res.statusCode === 200) {
      if (!deletePayload.isDeleted)
        toast("Success restore data")
      else
        toast("Success delete data")
      handleSearch();
      setDeleteModal(false)
    }
  }

  function FilterData() {
    if (search.length >= 3) {
      return data.filter(f => {
        const productMatch = f.product.toLowerCase().includes(search.toLowerCase());
        const skuMatch = f.skus?.some(s => s.name.toLowerCase().includes(search.toLowerCase()));
        return productMatch || skuMatch;
      });
    }
    return data;
  }

  return (
    <div>
      <Breadcrumb pageName="SKU (stock keeping unit)" />
      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="flex w-full flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
          <div className="w-full md:w-96">
            <Input
              label={"Search"}
              name={"search"}
              id={"search"}
              value={search}
              onChange={(v) => setSearch(v)}
              error={null}
              onEnter={handleSearch}
            />
          </div>
          <button
            onClick={handleSearch}
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <div className="w-min">
            <PrintButton />
          </div>

        </div>
      </div>
      <div id="printable">
        {/* detail data */}
        <div className="bg-white dark:bg-boxdark shadow rounded-lg">
          <div className="pl-4 pt-4">
            <div className="text-blue-600 font-semibold">Total Sku {total} items</div>
          </div>
          {FilterData().map((p, idx) => (
            <div key={idx} className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {/* <input type="checkbox" /> */}
                  <div>
                    <p className="font-semibold">{p.product}</p>
                    <p className="text-sm text-gray-500">total {p.total_items} items</p>
                  </div>
                </div>
                <div>
                  {
                    selectedOutlets.length >= 1 ?
                      <p className="text-sm text-gray-500">Selected Outlet {selectedOutlets.length}</p> :
                      <p className="text-sm text-gray-500">All Outlets</p>
                  }
                </div>
              </div>
              <div className="border-l-2 border-blue-500 relative">

                <div className="relative pl-2">
                  {/* <p className="font-semibold text-sm ml-4" style={{ marginBottom: '0.5rem' }}>{p.product}</p> */}
                  <div className="absolute bottom-2 -left-0.5 -rotate-2 w-4 h-4 border-l-2 border-b-2 border-blue-500 rounded-bl-md" />
                  <div className="overflow-x-auto border-l-2 border-blue-500 ml-4">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Code</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Outlet</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Description</th>
                          <th className="p-2 whitespace-nowrap">Created by</th>
                          <th className="p-2 whitespace-nowrap">Updated by</th>
                          {/* <th className="p-2">Action</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {p.skus.map((sku, key) => {
                          return (
                            <tr key={key} className={`border-b border-gray-200 dark:border-gray-700`}>
                              <td className="p-4">{key + 1}</td>
                              <td className="p-2">{sku.code}</td>
                              <td className="p-2">{sku.name}</td>
                              {sku.outlet_price_skus.length >= 1 ? sku.outlet_price_skus.map((price, keyPrice) => (
                                <td key={keyPrice} className="p-2 flex flex-col space-y-1 relative">
                                  <p className="p-1">{FormatIDR(sku.price)} <span className="text-xs"> - General</span></p>
                                  <p className="p-1">{FormatIDR(price.price)} <span className="text-xs"> - {price.outlet.name}</span></p>
                                </td>
                              )) : (
                                <td className="p-2 flex flex-col space-y-1 relative">
                                  <p className="p-1">{FormatIDR(sku.price)} <span className="text-xs"> - General</span></p>
                                </td>
                              )}
                              <td className={`p-2`}>{sku.outlet === null ? "All" : sku.outlet.name}</td>
                              <td className={`p-2`}>
                                {
                                  sku.is_deleted ?
                                    <button className="bg-red-500 px-2 text-white rounded" onClick={() => DeleteData(sku.id, !sku.is_deleted)}>deleted</button> :
                                    <button className="bg-green-500 px-2 text-white rounded" onClick={() => DeleteData(sku.id, !sku.is_deleted)}>active</button>
                                }
                              </td>
                              <td className={`p-2`}>{sku.description.length >= 1 ? sku.description : "-"}</td>
                              <td className={`p-2 whitespace-nowrap`}>{
                                sku.sku_creator ? sku.sku_creator.fullname : "-"}
                                <p className="text-xs text-gray-500">
                                  {sku.sku_creator ? `${sku.sku_creator.dial_code} ${sku.sku_creator.phone_number}` : ""}
                                </p>
                              </td>
                              <td className={`p-2 whitespace-nowrap`}>{
                                sku.sku_updater ? sku.sku_updater.fullname : "-"}
                                <p className="text-xs text-gray-500">
                                  {sku.sku_updater ? `${sku.sku_updater.dial_code} ${sku.sku_updater.phone_number}` : ""}
                                </p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* modal delete */}
      <Modal isOpen={deleteModal}>
        <div className="relative h-min w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-fit">
          <div className="flex w-full justify-center">
            <CiCircleAlert size={100} />
          </div>
          <div className="flex-wrap justify-center">
            <p className="w-full text-center text-2xl font-semibold">
              Are you sure?
            </p>
            <p className="w-full text-center">you want to delete this data?</p>
          </div>
          <div className="flex w-full justify-center space-x-4">
            <button
              onClick={HandleDelete}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Confirm
            </button>
            <button
              onClick={CancelDeleteData}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-red px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


interface iProductSku {
  id: string;
  code: string;
  name: string;
  description: string;
  price: string;
  type: string;
  stock: string | null;
  unit: string | null;
  machine_washer: boolean;
  machine_dryer: boolean;
  machine_iron: boolean;
  is_deleted: boolean,
  product: {
    id: string;
    name: string;
    product_creator: iUser | null;
    product_updater: iUser | null;
  };
  outlet: {
    id: string;
    name: string;
    city: string;
  } | null;
  outlet_price_skus: {
    price: string;
    outlet: {
      name: string;
    }
  }[];
  sku_creator: iUser | null;
  sku_updater: iUser | null;
}

interface iUser {
  id: string
  fullname: string
  email: string
  dial_code: string
  phone_number: string
}

interface GroupedLaundryData {
  product: string;
  total_items: number;
  skus: iProductSku[];
}