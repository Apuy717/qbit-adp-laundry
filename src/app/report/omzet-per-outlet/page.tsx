"use client";

import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { MerchantDataContext } from "@/contexts/merchantDataContext";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { IoIosRefresh, IoMdDownload } from "react-icons/io";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { HeaderReport } from "../components/HeaderReport";
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

type ResponseAPIType = {
  statusCode: number;
  msg: string;
  total: number;
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

  
  const {merchantData, setMerchantData} = useContext(MerchantDataContext);
  const [choiceOutlet, setChoiceOutlet] = useState<string | number>("all");
  const [optionsOutlet, setOptionsOutlet] = useState<any[]>([]);
  const [isThereData, setIsThereData] = useState<boolean>(false);
  const [getDataById, setGetDataById] = useState<number[] | string[] | []>([]);
  const [startDate, setStartDate] = useState<Date | string>(startOfMonth);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth);

  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterIsDeleted, setFilterIsDeleted] = useState<boolean | undefined>();
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [totalItem, setTotalItem] = useState(0);

  const [currentOptionRange, setCurrentOptionRange] = useState<string>("");


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

  const tableRef = useRef<HTMLTableElement | null>(null);

  const { auth, role, department } = useSelector((s: RootState) => s.auth);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
      FilterByOutletContext,
    );

    const [switchMachine, setSwitchMachine] = useState<iSwitchMachine[]>([]);

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

    const handleFilterDataByDate = (currentOption: string) => {

      const determineRange = (option: string): { startedDay: Date; endedDay: Date } => {
        const now = new Date();

        const startOfDay = (date: Date): Date => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d;
        };

        const endOfDay = (date: Date): Date => {
          const d = new Date(date);
          d.setHours(23, 59, 59, 999);
          return d;
        };

        switch (option) {
          case "Today": {
            const startedDay = startOfDay(now);
            const endedDay = endOfDay(now);
            return { startedDay, endedDay };
          }

          case "3 Days Ago": {
            const startedDay = startOfDay(
              new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)
            );
            const endedDay = endOfDay(now);
            return { startedDay, endedDay };
          }

          case "7 Days Ago": {
            const startedDay = startOfDay(
              new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
            );
            const endedDay = endOfDay(now);
            return { startedDay, endedDay };
          }

          case "14 Days Ago": {
            const startedDay = startOfDay(
              new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
            );
            const endedDay = endOfDay(now);
            return { startedDay, endedDay };
          }

          case "Prev Month": {
            const year = now.getFullYear();
            const month = now.getMonth() - 1;

            const startedDay = startOfDay(new Date(year, month, 1));
            const lastDateOfPrevMonth = new Date(year, month + 1, 0);
            const endedDay = endOfDay(lastDateOfPrevMonth);

            return { startedDay, endedDay };
          }

          case "Current Month": {
            const year = now.getFullYear();
            const month = now.getMonth();

            const startedDay = startOfDay(new Date(year, month, 1));
            const lastDateOfCurrentMonth = new Date(year, month + 1, 0);
            const endedDay = endOfDay(lastDateOfCurrentMonth);

            return { startedDay, endedDay };
          }

          default:
            throw new Error(`Unknown option: ${option}`);
          }
        };


        const {startedDay, endedDay} = determineRange(currentOption);

        const pad = (n: any) => n.toString().padStart(2, "0");
        const stdDate = new Date(startedDay);
        const eDate = new Date(endedDay);
        const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
        const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

        setStartDate(_startedAt);
        setEndDate(_endedAt);

        console.log(_startedAt, _endedAt);
      // console.log(currentDate);
    }

  return (
    <main className="relative min-h-screen">
      <HeaderReport title="Report Merchant - Omzet Per Outlet" description=" Welcome to bossq merchant"/>

        <div className="w-sm lg:w-fit overflow-x-auto mt-8 mb-6">
          <div className="grid grid-flow-col auto-cols-[180px] gap-x-2">
            {rangeDateOptions && rangeDateOptions.map((option) => (
                <button key={option} onClick={() => {
                  handleFilterDataByDate(option);
                  setCurrentOptionRange(option);
                }} type="button" className={`dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 lg:px-6 lg:py-3 py-2.5 rounded transition-all hover:bg-slate-100 shadow ${currentOptionRange == option ? "bg-slate-100 scale-90" : "bg-white"}`}>{option}</button>
            ))}
          </div>
        </div>
      
      <section className="mb-4 mt-8 flex flex-col items-end justify-between gap-y-3 lg:flex-row lg:items-center lg:gap-y-0">
        <div className="mx-auto flex lg:flex-row flex-col lg:gap-y-0 gap-y-6 w-full items-center gap-x-4 lg:mx-0 lg:w-9/12">
          <DatePickerOne label={"Start"} defaultDate={startDate} onChange={(val) => {
            setStartDate(val);
          }} />
          <DatePickerOne
            label={"End"}
            defaultDate={endDate}
            onChange={(val) => {
              setEndDate(val);
            }}
          />
        </div>

        <div className="flex items-center gap-x-6">
          <button
            onClick={() => window.location.reload()}
            className="p-3 rounded-full bg-white dark:bg-slate-800 dark:border dark:border-slate-100 shadow hover:bg-slate-100"
          >
            <IoIosRefresh className="dark:text-slate-100" />
          </button>
          <button
            onClick={DownloadXLXS}
            className="flex items-center gap-x-3 rounded-md dark:bg-slate-800 border-slate-500 hover:bg-slate-200 dark:border-slate-200 px-3 py-1.5 text-slate-800 dark:text-slate-100 shadow transition-all hover:dark:bg-slate-700 bg-white"
          >
            <IoMdDownload />
            <span className="font-medium capitalize">download excel</span>
          </button>
        </div>
      </section>

      <TableReport merchantData={merchantData}/>
    </main>
  );
}
