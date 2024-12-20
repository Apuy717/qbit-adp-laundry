"use client"
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { BRAND } from "@/types/brand";
import { TopPerformanceOutlet } from "@/types/profit";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const TableOne = () => {
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

  const [items, setItems] = useState<TopPerformanceOutlet[]>([])

  useEffect(() => {
    async function GotTopPerformanceOutlet() {
      setLoading(true);

      const res = await PostWithToken<iResponse<TopPerformanceOutlet[]>>({
        router: router,
        url: "/api/order/top-outlet?limit=10",
        token: `${auth.access_token}`,
        data: {
          outlet_ids: filterByOutlet,
          started_at: startDate,
          ended_at: endDate,

        }
      })

      if (res?.statusCode === 200) {
        setItems(res.data);
      }

      setTimeout(() => {
        setLoading(false);
      }, 100);
    }

    GotTopPerformanceOutlet()

  }, [startDate, endDate, filterByOutlet, auth.access_token, router])

  function FormatDecimal(number: number) {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR"
    }).format(number);

    return result
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Top Outlets
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Name
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Sales
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Revenues
            </h5>
          </div>
        </div>

        {items.map((i, k) => (
          <div
            className={`grid grid-cols-3 ${k === items.length - 1
              ? ""
              : "border-b border-stroke dark:border-strokedark"
              }`}
            key={k}
          >
            <div className="flex flex-col items-start justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">
                {i.outlet.name}
              </p>
              <span className="text-sm">{i.outlet.city}</span>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{FormatDecimal(parseInt(i.order_count))}</p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-meta-3">Rp. {FormatDecimal(parseInt(i.total_sum))}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOne;
