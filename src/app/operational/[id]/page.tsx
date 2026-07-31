"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GetWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// ─── Types ──────────────────────────────────────────────────────────────────

type User = {
  id: string;
  fullname: string;
};

type SopReportItem = {
  id: string;
  sop_group_name: string;
  sop_item_name: string;
  picture: string | null;
  checklist: boolean;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user: User | null;
};

type Outlet = {
  id: string;
  name: string;
};

type Report = {
  id: string;
  report_date: string;
  closing_date: string | null;
  created_at: string;
  updated_at: string;
  outlet: Outlet;
  user: User;
  sop_report_items: SopReportItem[];
};

type ApiResponse = {
  statusCode: number;
  msg: string;
  data: Report | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-GB", options).replace(",", "");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutletOperationalDetail() {
  const router = useRouter();
  const params = useParams();
  const outletId = params.id as string;
  
  const auth = useSelector((s: RootState) => s.auth);

  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<Report | null>(null);

  const fetchData = async () => {
    if (!auth.auth.access_token || !outletId) return;
    setLoading(true);
    try {
      const res = await GetWithToken<ApiResponse>({
        router,
        url: `/api/sop/reports/filter/?outlet_id=${outletId}`,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200 && res.data) {
        setReport(res.data);
      } else if (res?.statusCode === 200) {
        toast.info("No report found for this outlet today");
      } else {
        toast.error("Failed to load SOP report detail");
      }
    } catch {
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.auth.access_token, outletId]);

  // Group SOP items by group name
  const groupedItems: Record<string, SopReportItem[]> = {};
  if (report?.sop_report_items) {
    report.sop_report_items.forEach((item) => {
      if (!groupedItems[item.sop_group_name]) {
        groupedItems[item.sop_group_name] = [];
      }
      groupedItems[item.sop_group_name].push(item);
    });
  }

  return (
    <div>
      <Breadcrumb pageName="Operational Detail" />

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : !report ? (
        <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          No report found for this outlet today.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
            {/* Report Header */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Opening</p>
                <p className="text-sm font-medium text-black dark:text-white">
                  {formatDateTime(report.report_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Closing</p>
                <p className="text-sm font-medium text-black dark:text-white">
                  {formatDateTime(report.closing_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Outlet</p>
                <p className="text-sm font-medium text-black dark:text-white">
                  {report.outlet?.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Report By</p>
                <p className="text-sm font-medium text-black dark:text-white">
                  {report.user?.fullname || "-"}
                </p>
              </div>
            </div>

            {/* Grouped Tables */}
            <div className="flex flex-col gap-5">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="rounded border border-stroke bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4">
                  No SOP Report Items available.
                </div>
              ) : (
                Object.keys(groupedItems).map((groupName, gIdx) => {
                  const items = groupedItems[groupName];
                  return (
                    <div
                      key={gIdx}
                      className="rounded border border-stroke dark:border-strokedark overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                        <h4 className="font-semibold text-black dark:text-white">
                          {groupName}
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                          <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 w-12">
                                #
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 min-w-[200px]">
                                Item Name
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                Picture
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                Checklist
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                User
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                Created At
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, iIdx) => (
                              <tr
                                key={item.id}
                                className="border-b border-stroke last:border-0 dark:border-strokedark transition hover:bg-gray-50 dark:hover:bg-meta-4"
                              >
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {iIdx + 1}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-black dark:text-white">
                                  {item.sop_item_name}
                                </td>
                                <td className="px-4 py-3">
                                  {item.picture ? (
                                    <a className="block w-16 h-16 bg-gray-100 relative rounded overflow-hidden" href={`/api/file/${item.picture}`} target="_blank" rel="noreferrer">
                                      <Image
                                        priority
                                        className="object-cover"
                                        fill
                                        alt={item.sop_item_name}
                                        src={`/api/file/${item.picture}`}
                                        sizes="64px"
                                      />
                                    </a>
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">No picture</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {item.checklist ? (
                                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      Checked
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                      Unchecked
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {item.user?.fullname || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {formatDateTime(item.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
