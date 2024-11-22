"use client";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import ChartOne from "../Charts/ChartOne";
import ChartTwo from "../Charts/ChartTwo";
import ChatCard from "../Chat/ChatCard";
import TableOne from "../Tables/TableOne";
import CardDataStats from "../CardDataStats";
import { FiShoppingCart } from "react-icons/fi";
import { CgShoppingBag } from "react-icons/cg";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { MdOutlineSpeed } from "react-icons/md";
import { ProfitType } from "@/types/profit";
import { useSelector } from "react-redux";
import { RootState } from "@/stores/store";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { useRouter } from "next/navigation";
import MapOne from "../Maps/MapOne";


const ChartThree = dynamic(() => import("@/components/Charts/ChartThree"), {
  ssr: false,
});


const defaultAndLostDefaultValue = {
  count_expense: 0,
  total_expense: null,
  count_sales: 0,
  total_sales: null,
  profit: 0,
  avg: {
    total: null
  }
}

const ECommerce: React.FC = () => {
  const { auth, role } = useSelector((s: RootState) => s.auth)
  const [loading, setLoading] = useState<boolean>(true)
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([])
  const router = useRouter()
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(
    `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate()} 23:59`,
  )

  const [startDate, setStartDate] = useState<Date | string>(startOfMonth.toISOString().split(".")[0]);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth.toISOString().split(".")[0]);
  const [profitAndLos, setProfitAndLos] = useState<ProfitType | null>(null)

  useEffect(() => {
    async function GotProfitAndLost() {
      setLoading(true);

      const res = await PostWithToken<iResponse<ProfitType>>({
        router: router,
        url: "/api/order/profit-lost",
        token: `${auth.access_token}`,
        data: {
          outlet_ids: filterByOutlet,
          started_at: startDate,
          ended_at: endDate,

        }
      })

      if (res?.statusCode === 200) {
        setProfitAndLos(res.data);
      }

      setTimeout(() => {
        setLoading(false);
      }, 100);
    }

    GotProfitAndLost()

  }, [startDate, endDate, filterByOutlet])

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
    return `${FormatDecimal(profitAndLos.count_sales)} inv`
  }

  function totalProfit(): string {
    if (profitAndLos === null) return "-"
    if (profitAndLos.profit === null) return "-"
    return `Rp. ${FormatDecimal(profitAndLos.profit)}`
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

  function totalAvg(): string {
    if (profitAndLos === null) return "-"
    if (profitAndLos.avg.total === null) return "-"
    return `Rp. ${FormatDecimal(parseInt(profitAndLos.avg.total))}`
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total Sales" total={totalSales()} rate={countSales()} levelUp>
          <FiShoppingCart size={23} className="text-primary" />
        </CardDataStats>
        <CardDataStats title="Total Profit" total={totalProfit()} rate="">
          <CgShoppingBag size={23} className="text-primary" />
        </CardDataStats>
        <CardDataStats title="Total Expense" total={totalExpense()} rate={countExpense()} levelDown>
          <FaMoneyBillTransfer size={23} className="text-primary" />
        </CardDataStats>
        <CardDataStats title="Average Sales" total={totalAvg()} rate="">
          <MdOutlineSpeed size={23} className="text-primary" />
        </CardDataStats>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartOne />
        <ChartTwo />
        <ChartThree />
        <MapOne />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
        <ChatCard />
      </div>
    </>
  );
};

export default ECommerce;
