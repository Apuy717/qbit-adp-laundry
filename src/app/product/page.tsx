"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  iDropdown,
  Input,
  InputDropdown,
  InputFile,
  InputTextArea,
  InputToggle,
} from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { TypeProduct } from "@/types/product";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { PiExcludeSquareDuotone } from "react-icons/pi";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { EDepartmentEmployee } from "@/types/employee";
import { ERoles } from "@/stores/authReducer";
import { CiCircleAlert } from "react-icons/ci";
import { Outlet } from "@/types/outlet";

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  total: number;
  err: string | string[];
}
const CELLS = ["Name", "Total SKU", "Created at", "Status", "Action"];

export default function Product() {
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [products, setProducts] = useState<TypeProduct[]>([]);
  const [categorys, setCategorys] = useState<iDropdown[]>([]);
  const [filterSkus, setfilterSkus] = useState<any>([]);
  const [totalSkus, setTotalSkus] = useState<any>([]);
  const [excludes, setExcludes] = useState<any>([]);
  const [paginationSkus, setPaginationSkus] = useState<any>([]);
  const [currentPageProduct, setCurrentPageProduct] = useState(1);
  const [currentPageSku, setCurrentPageSku] = useState(1);
  const [fixValueSearchProduct, setFixValueSearchProduct] = useState("");
  const [fixValueSearchSku, setFixValueSearchSku] = useState("");
  const [totalProduct, setTotalProduct] = useState<number>(0);
  const [MapingProduct, setMapingProduct] = useState<iDropdown[]>([]);
  const [isViewDetail, setIsViewDetail] = useState<boolean>(false);
  const [isViewSkuPrices, setIsViewSkuPrices] = useState<boolean>(false);
  const [isViewSkuExclude, setIsViewSkuExclude] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [updateModal, setUpdateModal] = useState<boolean>(false);
  const [addpriceSku, setAddpriceSku] = useState<boolean>(false);
  const [productOrSku, setProductOrSku] = useState<boolean>(false);
  const [updateOrAddSku, setUpdateOrAddSku] = useState<boolean>(false);
  const [addSkuModal, setaddSkuModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteFunction, setDeleteFunction] = useState<() => void>(
    () => () => { },
  );
  const [outlets, setOutlets] = useState<iDropdown[]>([]);
  const [outletExclude, setOutletExclude] = useState<Outlet[]>([]);
  const [productName, setProductName] = useState<string>("");
  const [skuName, setskuName] = useState<string>("");
  const [selectedRadio, setSelectedRadio] = useState<boolean>(false);
  const [productId, setProductId] = useState<string | null>(null);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );

  const [skuId, setSkuId] = useState<string>("");
  const [skuPrices, setSkuPrices] = useState<any[]>([]);

  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  const [checkedOutlets, setCheckedOutlets] = useState<any[]>([]);


  const [filterByCategory, setFilterByCategory] = useState<string>("all");
  enum TabActive {
    PRODUCT = "PRODUCT",
    SKU = "SKU",
  }

  const [searchExclude,setSearchExclude] = useState<string>("")
  const filteredOutlets = outletExclude.filter((i) =>
    i.name.toLowerCase().includes(searchExclude.toLowerCase())
  );

  // State to track which rows are checked
  const [checkedRows, setCheckedRows] = useState<string[]>([])

  // Check if all rows are checked
  const allChecked = checkedRows.length === outletExclude.length

  // Check if some rows are checked (for indeterminate state)
  const someChecked = checkedRows.length > 0 && !allChecked

  // Toggle all checkboxes
  const toggleAll = () => {
    if (allChecked) {
      setCheckedRows([])
      formikExcludeSku.setFieldValue("outlet_ids", []);
    } else {
      setCheckedRows(outletExclude.map((item) => item.id))
      formikExcludeSku.setFieldValue("outlet_ids", outletExclude.map((item) => item.id));
    }
    console.log(checkedRows);
  }

  // Toggle individual checkbox
  const toggleRow = (id: string) => {
    if (checkedRows.includes(id)) {
      setCheckedRows(checkedRows.filter((rowId) => rowId !== id))
      formikExcludeSku.setFieldValue("outlet_ids", checkedRows.filter((rowId) => rowId !== id));
      console.log(checkedRows);
    } else {
      setCheckedRows([...checkedRows, id])
      formikExcludeSku.setFieldValue("outlet_ids", [...checkedRows, id]);
      console.log(checkedRows);
    }
  }
  const checkboxRef = useRef<HTMLInputElement>(null);


  const [tabActive, setTabActive] = useState<TabActive>(TabActive.PRODUCT);

  const serviceType = [
    {
      label: "services",
      value: "services",
    },
    {
      label: "goods",
      value: "goods",
    },
  ];

  useEffect(() => {
    const GotOutlets = async () => {
      let urlwithQuery = `/api/outlet`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
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
    };
    GotOutlets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addpriceSku]);

  useEffect(() => {
    const GotProduct = async () => {
      let urlwithQuery = `/api/product/filter?page=${currentPageProduct}&limit=${10}`;
      if (fixValueSearchProduct.length >= 1) {
        urlwithQuery = `/api/product/filter?page=${currentPageProduct}&limit=${10}&search=${fixValueSearchProduct}`;
      }
      const res = await PostWithToken<iResponse<TypeProduct[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : auth.department !== EDepartmentEmployee.HQ &&
                auth.role.name !== ERoles.PROVIDER
                ? defaultSelectedOutlet.map((o) => o.outlet_id)
                : [],
        },
      });
      const productMap = res.data.map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      });
      // setProductId(productMap[0].label);

      if (productMap.length >= 1) {
        setMapingProduct(productMap);
      }
      if (res?.statusCode === 200) {
        if (res.total) setTotalProduct(res.total);
        else setTotalProduct(0);
        setProducts(res.data);
        const mapSku = products.flatMap((item) =>
          item.skus.map((skuItem) => skuItem),
        );
        // setTotalSkus(mapSku);
        // console.log(mapSku);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    };
    const GotSku = async () => {
      let urlwithQuery = `/api/product/got-skus?page=${currentPageSku}&limit=${10}`;
      if (fixValueSearchSku.length >= 1) {
        urlwithQuery = `/api/product/got-skus?page=${currentPageSku}&limit=${10}&search=${fixValueSearchSku}`;
      }
      const res = await PostWithToken<iResponse<any[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : auth.department !== EDepartmentEmployee.HQ &&
                auth.role.name !== ERoles.PROVIDER
                ? defaultSelectedOutlet.map((o) => o.outlet_id)
                : [],
        },
      });

      if (res?.statusCode === 200) {
        setTotalSkus(res.data);
        setPaginationSkus(res.total);
        console.log(totalSkus);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    };
    const GotCategorys = async () => {
      let urlwithQuery = `/api/category`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const mapingCategory = res.data.map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      }) as iDropdown[];

      if (mapingCategory.length >= 1)
        formik.setFieldValue("category_id", mapingCategory[0].value);

      setCategorys(mapingCategory);
    };
    if (!modal && auth) {
      GotProduct();
      GotSku();
      GotCategorys();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    currentPageProduct,
    fixValueSearchProduct,
    currentPageSku,
    fixValueSearchSku,
    refresh,
    auth.auth.access_token,
    filterByOutlet,
    isViewDetail,
    tabActive,
    modal,
    defaultSelectedOutlet,
    selectedOutlets,
    deleteModal,
  ]);

  useEffect(() => {
    if (skuId != "") {
      const GotPriceSku = async () => {
        let urlwithQuery = `/api/product/get-prices/${skuId}`;
        const res = await GetWithToken<iResponse<[]>>({
          router: router,
          url: urlwithQuery,
          token: `${auth.auth.access_token}`,
        });
        if (res?.statusCode === 200) {
          if (res.total) setTotalProduct(res.total);
          else setTotalProduct(0);
          setSkuPrices(res.data);
        }

        setTimeout(() => {
          setLoadingSearch(false);
        }, 100);
      };
      GotPriceSku();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuId, addpriceSku, auth.auth.access_token]);

  useEffect(() => {
    const GotOutletExclude = async () => {
      let urlwithQuery = `/api/outlet`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 200) {
        setOutletExclude(res.data)
        console.log(outletExclude);
        const unique = excludes.filter((item: any) =>
          outletExclude.some((d) => d.id === item.outlet_id)
        );
        console.log(unique.map((i: any) => i.outlet_id));
        setCheckedRows(unique.map((i: any) => i.outlet_id))
      }
    };
    GotOutletExclude();
  }, [tabActive, excludes])

  useEffect(() => {
    if (skuId != "") {
      const GotExcludeSku = async () => {
        let urlwithQuery = `/api/product/exclude/got/${skuId}`;
        const res = await GetWithToken<iResponse<[]>>({
          router: router,
          url: urlwithQuery,
          token: `${auth.auth.access_token}`,
        });
        console.log(res.data);

        if (res?.statusCode === 200) {
          setExcludes(res.data);
        }

        setTimeout(() => {
          setLoadingSearch(false);
        }, 100);
      };
      GotExcludeSku();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, refresh, isViewSkuExclude, auth.auth.access_token]);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someChecked && !allChecked;
    }
  }, [someChecked, allChecked]);

  const handleSearch = async () => {
    if (tabActive === TabActive.PRODUCT) {
      if (search.length === 0) {
        setCurrentPageProduct(1);
        setProducts([]);
        setLoadingSearch(true);
        setFixValueSearchProduct("");
        setRefresh((prev) => !prev);
      } else {
        if (search.length >= 1 && fixValueSearchProduct !== search) {
          setProducts([]);
          setLoadingSearch(true);
          setFixValueSearchProduct(search);
          setCurrentPageProduct(1);
        }
      }
    } else {
      if (search.length === 0) {
        setCurrentPageSku(1);
        setTotalSkus([]);
        setLoadingSearch(true);
        setFixValueSearchSku("");
        setRefresh((prev) => !prev);
      } else {
        if (search.length >= 1 && fixValueSearchSku !== search) {
          setTotalSkus([]);
          setLoadingSearch(true);
          setFixValueSearchSku(search);
        }
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      id: "",
      outlet_id: "",
      name: "",
      // slug: "",
      picture: "",
      description: "",
      is_deleted: "",
      category_id: "",

      is_self_service: false,
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
      is_quantity_decimal: false,

      sku_id: "",
    },
    validationSchema: Yup.object({
      outlet_id: Yup.string(),
      name: Yup.string().max(100, "Max 225 char!"),
      // slug: Yup.string().max(100, "Max 225 char!"),
      description: Yup.string().max(100, "Max 255 char!").optional(),
      category_id: Yup.string(),
      variants: Yup.array().of(
        Yup.object({
          code: Yup.string().max(100, "Max 100 char!"),
          name: Yup.string().max(100, "Max 100 char!"),
          description: Yup.string().max(100, "Max 225 char!").optional(),
          price: Yup.number().min(0).required(),
          type: Yup.string().max(100, "Max 100 char!"),
          stock: Yup.string().max(100, "Max 100 char!"),
          unit: Yup.string().max(100, "Max 100 char!"),
          washer_duration: Yup.number().min(0),
          dryer_duration: Yup.number().min(0),
          iron_duration: Yup.number().min(0),
        }),
      ),
    }),

    onSubmit: async (values) => {
      if (values.type == "services") {
        Object.assign(values, { stock: null, unit: null });
      }
      if (!values.machine_washer) {
        Object.assign(values, { washer_duration: null });
      }
      if (!values.machine_dryer) {
        Object.assign(values, { dryer_duration: null });
      }
      if (!values.machine_iron) {
        Object.assign(values, { iron_duration: null });
      }

      if (loading) return;
      setLoading(true);
      let res = null;
      if (productOrSku && !addpriceSku) {
        res = await PostWithToken<MyResponse>({
          router: router,
          url: "/api/product/update-product",
          data: {
            id: values.id,
            outlet_id: values.outlet_id,
            name: values.name,
            picture: values.picture,
            // slug: values.slug,
            description: values.description,
            is_deleted: values.is_deleted,
            category_id: values.category_id,
            is_self_service: values.is_self_service,
          },
          token: `${auth.auth.access_token}`,
        });
      } else if (!productOrSku && !addpriceSku) {
        if (updateOrAddSku) {
          res = await PostWithToken<MyResponse>({
            router: router,
            url: "/api/product/update-sku",
            data: {
              id: values.id,
              product_id: values.product_id,
              outlet_id: values.outlet_id === "all" ? null : values.outlet_id,
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
              is_deleted: values.is_deleted,
              is_self_service: values.is_self_service,
              is_quantity_decimal: values.is_quantity_decimal,
            },
            token: `${auth.auth.access_token}`,
          });
        } else {
          res = await PostWithToken<MyResponse>({
            router: router,
            url: "/api/product/add-sku",
            data: {
              product_id: values.product_id,
              outlet_id: values.outlet_id === "all" ? null : values.outlet_id,
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
              is_deleted: values.is_deleted,
              is_quantity_decimal: values.is_quantity_decimal,
            },
            token: `${auth.auth.access_token}`,
          });
        }
      } else {
        const dataprice = [
          {
            outlet_id: values.outlet_id,
            sku_id: values.sku_id,
            price: values.price,
          },
        ];
        res = await PostWithToken<MyResponse>({
          router: router,
          url: "/api/product/add-price-outlet",
          data: { values: dataprice },
          token: `${auth.auth.access_token}`,
        });
      }

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Success update data!");
        if (addpriceSku) {
          formik.setFieldValue("price", "");
          setAddpriceSku(false);
        } else {
          router.push("/product");
          setTabActive(TabActive.PRODUCT);
          setIsViewDetail(false);
          setUpdateModal(false);
          setAddpriceSku(false);
          setaddSkuModal(false);
        }
      }
      setLoading(false);
    },
  });

  const formikExcludeSku = useFormik({
    initialValues: {
      outlet_ids: [],
      sku_id: "",
    },
    validationSchema: Yup.object({
      outlet_ids: Yup.array(),
      sku_id: Yup.string(),
    }),
    onSubmit: async (values) => {
      console.log(values);
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
        console.log(res.data);
        setSearchExclude("")
      }
      setLoading(false);
    },
  });

  const handleChangeFileImage = (
    event: ChangeEvent<HTMLInputElement>,
    callBack: (file: File | undefined, result: string) => void,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callBack(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      callBack(undefined, "");
    }
  };

  const rupiah = (number: number) => {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR",
    }).format(number);

    return `Rp. ${result}`;
  };

  const deleteProduct = async (id: any) => {
    const res = await PostWithToken<any>({
      router: router,
      url: "/api/product/remove-product",
      data: {
        product_id: id,
        is_deleted: true,
      },
      token: `${auth.auth.access_token}`,
    });
    if (res?.statusCode === 200) {
      setLoading(true);
      toast.success("Delete data success!");
      setDeleteModal(false);
      setDeleteFunction(() => () => { });
      setRefresh(true);
      setLoading(false);
    }
  };
  const deleteSku = async (id: any) => {
    const res = await PostWithToken<any>({
      router: router,
      url: "/api/product/remove-sku",
      data: {
        sku_id: id,
        is_deleted: true,
      },
      token: `${auth.auth.access_token}`,
    });
    if (res?.statusCode === 200) {
      setLoading(true);
      setDeleteModal(false);
      toast.success("Delete data success!");
      setRefresh(true);
      setLoading(false);
      setIsViewDetail(false);
    }
  };
  const removeExclude = async (id: any) => {
    setLoading(true);

    const res: any = await fetch(`/api/product/exclude/remove/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${auth.auth.access_token}`,
      },
    });
    console.log(res);

    if (res?.status === 200) {
      setDeleteModal(false);
      toast.success("Delete data success!");
      setRefresh(true);
    }
    setLoading(false);
  };

  return (
    <>
      <Breadcrumb pageName="Product Group" />

      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="flex w-full flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
          {/* <InputDropdown
            label={"Filter By Category"}
            name={"filterByCategory"}
            id={"filterByCategory"}
            value={filterByCategory}
            onChange={(e) => setFilterByCategory(e)}
            error={null}
            options={[{ label: "All", value: "all" }].concat(categorys)}
          /> */}
          <div className="w-full md:w-96">
            <Input
              label={"Search"}
              name={"search"}
              id={"search"}
              value={search}
              onChange={(v) => setSearch(v)}
              error={null}
            />
          </div>
          <button
            onClick={handleSearch}
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <button
            className={`font-edium inline-flex items-center justify-center rounded-md bg-black px-10 
            py-3 text-center text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={() => {
              router.push("/product/create");
            }}
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="mb-4 w-full rounded-md bg-gray-50 px-4 pt-4 dark:bg-gray-800">
        <ul
          className="-mb-px flex flex-wrap text-center text-sm font-medium"
          id="default-tab"
          data-tabs-toggle="#default-tab-content"
          role="tablist"
        >
          <li className="me-2" role="presentation">
            <button
              className={`inline-block rounded-t-lg border-b-2 p-4 
              ${tabActive === TabActive.PRODUCT
                  ? "border-blue-500 text-blue-500"
                  : "dark:border-form-strokedark"
                }
              `}
              onClick={() => setTabActive(TabActive.PRODUCT)}
            >
              {TabActive.PRODUCT}
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              className={`inline-block rounded-t-lg border-b-2 p-4 
              ${tabActive === TabActive.SKU
                  ? "border-blue-500 text-blue-500"
                  : "dark:border-form-strokedark"
                }
              `}
              onClick={() => setTabActive(TabActive.SKU)}
            >
              {TabActive.SKU}
            </button>
          </li>
        </ul>
      </div>

      <div
        className={
          tabActive == TabActive.PRODUCT ? `dark:min-h-screen` : `hidden`
        }
      >
        <Table
          colls={CELLS}
          onPaginate={(page) => setCurrentPageProduct(page)}
          currentPage={currentPageProduct}
          totalItem={totalProduct}
        >
          {products.map((prod, index) => (
            <tr
              key={index}
              className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600"
            >
              <td className="px-6 py-4">{prod.name}</td>
              <td className="px-6 py-4">{prod.skus.length + " SKU"}</td>
              <td className="px-6 py-4">
                {new Date(prod.created_at).toLocaleString("id", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-4">
                {prod.is_deleted ? (
                  <p className="font-bold uppercase text-red">inactive</p>
                ) : (
                  <p className="font-bold uppercase text-green-500">active</p>
                )}
              </td>
              <td className="px-6 py-4">
                <div className=" flex flex-row items-center space-x-2">
                  <div className="group relative">
                    <button
                      className="cursor-pointer"
                      onClick={() => {
                        setProductName(prod.name);
                        setProductId(prod.id);
                        setIsViewDetail(true);
                        const filter = products.filter(
                          (f: any) => f.id == prod.id,
                        );
                        setfilterSkus(filter[0].skus);
                      }}
                    >
                      <FiEye size={18} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      View detail
                    </div>
                  </div>
                  <div className="group relative">
                    <button
                      onClick={() => {
                        formik.setFieldValue("id", prod.id);
                        // formik.setFieldValue("outlet_id", prod.outlet.id)
                        formik.setFieldValue("name", prod.name);
                        // formik.setFieldValue("slug", prod.slug)
                        formik.setFieldValue(
                          "description",
                          prod.description === null ? `` : prod.description,
                        );
                        // formik.setFieldValue("category_id", prod.category.id)
                        formik.setFieldValue("is_deleted", prod.is_deleted);
                        formik.setFieldValue(
                          "is_self_service",
                          prod.is_self_service,
                        );
                        setSelectedRadio(prod.is_self_service);

                        setUpdateModal(true);
                        setProductOrSku(true);
                      }}
                    >
                      <FiEdit size={18} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      Edit Product
                    </div>
                  </div>
                  <div className="group relative">
                    <button
                      onClick={() => {
                        setDeleteFunction(() => () => deleteProduct(prod.id));
                        setDeleteModal(true);
                        setRefresh(!refresh);
                      }}
                    >
                      <FiTrash size={18} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      Delete Product
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <div
        className={tabActive == TabActive.SKU ? `dark:min-h-screen` : `hidden`}
      >
        <Table
          colls={[
            "#",
            "Code",
            "Name",
            "Type",
            "Price",
            "Outlet",
            "Stock",
            "Washer",
            "Dryer",
            "Iron",
            "Description",
            "Action",
          ]}
          currentPage={currentPageSku}
          totalItem={paginationSkus}
          onPaginate={(page) => setCurrentPageSku(page)}
        >
          {totalSkus.map((i: any, k: any) => (
            <tr key={k}>
              <td className="px-6 py-4">{k + 1}</td>
              <td className="whitespace-nowrap px-6 py-4">{i.code}</td>
              <td className="whitespace-nowrap px-6 py-4">{i.name}</td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.is_self_service ? "Self Service" : "Full Service"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">{rupiah(i.price)}</td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.outlet === null ? "ALL" : i.outlet.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.stock ? `${i.stock} ${i.unit}` : "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.machine_washer ? (
                  <p className="font-bold uppercase text-green-500">
                    {`${i.washer_duration}`} Mnt
                  </p>
                ) : (
                  <p className="font-bold uppercase text-red">none</p>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.machine_dryer ? (
                  <p className="font-bold uppercase text-green-500">
                    {`${i.dryer_duration}`} Mnt
                  </p>
                ) : (
                  <p className="font-bold uppercase text-red">none</p>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {i.machine_iron ? (
                  <p className="font-bold uppercase text-green-500">
                    {`${i.iron_duration}`} Mnt
                  </p>
                ) : (
                  <p className="font-bold uppercase text-red">none</p>
                )}
              </td>
              <td className="px-6 py-4">{i.description}</td>
              <td className="flex justify-center space-x-2 whitespace-nowrap px-6 py-4">
                <div className="group relative">
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      setskuName(i.name);
                      setIsViewSkuPrices(true);
                      setSkuId(i.id);
                      formik.setFieldValue("sku_id", i.id);
                      setAddpriceSku(true);
                    }}
                  >
                    <FiEye size={18} />
                  </button>
                  <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                    View detail
                  </div>
                </div>

                <div className="group relative">
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      formik.setFieldValue("id", i.id);
                      formik.setFieldValue(
                        "outlet_id",
                        i.outlet !== null ? i.outlet.id : outlets[0].value,
                      );
                      formik.setFieldValue("product_id", i.product_id);
                      setProductId(i.product_id);
                      formik.setFieldValue("code", i.code);
                      formik.setFieldValue("name", i.name);
                      formik.setFieldValue(
                        "description",
                        i.description == null ? `` : i.description,
                      );
                      formik.setFieldValue("capital_price", i.capital_price);
                      formik.setFieldValue("price", i.price);
                      formik.setFieldValue("type", i.type);
                      formik.setFieldValue("stock", i.stock);
                      formik.setFieldValue("unit", i.unit);
                      formik.setFieldValue("machine_washer", i.machine_washer);
                      formik.setFieldValue(
                        "washer_duration",
                        parseInt(i.washer_duration),
                      );
                      formik.setFieldValue("machine_dryer", i.machine_dryer);
                      formik.setFieldValue(
                        "dryer_duration",
                        parseInt(i.dryer_duration),
                      );
                      formik.setFieldValue("machine_iron", i.machine_iron);
                      formik.setFieldValue(
                        "iron_duration",
                        parseInt(i.iron_duration),
                      );

                      formik.setFieldValue("is_deleted", i.is_deleted);
                      formik.setFieldValue(
                        "is_self_service",
                        i.is_self_service,
                      );
                      formik.setFieldValue(
                        "is_self_service",
                        i.is_quantity_decimal,
                      );
                      setSelectedRadio(i.is_self_service);

                      setUpdateModal(true);
                      setUpdateOrAddSku(true);
                      setProductOrSku(false);
                    }}
                  >
                    <FiEdit size={18} />
                  </button>
                  <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                    Edit SKU
                  </div>
                </div>

                <div className="group relative">
                  <button
                    onClick={() => {
                      setSkuId(i.id);
                      formikExcludeSku.setFieldValue("sku_id", i.id);
                      setIsViewSkuExclude(true);
                    }}
                  >
                    <PiExcludeSquareDuotone size={18} />
                  </button>
                  <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                    Exclude SKU
                  </div>
                </div>
                <div className="group relative">
                  <button
                    onClick={() => {
                      setDeleteModal(true);
                      setDeleteFunction(() => () => deleteSku(i.id));
                      setRefresh(!refresh);
                    }}
                  >
                    <FiTrash size={18} />
                  </button>
                  <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                    Delete SKU
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* SKU Slide2 */}
      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-[80%] overflow-x-auto overflow-y-auto
        bg-white shadow transition-all duration-500 dark:bg-boxdark
        ${isViewDetail ? "" : "translate-x-full"}`}
      >
        <div className="bg-white p-4 shadow dark:bg-boxdark">
          <button
            onClick={() => {
              setIsViewDetail(false);
              setProductId(null);
            }}
          >
            <FaArrowLeft size={20} className="rotate-180" />
          </button>
        </div>
        <div className="mt-4 p-4">
          <div className="mb-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between lg:text-base">
            <h3 className="text-2xl font-semibold text-black dark:text-white">
              {productName}
            </h3>
            <nav>
              <ol className="flex items-center gap-2">
                <li>
                  <Link className="" href="/">
                    Dashboard / Product /
                  </Link>
                </li>
                <li className=" text-primary">Product Detail</li>
              </ol>
            </nav>
          </div>

          <button
            className="rounded-md bg-blue-500 px-10 py-2 text-white"
            onClick={() => {
              if (productId !== null) {
                setSelectedRadio(false);
                formik.setFieldValue("product_id", MapingProduct[0].value);
                formik.setFieldValue("code", "");
                formik.setFieldValue("name", "");
                formik.setFieldValue("description", "");
                formik.setFieldValue("capital_price", "");
                formik.setFieldValue("price", "");
                formik.setFieldValue("type", "services");
                formik.setFieldValue("stock", "");
                formik.setFieldValue("unit", "");
                formik.setFieldValue("machine_washer", false);
                formik.setFieldValue("washer_duration", 0);
                formik.setFieldValue("machine_dryer", false);
                formik.setFieldValue("dryer_duration", 0);
                formik.setFieldValue("machine_iron", false);
                formik.setFieldValue("iron_duration", 0);
                formik.setFieldValue("is_deleted", false);
                formik.setFieldValue(`is_self_service`, false);
                formik.setFieldValue(`is_quantity_decimal`, false);

                setProductOrSku(false);
                setUpdateOrAddSku(false);
                setaddSkuModal(true);
              } else {
                toast.warn("Product not selected!");
              }
            }}
          >
            Add SKU
          </button>
        </div>

        <div className="space-y-2 px-4">
          <p className="text-lg font-semibold text-black dark:text-white">
            Detail SKU
          </p>
          <Table
            colls={[
              "#",
              "Code",
              "Name",
              "Type",
              "Price",
              "Outlet",
              "Stock",
              "Washer",
              "Dryer",
              "Iron",
              "Description",
              "Action",
            ]}
            currentPage={0}
            totalItem={0}
            onPaginate={function (page: number): void {
              throw new Error("Function not implemented.");
            }}
          >
            {filterSkus.map((i: any, k: any) => (
              <tr key={k}>
                <td className="px-6 py-4">{k + 1}</td>
                <td className="whitespace-nowrap px-6 py-4">{i.code}</td>
                <td className="whitespace-nowrap px-6 py-4">{i.name}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.is_self_service ? "Self Service" : "Full Service"}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {rupiah(i.price)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.outlet === null ? "ALL" : i.outlet.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.stock ? `${i.stock} ${i.unit}` : "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_washer ? (
                    <div className="flex w-auto items-center rounded-xl bg-green-500 px-2 text-center ">
                      <p className="text-white">{`${i.washer_duration}`} Mnt</p>
                    </div>
                  ) : (
                    <div className="w-auto rounded-xl bg-red-500 px-2 text-center">
                      <p className="text-white">No</p>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_dryer ? (
                    <div className="flex w-auto items-center rounded-xl bg-green-500 px-2 text-center ">
                      <p className="text-white">{`${i.dryer_duration}`} Mnt</p>
                    </div>
                  ) : (
                    <div className="w-auto rounded-xl bg-red-500 px-2 text-center">
                      <p className="text-white">No</p>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.machine_iron ? (
                    <div className="flex w-auto items-center rounded-xl bg-green-500 px-2 text-center ">
                      <p className="text-white">{`${i.iron_duration}`} Mnt</p>
                    </div>
                  ) : (
                    <div className="w-auto rounded-xl bg-red-500 px-2 text-center">
                      <p className="text-white">No</p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{i.description}</td>
                <td className="flex justify-center space-x-2 whitespace-nowrap px-6 py-4">
                  <div className="group relative">
                    <button
                      className="cursor-pointer"
                      onClick={() => {
                        setskuName(i.name);
                        setIsViewSkuPrices(true);
                        setSkuId(i.id);
                        formik.setFieldValue("sku_id", i.id);
                        setAddpriceSku(true);
                      }}
                    >
                      <FiEye size={18} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      View detail
                    </div>
                  </div>

                  <div className="group relative">
                    <button
                      className="cursor-pointer"
                      onClick={() => {
                        formik.setFieldValue("id", i.id);
                        formik.setFieldValue("product_id", i.product_id);
                        formik.setFieldValue(
                          "outlet_id",
                          i.outlet !== null ? i.outlet.id : outlets[0].value,
                        );
                        setProductId(i.product_id);
                        formik.setFieldValue("code", i.code);
                        formik.setFieldValue("name", i.name);
                        formik.setFieldValue(
                          "description",
                          i.description == null ? `` : i.description,
                        );
                        formik.setFieldValue("capital_price", i.capital_price);
                        formik.setFieldValue("price", i.price);
                        formik.setFieldValue("type", i.type);
                        formik.setFieldValue("stock", i.stock);
                        formik.setFieldValue("unit", i.unit);
                        formik.setFieldValue(
                          "machine_washer",
                          i.machine_washer,
                        );
                        formik.setFieldValue(
                          "washer_duration",
                          parseInt(i.washer_duration),
                        );
                        formik.setFieldValue("machine_dryer", i.machine_dryer);
                        formik.setFieldValue(
                          "dryer_duration",
                          parseInt(i.dryer_duration),
                        );
                        formik.setFieldValue("machine_iron", i.machine_iron);
                        formik.setFieldValue(
                          "iron_duration",
                          parseInt(i.iron_duration),
                        );

                        formik.setFieldValue("is_deleted", i.is_deleted);
                        formik.setFieldValue(
                          "is_self_service",
                          i.is_self_service,
                        );
                        setSelectedRadio(i.is_self_service);
                        setUpdateModal(true);
                        setUpdateOrAddSku(true);
                        setProductOrSku(false);
                      }}
                    >
                      <FiEdit size={18} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      Edit SKU
                    </div>
                  </div>
                  <div className="group relative">
                    <button
                      onClick={() => {
                        setSkuId(i.id);
                        formikExcludeSku.setFieldValue("sku_id", i.id);
                        setIsViewSkuExclude(true);
                      }}
                    >
                      <PiExcludeSquareDuotone size={18} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      Exclude SKU
                    </div>
                  </div>

                  <div className="group relative">
                    <button
                      onClick={() => {
                        setDeleteModal(true);
                        setDeleteFunction(() => () => deleteSku(i.id));
                        setRefresh(!refresh);
                      }}
                    >
                      <FiTrash size={18} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      Delete SKU
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      <Modal isOpen={addSkuModal}>
        <div className="relative w-[90%] rounded-md bg-white p-4  shadow dark:bg-boxdark md:w-[50%] ">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setUpdateModal(false);
              setaddSkuModal(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={`Add SKU`} />
          </div>
          <div className="h-96 space-y-6 overflow-y-scroll py-2">
            <InputDropdown
              label={"Outlets*"}
              name={"Outlets"}
              id={"Outlets"}
              value={formik.values.outlet_id}
              onChange={(v) => formik.setFieldValue("outlet_id", v)}
              options={outlets}
              error={
                formik.touched.outlet_id && formik.errors.outlet_id
                  ? formik.errors.outlet_id
                  : null
              }
            />
            <InputDropdown
              label={"Product*"}
              name={"Product"}
              id={"Product"}
              value={
                formik.values.product_id !== null
                  ? formik.values.product_id
                  : ""
              }
              onChange={(v) => {
                setProductId(v);
                formik.setFieldValue(`product_id`, v);
              }}
              options={MapingProduct}
              error={
                formik.touched.product_id &&
                  typeof formik.errors.product_id === "object" &&
                  formik.errors.product_id
                  ? formik.errors.product_id
                  : null
              }
            />
            <Input
              label={"Code*"}
              name={"code"}
              id={"code"}
              value={formik.values.code}
              onChange={(v) => formik.setFieldValue(`code`, v)}
              error={
                formik.touched.code &&
                  typeof formik.errors.code === "object" &&
                  formik.errors.code
                  ? formik.errors.code
                  : null
              }
            />
            <Input
              label={"Name*"}
              name={"name"}
              id={"name"}
              value={formik.values.name}
              onChange={(v) => formik.setFieldValue(`name`, v)}
              error={
                formik.touched.name &&
                  typeof formik.errors.name === "object" &&
                  formik.errors.name
                  ? formik.errors.name
                  : null
              }
            />

            <Input
              label={"Price*"}
              name={"price"}
              id={"price"}
              value={formik.values.price ? formik.values.price : ""}
              onChange={(v) => formik.setFieldValue(`price`, parseInt(v))}
              error={
                formik.touched.price &&
                  typeof formik.errors.price === "object" &&
                  formik.errors.price
                  ? formik.errors.price
                  : null
              }
            />

            <InputDropdown
              label={"Type*"}
              name={"type"}
              id={"type"}
              value={formik.values.type}
              onChange={(v) => formik.setFieldValue(`type`, v)}
              options={serviceType}
              error={
                formik.touched.type &&
                  typeof formik.errors.type === "object" &&
                  formik.errors.type
                  ? formik.errors.type
                  : null
              }
            />
            <Input
              className={formik.values.type === "services" ? `hidden` : ``}
              label={"Stock*"}
              name={"stock"}
              id={"stock"}
              value={formik.values.stock ? formik.values.stock : ""}
              onChange={(v) => formik.setFieldValue(`stock`, parseInt(v))}
              error={
                formik.touched.stock &&
                  typeof formik.errors.stock === "object" &&
                  formik.errors.stock
                  ? formik.errors.stock
                  : null
              }
            />
            <Input
              className={formik.values.type === "services" ? `hidden` : ``}
              label={"Unit*"}
              name={"unit"}
              id={"unit"}
              value={formik.values.unit ? formik.values.unit : ""}
              onChange={(v) => formik.setFieldValue(`unit`, v)}
              error={
                formik.touched.unit &&
                  typeof formik.errors.unit === "object" &&
                  formik.errors.unit
                  ? formik.errors.unit
                  : null
              }
            />
            <InputTextArea
              label={"Description"}
              name={"description"}
              id={"description"}
              value={formik.values.description}
              onChange={(v) => formik.setFieldValue(`description`, v)}
              error={
                formik.touched.description &&
                  typeof formik.errors.description === "object" &&
                  formik.errors.description
                  ? formik.errors.description
                  : null
              }
            />

            <div className="my-4 flex gap-4 p-2">
              {/* Pilihan Ya */}
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="radio"
                  name="addSku"
                  value="false"
                  checked={formik.values.is_self_service === false}
                  onChange={() => {
                    setSelectedRadio(false);
                    formik.setFieldValue(`is_self_service`, false);
                  }}
                  className="h-5 w-5 checked:bg-blue-600"
                />
                <span className="text-sm">Full Service</span>
              </label>

              {/* Pilihan Tidak */}
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="radio"
                  name="addSku"
                  value="true"
                  checked={formik.values.is_self_service === true}
                  onChange={() => {
                    setSelectedRadio(true);
                    formik.setFieldValue(`is_self_service`, true);
                  }}
                  className="h-5 w-5 checked:bg-blue-600"
                />
                <span className="text-sm">Self Service</span>
              </label>
            </div>
            <div className="my-4 flex gap-4 p-2">
              {/* Pilihan Non Decimal */}
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="radio"
                  name={`isDecimalAddSku`} // tetap unik per index
                  value="false"
                  checked={formik.values.is_quantity_decimal === false}
                  onChange={() =>
                    formik.setFieldValue(`is_quantity_decimal`, false)
                  }
                  className="h-5 w-5 checked:bg-blue-600"
                />
                <span className="text-sm">Order Qty Non Decimal</span>
              </label>

              {/* Pilihan Decimal */}
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="radio"
                  name={`isDecimalAddSku`}
                  value="true"
                  checked={formik.values.is_quantity_decimal === true}
                  onChange={() =>
                    formik.setFieldValue(`is_quantity_decimal`, true)
                  }
                  className="h-5 w-5 checked:bg-blue-600"
                />
                <span className="text-sm">Order Qty Decimal</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-4 md:grid-cols-2">
              <InputToggle
                value={formik.values.machine_washer}
                onClick={(v) => {
                  formik.setFieldValue(`machine_washer`, v);
                }}
                label={"Washer machine"}
              />
              <Input
                className={formik.values.machine_washer ? `` : `w-1 opacity-0`}
                label={formik.values.machine_washer ? "Time in minutes" : ""}
                name={"washer_duration"}
                id={"washer_duration"}
                value={`${formik.values.washer_duration ? formik.values.washer_duration : ""}`}
                onChange={(v) =>
                  formik.setFieldValue(`washer_duration`, parseInt(v))
                }
                error={
                  formik.touched.washer_duration &&
                    typeof formik.errors.washer_duration === "object" &&
                    formik.errors.washer_duration
                    ? formik.errors.washer_duration
                    : null
                }
              />
              <InputToggle
                value={formik.values.machine_dryer}
                onClick={(v) => {
                  formik.setFieldValue(`machine_dryer`, v);
                }}
                label={"Dryer Machine"}
              />
              <Input
                className={formik.values.machine_dryer ? `` : `w-1 opacity-0`}
                label={formik.values.machine_dryer ? "Time in minutes" : ""}
                name={"dryer_duration"}
                id={"dryer_duration"}
                value={
                  formik.values.dryer_duration
                    ? formik.values.dryer_duration
                    : ``
                }
                onChange={(v) =>
                  formik.setFieldValue(`dryer_duration`, parseInt(v))
                }
                error={
                  formik.touched.dryer_duration &&
                    typeof formik.errors.dryer_duration === "object" &&
                    formik.errors.dryer_duration
                    ? formik.errors.dryer_duration
                    : null
                }
              />
              <InputToggle
                value={formik.values.machine_iron}
                onClick={(v) => {
                  formik.setFieldValue(`machine_iron`, v);
                }}
                label={"Iron Machine"}
              />
              <Input
                className={formik.values.machine_iron ? `` : `w-1 opacity-0`}
                label={formik.values.machine_iron ? "Time in minutes" : ""}
                name={"iron_duration"}
                id={"iron_duration"}
                value={
                  formik.values.iron_duration ? formik.values.iron_duration : ""
                }
                onChange={(v) =>
                  formik.setFieldValue(`iron_duration`, parseInt(v))
                }
                error={
                  formik.touched.iron_duration &&
                    typeof formik.errors.iron_duration === "object" &&
                    formik.errors.iron_duration
                    ? formik.errors.iron_duration
                    : null
                }
              />
            </div>
            <button
              onClick={formik.submitForm}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={updateModal}>
        {productOrSku ? (
          //UPDATE PRODUCT
          <div className="relative w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
            <div
              className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
              // className="z-50 absolute top-2 right-2 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
              onClick={() => {
                setUpdateModal(false);
              }}
            >
              <IoCloseOutline color="white" size={20} />
            </div>

            <div className="flex flex-col space-y-8 pt-6">
              <Breadcrumb
                pageName={productOrSku ? `Update Product` : `Update SKU`}
              />
            </div>

            <div className=" h-96 overflow-y-scroll py-2">
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-1">
                <Input
                  label={"Name*"}
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
                {/* <Input
                  label={"Slug"}
                  name={"slug"}
                  id={"slug"}
                  value={formik.values.slug}
                  onChange={(v) => formik.setFieldValue("slug", v)}
                  error={
                    formik.touched.slug && formik.errors.slug
                      ? formik.errors.slug
                      : null
                  }
                /> */}
                {/* <InputDropdown
                  label={"Category*"}
                  name={"category_id"}
                  id={"category_id"}
                  value={formik.values.category_id}
                  onChange={(v) => formik.setFieldValue("category_id", v)}
                  options={categorys}
                  error={
                    formik.touched.category_id && formik.errors.category_id
                      ? formik.errors.category_id
                      : null
                  }
                /> */}

                <InputFile
                  label={"Picture"}
                  name={"picture"}
                  id={"picture"}
                  onChange={(e) =>
                    handleChangeFileImage(e, (file, result) => {
                      formik.setFieldValue(
                        "picture",
                        result.replace(/^data:image\/\w+;base64,/, ""),
                      );
                    })
                  }
                  error={
                    formik.touched.picture && formik.errors.picture
                      ? formik.errors.picture
                      : null
                  }
                ></InputFile>
              </div>
              <div className="pt-6">
                <InputTextArea
                  rows={5}
                  label={"Description"}
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

                {/* Pilihan Ya */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="agreement"
                    value="false"
                    checked={selectedRadio === false}
                    onChange={() => {
                      setSelectedRadio(false);
                      formik.setFieldValue(`is_self_service`, false);
                    }}
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Full Service</span>
                </label>

                {/* Pilihan Tidak */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="agreement"
                    value="true"
                    checked={selectedRadio === true}
                    onChange={() => {
                      setSelectedRadio(true);
                      formik.setFieldValue(`is_self_service`, true);
                    }}
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Self Service</span>
                </label>
              </div>

              <div className="mt-6">
                <InputToggle
                  value={!formik.values.is_deleted}
                  onClick={(v) => formik.setFieldValue("is_deleted", !v)}
                  label={"Status"}
                />
              </div>
            </div>

            <button
              onClick={formik.submitForm}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>
        ) : (
          //UPDATE SKU
          <div className="relative w-[90%] rounded-md bg-white p-4  shadow dark:bg-boxdark md:w-[50%] ">
            <div
              className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
              onClick={() => {
                setUpdateModal(false);
              }}
            >
              <IoCloseOutline color="white" size={20} />
            </div>

            <div className="flex flex-col space-y-8">
              <Breadcrumb
                pageName={productOrSku ? `Update Product` : `Update SKU`}
              />
            </div>
            <div className=" h-96 overflow-y-scroll py-2">
              <div className="grid grid-cols-1 gap-x-4 gap-y-6">
                <InputDropdown
                  label={"Outlets*"}
                  name={"Outlets"}
                  id={"Outlets"}
                  value={formik.values.outlet_id}
                  onChange={(v) => formik.setFieldValue("outlet_id", v)}
                  options={outlets}
                  error={
                    formik.touched.outlet_id && formik.errors.outlet_id
                      ? formik.errors.outlet_id
                      : null
                  }
                />
                <InputDropdown
                  label={"Product*"}
                  name={"Product"}
                  id={"Product"}
                  value={productId ? productId : ""}
                  onChange={(v) => {
                    setProductId(v);
                    formik.setFieldValue(`product_id`, v);
                  }}
                  options={MapingProduct}
                  error={
                    formik.touched.product_id &&
                      typeof formik.errors.product_id === "object" &&
                      formik.errors.product_id
                      ? formik.errors.product_id
                      : null
                  }
                />
                <Input
                  label={"Code*"}
                  name={"code"}
                  id={"code"}
                  value={formik.values.code}
                  onChange={(v) => formik.setFieldValue(`code`, v)}
                  error={
                    formik.touched.code &&
                      typeof formik.errors.code === "object" &&
                      formik.errors.code
                      ? formik.errors.code
                      : null
                  }
                />
                <Input
                  label={"Name*"}
                  name={"name"}
                  id={"name"}
                  value={formik.values.name}
                  onChange={(v) => formik.setFieldValue(`name`, v)}
                  error={
                    formik.touched.name &&
                      typeof formik.errors.name === "object" &&
                      formik.errors.name
                      ? formik.errors.name
                      : null
                  }
                />

                <Input
                  label={"Price*"}
                  name={"price"}
                  id={"price"}
                  value={formik.values.price ? formik.values.price : ""}
                  onChange={(v) => formik.setFieldValue(`price`, parseInt(v))}
                  error={
                    formik.touched.price &&
                      typeof formik.errors.price === "object" &&
                      formik.errors.price
                      ? formik.errors.price
                      : null
                  }
                />

                <InputDropdown
                  label={"Type*"}
                  name={"type"}
                  id={"type"}
                  value={formik.values.id}
                  onChange={(v) => formik.setFieldValue(`type`, v)}
                  options={serviceType}
                  error={
                    formik.touched.id &&
                      typeof formik.errors.id === "object" &&
                      formik.errors.id
                      ? formik.errors.id
                      : null
                  }
                />
                <Input
                  className={formik.values.type === "services" ? `hidden` : ``}
                  label={"Stock*"}
                  name={"stock"}
                  id={"stock"}
                  value={formik.values.stock ? formik.values.stock : ""}
                  onChange={(v) => formik.setFieldValue(`stock`, parseInt(v))}
                  error={
                    formik.touched.stock &&
                      typeof formik.errors.stock === "object" &&
                      formik.errors.stock
                      ? formik.errors.stock
                      : null
                  }
                />
                <Input
                  className={formik.values.type === "services" ? `hidden` : ``}
                  label={"Unit*"}
                  name={"unit"}
                  id={"unit"}
                  value={formik.values.unit ? formik.values.unit : ""}
                  onChange={(v) => formik.setFieldValue(`unit`, v)}
                  error={
                    formik.touched.unit &&
                      typeof formik.errors.unit === "object" &&
                      formik.errors.unit
                      ? formik.errors.unit
                      : null
                  }
                />
              </div>
              <div className="pt-6">
                <InputTextArea
                  label={"Description"}
                  name={"description"}
                  id={"description"}
                  value={formik.values.description}
                  onChange={(v) => formik.setFieldValue(`description`, v)}
                  error={
                    formik.touched.description &&
                      typeof formik.errors.description === "object" &&
                      formik.errors.description
                      ? formik.errors.description
                      : null
                  }
                />
              </div>
              <div className="my-4 flex gap-4 p-2">
                {/* Pilihan Ya */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="agreement"
                    value="false"
                    checked={selectedRadio === false}
                    onChange={() => {
                      setSelectedRadio(false);
                      formik.setFieldValue(`is_self_service`, false);
                    }}
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Full Service</span>
                </label>

                {/* Pilihan Tidak */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="agreement"
                    value="true"
                    checked={selectedRadio === true}
                    onChange={() => {
                      setSelectedRadio(true);
                      formik.setFieldValue(`is_self_service`, true);
                    }}
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Self Service</span>
                </label>
              </div>
              <div className="my-4 flex gap-4 p-2">
                {/* Pilihan Non Decimal */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name={`isDecimal`} // tetap unik per index
                    value="false"
                    checked={formik.values.is_quantity_decimal === false}
                    onChange={() =>
                      formik.setFieldValue(`is_quantity_decimal`, false)
                    }
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Order Qty Non Decimal</span>
                </label>

                {/* Pilihan Decimal */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name={`isDecimal`}
                    value="true"
                    checked={formik.values.is_quantity_decimal === true}
                    onChange={() =>
                      formik.setFieldValue(`is_quantity_decimal`, true)
                    }
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Order Quantity Decimal</span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-4 md:grid-cols-2">
                <InputToggle
                  value={formik.values.machine_washer}
                  onClick={(v) => {
                    formik.setFieldValue(`machine_washer`, v);
                  }}
                  label={"Washer machine"}
                />
                <Input
                  className={
                    formik.values.machine_washer ? `` : `w-1 opacity-0`
                  }
                  label={formik.values.machine_washer ? "Time in minutes" : ""}
                  name={"washer_duration"}
                  id={"washer_duration"}
                  value={`${formik.values.washer_duration ? formik.values.washer_duration : ""}`}
                  onChange={(v) =>
                    formik.setFieldValue(`washer_duration`, parseInt(v))
                  }
                  error={
                    formik.touched.washer_duration &&
                      typeof formik.errors.washer_duration === "object" &&
                      formik.errors.washer_duration
                      ? formik.errors.washer_duration
                      : null
                  }
                />
                <InputToggle
                  value={formik.values.machine_dryer}
                  onClick={(v) => {
                    formik.setFieldValue(`machine_dryer`, v);
                  }}
                  label={"Dryer Machine"}
                />
                <Input
                  className={formik.values.machine_dryer ? `` : `w-1 opacity-0`}
                  label={formik.values.machine_dryer ? "Time in minutes" : ""}
                  name={"dryer_duration"}
                  id={"dryer_duration"}
                  value={
                    formik.values.dryer_duration
                      ? formik.values.dryer_duration
                      : ``
                  }
                  onChange={(v) =>
                    formik.setFieldValue(`dryer_duration`, parseInt(v))
                  }
                  error={
                    formik.touched.dryer_duration &&
                      typeof formik.errors.dryer_duration === "object" &&
                      formik.errors.dryer_duration
                      ? formik.errors.dryer_duration
                      : null
                  }
                />
                <InputToggle
                  value={formik.values.machine_iron}
                  onClick={(v) => {
                    formik.setFieldValue(`machine_iron`, v);
                  }}
                  label={"Iron Machine"}
                />
                <Input
                  className={formik.values.machine_iron ? `` : `w-1 opacity-0`}
                  label={formik.values.machine_iron ? "Time in minutes" : ""}
                  name={"iron_duration"}
                  id={"iron_duration"}
                  value={
                    formik.values.iron_duration
                      ? formik.values.iron_duration
                      : ""
                  }
                  onChange={(v) =>
                    formik.setFieldValue(`iron_duration`, parseInt(v))
                  }
                  error={
                    formik.touched.iron_duration &&
                      typeof formik.errors.iron_duration === "object" &&
                      formik.errors.iron_duration
                      ? formik.errors.iron_duration
                      : null
                  }
                />
              </div>
              <button
                onClick={formik.submitForm}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={isViewSkuPrices}>
        <div className="relative h-[80%] w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setIsViewSkuPrices(false);
              setAddpriceSku(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                {skuName}
              </h2>
              <nav>
                <ol className="flex items-center gap-2">
                  <li>
                    <Link className="font-medium" href="/">
                      Dashboard / Product /
                    </Link>
                  </li>
                  <li className="font-medium text-primary">SKU Price Detail</li>
                </ol>
              </nav>
            </div>
            {/* <Breadcrumb pageName={`SKU Price Detail`} /> */}
            <div className="space-y-4 rounded-lg bg-white p-4 dark:bg-gray-700 lg:flex lg:space-x-4 lg:space-y-0">
              <InputDropdown
                label={"Outlets*"}
                name={"Outlets"}
                id={"Outlets"}
                value={formik.values.outlet_id}
                onChange={(v) => formik.setFieldValue("outlet_id", v)}
                options={outlets}
                error={
                  formik.touched.outlet_id && formik.errors.outlet_id
                    ? formik.errors.outlet_id
                    : null
                }
              />
              <Input
                label={"Add Price*"}
                name={"add_price"}
                id={"add_price"}
                value={formik.values.price ? formik.values.price : ""}
                onChange={(v) => formik.setFieldValue(`price`, parseInt(v))}
                error={
                  formik.touched.price &&
                    typeof formik.errors.price === "object" &&
                    formik.errors.price
                    ? formik.errors.price
                    : null
                }
              />

              <button
                onClick={() => {
                  formik.submitForm();
                  setAddpriceSku(true);
                }}
                className="inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:w-auto lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="mt-4 h-70 overflow-y-auto">
            <Table
              colls={["#", "Outlet", "City", "Price"]}
              onPaginate={(page) => setCurrentPageProduct(page)}
              currentPage={0}
              totalItem={0}
            >
              {skuPrices.map((i, k) => (
                <tr
                  key={k}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="px-6 py-4">{k + 1}</td>
                  <td className="px-6 py-4">{i.outlet?.name}</td>
                  <td className="px-6 py-4">{i.outlet?.city.split("--")[1]}</td>
                  <td className="px-6 py-4">{rupiah(i.price)}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewSkuExclude}>
        <div className="relative h-[80%] w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setCheckedRows([])
              setIsViewSkuExclude(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                Exclude SKU
              </h2>
            </div>
            <div className="space-y-4 rounded-lg bg-white p-4 dark:bg-gray-700">
              <Input
                label={"Search Outlet"}
                name={"searchExclude"}
                id={"searchExclude"}
                value={searchExclude}
                onChange={(v) => setSearchExclude(v)}
                error={null}
              />

              <button
                onClick={() => {
                  formikExcludeSku.submitForm();
                }}
                className="inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="mt-4 h-70 overflow-y-auto px-4">
            <div className="w-full rounded-md border">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className={`px-6 py-3`}>
                      <input
                        ref={checkboxRef}
                        type="checkbox"
                        checked={allChecked}
                        data-state={allChecked ? "checked" : someChecked ? "indeterminate" : "unchecked"}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className={`px-6 py-3`}>Outlet</th>
                    <th className={`px-6 py-3`}>City</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutlets.map((i, index) => (
                    <tr key={index} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={checkedRows.includes(i.id)}
                          onChange={() => {
                            toggleRow(i.id)
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">{i.name}</td>
                      <td className="px-6 py-4">{i.city.split("--")[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
      {/* <Modal isOpen={isViewSkuExclude}>
        <div className="relative h-[80%] w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setIsViewSkuExclude(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                Exclude SKU
              </h2>
            </div>
            <div className="space-y-4 rounded-lg bg-white p-4 dark:bg-gray-700 lg:flex lg:space-x-4 lg:space-y-0">
              <InputDropdown
                label={"Outlets*"}
                name={"Outlets"}
                id={"Outlets"}
                value={formikExcludeSku.values.outlet_id}
                onChange={(v) => formikExcludeSku.setFieldValue("outlet_ids", v)}
                options={outlets}
                error={
                  formikExcludeSku.touched.outlet_id &&
                  formikExcludeSku.errors.outlet_id
                    ? formikExcludeSku.errors.outlet_id
                    : null
                }
              />

              <button
                onClick={() => {
                  formikExcludeSku.submitForm();
                }}
                className="inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:w-auto lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="mt-4 h-70 overflow-y-auto">
            <Table
              colls={["#", "Outlet", "City", "Action"]}
              onPaginate={(page) => setCurrentPageProduct(page)}
              currentPage={0}
              totalItem={0}
            >
              {excludes.map((i: any, k: number) => (
                <tr
                  key={k}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="px-6 py-4">{k + 1}</td>
                  <td className="px-6 py-4">{i.outlet?.name}</td>
                  <td className="px-6 py-4">{i.outlet?.city.split("--")[1]}</td>
                  <td className="px-6 py-4">
                    <div className="group relative">
                      <button
                        onClick={() => {
                          setDeleteModal(true)
                          setDeleteFunction(() => () => removeExclude(i.id));
                          setRefresh(!refresh);
                        }}
                      >
                        <FiTrash size={18} />
                      </button>
                      <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                        Remove Exclude
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      </Modal> */}

      <Modal isOpen={false}>
        <div className="relative h-min w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setAddpriceSku(false);
              formik.setFieldValue("outlet_id", "");
              formik.setFieldValue("sku_id", "");
              formik.setFieldValue("price", "");
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={`Add SKU Price`} />
          </div>

          <div className="">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
              <InputDropdown
                label={"Outlets*"}
                name={"Outlets"}
                id={"Outlets"}
                value={formik.values.outlet_id}
                onChange={(v) => formik.setFieldValue("outlet_id", v)}
                options={outlets}
                error={
                  formik.touched.outlet_id && formik.errors.outlet_id
                    ? formik.errors.outlet_id
                    : null
                }
              />

              <Input
                label={"Price*"}
                name={"price"}
                id={"price"}
                value={formik.values.price ? formik.values.price : ""}
                onChange={(v) => formik.setFieldValue(`price`, parseInt(v))}
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
              onClick={formik.submitForm}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>

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
              onClick={() => {
                deleteFunction();
              }}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setDeleteModal(false);
              }}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-red px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
