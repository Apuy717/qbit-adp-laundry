"use client";

import { ApexOptions } from "apexcharts";
import React, { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/stores/store";
import { GraphType } from "@/types/graph";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const listMonth = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const listDay = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
]

interface ChartOneState {
  series: {
    name: string;
    data: number[];
  }[];
}

const ChartOne: React.FC = () => {
  // const series = [
  //   {
  //     name: "Sales",
  //     data: [1000000],
  //   },
  // ]

  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const [series, setSeries] = useState<{ name: string, data: number[] }>({ name: "Sales", data: [] })
  const [selectedFilter, setSelectedFilter] = useState<string>("day")
  const [options, setOptions] = useState<ApexOptions>({
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#3C50E0", "#80CAEE"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "area",
      dropShadow: {
        enabled: false,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        // show: true,
        tools: {
          download: true,
          reset: true,
          zoom: true,
          pan: false,
          zoomin: true,
          selection: false,
          zoomout: true,
        }
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: "smooth",
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: "#fff",
      strokeColors: ["#3056D3", "#80CAEE"],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(value);
        },
      },
      title: {
        style: {
          fontSize: "0px",
        },
      },
      min: 0,
      max: 1,
    },
  })

  const [loading, setLoading] = useState<boolean>(false)
  const [filterDate, setFilterDate] = useState<{ startedAt: Date, endedAt: Date }>({ startedAt: new Date(), endedAt: new Date() })
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)

  useEffect(() => {
    async function GotGraph() {
      setLoading(true)
      const res = await PostWithToken<iResponse<GraphType[]>>({
        url: `/api/order/transaction-graph?filter=${selectedFilter}`,
        router: router,
        token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map(o => o.outlet_id) : defaultSelectedOutlet.map(o => o.outlet_id),
        }
      })



      if (res?.statusCode === 200) {
        let categories: string[] = []
        let dt = []

        if (res.data.length === 0) {
          setLoading(false)
          setSeries((old) => {
            return { ...old, data: [] }
          })

          setOptions((old) => {
            return {
              ...old, xaxis: { ...old.xaxis, categories: categories },
              yaxis: { ...old.yaxis, max: 0 }
            }
          })
          return;
        }

        const maxRevenueData = res.data.reduce((max, item) =>
          parseInt(item.total_revenue) > parseInt(max.total_revenue) ? item : max
        );


        for (const item of res.data) {
          const day = new Date(item.date).getDay()
          const month = new Date(item.date).getMonth()
          let category = listDay[day]
          if (selectedFilter === "month") {
            category = listMonth[month]
          } else {
            category = listDay[day]
          }
          categories.push(category)
          dt.push(parseInt(item.total_revenue))
        }
        setSeries((old) => {
          return { ...old, data: dt }
        })

        setOptions((old) => {
          return {
            ...old, xaxis: { ...old.xaxis, categories: categories },
            yaxis: { ...old.yaxis, max: parseInt(maxRevenueData.total_revenue) * 1.5 }
          }
        })
      }

      setTimeout(() => setLoading(false), 100)
    }

    function setDate() {
      const now = new Date()
      if (selectedFilter === "day") {
        const currentDay = now.getDay();
        let _startedAt = new Date(now)
        _startedAt.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        _startedAt.setHours(0, 0, 0, 0);
        let _endedAt = new Date(now);
        _endedAt.setDate(now.getDate() + (currentDay === 0 ? 0 : 7 - currentDay));
        _endedAt.setHours(23, 59, 59, 999);

        setFilterDate((old) => {
          return {
            startedAt: _startedAt,
            endedAt: _endedAt
          }
        })
      } else {
        const _startedAt = new Date(now.getFullYear(), 0, 1);
        const _endedAt = new Date(now.getFullYear(), 11, 31);
        setFilterDate((old) => {
          return {
            startedAt: _startedAt,
            endedAt: _endedAt
          }
        })
      }
    }

    if (!modal) {
      setDate()
      GotGraph()
    }

  }, [selectedFilter, selectedOutlets, defaultSelectedOutlet, modal])

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-primary">Total Sales</p>
              <p className="text-sm font-medium">
                {
                  filterDate.startedAt.toLocaleDateString("id", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                }
                {" - "}
                {
                  filterDate.endedAt.toLocaleDateString("id", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                }
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-45 justify-end">
          <div className="inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4">
            {/* <button className="bg-white shadow-card rounded px-3 py-1 text-xs font-medium text-black  hover:bg-white hover:shadow-card dark:bg-boxdark dark:text-white dark:hover:bg-boxdark">
              Day
            </button> */}
            <button className={`${selectedFilter === "day" && "bg-white dark:bg-gray-500 shadow-card"} rounded px-3 py-1 text-xs font-medium text-black hover:bg-white 
            hover:shadow-card dark:text-white dark:hover:bg-boxdark`}
              onClick={() => {
                if (selectedFilter !== "day") setSelectedFilter("day")
              }}>
              Week
            </button>
            <button className={`${selectedFilter === "month" && "bg-white dark:bg-gray-500 shadow-card"} rounded px-3 py-1 text-xs font-medium text-black hover:bg-white 
            hover:shadow-card dark:text-white dark:hover:bg-boxdark`}
              onClick={() => {
                if (selectedFilter !== "month") setSelectedFilter("month")
              }}>
              Month
            </button>
          </div>
        </div>
      </div>

      <div>
        <div id="chartOne" className="-ml-5 relative">
          {
            loading && <div className="w-full h-full absolute top-0 flex items-center justify-center z-50">
              <AiOutlineLoading3Quarters className="animate-spin text-purple-600" size={50} />
            </div>
          }
          <ReactApexChart
            options={options}
            series={[series]}
            type="area"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
