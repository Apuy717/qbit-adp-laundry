"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { MerchantDataContext } from "@/contexts/merchantDataContext";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { IoMdDownload } from "react-icons/io";
import { useSelector } from "react-redux";
import { TableReport } from "../components/TableReport";
// import { transactions } from "../data-dummy/transactions";

type MerchantDataType = {
  transaction: string;
  total: string;
  outlet: {
    id: string;
    name: string;
  }
}


export default function OmzetPerOutlet() {
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


  const { merchantData, setMerchantData } = useContext(MerchantDataContext);
  const [startDate, setStartDate] = useState<Date>(startOfMonth);
  const [endDate, setEndDate] = useState<Date>(endOfMonth);

  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterIsDeleted, setFilterIsDeleted] = useState<boolean | undefined>();
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [totalItem, setTotalItem] = useState(0);

  const [currentOptionRange, setCurrentOptionRange] = useState<string>("");


  const rangeDateOptions = ["Today", "3 Days Ago", "7 Days Ago", "14 Days Ago", "Prev Month", "Current Month"];

  const tableRef = useRef<HTMLTableElement | null>(null);

  const { auth, role, department } = useSelector((s: RootState) => s.auth);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );

  const router = useRouter();

  useEffect(() => {
    async function GotPerOutlet() {
      let urlwithQuery = `/api/v2/report/omzet/per-outlet`;
      // if (fixValueSearch.length >= 1) {
      //   urlwithQuery = `/api/v2/report/omzet/per-outlet?page=${currentPage}&limit=${100}&search=${fixValueSearch}`;
      // }
      let sttsFilter = {};
      if (filterIsDeleted) sttsFilter = { is_deleted: filterIsDeleted };

      const pad = (n: any) => n.toString().padStart(2, "0");
      const stdDate = new Date(startDate);
      const eDate = new Date(endDate);
      const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
      const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

      const res = await PostWithToken<iResponse<MerchantDataType[]>>({
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
        setMerchantData(res.data);
        console.log(res.data);

      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }
    if (!modal) GotPerOutlet();
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
      url: "/api/v2/report/omzet/per-outlet/download",
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

  return (
    <main className="relative min-h-screen">
      <Breadcrumb pageName={"Report Outlet - Omzet Per Outltet"} />

      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {rangeDateOptions.map((option) => {
            const isActive = currentOptionRange === option;
            return (
              <button
                key={option}
                onClick={() => handleFilterDataByDate(option)}
                type="button"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700
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
        <div className="mx-auto flex flex-col md:flex-row w-full items-center gap-4 ">
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

      <TableReport merchantData={merchantData} />
    </main>
  );
}
