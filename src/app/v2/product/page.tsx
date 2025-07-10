'use client';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input } from "@/components/Inputs/InputComponent";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";

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
          {data.map((p, idx) => (
            <div key={idx} className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {/* <input type="checkbox" /> */}
                  <div>
                    <p className="font-semibold">{p.product}</p>
                    <p className="text-sm text-gray-500">total {p.total_items} items</p>
                  </div>
                </div>
                <div className="text-blue-600 font-semibold">{selectedOutlets.length}</div>
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
                          <th className="p-2">Description</th>
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
                              <td className={`p-2`}>{sku.description.length >= 1 ? sku.description : "-"}</td>
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
  product: {
    id: string;
    name: string;
  },
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
  }[]
}
interface iResSku {
  total: number,
  data: GroupedLaundryData[]
}
interface GroupedLaundryData {
  product: string;
  total_items: number;
  skus: iProductSku[];
}