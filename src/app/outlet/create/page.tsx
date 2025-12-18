"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import {
  Input,
  InputDropdown,
  InputTextArea,
} from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { GET, GetWithToken, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import CountryList from "country-list-with-dial-code-and-flag";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CiCircleAlert } from "react-icons/ci";
import { FaArrowLeft } from "react-icons/fa6";
import { FiEdit, FiTrash } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

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

export default function CreateOutlet() {
  const [areas, setAreas] = useState<any[]>([]);
  const [areaModal, setAreaModal] = useState<boolean>(false);
  const [mapingGroupArea, setMapingGroupArea] = useState<any[]>([]);
  const [province, setProvince] = useState<iDropdown[]>([]);
  const [city, setCity] = useState<iDropdown[]>([]);
  const [subdistrict, setSubDistrict] = useState<iDropdown[]>([]);
  const [countrys, setCountrys] = useState<iDropdown[]>([]);
  const [dialCodes, setDialCodes] = useState<iDropdown[]>([]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteFunction, setDeleteFunction] = useState<() => void>(
    () => () => { },
  );
  const auth = useSelector((s: RootState) => s.auth);

  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
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
    if (
      auth.role.name !== ERoles.PROVIDER &&
      auth.role.name !== ERoles.SUPER_ADMIN
    )
      router.push("/outlet");
  }, [auth.role.name, router]);

  const formikArea = useFormik({
    initialValues: {
      id: "",
      name: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Area name shouldn't empty"),
    }),
    onSubmit: async (values) => {
      let data = {};
      if (values.id != "" && values.name != "") {
        data = {
          name: values.name,
          id: values.id,
        };
      } else {
        data = {
          name: values.name,
        };
      }
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/outlet/create-or-update-area",
        data: data,
        token: `${auth.auth.access_token}`,
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
      name: "",
      area_id: "",
      country: "Indonesia",
      province: "",
      city: "",
      district: "",
      postal_code: null,
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
        .max(100, "max name 255 character")
        .required("required!"),
      area_id: Yup.string().optional(),
      province: Yup.string().max(100, "Max 100 character").optional(),
      city: Yup.string().max(100, "Max 100 character").optional(),
      district: Yup.string().max(100, "Max 100 character").optional(),
      address: Yup.string().max(255, "Max 255 character").optional(),
      dial_code: Yup.string()
        .max(100, "Max 100 character")
        .required("Must be filled!"),
      phone_number: Yup.string()
        .max(100, "Max 100 character")
        .required("Harus diisi!"),
      email: Yup.string()
        .max(100, "Max 100 character")
        .optional()
        .email("Email is not valid!"),
      total_washer: Yup.number().required("Must be filled!"),
      total_dryer: Yup.number().required("Must be filled!"),
    }),
    onSubmit: async (values) => {
      
      
      if (loading) return;
      setLoading(true);
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/outlet/create-update",
        data: values,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 200) {
        toast.success("Sucess update data!");
        router.push("/outlet");
      }
      setLoading(false);
    },
  });

  useEffect(() => {
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

    const GotGroupingAreas = async () => {
      let urlwithQuery = `/api/outlet/area/get-areas`;
      const res = await GetWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
      });
      const mapingArea = res.data.map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      });

      if (mapingArea.length >= 1) {
        formik.setFieldValue(`area_id`, mapingArea[0].value);
        setMapingGroupArea(mapingArea);
      }
    };
    GotGroupingAreas();
    GotAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.auth.access_token, areaModal]);

  useEffect(() => {
    async function GotProvince() {
      const res = await GET<MyResponse>({ url: "/api/address/province" });
      

      if (
        res.statusCode === 200 &&
        res?.data
      ) {
        const maping = (
          res?.data as {
            name: string;
            id: string;
          }[]
        ).map((i) => {
          return {
            label: i.name,
            value: `${i.id}--${i.name}`,
          };
        });
        if (maping.length >= 1) {
          // formik.setFieldValue("province", `${maping[0].value.split("--")[1]}`);
          formik.setFieldValue("province", `${maping[0].value}`);
          if (maping[0].value.split("--").length >= 2)
            GotCity(maping[0].value.split("--")[0]);
        }
        setProvince(maping);
      }
    }

    GotProvince();
    const country = CountryList.getAll();

    country.map((i) => {
      setDialCodes((old) => [
        ...old,
        { label: `${i.code} ${i.dial_code}`, value: i.dial_code },
      ]);
      setCountrys((old) => [...old, { label: i.name, value: i.name }]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function GotCity(province_id: string) {
    const res = await GET<MyResponse>({
      url: `/api/address/city?province_id=${province_id}`,
    });

    

    if (
      res?.statusCode === 200 &&
      res?.data
    ) {
      const maping = (
        res?.data as {
          name: string;
          id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.name}`,
          value: `${i.id}--${i.name}`,
        };
      });

      if (maping.length >= 1) {
        // formik.setFieldValue("city", `${maping[0].value.split("--")[1]}`);
        formik.setFieldValue("city", `${maping[0].value}`);
        if (maping[0].value.split("--").length >= 2)
          GotSubDistrict(maping[0].value.split("--")[0]);
      }

      setCity(maping);
    }
  }

  async function GotSubDistrict(city_id: string) {
    const res = await GET<MyResponse>({
      url: `/api/address/sub-district?city_id=${city_id}`,
    });
    
    

    if (
      res?.statusCode === 200 &&
      res?.data
    ) {
      const maping = (
        res?.data as {
          name: string;
          id: string;
        }[]
      ).map((i) => {
        return {
          label: `${i.name}`,
          value: `${i.id}--${i.name}`,
        };
      });
      if (maping.length >= 1)
        formik.setFieldValue("district", `${maping[0].value.split("--")[1]}`);
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
      token: `${auth.auth.access_token}`,
    });
    if (res?.statusCode === 200) {
      setRefresh(false);
      toast.success("Data changed success!");
      formik.setFieldValue("name", "");
      formik.setFieldValue("area_id", "");
      setDeleteModal(false);
      setAreaModal(false)
      setRefresh(true);
    }
  };

  return (
    <>
      <div>
        <Breadcrumb pageName="Outlet" />
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
            <button className={`font-semibold`}>Request Outlet Form</button>
          </div>
          <div className="px-10">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 ">
              <Input
                label={"Outlet Name*"}
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
                  id={"phone_number"}
                  type="number"
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
                  onChange={(v) => {
                    formik.setFieldValue("area_id", v);
                  }}
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
                    GotCity(val[0]);
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
                    GotSubDistrict(val[0]);
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
                value={
                  formik.values.total_washer ? formik.values.total_washer : ""
                }
                onChange={(v) =>
                  formik.setFieldValue("total_washer", parseInt(v))
                }
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
                value={
                  formik.values.total_dryer ? formik.values.total_dryer : ""
                }
                onChange={(v) =>
                  formik.setFieldValue("total_dryer", parseInt(v))
                }
                error={
                  formik.touched.total_dryer && formik.errors.total_dryer
                    ? formik.errors.total_dryer
                    : null
                }
              />
              <DatePickerOne
                label={"Start"}
                defaultDate={new Date(startDate)}
                onChange={(v) => {
                  formik.setFieldValue("opening_schedule", v);
                  setStartDate(v);
                }}
              />

              <button
                onClick={formik.submitForm}
                className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Submit
              </button>
            </div>
          </div>
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
