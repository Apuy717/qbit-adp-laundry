"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  Input,
  InputDropdown,
  InputFile,
  InputTextArea,
  InputToggle,
} from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { MachineType } from "@/types/machineType";
import { useFormik } from "formik";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import * as Yup from "yup";

interface MyResponse {
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

type MachineId = {
  machine_id: string;
  duration: number;
};

const dropdown = [
  {
    label: "",
    value: "",
  },
];
export default function CreateProduct() {
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<iDropdown[]>(dropdown);
  const [showImage, setShowImage] = useState<string>("");
  const [isSelfService, setIsSelfService] = useState<boolean>(false);
  const [choosedOutletId, setChoosedOutletId] = useState<string>("")
  const [machineExclusive, setMachineExclusive] = useState<MachineType[]>([]);
  const [isViewSkuExclusive, setIsViewSkuExclusive] = useState<boolean>(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);


  const auth = useSelector((s: RootState) => s.auth);
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

  const router = useRouter();

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
        setOutlets(mapingOutlet);
        formik.setFieldValue(`variants[${0}].outlet_id`, mapingOutlet[0].value);
      }
    };
    GotOutlets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      // slug: "",
      picture: "",
      description: "",
      is_deleted: false,
      is_self_service: false,
      variants: [
        {
          outlet_id: "",
          code: "",
          name: "",
          description: "",
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
          is_self_service: isSelfService,
          is_quantity_decimal: false,
          machine_ids: [] as MachineId[],
        },
      ],
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .max(100, "Maksimal 225 karakter!")
        .required("Harus diisi"),
      description: Yup.string().max(100, "Maksimal 255 karakter!").optional(),
      variants: Yup.array().of(
        Yup.object({
          code: Yup.string().max(100, "Maksimal 100 karakter!"),
          name: Yup.string()
            .max(100, "Maksimal 100 karakter!")
            .required("Harus diisi"),
          description: Yup.string()
            .max(100, "Maksimal 225 karakter!")
            .optional(),
          price: Yup.number().min(0).required("Harus diisi"),
          type: Yup.string().max(100, "Maksimal 100 karakter!"),
          stock: Yup.number(),
          unit: Yup.string().max(100, "Maksimal 100 karakter!"),
          washer_duration: Yup.number().min(0),
          dryer_duration: Yup.number().min(0),
          iron_duration: Yup.number().min(0),
        }),
      ),
    }),
    onSubmit: async (values) => {
      if (loading) return;
      setLoading(true);
      const updatedValues = {
        ...values,
        variants: values.variants.map((variant) => ({
          ...variant,
          outlet_id: variant.outlet_id === "all" ? null : variant.outlet_id,
        })),
      };
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: "/api/product/create",
        data: updatedValues,
        token: `${auth.auth.access_token}`,
      });
      if (res.statusCode === 422) {
        (res.err as string[]).map((i) => {
          const field = i.split(" ");
          if (field.length >= 1) formik.setFieldError(field[0], i);
        });
      }

      if (res.statusCode === 422) {
        toast.error(res.err[0]);
      }
      if (res.statusCode === 200) {
        toast.success("Success create product!");
        router.push("/product");
      }
      setLoading(false);
    },
  });

  const addVariant = () => {
    formik.setFieldValue("variants", [
      ...formik.values.variants,
      {
        outlet_id: "all",
        code: "",
        name: "",
        description: "",
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
        machine_ids: [] as { machine_id: string; duration: number }[],
      },
    ]);
  };

  const removeVariant = (index: number) => {
    const variants = [...formik.values.variants];
    variants.splice(index, 1);
    formik.setFieldValue("variants", variants);
  };


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



  useEffect(() => {

    async function GotMachines() {
      let urlwithQuery = `/api/machine`;
      const res = await PostWithToken<iResponse<MachineType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.auth.access_token}`,
        data: {
          outlet_ids:
            choosedOutletId !== "" && choosedOutletId !== "all"
              ? [choosedOutletId]
              : outlets.slice(1).map((o: iDropdown) => o.value),
        },
      });
      
      const mapingMachine = res.data.map((i: any) => {
        return {
          label: i.name,
          value: i.id,
        };
      });

      if (res?.statusCode === 200) {
        setMachineExclusive(res.data);
      }
    }

    GotMachines();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choosedOutletId, outlets]);

  const [searchExclusive, setSearchExclusive] = useState<string>("")

  const filteredMachine = machineExclusive.filter((i) => {
    const search = searchExclusive.toLowerCase();
    return (
      i.name.toLowerCase().includes(search) ||
      i.outlet.name.toLowerCase().includes(search)
    );
  });

  // State to track which rows are checked
  const [checkedRows, setCheckedRows] = useState<{ id: string; duration: number }[]>([]);


  // Check if all rows are checked
  const allChecked = checkedRows.length === machineExclusive.length

  // Check if some rows are checked (for indeterminate state)
  const someChecked = checkedRows.length > 0 && !allChecked

  // Toggle all checkboxes
  const toggleAll = () => {
    if (checkedRows.length === filteredMachine.length) {
      // kalau semua sudah terpilih → kosongkan
      setCheckedRows([]);
    } else {
      // kalau belum semua → ambil semua + kasih duration default
      setCheckedRows(
        filteredMachine.map((m) => ({
          id: m.id,
          duration: m.default_duration ?? 0
        }))
      );
    }
  };

  const handleCloseModal = () => {
    setCheckedRows([]);
    setCurrentVariantIndex(null);
    setIsViewSkuExclusive(false);
  };


  // Toggle individual checkbox
  const toggleRow = (machine: MachineType) => {
    const exists = checkedRows.find((row) => row.id === machine.id);
    if (exists) {
      // kalau sudah ada → hapus
      setCheckedRows(checkedRows.filter((row) => row.id !== machine.id));
    } else {
      // kalau belum ada → tambahkan dengan default_duration
      setCheckedRows([
        ...checkedRows,
        { id: machine.id, duration: machine.default_duration ?? 0 }
      ]);
    }
  };

  const checkboxRef = useRef<HTMLInputElement>(null);


  return (
    <>
      <Breadcrumb pageName="Product" />
      <div
        className="relative overflow-x-auto border-t border-white bg-white pb-10 shadow-md 
        dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg"
      >
        <div className="mb-8 border-b-2 px-10 py-6">
          <p className="font-semibold">Add Product</p>
        </div>
        <div className="px-10">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <Input
              label={"Product Name*"}
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
                  setShowImage(result);
                })
              }
              error={
                formik.touched.picture && formik.errors.picture
                  ? formik.errors.picture
                  : null
              }
            ></InputFile>

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
          </div>
          <div className="pt-6">
            <InputTextArea
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
            <div className="mt-6 p-4 rounded-md border-gray-200 my-4 border">
              <div className="flex gap-4">
                {/* Pilihan Ya */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="agreement"
                    value="false"
                    checked={formik.values.is_self_service === false}
                    onChange={() => {
                      formik.setFieldValue(`is_self_service`, false);
                    }}
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Order Qty Full Service</span>
                </label>

                {/* Pilihan Tidak */}
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="agreement"
                    value="true"
                    checked={formik.values.is_self_service === true}
                    onChange={() => {
                      formik.setFieldValue(`is_self_service`, true);
                    }}
                    className="h-5 w-5 checked:bg-blue-600"
                  />
                  <span className="text-sm">Order Qty Self Service</span>
                </label>
              </div>
            </div>
            <div className="mt-6">
              <InputToggle
                value={!formik.values.is_deleted}
                onClick={(v) => formik.setFieldValue("is_deleted", !v)}
                label={"Status"}
              />
            </div>
          </div>
          <div
            className={
              formik.values.picture
                ? `mt-6 rounded-lg bg-sky-100 py-4`
                : `hidden`
            }
          >
            <div className="relative flex aspect-square h-48 w-full justify-center">
              <NextImage
                src={showImage ? showImage : "/images/user/user-01.png"}
                alt="input-picture"
                fill
                className="h-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
          {formik.values.variants.map((variant, index) => (
            <div key={index}>
              <hr className="border-apps-primary my-8 border-b-2 dark:bg-gray-2"></hr>
              <div className="mb-5 mt-2">
                <button
                  className={
                    index == 0
                      ? `hidden`
                      : `rounded bg-red-700 p-2 text-sm text-white`
                  }
                  onClick={() => removeVariant(index)}
                >
                  Delete Item
                </button>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
                <Input
                  label={"Item Code"}
                  name={`code ${index}`}
                  id={`code ${index}`}
                  value={formik.values.variants[index].code}
                  onChange={(v) =>
                    formik.setFieldValue(`variants[${index}].code`, v)
                  }
                  error={
                    formik.touched.variants?.[index]?.code &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.code
                      ? formik.errors.variants[index].code
                      : null
                  }
                />
                <Input
                  label={"Item Name*"}
                  name={`name ${index}`}
                  id={`name ${index}`}
                  value={formik.values.variants[index].name}
                  onChange={(v) =>
                    formik.setFieldValue(`variants[${index}].name`, v)
                  }
                  error={
                    formik.touched.variants?.[index]?.name &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.name
                      ? formik.errors.variants[index].name
                      : null
                  }
                />

                <Input
                  label={"Price*"}
                  name={`price ${index}`}
                  id={`price ${index}`}
                  value={
                    formik.values.variants[index].price
                      ? formik.values.variants[index].price
                      : ``
                  }
                  onChange={(v) =>
                    formik.setFieldValue(
                      `variants[${index}].price`,
                      parseInt(v),
                    )
                  }
                  error={
                    formik.touched.variants?.[index]?.price &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.price
                      ? formik.errors.variants[index].price
                      : null
                  }
                />

                <InputDropdown
                  label={"Type*"}
                  name={`type ${index}`}
                  id={`type ${index}`}
                  value={formik.values.variants[index].type}
                  onChange={(v) =>
                    formik.setFieldValue(`variants[${index}].type`, v)
                  }
                  options={serviceType}
                  error={
                    formik.touched.variants?.[index]?.type &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.type
                      ? formik.errors.variants[index].type
                      : null
                  }
                />
                <Input
                  className={
                    formik.values.variants[index].type === "goods"
                      ? ""
                      : "hidden"
                  }
                  label={"Stock*"}
                  name={`stock ${index}`}
                  id={`stock ${index}`}
                  value={
                    formik.values.variants[index].stock
                      ? formik.values.variants[index].stock
                      : ""
                  }
                  onChange={(v) =>
                    formik.setFieldValue(
                      `variants[${index}].stock`,
                      parseInt(v),
                    )
                  }
                  error={
                    formik.touched.variants?.[index]?.stock &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.stock
                      ? formik.errors.variants[index].stock
                      : null
                  }
                />
                <Input
                  className={
                    formik.values.variants[index].type === "goods"
                      ? ""
                      : "hidden"
                  }
                  label={"Unit*"}
                  name={`unit ${index}`}
                  id={`unit ${index}`}
                  value={formik.values.variants[index].unit}
                  onChange={(v) =>
                    formik.setFieldValue(`variants[${index}].unit`, v)
                  }
                  error={
                    formik.touched.variants?.[index]?.unit &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.unit
                      ? formik.errors.variants[index].unit
                      : null
                  }
                />
              </div>

              <div className="space-y-3 pt-6">
                <InputDropdown
                  label={"Outlets*"}
                  name={"Outlets"}
                  id={"Outlets"}
                  value={
                    formik.values.variants[index].outlet_id === ""
                      ? outlets[0].value
                      :
                      formik.values.variants[index].outlet_id
                  }
                  onChange={(v) => {
                    formik.setFieldValue(`variants[${index}].outlet_id`, v)
                    setChoosedOutletId(v)
                    

                  }
                  }
                  options={outlets}
                  error={
                    formik.touched.variants?.[index]?.outlet_id &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.outlet_id
                      ? formik.errors.variants[index].outlet_id
                      : null
                  }
                />
                <InputTextArea
                  label={"Item Description"}
                  name={`description ${index}`}
                  id={`description ${index}`}
                  value={formik.values.variants[index].description}
                  onChange={(v) =>
                    formik.setFieldValue(`variants[${index}].description`, v)
                  }
                  error={
                    formik.touched.variants?.[index]?.description &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.description
                      ? formik.errors.variants[index].description
                      : null
                  }
                />
                <div className="flex gap-4 p-4 rounded-md border-gray-200 my-4 border">
                  {/* Pilihan Non Decimal */}
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="radio"
                      name={`isDecimal${index}`} // tetap unik per index
                      value="false"
                      checked={
                        formik.values.variants[index].is_quantity_decimal ===
                        false
                      }
                      onChange={() =>
                        formik.setFieldValue(
                          `variants[${index}].is_quantity_decimal`,
                          false,
                        )
                      }
                      className="h-5 w-5 checked:bg-blue-600"
                    />
                    <span className="text-sm">Order Qty Non Decimal</span>
                  </label>

                  {/* Pilihan Decimal */}
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="radio"
                      name={`isDecimal${index}`}
                      value="true"
                      checked={
                        formik.values.variants[index].is_quantity_decimal ===
                        true
                      }
                      onChange={() =>
                        formik.setFieldValue(
                          `variants[${index}].is_quantity_decimal`,
                          true,
                        )
                      }
                      className="h-5 w-5 checked:bg-blue-600"
                    />
                    <span className="text-sm">Order Qty Decimal</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-4 md:grid-cols-2 border p-4 rounded-md border-gray-200 my-4">
                <InputToggle
                  value={formik.values.variants[index].machine_washer}
                  onClick={(v) => {
                    formik.setFieldValue(
                      `variants[${index}].machine_washer`,
                      v,
                    );
                  }}
                  label={"Washer Machine"}
                />
                <Input
                  className={
                    formik.values.variants[index].machine_washer
                      ? ``
                      : `w-1 opacity-0`
                  }
                  label={
                    formik.values.variants[index].machine_washer
                      ? "Time in minutes*"
                      : ""
                  }
                  name={`washer time${index}`}
                  id={`washer time${index}`}
                  value={`${formik.values.variants[index].washer_duration ? formik.values.variants[index].washer_duration : ""}`}
                  onChange={(v) =>
                    formik.setFieldValue(
                      `variants[${index}].washer_duration`,
                      parseInt(v),
                    )
                  }
                  error={
                    formik.touched.variants?.[index]?.washer_duration &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.washer_duration
                      ? formik.errors.variants[index].washer_duration
                      : null
                  }
                />
                <InputToggle
                  value={formik.values.variants[index].machine_dryer}
                  onClick={(v) => {
                    formik.setFieldValue(`variants[${index}].machine_dryer`, v);
                  }}
                  label={"Dryer machine"}
                />
                <Input
                  className={
                    formik.values.variants[index].machine_dryer
                      ? ``
                      : `w-1 opacity-0`
                  }
                  label={
                    formik.values.variants[index].machine_dryer
                      ? "Time in minutes*"
                      : ""
                  }
                  name={`dryer time${index}`}
                  id={`dryer time${index}`}
                  value={
                    formik.values.variants[index].dryer_duration
                      ? formik.values.variants[index].dryer_duration
                      : ``
                  }
                  onChange={(v) =>
                    formik.setFieldValue(
                      `variants[${index}].dryer_duration`,
                      parseInt(v),
                    )
                  }
                  error={
                    formik.touched.variants?.[index]?.dryer_duration &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.dryer_duration
                      ? formik.errors.variants[index].dryer_duration
                      : null
                  }
                />
                <InputToggle
                  value={formik.values.variants[index].machine_iron}
                  onClick={(v) => {
                    formik.setFieldValue(`variants[${index}].machine_iron`, v);
                  }}
                  label={"Iron Machine"}
                />
                <Input
                  className={
                    formik.values.variants[index].machine_iron
                      ? ``
                      : `w-1 opacity-0`
                  }
                  label={
                    formik.values.variants[index].machine_iron
                      ? "Time in minutes*"
                      : ""
                  }
                  name={`iron time${index}`}
                  id={`iron time${index}`}
                  value={
                    formik.values.variants[index].iron_duration
                      ? formik.values.variants[index].iron_duration
                      : ""
                  }
                  onChange={(v) =>
                    formik.setFieldValue(
                      `variants[${index}].iron_duration`,
                      parseInt(v),
                    )
                  }
                  error={
                    formik.touched.variants?.[index]?.iron_duration &&
                      typeof formik.errors.variants?.[index] === "object" &&
                      formik.errors.variants[index]?.iron_duration
                      ? formik.errors.variants[index].iron_duration
                      : null
                  }
                />
              </div>

              {/* Machine Section */}
              <div className={formik.values.variants[index].machine_dryer ||
                formik.values.variants[index].machine_washer
                ? "border p-4 rounded-md mb-6 border-gray-200 space-y-6"
                : `hidden`}>

                {/* daftar mesin yang sudah dipilih */}
                {formik.values.variants[index].machine_ids &&
                  formik.values.variants[index].machine_ids.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 font-semibold">Exclusive Machines</h4>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-2 text-left">Machine</th>
                            <th className="px-4 py-2 text-left">Outlet</th>
                            <th className="px-4 py-2 text-left">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {formik.values.variants[index].machine_ids.map((m, idx) => {
                            const machine = machineExclusive.find((mc) => mc.id === m.machine_id);

                            return (
                              <tr key={idx}>
                                <td className="px-4 py-2">
                                  {machine ? machine.name : m.machine_id}
                                </td>
                                <td className="px-4 py-2">
                                  {machine ? machine.outlet.name : "-"}
                                </td>
                                <td className="px-4 py-2">{m.duration} menit</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}


                <button
                  className="w-auto rounded-md bg-blue-500 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                  onClick={() => {
                    setCurrentVariantIndex(index);

                    // ambil machine_ids dari Formik untuk variant ini
                    const selectedMachines = formik.values.variants[index].machine_ids || [];

                    // mapping jadi bentuk { id, duration }
                    setCheckedRows(
                      selectedMachines.map((m) => ({
                        id: m.machine_id,
                        duration: m.duration,
                      }))
                    );

                    setIsViewSkuExclusive(true);
                  }}
                >
                  Add Exclusive Machine
                </button>
              </div>

            </div>
          ))}
          <div className="w-full">
            <button
              onClick={addVariant}
              className="w-auto rounded-md bg-blue-500 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Add Item SKU
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-6 md:grid-cols-1">
            <button
              onClick={() => {
                formik.values.variants.map((i, index) => {
                  formik.setFieldValue(
                    `variants[${index}].is_self_service`,
                    formik.values.is_self_service,
                  );
                });
                formik.submitForm();
              }}
              className="inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
      <Modal isOpen={isViewSkuExclusive}>
        <div className="relative h-[80%] w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={handleCloseModal}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                Exclusive SKU
              </h2>
            </div>
            <div className="space-y-4 rounded-lg bg-white p-4 dark:bg-gray-700">
              <Input
                label={"Search Machine"}
                name={"searchExclusive"}
                id={"searchExclusive"}
                value={searchExclusive}
                onChange={(v) => setSearchExclusive(v)}
                error={null}
              />

              <button
                onClick={() => {
                  if (currentVariantIndex !== null) {
                    const newMachines = checkedRows.map((m) => ({
                      machine_id: m.id,
                      duration: m.duration,
                    }));

                    formik.setFieldValue(
                      `variants[${currentVariantIndex}].machine_ids`,
                      newMachines
                    );
                  }

                  handleCloseModal(); // reset & close modal
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
                    <th className={`px-6 py-3`}>Machine</th>
                    <th className={`px-6 py-3`}>Outlet </th>
                    <th className={`px-6 py-3`}>Duration</th >
                  </tr>
                </thead>
                <tbody>
                  {filteredMachine.map((m) => {
                    const selected = checkedRows.find((row) => row.id === m.id);
                    return (
                      <tr key={m.id} className="border-b">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => toggleRow(m)}
                          />
                        </td>
                        <td className="px-6 py-4">{m.name}</td>
                        <td className="px-6 py-4">{m.outlet?.name}</td>
                        <td className="px-6 py-4">
                          {selected && (
                            <input
                              type="number"
                              value={selected.duration}
                              onChange={(e) => {
                                const newVal = Number(e.target.value);
                                setCheckedRows(
                                  checkedRows.map((row) =>
                                    row.id === m.id ? { ...row, duration: newVal } : row
                                  )
                                );
                              }}
                              className="w-20 rounded border p-1"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
