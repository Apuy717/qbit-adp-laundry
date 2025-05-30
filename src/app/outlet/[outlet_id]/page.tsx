"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import {
  Input,
  InputDropdown,
  InputTextArea,
  InputToggle,
} from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GET, GetWithToken, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import { ERoles } from "@/types/Roles";
import CountryList from "country-list-with-dial-code-and-flag";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CiCircleAlert } from "react-icons/ci";
import { FaArrowLeft } from "react-icons/fa";
import { FiEdit, FiTrash } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

interface iResponseOutlet {
  statusCode: number;
  msg: string;
  data: Outlet;
  err: string | string[];
}

interface iResponseAddress {
  statusCode: number;
  msg: string;
  data: any;
  err: string | string[];
}

interface iDropdown {
  label: string;
  value: string;
}
[];

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  err: string | string[];
}

export default function UpdateOutlet({
  params,
}: {
  params: { outlet_id: string };
}) {
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [areaModal, setAreaModal] = useState<boolean>(false);
  const [mapingGroupArea, setMapingGroupArea] = useState<any[]>([]);
  const credential = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [refresh, setRefresh] = useState<boolean>(false);

  const [province, setProvince] = useState<iDropdown[]>([]);
  const [city, setCity] = useState<iDropdown[]>([]);
  const [subdistrict, setSubDistrict] = useState<iDropdown[]>([]);
  const [countrys, setCountrys] = useState<iDropdown[]>([]);
  const [dialCodes, setDialCodes] = useState<iDropdown[]>([]);
  const [dateComponent, setDateCompnent] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteFunction, setDeleteFunction] = useState<() => void>(
    () => () => {},
  );

  let startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  let endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() + 1,
  );

  endOfMonth.setHours(6, 59, 59, 0);
  const offsetInMinutes = 7 * 60;
  startOfMonth = new Date(startOfMonth.getTime() + offsetInMinutes * 60 * 1000);

  const [startDate, setStartDate] = useState<Date | string>(
    startOfMonth.toISOString().split(".")[0],
  );
  const [endDate, setEndDate] = useState<Date | string>(
    endOfMonth.toISOString().split(".")[0],
  );

  useEffect(() => {
    async function GotDetailOutlet(isupdate: boolean) {
      const res = await GetWithToken<iResponseOutlet>({
        router: router,
        url: `/api/outlet/${params.outlet_id}`,
        token: `${credential.auth.access_token}`,
      });

      if (res.statusCode === 404) toast.warning("Outlet not found, try again!");

      formik.setFieldValue("id", res.data.id);
      formik.setFieldValue("name", res.data.name);
      // formik.setFieldValue("country", res.data.country)
      if (res.data.outlet_area_grouping !== null) {
        formik.setFieldValue(
          "area_id",
          res.data.outlet_area_grouping.outlet_area.id,
        );
      }
      formik.setFieldValue("province", res.data.province);
      formik.setFieldValue("city", res.data.city);
      formik.setFieldValue("district", res.data.district);
      // formik.setFieldValue("postal_code", res.data.postal_code)
      formik.setFieldValue("address", res.data.address);
      formik.setFieldValue("dial_code", res.data.dial_code);
      formik.setFieldValue("phone_number", res.data.phone_number);
      formik.setFieldValue("email", res.data.email);
      formik.setFieldValue("is_deleted", res.data.is_deleted);
      formik.setFieldValue("total_washer", res.data.total_washer);
      formik.setFieldValue("total_dryer", res.data.total_dryer);
      formik.setFieldValue("opening_schedule", res.data.opening_schedule);
      setOutlet(res.data);
      setDateCompnent(true);
      console.log(res.data);

      if (res.data.province && res.data.province.split("--").length >= 2)
        GotCity(res.data.province.split("--")[0], isupdate);

      if (res.data.city && res.data.city.split("--").length >= 2)
        GotSubDistrict(res.data.city.split("--")[0], isupdate);

      setLoading(false);
    }

    async function GotProvince(isupdate: boolean) {
      const res = await GET<iResponseAddress>({ url: "/api/address/province" });
      if (
        res.statusCode === 200 &&
        res?.data?.rajaongkir &&
        res?.data?.rajaongkir?.results
      ) {
        const maping = (
          res?.data?.rajaongkir?.results as {
            province: string;
            province_id: string;
          }[]
        ).map((i) => {
          return {
            label: i.province,
            value: `${i.province_id}--${i.province}`,
          };
        });
        if (formik.values.province) {
          formik.setFieldValue("province", formik.values.province);
        }
        setProvince(maping);
        GotDetailOutlet(isupdate);
      }
    }

    const country = CountryList.getAll();
    country.map((i) => {
      setDialCodes((old) => [
        ...old,
        { label: `${i.code} ${i.dial_code}`, value: i.dial_code },
      ]);
      setCountrys((old) => [...old, { label: i.name, value: i.name }]);
    });

    GotProvince(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const GotAreas = async () => {
      let urlwithQuery = `/api/outlet/area/get-areas`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${credential.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        setAreas(res.data);
      }
    };

    const GotGroupingAreas = async () => {
      let urlwithQuery = `/api/outlet/area/get-areas`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${credential.auth.access_token}`,
      });
      const mapingArea = res.data.map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      });

      if (mapingArea.length >= 1) {
        setMapingGroupArea(mapingArea);
        if (
          formik.values.area_id === "" &&
          outlet !== null &&
          outlet.outlet_area_grouping !== null
        ) {
          const item = mapingGroupArea.findIndex(
            (i: any) => i.value === outlet?.outlet_area_grouping.outlet_area.id,
          );
          formik.setFieldValue("area_id", mapingGroupArea[item].value);
        }
      }
    };
    GotGroupingAreas();
    GotAreas();
  }, [
    credential.auth.access_token,
    router,
    areaModal,
    outlet,
    mapingGroupArea,
    refresh,
    deleteModal,
  ]);

  const formikArea = useFormik({
    initialValues: {
      name: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Area name shouldn't be empty"),
    }),
    onSubmit: async (values) => {
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/outlet/create-or-update-area",
        data: values,
        token: `${credential.auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        toast.success("create area success!");
        setAreaModal(false);
        formikArea.setFieldValue("name", "");
      }
    },
  });

  const formik = useFormik({
    initialValues: {
      id: "",
      name: "",
      area_id: "",
      country: "Indonesia",
      province: "",
      city: "",
      district: "",
      address: "",
      dial_code: "+62",
      phone_number: "",
      email: "",
      is_deleted: true,
      opening_schedule: new Date(startDate),
      total_washer: 0,
      total_dryer: 0,
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .max(100, "max name 255 character!")
        .required("required!"),
      province: Yup.string().max(100, "Max 100 character!").optional(),
      city: Yup.string().max(100, "Max 100 character!").optional(),
      district: Yup.string().max(100, "Max 100 character!").optional(),
      address: Yup.string().max(255, "Max 255 character!").optional(),
      dial_code: Yup.string()
        .max(100, "Max 100 character!")
        .required("Must be filled!"),
      phone_number: Yup.string()
        .max(100, "Max 100 character!")
        .required("Must be filled!"),
      email: Yup.string()
        .max(100, "Max 100 character!")
        .optional()
        .email("invalid email!"),
      // is_deleted: Yup.boolean().required("Must be filled!"),
    }),
    onSubmit: async (values) => {
      console.log(values);

      if (loading) return;
      setLoading(true);
      const res = await PostWithToken<iResponseOutlet>({
        router: router,
        url: "/api/outlet/update",
        data: values,
        token: `${credential.auth.access_token}`,
      });
      console.log(res.data);

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Update data success!");
        router.push("/outlet");
      }
      setLoading(false);
    },
  });

  async function GotCity(province_id: string, isupdate: boolean) {
    const res = await GET<iResponseAddress>({
      url: `/api/address/city?province_id=${province_id}`,
    });

    if (
      res?.statusCode === 200 &&
      res?.data?.rajaongkir &&
      res?.data?.rajaongkir?.results
    ) {
      const maping = (
        res?.data?.rajaongkir?.results as {
          type: string;
          city_name: string;
          city_id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.type} ${i.city_name}`,
          value: `${i.city_id}--${i.type} ${i.city_name}`,
        };
      });
      if (isupdate) {
        formik.setFieldValue("city", maping[0].value);
        GotSubDistrict(maping[0].value.split("--")[0], true);
      }
      setCity(maping);
    }
  }

  async function GotSubDistrict(city_id: string, isupdate: boolean) {
    const res = await GET<iResponseAddress>({
      url: `/api/address/sub-district?city_id=${city_id}`,
    });

    if (
      res?.statusCode === 200 &&
      res?.data?.rajaongkir &&
      res?.data?.rajaongkir?.results
    ) {
      const maping = (
        res?.data?.rajaongkir?.results as {
          subdistrict_name: string;
          subdistrict_id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.subdistrict_name}`,
          value: `${i.subdistrict_id}--${i.subdistrict_name}`,
        };
      });

      if (isupdate) {
        formik.setFieldValue("district", maping[0].value.split("--")[1]);
      }
      setSubDistrict(maping);
    }
  }

  const deleteArea = async (id: any) => {
    const data = {
      area_id: id,
    };

    const res = await PostWithToken<MyResponse>({
      router: router,
      url: "/api/outlet/remove-area",
      data: data,
      token: `${credential.auth.access_token}`,
    });
    if (res?.statusCode === 200) {
      setRefresh(false);
      toast.success("Data changed success!");
      formik.setFieldValue("name", "");
      formik.setFieldValue("area_id", "");
      setDeleteModal(false);
      setRefresh(true);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Edit Outlet" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 flex space-x-4 border-b-2 px-10 py-6">
          <button
            onClick={() => {
              router.push("/outlet");
            }}
          >
            <FaArrowLeft size={20} />
          </button>
          <button className={`font-semibold`}>Edit Outlet Form</button>
        </div>
        <div className="grid grid-cols-1 gap-6 px-10">
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
          <div className="flex flex-row space-x-2">
            <div className="w-32">
              <InputDropdown
                label={"Dial Code*"}
                name={"dial_code"}
                id={"dial_code"}
                value={formik.values.dial_code}
                onChange={(v) => formik.setFieldValue("dial_code", v)}
                options={dialCodes}
                error={
                  formik.touched.dial_code && formik.errors.dial_code
                    ? formik.errors.dial_code
                    : null
                }
              />
            </div>
            <Input
              label={"Phone*"}
              name={"phone_number"}
              type="number"
              id={"phone_number"}
              value={formik.values.phone_number}
              onChange={(value) => {
                // delete "0" first value
                if (value.startsWith("0") && value.length > 1) {
                  value = value.replace(/^0+/, "");
                }
                formik.setFieldValue("phone_number", value);
              }}
              error={
                formik.touched.phone_number && formik.errors.phone_number
                  ? formik.errors.phone_number
                  : null
              }
            />
          </div>

          <Input
            label={"Email*"}
            name={"email"}
            id={"email"}
            value={formik.values.email}
            onChange={(v) => formik.setFieldValue("email", v)}
            error={
              formik.touched.email && formik.errors.email
                ? formik.errors.email
                : null
            }
          />

          <div className="flex space-x-2">
            <InputDropdown
              label={"Area"}
              name={"area"}
              id={"area"}
              value={formik.values.area_id}
              onChange={(v) => formik.setFieldValue("area_id", v)}
              options={mapingGroupArea}
              error={
                formik.touched.area_id && formik.errors.area_id
                  ? formik.errors.area_id
                  : null
              }
            />
            <button
              onClick={() => {
                setAreaModal(true);
              }}
              className={`inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90
            dark:text-gray-400 lg:px-8 xl:px-10`}
            >
              Create Area
            </button>
          </div>

          {/* <InputDropdown
            label={"Country"}
            name={"country"}
            id={"country"}
            value={formik.values.country}
            onChange={(v) => formik.setFieldValue("country", v)}
            options={countrys}
            error={
              formik.touched.country && formik.errors.country
                ? formik.errors.country
                : null
            }
          /> */}
          <InputDropdown
            label={"Province"}
            name={"province"}
            id={"province"}
            value={formik.values.province}
            options={province}
            onChange={(v) => {
              const val = v.split("--");
              if (val.length >= 2) {
                formik.setFieldValue("province", v);
                GotCity(val[0], true);
              }
            }}
            error={
              formik.touched.province && formik.errors.province
                ? formik.errors.province
                : null
            }
          />
          <InputDropdown
            label={"City"}
            name={"city"}
            id={"city"}
            value={formik.values.city}
            options={city}
            onChange={(v) => {
              const val = v.split("--");
              if (val.length >= 2) {
                formik.setFieldValue("city", v);
                GotSubDistrict(val[0], true);
              }
            }}
            error={null}
          />
          <InputDropdown
            label={"District"}
            name={"district"}
            id={"district"}
            value={formik.values.district}
            options={subdistrict}
            onChange={(v) => {
              const val = v.split("--");
              if (val.length >= 2) {
                formik.setFieldValue("district", v);
              }
            }}
            error={null}
          />
          {/* <Input
            label={"Pos"}
            name={"postal_code"}
            id={"postal_code"}
            value={formik.values.postal_code}
            onChange={(v) => formik.setFieldValue("postal_code", v)}
            error={
              formik.touched.postal_code && formik.errors.postal_code
                ? formik.errors.postal_code
                : null
            }
          /> */}
          {/* <Input
            label={"Latitude*"}
            name={"latitude"}
            id={"latitude"}
            value={formik.values.latitude}
            onChange={(v) => formik.setFieldValue("latitude", v)}
            error={
              formik.touched.latitude && formik.errors.latitude
                ? formik.errors.latitude
                : null
            }
          />
          <Input
            label={"Longitude*"}
            name={"longitude"}
            id={"longitude"}
            value={formik.values.longitude}
            onChange={(v) => formik.setFieldValue("longitude", v)}
            error={
              formik.touched.longitude && formik.errors.longitude
                ? formik.errors.longitude
                : null
            }
          /> */}
          <InputTextArea
            label={"Address"}
            name={"address"}
            id={"address"}
            value={formik.values.address}
            onChange={(v) => formik.setFieldValue("address", v)}
            error={
              formik.touched.address && formik.errors.address
                ? formik.errors.address
                : null
            }
          />
          <Input
            label={"Total Washer*"}
            name={"total_washer"}
            id={"total_washer"}
            value={formik.values.total_washer ? formik.values.total_washer : ""}
            onChange={(v) => formik.setFieldValue("total_washer", parseInt(v))}
            error={
              formik.touched.total_washer && formik.errors.total_washer
                ? formik.errors.total_washer
                : null
            }
          />
          <Input
            label={"Total Dryer*"}
            name={"total_dryer"}
            id={"total_dryer"}
            value={formik.values.total_dryer ? formik.values.total_dryer : ""}
            onChange={(v) => formik.setFieldValue("total_dryer", parseInt(v))}
            error={
              formik.touched.total_dryer && formik.errors.total_dryer
                ? formik.errors.total_dryer
                : null
            }
          />
          {dateComponent ? (
            <DatePickerOne
              label={"Opening Schedule"}
              defaultDate={new Date(formik.values.opening_schedule)}
              onChange={(v) => {
                formik.setFieldValue("opening_schedule", v);
                setStartDate(v);
              }}
            />
          ) : (
            <p>loading...</p>
          )}

          <div
            className={`${credential.role.name !== ERoles.PROVIDER && "hidden"}`}
          >
            <InputToggle
              value={!formik.values.is_deleted}
              onClick={(v) => formik.setFieldValue("is_deleted", !v)}
              label={"Status"}
            />
          </div>
          <button
            onClick={formik.submitForm}
            className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            Submit
          </button>
        </div>
      </div>

      <Modal isOpen={areaModal}>
        <div className="relative w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              formikArea.setFieldValue("id", "");
              formikArea.setFieldValue("name", "");
              setAreaModal(false);
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb pageName={`Create Area`} />
          </div>

          <div className="">
            <div className="flex items-center justify-between space-x-4">
              <Input
                label={"Area Name*"}
                name={"area_name"}
                id={"area_name"}
                value={formikArea.values.name ? formikArea.values.name : ""}
                onChange={(v) => formikArea.setFieldValue("name", v)}
                error={
                  formikArea.touched.name && formikArea.errors.name
                    ? formikArea.errors.name
                    : null
                }
              />
              <button
                onClick={formikArea.submitForm}
                className="inline-flex items-center justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>

            <div className="mt-4 h-70 overflow-y-auto">
              <Table
                colls={["#", "Name", "Action"]}
                onPaginate={() => null}
                currentPage={0}
                totalItem={0}
              >
                {areas.map((i, k) => (
                  <tr
                    key={k}
                    className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                  >
                    <td className="px-6 py-4">{k + 1}</td>
                    <td className="px-6 py-4">{i.name}</td>
                    <td className="flex space-x-2 px-6 py-4 ">
                      <div className="group relative">
                        <button
                          onClick={() => {
                            formikArea.setFieldValue("name", i.name);
                            formikArea.setFieldValue("area_id", i.id);
                          }}
                        >
                          <FiEdit size={23} />
                        </button>
                        <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                          Edit Area
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          onClick={() => {
                            setDeleteFunction(() => () => deleteArea(i.id));
                            setDeleteModal(true);
                            setRefresh(!refresh);
                          }}
                        >
                          <FiTrash size={23} />
                        </button>
                        <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                          Delete Area
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
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
