"use client";

import { Input } from "@/components/Inputs/InputComponent";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

type OutletExclude = {
  id: string;
  name: string;
};

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  total: number;
  err: string | string[];
}

export default function ExcludeSkuPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const auth = useSelector((s: RootState) => s.auth);
  const { selectedOutlets, defaultSelectedOutlet } = useContext(FilterByOutletContext);

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingData, setFetchingData] = useState<boolean>(true);
  const [outlets, setOutlets] = useState<OutletExclude[]>([]);
  const [skuName, setSkuName] = useState<string>("");
  const [skuCode, setSkuCode] = useState<string>("");
  const [selectedOutletList, setSelectedOutletList] = useState<string[]>([]);
  const [searchOutlet, setSearchOutlet] = useState<string>("");

  const formikExcludeSku = useFormik({
    initialValues: {
      outlet_ids: [] as string[],
      sku_id: id || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      outlet_ids: Yup.array(),
      sku_id: Yup.string(),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      const res = await PostWithToken<any>({
        router: router,
        url: "/api/product/exclude/set",
        data: values,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        toast.warn("Select Outlet!");
      }

      if (res?.statusCode === 200) {
        toast.success("Change data success!");
        setSearchOutlet("");
        router.push("/v2/product");
      }

      setLoading(false);
    },
  });

  useEffect(() => {
    const gotOutlets = async () => {
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: "/api/outlet",
        token: `${auth.auth.access_token}`,
      });

      const mappedOutlets = (res.data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
      }));

      if (mappedOutlets.length >= 1) {
        setOutlets(mappedOutlets);
      }
    };

    gotOutlets();
  }, [auth.auth.access_token, router]);

  useEffect(() => {
    const fetchSkuData = async () => {
      if (!id) return;
      setFetchingData(true);

      const outletsPayload =
        selectedOutlets.length >= 1
          ? selectedOutlets.map((o) => o.outlet_id)
          : defaultSelectedOutlet.map((o) => o.outlet_id);

      try {
        const res = await PostWithToken<iResponse<any[]>>({
          router: router,
          url: "/api/v2/product/got-product",
          token: `${auth.auth.access_token}`,
          data: {
            outlet_ids: outletsPayload,
          },
        });

        if (res.statusCode === 200 && res.data) {
          let foundSku = null;

          for (const item of res.data) {
            if (item.skus) {
              const sku = item.skus.find((s: any) => s.id === id);
              if (sku) {
                foundSku = sku;
                break;
              }
            }
          }

          if (foundSku) {
            setSkuCode(foundSku.code);
            setSkuName(foundSku.name);

            const exRes = await GetWithToken<MyResponse>({
              router,
              url: `/api/product/exclude/got/${id}`,
              token: `${auth.auth.access_token}`,
            });

            if (exRes.statusCode === 200 && exRes.data) {
              const exclusions = exRes.data;
              const outletIds = (exclusions.excludes || exclusions || []).map(
                (ex: any) => ex.outlet_id || ex.machine_id,
              );
              setSelectedOutletList(outletIds);
              formikExcludeSku.setFieldValue("outlet_ids", outletIds);
            }
          } else {
            toast.error("SKU Not found!");
          }
        }
      } catch (err) {
        console.error(err);
      }

      setFetchingData(false);
    };

    fetchSkuData();
  }, [id, auth.auth.access_token, router, selectedOutlets, defaultSelectedOutlet]);

  const checkboxRefOutlet = useRef<HTMLInputElement>(null);
  const allCheckedOutlets = selectedOutletList.length === outlets.length && outlets.length > 0;
  const someCheckedOutlets = selectedOutletList.length > 0 && !allCheckedOutlets;

  const toggleAllOutlets = () => {
    if (allCheckedOutlets) {
      setSelectedOutletList([]);
      formikExcludeSku.setFieldValue("outlet_ids", []);
    } else {
      const allOutletIds = outlets.map((item) => item.id);
      setSelectedOutletList(allOutletIds);
      formikExcludeSku.setFieldValue("outlet_ids", allOutletIds);
    }
  };

  const toggleOutlet = (outletId: string) => {
    const isChecked = selectedOutletList.includes(outletId);
    const updated = isChecked
      ? selectedOutletList.filter((idOutlet) => idOutlet !== outletId)
      : [...selectedOutletList, outletId];

    setSelectedOutletList(updated);
    formikExcludeSku.setFieldValue("outlet_ids", updated);
  };

  const filteredOutlets = outlets.filter((outlet) => {
    const search = searchOutlet.toLowerCase();
    return outlet.name.toLowerCase().includes(search);
  });

  if (fetchingData) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="font-medium text-gray-500">Loading SKU Details...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Exclude SKU {skuCode && `(${skuCode})`}
        </h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <Link className="font-medium hover:text-primary" href="/">
                Dashboard /
              </Link>
            </li>
            <li>
              <Link className="font-medium hover:text-primary" href="/v2/product">
                SKU /
              </Link>
            </li>
            <li className="font-medium text-primary">Exclude SKU</li>
          </ol>
        </nav>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        <div className="space-y-5 py-2 pr-1">
          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4 dark:bg-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU Informasi</p>
            <p className="mt-1 text-lg font-semibold text-black dark:text-white">{skuName}</p>
            {skuCode && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Kode: {skuCode}</p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:bg-gray-700">
            <Input
              label={"Search Outlet"}
              name={"searchOutlet"}
              id={"searchOutlet"}
              value={searchOutlet}
              onChange={(v) => setSearchOutlet(v)}
              error={null}
            />
          </div>

          <div className="mt-6 w-full overflow-hidden rounded-md border">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      ref={checkboxRefOutlet}
                      type="checkbox"
                      checked={allCheckedOutlets}
                      data-state={
                        allCheckedOutlets
                          ? "checked"
                          : someCheckedOutlets
                            ? "indeterminate"
                            : "unchecked"
                      }
                      onChange={toggleAllOutlets}
                      className="h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3">Outlet Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredOutlets.length > 0 ? (
                  filteredOutlets.map((outlet) => {
                    return (
                      <tr
                        key={outlet.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOutletList.includes(outlet.id)}
                            onChange={() => toggleOutlet(outlet.id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {outlet.name}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      No outlets available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => formikExcludeSku.submitForm()}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:px-8 xl:px-10"
          >
            {loading ? "Saving..." : "Save exclude SKU"}
          </button>
        </div>
      </div>
    </div>
  );
}
