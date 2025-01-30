"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Input, InputDropdown, InputToggle } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { Area } from "@/contexts/selectOutletContex";
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

export default function OutletPage() {
  const [outlets, setOutlets] = useState<Area[]>([]);
  const [mapingGroupOutlet, setMapingGroupOutlet] = useState<GroupingType[]>([]);
  const [mapingGroupArea, setMapingGroupArea] = useState<GroupingType[]>([]);
  const [areas, setAreas] = useState<any[]>([])
  const auth = useSelector((s: RootState) => s.auth);
  const [totalOutlet, setTotalOutlet] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [areaModal, setAreaModal] = useState<boolean>(false)
  const [groupingModal, setGroupingModal] = useState<boolean>(false)
  const [createOrUpdate, setCreateOrUpdate] = useState<boolean>(true)
  const CELLS = [
    "Name",
    // "Email",
    "Phone",
    // "Address",
    // "Location",
    "Status",
    "Action",
  ];

  const [search, setSearch] = useState<string>("");
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter();

  function findOutletByNameSubstring(nameSubstring: string): Area[] {
    const results: Area[] = [];

    for (const area of outlets) {
      for (const outlet of area.outlets) {
        if (outlet.name.toLowerCase().includes(nameSubstring.toLowerCase())) {
          const checkArea = results.findIndex(f => f.area_id === area.area_id)
          if (checkArea <= -1) {
            results.push({
              area_id: area.area_id,
              area: area.area,
              outlets: [outlet],
            });
          } else {
            Object.assign(results[checkArea], {
              ...results[checkArea],
              outlets: results[checkArea].outlets.concat([outlet])
            })
          }
        }
      }
    }

    return results;
  }
  function filterOutlet() {
    if (search.length >= 3)
      return findOutletByNameSubstring(search);
    return outlets
  }

  useEffect(() => {
    const GotGroupingOutlets = async () => {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet/got/forme",
        token: `${auth.auth.access_token}`
      })

      if (res?.statusCode === 200) {
        const maping: Area[] = []
        for (const i of res.data) {
          let areaId = null;
          let areaName = "Without Area";
          if (i.outlet_area_grouping) {
            areaId = i.outlet_area_grouping.outlet_area.id
            areaName = i.outlet_area_grouping.outlet_area.name
          }

          const city = i.city.split("--")
          const checkArea = maping.findIndex(f => f.area_id === areaId)
          const outlet = { outlet_id: i.id, name: i.name, phone: i.dial_code + i.phone_number, is_deleted: i.is_deleted }

          const outletGrouping: any = {
            area_id: areaId,
            area: areaName,
            outlets: [outlet]
          }
          if (checkArea <= -1) {
            maping.push(outletGrouping);
          } else {
            Object.assign(maping[checkArea], {
              ...maping[checkArea],
              outlets: maping[checkArea].outlets.concat([outlet])
            })
          }
        }
        setOutlets(maping)
        // console.log(outlets);
        // console.log(res.data);

      }
    }
    const GotAreas = async () => {
      let urlwithQuery = `/api/outlet/area/get-areas`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        setAreas(res.data);
      }
    };

    GotGroupingOutlets();
    GotAreas()
  }, [groupingModal, outlets, currentPage, areaModal, fixValueSearch, refresh, auth.auth.access_token, router]);

  useEffect(() => {
    const GotGroupingOutlets = async () => {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet/got/forme",
        token: `${auth.auth.access_token}`
      })

      if (res?.statusCode === 200) {
        const mapingOutlet: any = []
        for (const i of res.data) {
          let label = null;
          let value = null;
          if (!i.outlet_area_grouping) {
            value = i.name
            label = i.id
          }
          const data = {
            value: label,
            label: value
          }
          if (data.label) {
            mapingOutlet.push(data)
            formikGrouping.setFieldValue(`groupings[${0}].outlet_id`, mapingOutlet[0].value)
          }
        }
        setMapingGroupOutlet(mapingOutlet)
      }
    }

    const GotGroupingAreas = async () => {
      let urlwithQuery = `/api/outlet/area/get-areas`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const mapingArea = (res.data).map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      })

      if (mapingArea.length >= 1) {
        formikGrouping.setFieldValue(`groupings[${0}].outlet_area_id`, mapingArea[0].value)
        setMapingGroupArea(mapingArea)
        // console.log(mapingArea);
      }
    };
    GotGroupingOutlets();
    GotGroupingAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupingModal])

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

  const formik = useFormik({
    initialValues: {
      name: "",
      area_id: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Area name shouldn't empty"),
    }),
    onSubmit: async (values) => {

      let data: any = values
      let url = "api/outlet/create-or-update-area"
      console.log(url);
      console.log(values);

      if (values.area_id != "" && values.name != "") {
        data = {
          name: values.name,
          id: values.area_id
        }
      }

      const res = await PostWithToken<MyResponse>({
        router: router,
        url: url,
        data: data,
        token: `${auth.auth.access_token}`
      })
      console.log(res.data);

      if (res?.statusCode === 200) {
        toast.success("Data changed success!");
        setAreaModal(false)
        formik.setFieldValue("name", "")
        formik.setFieldValue("area_id", "")
      }
    },
  })

  const formikGrouping = useFormik({
    initialValues: {
      groupings: [
        {
          outlet_id: "",
          outlet_area_id: "",
        },
      ],
    },
    validationSchema: Yup.object({
      groupings: Yup.array().of(
        Yup.object({
          outlet_id: Yup.string(),
          outlet_area_id: Yup.string(),
        })
      ),
    }),
    onSubmit: async (values) => {
      console.log(values);


      const checkDuplicate = hasDuplicateOutletId(values.groupings)
      console.log(checkDuplicate);

      if (checkDuplicate) return toast.warning("Forbidden to grouping same outlet, check your form and retry to submit")

      let url = "api/outlet/gouping-outlet"
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: url,
        data: values,
        token: `${auth.auth.access_token}`
      })
      if (res?.statusCode === 200) {
        toast.success("Data changed success!");
        setAreaModal(false)
        // formik.setFieldValue("name", "")
        // formik.setFieldValue("area_id", "")
        resetVariantGroup()
        setGroupingModal(false)
      }
    },
  })
  const deleteArea = async (id: any) => {
    const userConfirmed = window.confirm("Are you sure you want to delete this Area?");
    if (!userConfirmed) {
      return;
    }
    const data = {
      area_id: id
    }
    console.log(data);

    const res = await PostWithToken<MyResponse>({
      router: router,
      url: "api/outlet/remove-area",
      data: data,
      token: `${auth.auth.access_token}`
    })
    if (res?.statusCode === 200) {
      toast.success("Data changed success!");
      formik.setFieldValue("name", "")
      formik.setFieldValue("area_id", "")
      setRefresh(true)
    }

  }
  const hasDuplicateOutletId = (groupings: any) => {
    const outletIds = groupings.map((item: any) => item.outlet_id);
    return new Set(outletIds).size !== outletIds.length;
  };

  const addVariantGroup = (index: any) => {
    if (index <= mapingGroupOutlet.length) {
      formikGrouping.setFieldValue('groupings', [
        ...formikGrouping.values.groupings,
        {
          outlet_id: mapingGroupOutlet[index].value,
          outlet_area_id: mapingGroupArea[0].value,
        },
      ]);
      console.log(formikGrouping.values);
    }

  };

  const removeVariantGroup = (index: any) => {
    const groupings = [...formikGrouping.values.groupings];
    groupings.splice(index, 1);
    formikGrouping.setFieldValue('groupings', groupings);
  };
  const resetVariantGroup = () => {
    const groupings = [...formikGrouping.values.groupings];
    groupings.splice(1, groupings.length);
    formikGrouping.setFieldValue('groupings', groupings);
  };

  return (
    <>
      <Breadcrumb pageName="Outlet" />
      <div className="w-full bg-white  dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row w-full md:space-x-4">
          <div className="lg:w-90">
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
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white dark:text-gray-400 hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Search
          </button>
          <Link
            href={"/outlet/create"}
            className={`${auth.role.name !== ERoles.PROVIDER && auth.role.name && ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white dark:text-gray-400
            hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            Create Outlet
          </Link>
        </div>
      </div>


      <Table
        colls={CELLS}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={0}
        totalItem={0}
      >
        {filterOutlet().map((i, k) => (
          <React.Fragment key={k}>
            <tr key={k} className="text-center border-b bg-gray-200 dark:bg-boxdark hover:bg-gray-100 dark:border-gray-700 
                   dark:hover:bg-gray-600">
              <td colSpan={5} className="font-bold whitespace-nowrap px-6 py-4">{i.area}</td>
            </tr>
            {i.outlets.map((o: any, key) => {
              return (
                <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
                  dark:bg-gray-800 dark:hover:bg-gray-600"
                  key={key}>
                  <td className="whitespace-nowrap px-6 py-4">{o.name}</td>
                  <td className="whitespace-nowrap px-6 py-4">{o.phone}</td>
                  <td className="px-6 py-4">
                    {o.is_deleted ? (
                      <p className="text-red uppercase font-bold">Inactive</p>
                    ) : (
                      <p className="text-green-500 uppercase font-bold">Active</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className=" relative group">
                      <button
                        onClick={() => {
                          router.push(`/outlet/${o.outlet_id}`);
                        }}
                        className="flex items-center"
                      >
                        <FiEdit size={23} />
                      </button>
                      <div className="absolute opacity-85 bottom-[70%] transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1">
                        Edit Outlet
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </React.Fragment>
        ))}
      </Table>

      <Modal isOpen={areaModal}>
        <div className="relative bg-white dark:bg-boxdark shadow rounded-md w-[90%] md:w-[50%] p-4">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              formik.setFieldValue("name", "")
              formik.setFieldValue("area_id", "")
              setAreaModal(false)
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={createOrUpdate ? `Create Area` : `Edit Area`} />
          </div>

          <div className="gap-y-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6">
              <Input
                label={"Area Name*"}
                name={"area_name"}
                id={"area_name"}
                value={formik.values.name ? formik.values.name : ""}
                onChange={(v) => formik.setFieldValue("name", v)}
                error={
                  formik.touched.name && formik.errors.name
                    ? formik.errors.name
                    : null
                }
              />
            </div>

            <button
              onClick={formik.submitForm}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 mt-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
              Submit
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={groupingModal}>
        <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-min w-[90%] md:w-[50%] p-4 ">
          <div
            className="z-50 absolute -top-3 -right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
            onClick={() => {
              setGroupingModal(false)
              resetVariantGroup()
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={`Grouping outlet`} />
          </div>

          <div className="gap-y-6 ">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 max-h-80 overflow-y-scroll">
              {formikGrouping.values.groupings.map((group, index) => (
                <div key={index} className="relative space-y-6 p-4 bg-gray-50 rounded-md">
                  <div
                    className={index == 0 ? `hidden` : `z-50 absolute right-4 top-2 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer`}
                    onClick={() => { removeVariantGroup(index) }}
                  >
                    <IoCloseOutline color="white" size={20} />
                  </div>
                  <InputDropdown
                    label={"Outlet"}
                    name={"outlet_id"}
                    id={"outlet_id"}
                    value={formikGrouping.values.groupings[index].outlet_id}
                    onChange={(v) => formikGrouping.setFieldValue(`groupings[${index}].outlet_id`, v)}
                    options={mapingGroupOutlet.filter(
                      (option) =>
                        !formikGrouping.values.groupings.some(
                          (group) => group.outlet_id === option.value
                        ) || formikGrouping.values.groupings[index].outlet_id === option.value
                    )}
                    error={
                      formikGrouping.touched.groupings?.[index]?.outlet_id &&
                        (typeof formikGrouping.errors.groupings?.[index] === 'object' && formikGrouping.errors.groupings[index]?.outlet_id)
                        ? formikGrouping.errors.groupings[index]?.outlet_id
                        : null
                    }
                  />
                  <InputDropdown
                    label={"Area"}
                    name={"outlet_area_id"}
                    id={"outlet_area_id"}
                    value={formikGrouping.values.groupings[index].outlet_area_id}
                    onChange={(v) => formikGrouping.setFieldValue(`groupings[${index}].outlet_area_id`, v)}
                    options={mapingGroupArea}
                    error={
                      formikGrouping.touched.groupings?.[index]?.outlet_area_id &&
                        (typeof formikGrouping.errors.groupings?.[index] === 'object' && formikGrouping.errors.groupings[index]?.outlet_area_id)
                        ? formikGrouping.errors.groupings[index]?.outlet_area_id
                        : null
                    }
                  />
                </div>
              ))}
            </div>
            <div className="">
              <button
                onClick={() => { addVariantGroup(formikGrouping.values.groupings.length) }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-2 mt-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
                Add form
              </button>
            </div>
            <div className="w-full">
              <button
                onClick={formikGrouping.submitForm}
                className="w-full inline-flex items-center justify-center rounded-md bg-black px-10 py-2 mt-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
                Submit
              </button>
            </div>

          </div>
        </div>
      </Modal>
    </>
  );
}
