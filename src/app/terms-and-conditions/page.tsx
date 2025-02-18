"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  iDropdown,
  Input,
  InputDropdown,
  InputTextArea,
  InputTextAreaWithKeydown,
} from "@/components/Inputs/InputComponent";
import { GetWithToken, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { ERoles } from "@/stores/authReducer";
import Table from "@/components/Tables/Table";
import { TNC } from "@/types/tnc";
import { FiEdit, FiEye } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";

interface MyResponse {
  statusCode: number;
  msg: string;
  data: any;
  // total: number;
  err: string | string[];
}

export default function TermsAndConditions() {
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const [outlets, setOutlets] = useState<iDropdown[]>([]);
  const [terms, setTerms] = useState<TNC[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTerms, setTotalTerms] = useState(0);
  const [isViewDetail, setIsViewDetail] = useState<boolean>(false);
  const [idx, setIdx] = useState<number>(0);

  useEffect(() => {
    const GotTerms = async () => {
      const data = {
        outlet_ids: [],
      };
      let urlwithQuery = `/api/t-and-c?${currentPage}&limit=${10}`;
      const res = await PostWithToken<MyResponse>({
        router: router,
        url: urlwithQuery,
        data: data,
        token: `${auth.auth.access_token}`,
      });

      if (res.statusCode === 200) {
        setTerms(res.data);
        console.log(res.data);
      }
    };
    GotTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-4 w-full  rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="flex w-full flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
          <Link
            href={"/terms-and-conditions/create"}
            className={`${auth.role.name !== ERoles.PROVIDER && auth.role.name !== ERoles.SUPER_ADMIN && "hidden"}  inline-flex items-center 
            justify-center rounded-md bg-black px-10 py-3 text-center font-medium text-white hover:bg-opacity-90
            dark:text-gray-400 lg:px-8 xl:px-10`}
          >
            Create T&C
          </Link>
        </div>
      </div>

      <Table
        colls={["TITLE", "CREATED AT", "LAST UPDATED", "ACTION"]}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={0}
        totalItem={0}
      >
        {terms?.map((i, index) => (
          <tr
            key={index}
            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
          >
            <td className="px-6 py-4">{i.title}</td>
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
                    className="cursor-pointer"
                    onClick={() => {
                      setIdx(index);
                      setIsViewDetail(true);
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
                      router.push(`terms-and-conditions/update/${i.outlet_id}`);
                    }}
                  >
                    <FiEdit size={18} />
                  </button>
                  <div className="absolute bottom-[70%] mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-85 group-hover:block">
                    Edit T&C
                  </div>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-[80%] overflow-x-auto overflow-y-auto
              bg-white shadow transition-all duration-500 dark:bg-boxdark
              ${isViewDetail ? "" : "translate-x-full"}`}
      >
        <div className="bg-white p-4 shadow dark:bg-boxdark">
          <button
            onClick={() => {
              setIsViewDetail(false);
            }}
          >
            <FaArrowLeft size={20} className="rotate-180" />
          </button>
        </div>
        <div className="mt-4 p-4">
          <div className="mt-6 h-full w-full space-y-6 rounded-md bg-white p-4 dark:bg-boxdark">
            {/* <div className="w-full">
              <button
                onClick={() => {}}
                className="w-auto rounded-md bg-gray-500 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Preview
              </button>
            </div> */}
            <div className="h-full w-full space-y-6 rounded-lg p-4 text-black-2 outline outline-1 outline-slate-400  dark:text-gray-300">
              <p className="text-3xl font-bold">{terms[idx]?.title}</p>
              {terms[idx]?.terms_and_conditions_items?.map((i, index) => (
                <div key={index}>
                  <p className="text-xl font-bold">
                    {index + 1 + ". " + i.label}
                  </p>
                  <p className="">
                    {i.text.split("\n").map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
