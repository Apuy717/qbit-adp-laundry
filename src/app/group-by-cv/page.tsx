"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  Input,
  InputDropdown,
  InputToggle,
} from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { Area, OutletType } from "@/contexts/selectOutletContex";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaLocationDot, FaLocationPin } from "react-icons/fa6";
import { FiDelete, FiEdit, FiTrash } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { LuGroup } from "react-icons/lu";
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

interface GroupingType {
  label: "";
  value: "";
}
export type CV = {
  cv_id: string | null;
  cv: string | null;
  outlets: OutletType[];
};
export default function OutletPage() {
  enum TabActive {
    OUTLETS = "OUTLETS",
    CV = "CV",
  }

  const [tabActive, setTabActive] = useState<TabActive>(TabActive.OUTLETS);
  const [outlets, setOutlets] = useState<CV[]>([]);
  const [cvItems, setCvItems] = useState<any[]>([]);
  const [mapingGroupOutlet, setMapingGroupOutlet] = useState<GroupingType[]>(
    [],
  );
  const [mapingUngroupOutlet, setMapingUngroupOutlet] = useState<
    GroupingType[]
  >([]);
  const [mapingGroupCv, setMapingGroupCv] = useState<GroupingType[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const auth = useSelector((s: RootState) => s.auth);
  const [totalOutlet, setTotalOutlet] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [newCvModal, setNewCvModal] = useState<boolean>(false);
  const [updateCvModal, setUpdateCvModal] = useState<boolean>(false);
  const [ungroupingModal, setUngroupingModal] = useState<boolean>(false);
  const [groupingModal, setGroupingModal] = useState<boolean>(false);
  const [createOrUpdate, setCreateOrUpdate] = useState<boolean>(true);
  const CELLS = ["Name", "Phone", "Status", "Action"];

  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter();

  function findOutletByNameSubstring(nameSubstring: string): CV[] {
    const results: CV[] = [];

    for (const area of outlets) {
      for (const outlet of area.outlets) {
        if (outlet.name.toLowerCase().includes(nameSubstring.toLowerCase())) {
          const checkArea = results.findIndex((f) => f.cv_id === area.cv_id);
          if (checkArea <= -1) {
            results.push({
              cv_id: area.cv_id,
              cv: area.cv,
              outlets: [outlet],
            });
          } else {
            Object.assign(results[checkArea], {
              ...results[checkArea],
              outlets: results[checkArea].outlets.concat([outlet]),
            });
          }
        }
      }
    }

    return results;
  }
  function filterOutlet() {
    if (search.length >= 3) return findOutletByNameSubstring(search);
    return outlets;
  }

  useEffect(() => {
    const GotGroupingOutlets = async () => {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet/got/forme",
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        const maping: CV[] = [];
        for (const i of res.data) {
          let cvId = null;
          let cvName = "Without CV Group";
          if (i.outlet_grouping) {
            cvId = i.outlet_grouping.outlet_grouping_master.id;
            cvName = i.outlet_grouping.outlet_grouping_master.name;
          }

          const city = i.city.split("--");
          const checkArea = maping.findIndex((f) => f.cv_id === cvId);
          const outlet = {
            outlet_id: i.id,
            name: i.name,
            phone: i.dial_code + i.phone_number,
            is_deleted: i.is_deleted,
          };

          const outletGrouping: any = {
            cv_id: cvId,
            cv: cvName,
            outlets: [outlet],
          };
          if (checkArea <= -1) {
            maping.push(outletGrouping);
          } else {
            Object.assign(maping[checkArea], {
              ...maping[checkArea],
              outlets: maping[checkArea].outlets.concat([outlet]),
            });
          }
        }
        setOutlets(maping);
      }
    };
    const GotCv = async () => {
      let urlwithQuery = `/api/outlet-grouping/groups`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      if (res.statusCode === 200) {
        setCvItems(res.data);
      }
    };

    GotGroupingOutlets();
    GotCv();
  }, [
    ungroupingModal,
    groupingModal,
    currentPage,
    newCvModal,
    updateCvModal,
    fixValueSearch,
    refresh,
    auth.auth.access_token,
    router,
  ]);

  useEffect(() => {
    const GotGroupingOutlets = async () => {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet/got/forme",
        token: `${auth.auth.access_token}`,
      });

      const mapingOutlet = res.data.map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      });

      if (mapingOutlet.length >= 1) {
        setMapingGroupOutlet(mapingOutlet);
      }
    };

    const GotGroupingCv = async () => {
      let urlwithQuery = `/api/outlet-grouping/groups`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const mapingCv = res.data.map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      });

      if (mapingCv.length >= 1) {
        formikGrouping.setFieldValue(
          `groupings[${0}].outlet_goruping_master_id`,
          mapingCv[0].value,
        );
        setMapingGroupCv(mapingCv);
      }
    };
    GotGroupingOutlets();
    GotGroupingCv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCvModal]);

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

  const formikNewCv = useFormik({
    initialValues: {
      name: "",
      is_deleted: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Area name shouldn't empty"),
    }),
    onSubmit: async (values) => {
      let data: any = values;
      let url = "api/outlet-grouping/group/create-update";
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: url,
        data: data,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        toast.success("Data changed success!");
        setNewCvModal(false);
        formikNewCv.setFieldValue("name", "");
      }
    },
  });
  const formikUpdateCv = useFormik({
    initialValues: {
      id: "",
      name: "",
      is_deleted: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Area name shouldn't empty"),
    }),
    onSubmit: async (values) => {
      let data: any = values;
      let url = "api/outlet-grouping/group/create-update";
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: url,
        data: data,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        toast.success("Data changed success!");
        setUpdateCvModal(false);
        formikUpdateCv.setFieldValue("id", "");
        formikUpdateCv.setFieldValue("name", "");
      }
    },
  });

  const formikGrouping = useFormik({
    initialValues: {
      groupings: [
        {
          outlet_id: "",
          outlet_goruping_master_id: "",
        },
      ],
    },
    validationSchema: Yup.object({
      groupings: Yup.array().of(
        Yup.object({
          outlet_id: Yup.string(),
          outlet_goruping_master_id: Yup.string(),
        }),
      ),
    }),
    onSubmit: async (values) => {

      const checkDuplicate = hasDuplicateOutletId(values.groupings);

      if (checkDuplicate)
        return toast.warning(
          "Forbidden to grouping same outlet, check your form and retry to submit",
        );

      let url = "api/outlet-grouping/group/set";
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: url,
        data: values,
        token: `${auth.auth.access_token}`,
      });
      if (res?.statusCode === 200) {
        toast.success("Data changed success!");
        setNewCvModal(false);
        resetVariantGroup();
        setUngroupingModal(false);
      }
    },
  });
  const formikUpdateGrouping = useFormik({
    initialValues: {
      outlet_id: "",
      outlet_goruping_master_id: "",
    },
    validationSchema: Yup.object({
      outlet_id: Yup.string(),
      outlet_goruping_master_id: Yup.string(),
    }),
    onSubmit: async (values) => {

      let url = "api/outlet-grouping/group/change";
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: url,
        data: values,
        token: `${auth.auth.access_token}`,
      });
      if (res?.statusCode === 200) {
        toast.success("Data changed success!");
        setNewCvModal(false);
        resetVariantGroup();
        setGroupingModal(false);
      }
    },
  });
  const deleteCv = async (id: any) => {
    const userConfirmed = window.confirm(
      "Are you sure you want to delete this CV?",
    );
    if (!userConfirmed) {
      return;
    }
    const res = await fetch(`api/outlet-grouping/group/delete/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${auth.auth.access_token}`,
      },
    });
    if (res?.status === 200) {
      toast.success("Data changed success!");
      formikNewCv.setFieldValue("name", "");
      setRefresh(true);
    }
  };

  const hasDuplicateOutletId = (groupings: any) => {
    const outletIds = groupings.map((item: any) => item.outlet_id);
    return new Set(outletIds).size !== outletIds.length;
  };

  const addVariantGroup = (index: any) => {
    if (index <= mapingGroupOutlet.length) {
      formikGrouping.setFieldValue("groupings", [
        ...formikGrouping.values.groupings,
        {
          outlet_id: mapingGroupOutlet[index].value,
          outlet_area_id: mapingGroupCv[0].value,
        },
      ]);
    }
  };

  const removeVariantGroup = (index: any) => {
    const groupings = [...formikGrouping.values.groupings];
    groupings.splice(index, 1);
    formikGrouping.setFieldValue("groupings", groupings);
  };
  const resetVariantGroup = () => {
    const groupings = [...formikGrouping.values.groupings];
    groupings.splice(1, groupings.length);
    formikGrouping.setFieldValue("groupings", groupings);
  };

  return (
    <div className="dark:min-h-screen">
      <Breadcrumb pageName="Group by CV" />
      <div className={`${auth.role.name !== ERoles.PROVIDER && auth.role.name !== ERoles.SUPER_ADMIN && "hidden"} w-full bg-white  dark:bg-boxdark p-4 mb-4 rounded-t`}>
        <div className="flex w-full flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
          <button
            onClick={() => setNewCvModal(true)}
            className={`${auth.role.name !== ERoles.PROVIDER && auth.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90
            dark:text-gray-400 lg:px-8 xl:px-10`}
          >
            Create New CV
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
              ${
                tabActive === TabActive.OUTLETS
                  ? "border-blue-500 text-blue-500"
                  : "dark:border-form-strokedark"
              }
              `}
              onClick={() => setTabActive(TabActive.OUTLETS)}
            >
              {TabActive.OUTLETS}
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              className={`inline-block rounded-t-lg border-b-2 p-4 
              ${
                tabActive === TabActive.CV
                  ? "border-blue-500 text-blue-500"
                  : "dark:border-form-strokedark"
              }
              `}
              onClick={() => setTabActive(TabActive.CV)}
            >
              {TabActive.CV}
            </button>
          </li>
        </ul>
      </div>

      <div
        className={
          tabActive == TabActive.OUTLETS ? `dark:min-h-screen` : `hidden`
        }
      >
        <Table
          colls={CELLS}
          onPaginate={(page) => setCurrentPage(page)}
          currentPage={0}
          totalItem={0}
        >
          {filterOutlet().map((i, k) => (
            <React.Fragment key={k}>
              <tr
                key={k}
                className="border-b bg-gray-200 text-center hover:bg-gray-100 dark:border-gray-700 dark:bg-boxdark 
                   dark:hover:bg-gray-600"
              >
                <td
                  colSpan={5}
                  className="whitespace-nowrap px-6 py-4 font-bold"
                >
                  {i.cv}
                </td>
              </tr>
              {i.outlets.map((o: any, key) => {
                return (
                  <tr
                    className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
                  dark:bg-gray-800 dark:hover:bg-gray-600"
                    key={key}
                  >
                    <td className="whitespace-nowrap px-6 py-4">{o.name}</td>
                    <td className="whitespace-nowrap px-6 py-4">{o.phone}</td>
                    <td className="px-6 py-4">
                      {o.is_deleted ? (
                        <p className="font-bold uppercase text-red">Inactive</p>
                      ) : (
                        <p className="font-bold uppercase text-green-500">
                          Active
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className=" group relative">
                        <button
                          onClick={() => {
                            if (i.cv_id) {
                              formikUpdateGrouping.setFieldValue(
                                `outlet_id`,
                                o.outlet_id,
                              );
                              formikUpdateGrouping.setFieldValue(
                                `outlet_goruping_master_id`,
                                i.cv_id,
                              );
                              setGroupingModal(true);
                            } else {
                              formikGrouping.setFieldValue(
                                `groupings[${0}].outlet_id`,
                                o.outlet_id,
                              );
                              formikGrouping.setFieldValue(
                                `groupings[${0}].outlet_goruping_master_id`,
                                mapingGroupCv[0].value,
                              );
                              setUngroupingModal(true);
                            }
                          }}
                          className="flex items-center"
                        >
                          <LuGroup size={23} />
                        </button>
                        <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                          Group by CV
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </Table>
      </div>

      <div
        className={tabActive == TabActive.CV ? `dark:min-h-screen` : `hidden`}
      >
        <Table
          colls={["NAME", "CREATED AT", "LAST UPDATED", "ACTION"]}
          onPaginate={(page) => setCurrentPage(page)}
          currentPage={0}
          totalItem={0}
        >
          {cvItems?.map((i, index) => (
            <tr
              key={index}
              className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
            >
              <td className="px-6 py-4">{i.name}</td>
              <td className="px-6 py-4">
                {new Date(i.created_at).toLocaleDateString("id", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </td>
              <td className="px-6 py-4">
                {new Date(i.updated_at).toLocaleDateString("id", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </td>
              <td className="px-6 py-4">
                <div className=" flex flex-row items-center space-x-2">
                  <div className="group relative">
                    <button
                      onClick={() => {
                        formikUpdateCv.setFieldValue("id",i.id) 
                        formikUpdateCv.setFieldValue("name",i.name) 
                        setUpdateCvModal(true)
                      }}
                    >
                      <FiEdit size={23} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      Edit CV
                    </div>
                  </div>
                  <div className="group relative">
                    <button
                      onClick={() => {
                        deleteCv(i.id);
                        setRefresh(!refresh);
                      }}
                    >
                      <FiTrash size={23} />
                    </button>
                    <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                      Delete CV
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal isOpen={newCvModal}>
        <div className="relative w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              formikNewCv.setFieldValue("name", "");
              setNewCvModal(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb
              pageName={createOrUpdate ? `Create New CV` : `Edit New CV`}
            />
          </div>

          <div className="gap-y-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6">
              <Input
                label={"CV Name*"}
                name={"CV_name"}
                id={"CV_name"}
                value={formikNewCv.values.name ? formikNewCv.values.name : ""}
                onChange={(v) => formikNewCv.setFieldValue("name", v)}
                error={
                  formikNewCv.touched.name && formikNewCv.errors.name
                    ? formikNewCv.errors.name
                    : null
                }
              />
            </div>

            <button
              onClick={formikNewCv.submitForm}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={updateCvModal}>
        <div className="relative w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              formikUpdateCv.setFieldValue("name", "");
              setUpdateCvModal(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb
              pageName={createOrUpdate ? `Create New CV` : `Edit New CV`}
            />
          </div>

          <div className="gap-y-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6">
              <Input
                label={"CV Name*"}
                name={"CV_name"}
                id={"CV_name"}
                value={
                  formikUpdateCv.values.name ? formikUpdateCv.values.name : ""
                }
                onChange={(v) => formikUpdateCv.setFieldValue("name", v)}
                error={
                  formikUpdateCv.touched.name && formikUpdateCv.errors.name
                    ? formikUpdateCv.errors.name
                    : null
                }
              />
            </div>

            <button
              onClick={formikUpdateCv.submitForm}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={groupingModal}>
        <div className="relative h-min w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%] ">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setGroupingModal(false);
              resetVariantGroup();
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={`Grouping outlet`} />
          </div>

          <div className="gap-y-6 ">
            <div className="grid max-h-80 grid-cols-1 gap-x-4 gap-y-6 overflow-y-scroll">
              <div className="relative space-y-6 rounded-md bg-gray-50 dark:bg-black p-4">
                {/* <InputDropdown
                  label={"Outlet"}
                  name={"outlet_id"}
                  id={"outlet_id"}
                  value={formikUpdateGrouping.values.outlet_id}
                  onChange={(v) =>
                    formikUpdateGrouping.setFieldValue(`outlet_id`, v)
                  }
                  options={mapingGroupOutlet}
                  error={
                    formikUpdateGrouping.touched.outlet_id &&
                    formikUpdateGrouping.errors.outlet_id
                      ? formikUpdateGrouping.errors.outlet_id
                      : null
                  }
                /> */}
                <InputDropdown
                  label={"CV"}
                  name={"outlet_goruping_master_id"}
                  id={"outlet_goruping_master_id"}
                  value={formikUpdateGrouping.values.outlet_goruping_master_id}
                  onChange={(v) =>
                    formikUpdateGrouping.setFieldValue(
                      `outlet_goruping_master_id`,
                      v,
                    )
                  }
                  options={mapingGroupCv}
                  error={
                    formikUpdateGrouping.touched.outlet_goruping_master_id &&
                    formikUpdateGrouping.errors.outlet_goruping_master_id
                      ? formikUpdateGrouping.errors.outlet_goruping_master_id
                      : null
                  }
                />
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={formikUpdateGrouping.submitForm}
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal isOpen={ungroupingModal}>
        <div className="relative h-min w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%] ">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setUngroupingModal(false);
              resetVariantGroup();
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={`Grouping outlet`} />
          </div>

          <div className="gap-y-6 ">
            <div className="grid max-h-80 grid-cols-1 gap-x-4 gap-y-6 overflow-y-scroll">
              {formikGrouping.values.groupings.map((group, index) => (
                <div
                  key={index}
                  className="relative space-y-6 rounded-md bg-gray-50 dark:bg-black p-4"
                >
                  <div
                    className={
                      index == 0
                        ? `hidden`
                        : `absolute right-4 top-2 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow`
                    }
                    onClick={() => {
                      removeVariantGroup(index);
                    }}
                  >
                    <IoCloseOutline color="white" size={20} />
                  </div>
                  {/* <InputDropdown
                    label={"Outlet"}
                    name={"outlet_id"}
                    id={"outlet_id"}
                    value={formikGrouping.values.groupings[index].outlet_id}
                    onChange={(v) =>
                      formikGrouping.setFieldValue(
                        `groupings[${index}].outlet_id`,
                        v,
                      )
                    }
                    options={mapingGroupOutlet.filter(
                      (option) =>
                        !formikGrouping.values.groupings.some(
                          (group) => group.outlet_id === option.value,
                        ) ||
                        formikGrouping.values.groupings[index].outlet_id ===
                          option.value,
                    )}
                    error={
                      formikGrouping.touched.groupings?.[index]?.outlet_id &&
                      typeof formikGrouping.errors.groupings?.[index] ===
                        "object" &&
                      formikGrouping.errors.groupings[index]?.outlet_id
                        ? formikGrouping.errors.groupings[index]?.outlet_id
                        : null
                    }
                  /> */}
                  <InputDropdown
                    label={"CV"}
                    name={"outlet_goruping_master_id"}
                    id={"outlet_goruping_master_id"}
                    value={
                      formikGrouping.values.groupings[index]
                        .outlet_goruping_master_id
                    }
                    onChange={(v) =>
                      formikGrouping.setFieldValue(
                        `groupings[${index}].outlet_goruping_master_id`,
                        v,
                      )
                    }
                    options={mapingGroupCv}
                    error={
                      formikGrouping.touched.groupings?.[index]
                        ?.outlet_goruping_master_id &&
                      typeof formikGrouping.errors.groupings?.[index] ===
                        "object" &&
                      formikGrouping.errors.groupings[index]
                        ?.outlet_goruping_master_id
                        ? formikGrouping.errors.groupings[index]
                            ?.outlet_goruping_master_id
                        : null
                    }
                  />
                </div>
              ))}
            </div>
            {/* <div className="">
              <button
                onClick={() => {
                  addVariantGroup(formikGrouping.values.groupings.length);
                }}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Add form
              </button>
            </div> */}
            <div className="w-full">
              <button
                onClick={formikGrouping.submitForm}
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
