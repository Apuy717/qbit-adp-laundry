"use client";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { ProfitType } from "@/types/profit";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { CgShoppingBag } from "react-icons/cg";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { FiShoppingCart } from "react-icons/fi";
import { MdOutlineSpeed } from "react-icons/md";
import { useSelector } from "react-redux";
import CardDataStats from "../CardDataStats";
import ChartProductAnalytics from "../Charts/ChartProductAnalytics";
import ChartTwo from "../Charts/ChartTwo";
import DatePickerOne from "../FormElements/DatePicker/DatePickerOne";


const ECommerce: React.FC = () => {
  const { auth } = useSelector((s: RootState) => s.auth)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()
  let startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  endOfMonth.setHours(23, 59, 59, 0)
  startOfMonth.setHours(0, 0, 0, 0)

  const [startDate, setStartDate] = useState<Date | string>(startOfMonth);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth);
  const [profitAndLos, setProfitAndLos] = useState<ProfitType | null>(null)
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)

  useEffect(() => {
    async function GotProfitAndLost() {
      setLoading(true);
      const pad = (n: any) => n.toString().padStart(2, '0');
      const stdDate = new Date(startDate)
      const eDate = new Date(endDate)
      const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
      const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

      const res = await PostWithToken<iResponse<ProfitType>>({
        router: router,
        url: "/api/order/profit-lost",
        token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map(o => o.outlet_id) : defaultSelectedOutlet.map(o => o.outlet_id),
          started_at: _startedAt,
          ended_at: _endedAt,

        }
      })

      if (res?.statusCode === 200) {
        setProfitAndLos(res.data);
      }

      setTimeout(() => {
        setLoading(false);
      }, 100);
    }

    if (!modal)
      GotProfitAndLost()

  }, [startDate, endDate, selectedOutlets, defaultSelectedOutlet, modal, auth.access_token, router])

  function FormatDecimal(number: number) {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR"
    }).format(number);

    return result
  }

  function totalSales(): string {
    if (profitAndLos === null) return "-"
    if (profitAndLos.total_sales === null) return "-"
    return `Rp. ${FormatDecimal(profitAndLos.total_sales)}`
  }

  function countSales() {
    if (profitAndLos === null) return "-"
    if (profitAndLos.count_sales === null) return "-"
    return `${FormatDecimal(profitAndLos.count_sales)}`
  }

  function totalExpense(): string {
    if (profitAndLos === null) return "-"
    if (profitAndLos.total_expense === null) return "-"
    return `Rp. ${FormatDecimal(profitAndLos.total_expense)}`
  }

  function countExpense() {
    if (profitAndLos === null) return "-"
    if (profitAndLos.count_expense === null) return "-"
    return `${FormatDecimal(profitAndLos.count_expense)} inv`
  }

  function convertStaredDate(date: Date | string) {
    const pad = (n: any) => n.toString().padStart(2, '0');
    const stdDate = new Date(date)
    const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
    return _startedAt
  }

  function convertEndedDate(date: Date | string) {
    const pad = (n: any) => n.toString().padStart(2, '0');
    const eDate = new Date(date)
    const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;
    return _endedAt
  }

  return (
    <>
      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <DatePickerOne label={"Start"} defaultDate={new Date(startDate)}
            onChange={(val) => setStartDate(val)} />
          <DatePickerOne label={"End"} defaultDate={new Date(endDate)}
            onChange={(val) => setEndDate(val)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total Sales" total={totalSales()} rate={countSales()} levelUp>
          <FiShoppingCart size={23} className="text-primary" />
        </CardDataStats>
        <CardDataStats title="Total Order" total={countSales()} rate="">
          <CgShoppingBag size={23} className="text-primary" />
        </CardDataStats>
        <CardDataStats title="Total Expense" total={totalExpense()} rate={countExpense()} levelDown>
          <FaMoneyBillTransfer size={23} className="text-primary" />
        </CardDataStats>
        <CardDataStats title="Selected Outlet" total={`${selectedOutlets.length >= 1 ? selectedOutlets.length : defaultSelectedOutlet.length}`} rate="">
          <MdOutlineSpeed size={23} className="text-primary" />
        </CardDataStats>
      </div>

      <div className="mt-4 space-y-7">
        {/* <ChartOne /> */}
        {/* <ChartOrder /> */}
        <ChartTwo startedAt={convertStaredDate(startDate)} endedAt={convertEndedDate(endDate)} />
        {/* <ChartThree /> */}
        <ChartProductAnalytics startedAt={convertStaredDate(startDate)} endedAt={convertStaredDate(endDate)} />
        {/* <MapOne started_at={startDate} ended_at={endDate} />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
        <ChatCard /> */}
      </div>

    </>
  );
};

export default ECommerce;
