"use client";

import { IoMdDownload } from "react-icons/io";
import { IoIosRefresh } from "react-icons/io";
import DateTimePicker from "react-datetime-picker";
import { useState, useRef, useEffect } from "react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type MerchantDataType = {
  id: number;
  merchant: string;
  transaction: number;
  amount: string;
  date: string;
}[]

// data dummy
const transactions = [
    {
      id: 1,
      merchant: "Starbucks Coffee",
      transaction: 20,
      amount: "Rp 125.000",
      date: "2025-10-02",
    },
    {
      id: 2,
      merchant: "Amazon Store",
      transaction: 10,
      amount: "Rp 850.000",
      date: "2025-09-02",
    },
    {
      id: 3,
      merchant: "Shell Gas Station",
      transaction: 1,
      amount: "Rp 300.000",
      date: "2025-05-02",
    },
    {
      id: 1,
      merchant: "Starbucks Coffee",
      transaction: 20,
      amount: "Rp 125.000",
      date: "2025-10-02",
    },
    {
      id: 2,
      merchant: "Amazon Store",
      transaction: 3,
      amount: "Rp 850.000",
      date: "2025-08-02",
    },
    {
      id: 3,
      merchant: "Shell Gas Station",
      transaction: 1,
      amount: "Rp 300.000",
      date: "2025-05-02",
    },
  ];

export default function AllOutlet() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [merchantData, setMerchantData] = useState<MerchantDataType | null>();

  const cloningDataMerchant = structuredClone(transactions);

  const tableRef = useRef(null);

  const handleDownloadExcel = () => {
    const workbook = XLSX.utils.table_to_book(tableRef.current);
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "outlet-merchant-bossq-all.xlsx");
  };

  // memfilter data berdasarkan rentan tanggal tertentu
  const filteredData = cloningDataMerchant.filter((activity) => {
    const currentDate = new Date(activity.date);

    const start = new Date(startDate);
    const end = new Date(endDate);

    return (
      (!startDate || currentDate >= start) && (!endDate || currentDate <= end)
    );
  });

  const handleRefreshData = () => {
    setStartDate("");
    setEndDate("");

    setMerchantData([...transactions]);
  }

  useEffect(() => {
    setMerchantData([...transactions]);
  }, []);

  // ketika user telah menyetel kedua tanggal untuk mencari data berdasarkan rentan waktu tertentu, fungsi ini akan dijalankan
  useEffect(() => {
    if (startDate && endDate) {
      const result = filteredData;
      if(result) {
        setMerchantData(result);
      }
    }
  }, [startDate, endDate, filteredData]);

  // const parseDate = (date: string): number => {
  //   const [day, month, year] = date.split("-");
  //   return new Date(`${year}-${month}-${day}`).getTime();
  // };

  // useEffect(() => {
  //   const sortingByDate = transactions.sort((a, b) => {
  //     return parseDate(b.date) - parseDate(a.date);
  //   });

  //   console.log(sortingByDate);
  // }, []);

  return (
    <>
      <main className="relative">
        <section className="mt-3 lg:mt-0">
          <h1 className="text-2xl font-semibold capitalize text-slate-700">
            report merchant - all
          </h1>
          <p className="text-sm text-slate-500">Welcome to bossq merchant</p>
        </section>

        <section className="mb-4 mt-8 flex flex-col items-end justify-between gap-y-3 lg:flex-row lg:items-center lg:gap-y-0">
          <div className="mx-auto flex w-full items-center gap-x-4 lg:mx-0 lg:w-fit">
            <input
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              name=""
              id=""
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-700
    outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
            />
            <input
              onChange={(e) => setEndDate(e.target.value)}
              type="date"
              name=""
              id=""
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-700
    outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="flex items-center gap-x-6">
            <button
            onClick={handleRefreshData}
            className="p-3 rounded-full bg-slate-300/50"
              type="button"
            >
              <IoIosRefresh/>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-x-3 rounded-md bg-green-600 px-3 py-1.5 text-slate-100 shadow transition-all hover:bg-green-700"
              type="button"
            >
              <IoMdDownload />
              <span className="font-medium capitalize">download excel</span>
            </button>
          </div>
        </section>

        <section>
          <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table ref={tableRef} className="w-full table-auto">
                <thead className="hidden sm:table-header-group">
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Merchant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Transaction
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {merchantData != null && merchantData.map((item, index) => (
                    <tr
                      key={index}
                      className="grid grid-cols-2 items-start gap-2 rounded-xl border border-white/10 
                       bg-white/5 p-4 shadow-lg backdrop-blur-xl
                       transition duration-150 hover:bg-slate-50 sm:table-row
                       sm:rounded-none sm:bg-transparent sm:p-0 sm:hover:bg-slate-50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="text-xs text-gray-300 sm:px-6 sm:py-4 sm:text-sm sm:text-slate-500">
                        <span className="font-light text-gray-500 sm:hidden">
                          No:{" "}
                        </span>
                        #{index + 1}
                      </td>

                      <td className="sm:px-6 sm:py-4 sm:font-medium sm:text-slate-800">
                        <span className="font-light text-gray-500 sm:hidden">
                          Merchant:{" "}
                        </span>
                        {item.merchant}
                      </td>

                      <td
                        className="font-mono col-span-2 text-xs text-gray-400 
                           sm:col-span-1 sm:px-6 sm:py-4 sm:text-sm sm:text-slate-600"
                      >
                        <span className="font-light text-gray-500 sm:hidden">
                          Transaction:
                        </span>{" "}
                        {item.transaction}
                      </td>

                      <td
                        className="text-right font-medium text-green-400 
                           sm:px-6 sm:py-4 sm:text-slate-800"
                      >
                        <span className="font-light text-gray-500 sm:hidden">
                          Amount:{" "}
                        </span>
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
