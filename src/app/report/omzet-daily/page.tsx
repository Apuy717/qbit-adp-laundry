"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import Table from "@/components/Tables/Table";
import { MerchantDataContext } from "@/contexts/merchantDataContext";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useRef, useState } from "react";
import { IoMdDownload } from "react-icons/io";
import { useSelector } from "react-redux";
import { TablePrinter } from "../components/TableExcel";
import { toRupiah } from "../utils/toRupiah";
// import { transactions } from "../data-dummy/transactions";

type DetailDailyType = {
  outlet_id: string;
  order_date: string;
  stage_name: string;
  total_stage: string;
}

type DailyReportType = {
  order_date: string;
  transaction: string;
  total: string;
  outlet: {
    id: string;
    name: string;
  }
  detail: DetailDailyType[];
};

export default function OmzetDaily() {
  const { merchantData, setMerchantData } = useContext(MerchantDataContext);
  const [dailyReport, setDailyReport] = useState<DailyReportType[]>([]);

  const [openRow, setOpenRow] = useState<number | null>(null);
  let startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  let endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  );
  endOfMonth.setHours(23, 59, 59, 0);
  startOfMonth.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = useState<Date>(startOfMonth);
  const [endDate, setEndDate] = useState<Date>(endOfMonth);

  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterIsDeleted, setFilterIsDeleted] = useState<boolean | undefined>();
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [totalItem, setTotalItem] = useState(0);

  const [currentOptionRange, setCurrentOptionRange] = useState<string>("");
  const [determineIsActive, setDetermineIsActive] = useState<string>("");

  const [thereIsNotOption, setThereIsNotOption] = useState<boolean>(false);


  const rangeDateOptions = ["Today", "3 Days Ago", "7 Days Ago", "14 Days Ago", "Prev Month", "Current Month"];


  // const [dailyReport, setDailyReport] = useState<DailyReportType[]>([]);

  enum EStatusSwithMachine {
    ON = "ON",
    OFF = "OFF",
  }

  interface iSwitchMachine {
    machine_id: string;
    status: EStatusSwithMachine;
  }

  const formatDailyReport = (data: any) => {
    return {
      order_date: data.order_date,
      transaction: data.transaction,
      total: data.total,
      outlet: {
        id: data["outlet.id"],
        name: data["outlet.name"],
      },
      detail: data.detail
    }
  }

  const tableRef = useRef<HTMLTableElement | null>(null);

  const { auth, role, department } = useSelector((s: RootState) => s.auth);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );

  const [switchMachine, setSwitchMachine] = useState<iSwitchMachine[]>([]);

  const router = useRouter();

  useEffect(() => {
    async function GotDaily() {
      let urlwithQuery = `/api/v2/report/omzet/daily`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/v2/report/omzet/daily?page=${currentPage}&limit=${100}&search=${fixValueSearch}`;
      }
      let sttsFilter = {};
      if (filterIsDeleted) sttsFilter = { is_deleted: filterIsDeleted };

      const pad = (n: any) => n.toString().padStart(2, "0");
      const stdDate = new Date(startDate);
      const eDate = new Date(endDate);
      const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
      const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

      const res = await PostWithToken<iResponse<DailyReportType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o: any) => o.outlet_id)
              : defaultSelectedOutlet.map((o: any) => o.outlet_id),
          started_at: _startedAt,
          ended_at: _endedAt,
        },
      });

      if (res?.statusCode === 200) {
        if (res.total) setTotalItem(res.total);
        const changeFormat = res.data.map((daily) => formatDailyReport(daily));
        setDailyReport(changeFormat);
        console.log(changeFormat);

      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }
    if (!modal) GotDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    fixValueSearch,
    refresh,
    auth.access_token,
    filterIsDeleted,
    selectedOutlets,
    defaultSelectedOutlet,
    modal,
    startDate,
    endDate,
  ]);

  const [loadingDownload, setLodaingDownload] = useState<boolean>(false);

  async function DownloadXLXS() {
    setLodaingDownload(true);
    if (loadingDownload) return;
    let paymentStts = {};

    const pad = (n: any) => n.toString().padStart(2, "0");
    const stdDate = new Date(startDate);
    const eDate = new Date(endDate);
    const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
    const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

    const res = await PostWithToken<iResponse<{ filename: string }>>({
      router: router,
      url: "/api/v2/report/omzet/daily/download",
      token: `${auth.access_token}`,
      data: {
        outlet_ids:
          selectedOutlets.length >= 1
            ? selectedOutlets.map((o) => o.outlet_id)
            : defaultSelectedOutlet.map((o) => o.outlet_id),
        started_at: _startedAt,
        ended_at: _endedAt,
      },
    });
    if (res.statusCode === 200) {
      const url = `${window.location.origin}/download/${res.data.filename}`;
      window.open(url, "_blank");
    }

    setTimeout(() => setLodaingDownload(false), 1000);
  }

  // === Range date helper ===
  const getRangeByOption = (option: string): [Date, Date] => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    switch (option) {
      case "Today":
        return [startOfDay(now), endOfDay(now)];
      case "3 Days Ago":
        return [startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)), endOfDay(now)];
      case "7 Days Ago":
        return [startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)), endOfDay(now)];
      case "14 Days Ago":
        return [startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)), endOfDay(now)];
      case "Prev Month":
        return [
          new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0),
          new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        ];
      case "Current Month":
      default:
        return [
          new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
          new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        ];
    }
  };

  // === Tombol range handler ===
  const handleFilterDataByDate = (option: string) => {
    const [s, e] = getRangeByOption(option);
    setStartDate(s);
    setEndDate(e);
    setCurrentOptionRange(option);
  };

  // === Cek jika range manual, hilangkan tombol aktif ===
  useEffect(() => {
    const sameDate = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 1000;
    const matched = rangeDateOptions.find((opt) => {
      const [s, e] = getRangeByOption(opt);
      return sameDate(s, startDate) && sameDate(e, endDate);
    });
    setCurrentOptionRange(matched || "");
  }, [startDate, endDate]);



  useEffect(() => {
    const normalize = (d: Date) => {
      const n = new Date(d);
      n.setHours(0, 0, 0, 0);
      return n;
    };

    const dayDiff = (start: Date, end: Date) => {
      const s = normalize(start);
      const e = normalize(end);
      return Math.round((e.getTime() - s.getTime()) / 86400000);
    };

    const isToday = (start: string | Date, end: string | Date) => {
      const today = normalize(new Date());
      const s = normalize(new Date(start));
      const e = normalize(new Date(end));
      return s.getTime() === today.getTime() && e.getTime() === today.getTime();
    };

    const isRangeThreeDays = (start: string | Date, end: string | Date) => {
      return dayDiff(new Date(start), new Date(end)) === 3;
    };

    const isRangeSevenDays = (start: string | Date, end: string | Date) => {
      return dayDiff(new Date(start), new Date(end)) === 7;
    };

    const isRangeFourteenDays = (start: string | Date, end: string | Date) => {
      return dayDiff(new Date(start), new Date(end)) === 14;
    };

    const isRangeLastMonth = (start: string | Date, end: string | Date) => {
      const s = new Date(start);
      const e = new Date(end);

      const today = new Date();
      let lastMonth = today.getMonth() - 1;
      let year = today.getFullYear();

      if (lastMonth < 0) {
        lastMonth = 11;
        year--;
      }

      return (
        s.getFullYear() === year &&
        e.getFullYear() === year &&
        s.getMonth() === lastMonth &&
        e.getMonth() === lastMonth
      );
    };

    const isRangeThisMonth = (start: string | Date, end: string | Date) => {
      const today = new Date();
      const s = new Date(start);
      const e = new Date(end);

      return (
        s.getFullYear() === today.getFullYear() &&
        e.getFullYear() === today.getFullYear() &&
        s.getMonth() === today.getMonth() &&
        e.getMonth() === today.getMonth()
      );
    };

    if (!startDate || !endDate) return;

    if (isToday(startDate, endDate)) {
      setDetermineIsActive("Today");
      console.log("Today");
      setThereIsNotOption(false);
    } else if (isRangeThreeDays(startDate, endDate)) {
      setDetermineIsActive("3 Days Ago");
      console.log("3 Days Ago");
      setThereIsNotOption(false);
    } else if (isRangeSevenDays(startDate, endDate)) {
      setDetermineIsActive("7 Days Ago");
      console.log("7 Days Ago");
      setThereIsNotOption(false);
    } else if (isRangeFourteenDays(startDate, endDate)) {
      setDetermineIsActive("14 Days Ago");
      console.log("14 Days Ago");
      setThereIsNotOption(false);
    } else if (isRangeLastMonth(startDate, endDate)) {
      setDetermineIsActive("Prev Month");
      console.log("Prev Month");
      setThereIsNotOption(false);
    } else if (isRangeThisMonth(startDate, endDate)) {
      setDetermineIsActive("Current Month");
      console.log("Current Month")
      setThereIsNotOption(false);;
    } else {
      setDetermineIsActive("There is not!");
      setThereIsNotOption(true);
      console.log("There is not!");
    }
  }, [startDate, endDate]);

  return (
    <main className="relative min-h-screen">
      <TablePrinter ref={tableRef} merchantData={merchantData} />
      <Breadcrumb pageName={"Report Merchant - Omzet Daily"} />

      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {rangeDateOptions.map((option) => {
            const isActive = currentOptionRange === option || determineIsActive === option;
            return (
              <button
                disabled={thereIsNotOption}
                key={option}
                onClick={() => handleFilterDataByDate(option)}
                type="button"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-70
                  ${isActive
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 scale-95"
                    : "bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="mx-auto flex w-full items-center gap-x-4 ">
          <DatePickerOne
            label="Start"
            defaultDate={startDate}
            onChange={(val) => setStartDate(new Date(val))}
          />
          <DatePickerOne
            label="End"
            defaultDate={endDate}
            onChange={(val) => setEndDate(new Date(val))}
          />
          <button
            onClick={DownloadXLXS}
            className={`inline-flex w-full items-center justify-center rounded-md bg-black px-10 space-x-2 py-3 text-center 
              font-medium text-white hover:bg-opacity-90 lg:w-auto lg:px-8 xl:px-10`}
          >
            <IoMdDownload />
            <span className="font-xs whitespace-nowrap">Download xls</span>
          </button>
        </div>
      </div>

      <Table
        colls={
          [
            "#",
            "Order Date",
            "Merchant",
            "Transaction",
            "Amount",
            "Detail"
          ]
        }
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        totalItem={totalItem}
      >
        {dailyReport.length > 0 ? dailyReport.map((item, index) => (
          <React.Fragment key={index}>
            <tr
              className="grid grid-cols-2 justify-start items-start gap-2 rounded-xl border border-white/10 
        bg-white/5 p-4 shadow-lg backdrop-blur-xl transition hover:bg-slate-50 sm:table-row
        sm:rounded-none sm:bg-transparent sm:p-0 sm:hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
            >
              <td className="text-xs sm:px-6 sm:py-4 sm:text-sm sm:text-slate-500 dark:text-slate-100">
                {index + 1}
              </td>
              <td className="text-xs sm:px-6 sm:py-4 sm:text-sm sm:text-slate-500 dark:text-slate-100">
                {item.order_date}
              </td>
              <td className="sm:px-6 sm:py-4 sm:text-slate-800 dark:text-slate-100">
                {item.outlet.name}
              </td>
              <td className="font-mono col-span-2 text-xs sm:col-span-1 sm:px-6 sm:py-4 sm:text-sm lg:text-center dark:text-slate-100">
                {item.transaction}
              </td>
              <td className="text-right font-medium text-green-400 sm:px-6 sm:py-4 sm:text-slate-800 dark:text-slate-100 relative">
                {toRupiah(item.total)}
              </td>
              <td className="text-right font-medium sm:px-6 sm:py-4 dark:text-slate-100 relative">
                <button
                  onClick={() => setOpenRow(openRow === index ? null : index)}
                  type="button"
                  className="dark:text-slate-100"
                >
                  {openRow === index ? "Hide Detail" : "Show Detail"}
                </button>
              </td>
            </tr>

            {openRow === index && (
              <tr className="dark:bg-slate-700 dark:hover:bg-slate-600">
                <td colSpan={6} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 dark:text-slate-100">
                  <div className="p-4 bg-white dark:bg-slate-700 rounded-lg shadow flex flex-col gap-4">
                    {item.detail != null && item.detail.map((detail, i) => (
                      <div key={i} className="border-b pb-3 last:border-none dark:text-slate-100">
                        <p><b>Order Date:</b> {detail.order_date}</p>
                        <p className="mt-1.5"><b>Stage Name:</b> {detail.stage_name}</p>
                        <p className="mt-1.5"><b>Total Stage:</b> {detail.total_stage}</p>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        )) : Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse border-b dark:border-gray-700">
                            <td className="px-6 py-4">
                                <div className="h-4 w-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                        </tr>
                    ))}
      </Table>

    </main>
  );
}
