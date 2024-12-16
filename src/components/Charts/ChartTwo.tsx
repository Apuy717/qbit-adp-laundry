"use client";

import { ApexOptions } from "apexcharts";
import React, { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { TopPerformanceOutlet } from "@/types/profit";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { useSelector } from "react-redux";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});


interface iSeries {
  name: string,
  data: number[],
}

const ChartTwo: React.FC = () => {
  const [options, setOptions] = useState<ApexOptions>({
    colors: ["#3C50E0", "#80CAEE"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "bar",
      height: 335,
      stacked: true,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    responsive: [
      {
        breakpoint: 1536,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 0,
              columnWidth: "25%",
            },
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 0,
        columnWidth: "25%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: [],
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          return new Intl.NumberFormat("id-ID", {
            style: "decimal",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(value);
        },
      }
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Satoshi",
      fontWeight: 500,
      fontSize: "14px",
    },
    fill: {
      opacity: 1,
    },
  })

  const { auth } = useSelector((s: RootState) => s.auth)
  const [loading, setLoading] = useState<boolean>(true)
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)
  const router = useRouter()
  const [seriesSales, setSeriesSales] = useState<iSeries>({ name: "Sales", data: [] })
  const [seriesOrderSales, setSeriesOrderSales] = useState<iSeries>({ name: "Count Orders", data: [] })
  const [filterByDate, setFilterByDate] = useState<string>("day")

  useEffect(() => {
    let now = new Date()
    let startedAt: Date = new Date()
    let endedAt: Date = new Date()
    if (filterByDate === "day") {
      startedAt = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
      endedAt = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
    }

    if (filterByDate === "week") {
      const currentDay = now.getDay();
      // Tanggal awal minggu (Senin)
      startedAt = new Date(now);
      startedAt.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
      startedAt.setHours(0, 0, 0, 0);

      // Tanggal akhir minggu (Minggu)
      endedAt = new Date(now);
      endedAt.setDate(now.getDate() + (currentDay === 0 ? 0 : 7 - currentDay));
      endedAt.setHours(23, 59, 59, 999);
    }

    if (filterByDate === "month") {
      startedAt = new Date(now.getFullYear(), now.getMonth(), 1);
      endedAt = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    if (filterByDate === "year") {
      startedAt = new Date(now.getFullYear(), 0, 1);
      endedAt = new Date(now.getFullYear(), 11, 31);
    }

    startedAt.setHours(0, 0, 0, 0)
    endedAt.setHours(23, 59, 59, 0)
    const offsetInMinutes = 7 * 60;
    startedAt = new Date(startedAt.getTime() + offsetInMinutes * 60 * 1000);
    endedAt = new Date(endedAt.getTime() + offsetInMinutes * 60 * 1000);

    async function GotTopPerformanceOutlet() {
      setLoading(true);
      const res = await PostWithToken<iResponse<TopPerformanceOutlet[]>>({
        router: router,
        url: "/api/order/top-outlet?with_order_by=false",
        token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map(o => o.outlet_id) : defaultSelectedOutlet.map(o => o.outlet_id),
          started_at: startedAt.toISOString().split(".")[0],
          ended_at: endedAt.toISOString().split(".")[0]
        }
      })

      if (res?.statusCode === 200) {
        let _salesSeries: number[] = []
        let _orderCount: number[] = []
        let _categories: string[] = []
        for (const itm of res.data) {
          _salesSeries.push(parseInt(itm.total_sum))
          _orderCount.push(parseInt(itm.order_count))
          _categories.push(itm.outlet.name)
        }

        setSeriesSales((old) => {
          return {
            name: old.name,
            data: _salesSeries
          }
        })

        setSeriesOrderSales((old) => {
          return {
            name: old.name,
            data: _orderCount
          }
        })

        setOptions((old) => {
          return {
            ...old, xaxis: { ...old.xaxis, categories: _categories },
          }
        })
      }

      setTimeout(() => {
        setLoading(false);
      }, 100);
    }

    if (!modal)
      GotTopPerformanceOutlet()

  }, [selectedOutlets, defaultSelectedOutlet, filterByDate, modal])



  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Total Sales of Outlets
          </h4>
        </div>
        <div>
          <div className="relative z-20 inline-block">
            <select
              name="#"
              id="#"
              className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 text-sm font-medium outline-none"
              onChange={(v) => setFilterByDate(v.target.value)}
            >
              <option value="day" className="dark:bg-boxdark">
                This Day
              </option>
              <option value="week" className="dark:bg-boxdark">
                This Week
              </option>
              <option value="month" className="dark:bg-boxdark">
                This Month
              </option>
              <option value="year" className="dark:bg-boxdark">
                This Year
              </option>
            </select>
            <span className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.47072 1.08816C0.47072 1.02932 0.500141 0.955772 0.54427 0.911642C0.647241 0.808672 0.809051 0.808672 0.912022 0.896932L4.85431 4.60386C4.92785 4.67741 5.06025 4.67741 5.14851 4.60386L9.09079 0.896932C9.19376 0.793962 9.35557 0.808672 9.45854 0.911642C9.56151 1.01461 9.5468 1.17642 9.44383 1.27939L5.50155 4.98632C5.22206 5.23639 4.78076 5.23639 4.51598 4.98632L0.558981 1.27939C0.50014 1.22055 0.47072 1.16171 0.47072 1.08816Z"
                  fill="#637381"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.22659 0.546578L5.00141 4.09604L8.76422 0.557869C9.08459 0.244537 9.54201 0.329403 9.79139 0.578788C10.112 0.899434 10.0277 1.36122 9.77668 1.61224L9.76644 1.62248L5.81552 5.33722C5.36257 5.74249 4.6445 5.7544 4.19352 5.32924C4.19327 5.32901 4.19377 5.32948 4.19352 5.32924L0.225953 1.61241C0.102762 1.48922 -4.20186e-08 1.31674 -3.20269e-08 1.08816C-2.40601e-08 0.905899 0.0780105 0.712197 0.211421 0.578787C0.494701 0.295506 0.935574 0.297138 1.21836 0.539529L1.22659 0.546578ZM4.51598 4.98632C4.78076 5.23639 5.22206 5.23639 5.50155 4.98632L9.44383 1.27939C9.5468 1.17642 9.56151 1.01461 9.45854 0.911642C9.35557 0.808672 9.19376 0.793962 9.09079 0.896932L5.14851 4.60386C5.06025 4.67741 4.92785 4.67741 4.85431 4.60386L0.912022 0.896932C0.809051 0.808672 0.647241 0.808672 0.54427 0.911642C0.500141 0.955772 0.47072 1.02932 0.47072 1.08816C0.47072 1.16171 0.50014 1.22055 0.558981 1.27939L4.51598 4.98632Z"
                  fill="#637381"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div>
        <div id="chartTwo" className="-mb-9 -ml-5 relative">
          {
            loading && <div className="w-full h-full absolute top-0 flex items-center justify-center z-50">
              <AiOutlineLoading3Quarters className="animate-spin text-purple-600" size={50} />
            </div>
          }
          <ReactApexChart
            options={options}
            series={[seriesSales, seriesOrderSales]}
            type="bar"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartTwo;
