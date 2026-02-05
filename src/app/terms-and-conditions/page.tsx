"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Table from "@/components/Tables/Table";
import { PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import type { TermsAndConditions } from "@/types/tnc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiEdit, FiEye } from "react-icons/fi";
import { useSelector } from "react-redux";


interface MyResponse {
  statusCode: number;
  msg: string;
  data: TermsAndConditions[];
  err: string | string[];
}

export default function TermsAndConditions() {
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const [terms, setTerms] = useState<TermsAndConditions[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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
      }
    };
    GotTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className=" dark:min-h-screen">
      <Breadcrumb pageName={"Terms and Conditions"} />
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
        colls={["OUTLET", "TITLE", "CREATED AT", "LAST UPDATED", "CREATED BY", "UPDATED BY", "ACTION"]}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={0}
        totalItem={0}
      >
        {terms?.map((i, index) => (
          <tr
            key={index}
            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
          >
            <td className="px-6 py-4">{i.outlet ? i.outlet.name : "ALL"}</td>
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
            <td className="px-6 py-4 whitespace-normal">
              {i.tnc_creator ? i.tnc_creator.fullname : "N/A"}
              <p className="text-xs">
                {i.tnc_creator ? i.tnc_creator.dial_code + i.tnc_creator.phone_number : ""}
              </p>
            </td>
            <td className="px-6 py-4 whitespace-normal">
              {i.tnc_updater ? i.tnc_updater.fullname : "N/A"}
              <p className="text-xs">
                {i.tnc_updater ? i.tnc_updater.dial_code + i.tnc_updater.phone_number : ""}
              </p>
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
                      router.push(`terms-and-conditions/update/${i.id}`);
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

      {/* detail t&c */}
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
            <div className="h-full w-full space-y-6 rounded-lg p-4 text-black-2 outline outline-1 outline-slate-400  dark:text-gray-300">
              <p className="text-3xl font-bold mb-4">{terms[idx]?.title}</p>

              {/* detail info */}
              {terms[idx] && (
                <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Phone Number
                      </p>
                      <p className="text-base font-medium">
                        {terms[idx]?.phone_number || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Address
                      </p>
                      <p className="text-base whitespace-pre-line">
                        {terms[idx]?.address || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Outlet
                      </p>
                      <p className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 text-xs py-1 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        {terms[idx]?.outlet ? terms[idx]?.outlet.name : "ALL"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-center gap-4 md:items-end">
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Icon
                      </p>
                      {terms[idx]?.icon ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_DOMAIN}/api/file/${terms[idx]?.icon}`}
                          alt="Icon"
                          className="h-14 w-14 rounded-lg border border-slate-200 object-contain bg-white dark:border-slate-700"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No icon</span>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Receipt Icon
                      </p>
                      {terms[idx]?.receipt_icon ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_DOMAIN}/api/file/${terms[idx]?.receipt_icon}`}
                          alt="Receipt Icon"
                          className="h-14 w-14 rounded-lg border border-slate-200 object-contain bg-white dark:border-slate-700"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No receipt icon</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
