// TODO
import { useRef, useState } from "react";
import { IoIosRefresh, IoMdDownload } from "react-icons/io";
import { MerchantDataContext } from "@/contexts/merchantDataContext";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";

type ReportOutletLayoutType = {
    children: React.ReactNode;
}

export function LayoutOutlet(props: ReportOutletLayoutType) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [choiceOutlet, setChoiceOutlet] = useState<string>("all");
  const [optionsOutlet, setOptionsOutlet] = useState<any[]>([]);

  const tableRef = useRef<HTMLTableElement | null>(null);

  const handleDownloadExcel = () => {
      if (!tableRef.current) return;
      const workbook = XLSX.utils.table_to_book(tableRef.current);
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer]), "outlet-merchant-bossq-all.xlsx");
    };
  
    const handleRefreshData = () => {
      setStartDate("");
      setEndDate("");
    };

    return (<>
    <main className="relative min-h-screen">
      <section className="mt-3 lg:mt-0">
          <h1 className="text-2xl font-semibold capitalize text-slate-700 dark:text-slate-100">
            report merchant - all
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Welcome to bossq merchant
          </p>
        </section>
        <section className="mb-4 mt-8 flex flex-col items-end justify-between gap-y-3 lg:flex-row lg:items-center lg:gap-y-0">
        <div className="mx-auto flex w-full items-center gap-x-4 lg:mx-0 lg:w-fit">
          <DatePickerOne label="start" defaultDate={startDate} onChange={setStartDate} />
          <DatePickerOne
            label="end"
            defaultDate={endDate}
            onChange={setEndDate}
          />
          <select onChange={(event) => setChoiceOutlet(event.target.value)} className="block px-6 pr-10 py-3 rounded bg-white dark:bg-slate-800 dark:text-slate-100 text-slate-800 border-2 border-slate-200 dark:border-slate-700 dark:shadow"> 
            <option value="all">All</option>
            {optionsOutlet != null && optionsOutlet.map((data) => (
              <option value={data.id}>{data.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-x-6">
          <button
            onClick={handleRefreshData}
            className="p-3 rounded-full bg-slate-400/50 dark:bg-slate-800 dark:border dark:border-slate-100"
          >
            <IoIosRefresh className="dark:text-slate-100" />
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-x-3 rounded-md dark:bg-slate-800 border-slate-500 hover:bg-slate-200 dark:border-slate-200 px-3 py-1.5 text-slate-800 dark:text-slate-100 shadow transition-all hover:dark:bg-slate-700"
          >
            <IoMdDownload />
            <span className="font-medium capitalize">download excel</span>
          </button>
        </div>
      </section>
    {props.children}
    </main>
    </>)

}