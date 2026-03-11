"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  iDropdown,
  Input,
  InputDropdown,
} from "@/components/Inputs/InputComponent";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { FaArrowLeft } from "react-icons/fa";
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

export default function SKUPriceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);
  const { selectedOutlets, defaultSelectedOutlet } = useContext(
    FilterByOutletContext,
  );

  const [outlets, setOutlets] = useState<iDropdown[]>([]);
  const [skuName, setSkuName] = useState<string>("");
  const [skuCode, setSkuCode] = useState<string>("");
  const [skuPrices, setSkuPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [addpriceSku, setAddpriceSku] = useState<boolean>(false);
  const [selectedOutletList, setSelectedOutletList] = useState<string[]>([]);

  const rupiah = (number: number) => {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR",
    }).format(number);

    return `Rp. ${result}`;
  };

  const formik = useFormik({
    initialValues: {
      outlet_id: "",
      price: "",
      sku_id: id,
    },
    validationSchema: Yup.object({
      outlet_id: Yup.string(),
      price: Yup.number().min(0),
      sku_id: Yup.string(),
    }),
    onSubmit: async (values) => {
      if (loading) return;
      setLoading(true);

      const dataprice = [
        {
          outlet_id: values.outlet_id,
          sku_id: values.sku_id,
          price: parseInt(values.price as any),
        },
      ];
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/product/add-price-outlet",
        data: { values: dataprice },
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Success add price!");
        formik.setFieldValue("outlet_id", "");
        formik.setFieldValue("price", "");
        // Auto-update the prices table
        await fetchSkuPrices();
      }
      setLoading(false);
    },
  });

  const formikExcludeSku = useFormik({
    initialValues: {
      outlet_ids: [],
      sku_id: id,
    },
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
      }
      setLoading(false);
    },
  });

  // Function to fetch SKU prices
  const fetchSkuPrices = async () => {
    try {
      const pricesRes = await GetWithToken<iResponse<[]>>({
        router: router,
        url: `/api/product/get-prices/${id}`,
        token: `${auth.auth.access_token}`,
      });

      if (pricesRes?.statusCode === 200) {
        setSkuPrices(pricesRes.data);
      }
    } catch (err) {
      console.error("Error fetching SKU prices:", err);
    }
  };

  // Fetch SKU data and prices
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

            // Fetch prices for this SKU
            await fetchSkuPrices();
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

  // Fetch outlets
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const res = await GetWithToken<MyResponse>({
          router: router,
          url: `/api/outlet`,
          token: `${auth.auth.access_token}`,
        });

        const allOutlet = {
          label: "All",
          value: "all",
        };
        const mapingOutlet = res.data.map((i: any) => {
          return {
            label: i.name,
            value: i.id,
          };
        });
        mapingOutlet.unshift(allOutlet);

        if (mapingOutlet.length >= 1) {
          formik.setFieldValue("outlet_id", mapingOutlet[0].value);
          setOutlets(mapingOutlet);
        }
      } catch (error) {
        console.error("Error fetching outlets:", error);
      }
    };

    if (auth.auth.access_token) {
      fetchOutlets();
    }
  }, [auth.auth.access_token]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <FaArrowLeft size={14} />
          Back
        </button>
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          {skuName}
        </h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <Link className="font-medium" href="/product">
                Dashboard / Product /
              </Link>
            </li>
            <li className="font-medium text-primary">SKU Price Detail</li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-9">
        {/* Add Price Form */}
        <div className="rounded-lg border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="mb-6">
            <h3 className="text-title-sm font-bold text-black dark:text-white">
              Add Price
            </h3>
          </div>

          <form onSubmit={formik.handleSubmit}>
            <div className="space-y-4 rounded-lg bg-white p-4 dark:bg-gray-700 lg:flex lg:space-x-4 lg:space-y-0">
              <div className="w-full lg:w-auto lg:flex-1">
                <InputDropdown
                  label={"Outlets*"}
                  name={"outlet_id"}
                  id={"outlet_id"}
                  value={formik.values.outlet_id}
                  onChange={(v) => {
                    formik.setFieldValue("outlet_id", v);
                  }}
                  options={outlets}
                  error={
                    formik.touched.outlet_id && formik.errors.outlet_id
                      ? formik.errors.outlet_id
                      : null
                  }
                />
              </div>

              <div className="w-full lg:w-auto lg:flex-1">
                <Input
                  label={"Add Price*"}
                  name={"price"}
                  id={"price"}
                  type="number"
                  value={formik.values.price ? formik.values.price : ""}
                  onChange={(v) => formik.setFieldValue(`price`, v)}
                  error={
                    formik.touched.price &&
                    typeof formik.errors.price === "object" &&
                    formik.errors.price
                      ? formik.errors.price
                      : null
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-auto w-full items-center justify-center rounded-md bg-black px-10 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 lg:w-auto lg:px-8 xl:px-10"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>

        {/* Price List Table */}
        <div className="rounded-lg border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="mb-6">
            <h3 className="text-title-sm font-bold text-black dark:text-white">
              Price List
            </h3>
          </div>

          <div className="overflow-hidden">
            <Table
              colls={["#", "Outlet", "City", "Price"]}
              onPaginate={() => {}}
              currentPage={0}
              totalItem={0}
            >
              {skuPrices && skuPrices.length > 0 ? (
                skuPrices.map((i, k) => (
                  <tr
                    key={k}
                    className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                  >
                    <td className="px-6 py-4">{k + 1}</td>
                    <td className="px-6 py-4">{i.outlet?.name}</td>
                    <td className="px-6 py-4">
                      {i.outlet?.city?.split("--")?.[1] ||
                        i.outlet?.city ||
                        ""}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {rupiah(i.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No prices available
                  </td>
                </tr>
              )}
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
