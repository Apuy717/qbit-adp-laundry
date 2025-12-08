"use client";

import { useState, useRef, useEffect, useContext } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { MerchantDataContext } from "@/contexts/merchantDataContext";
import { HeaderReport } from "../components/HeaderReport";
import { FeaturesReportSection } from "../components/FeaturesReportSection";
import { TableReport } from "../components/TableReport";
import { TablePrinter } from "../components/TableExcel";
// import { transactions } from "../data-dummy/transactions";

export default function OmzetDaily() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const {merchantData, setMerchantData} = useContext(MerchantDataContext);
  const [choiceOutlet, setChoiceOutlet] = useState<string | number>("all");
  const [optionsOutlet, setOptionsOutlet] = useState<any[]>([]);
  const [isThereData, setIsThereData] = useState<boolean>(false);
  const [getDataById, setGetDataById] = useState<number | null>(null);

  const tableRef = useRef<HTMLTableElement | null>(null);

  const retrieveDataDaily = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_OMZET_DAILY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlet_ids: [getDataById],
          started_at: startDate || "2025-11-01",
          ended_at: endDate || "2025-11-30"
        })
      });

      if (!response.ok) return console.log("Response Not Ok");

      const { data } = await response.json();
      console.log(data);
      setMerchantData(data);

    } catch (error) { console.error(error); }
  };  

  const handleDownloadExcel = () => {
      if (!tableRef.current) return;
      const workbook = XLSX.utils.table_to_book(tableRef.current);
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer]), "outlet-merchant-bossq-all.xlsx");
    };

  // IF we are working with real API
  useEffect(() => {
    retrieveDataDaily();
    setIsThereData(true);
  }, []);

  // Working with data dummy
  // useEffect(() => {
  //   setMerchantData(transactions);
  //   setIsThereData(true);
  // }, []);

  // useEffect(() => {
  //   retrieveDataDaily();
  // }, [getDataById]);

  useEffect(() => {
    const result: {id: number, name: string}[] = [];

    merchantData.map((data) => {
      const isStored = result.some((stored) => stored.id === data.outlet.id);

      !isStored && result.push({id: data.outlet.id, name: data.outlet.name});
    });

    setOptionsOutlet([...result]);
  }, [isThereData]);

  useEffect(() => {
    // Working with real API
    if(startDate && endDate) {
      retrieveDataDaily();
    }

    // IF WORKING WITH DATA DUMMY
    // const filtered = merchantData.filter(
    //   (data) => data.outlet.id === Number(choiceOutlet)
    // );
    // setMerchantData(filtered);
  }, [startDate, endDate]);

  useEffect(() => {
    retrieveDataDaily();
  }, [choiceOutlet]);

  const handleRefreshData = () => {
    setStartDate("");
    setEndDate("");
  };

  // IF WORKING WITH DATA DUMMY
//   useEffect(() => {
//   if (!startDate || !endDate) return;

//   const start = new Date(startDate);
//   const end = new Date(endDate);

//   const maxEnd = new Date(start);
//   maxEnd.setMonth(maxEnd.getMonth() + 3);

//   if (end > maxEnd) {
//     setEndDate(maxEnd.toISOString().split("T")[0]);
//     return;
//   }

//   const filtered = merchantData.filter((item) => {
//     const current = new Date(item.date);
//     return current >= start && current <= end;
//   });

//   setMerchantData(filtered);
// }, [startDate, endDate]);


  return (
    <main className="relative min-h-screen">
      <TablePrinter ref={tableRef} merchantData={merchantData} />
      <HeaderReport title="Report Merchant - Omzet Daily" description=" Welcome to bossq merchant"/>

      <FeaturesReportSection startDate={startDate} setStartDate={setStartDate} 
                            endDate={endDate} setEndDate={setEndDate} 
                            handleRefreshData={handleRefreshData} handleDownloadExcel={handleDownloadExcel} 
                            optionsOutlet={optionsOutlet} setChoiceOutlet={setChoiceOutlet} setGetDataById={setGetDataById}/>

      <TableReport merchantData={merchantData}/>
    </main>
  );
}
