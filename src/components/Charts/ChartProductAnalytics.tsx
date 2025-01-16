"use client";

import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { GraphProductAnalytic } from "@/types/graph";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useSelector } from "react-redux";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});


interface iSeries {
  name: string,
  data: number[],
}

interface iProps {
  startedAt: string | Date
  endedAt: string | Date
}

export default function ChartProductAnalytics(props: iProps) {
  const [options, setOptions] = useState<ApexOptions>({
    colors: ["#3C50E0"],
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
      formatter: (val: any, opts: any) => {
        // Calculate total for the series
        const total = opts.w.config.series[0].data.reduce((a: any, b: any) => a + b, 0);
        // Calculate percentage and format
        const percentage = (val / total) * 100;
        return `${percentage.toFixed(1)}%`;
      },
      style: {
        fontSize: '10px',
      },
      background: {
        enabled: true,
        foreColor: 'black',
        borderRadius: 2,
        padding: 4,
        opacity: 1,
        borderWidth: 1,
        borderColor: 'black'
      },
      dropShadow: {
        enabled: false
      }
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

  useEffect(() => {
    async function GotTopPerformanceOutlet() {
      setLoading(true);
      const res = await GetWithToken<iResponse<GraphProductAnalytic[]>>({
        url: `/api/order/order-product-analytics?started_at=${props.startedAt}&ended_at=${props.endedAt}`,
        router: router,
        token: `${auth.access_token}`
      })

      if (res?.statusCode === 200) {
        let _salesSeries: number[] = []
        let _categories: string[] = []
        for (const itm of res.data) {
          _salesSeries.push(parseInt(itm.count))
          _categories.push(itm.product_sku_name)
        }

        setSeriesSales((old) => {
          return {
            name: old.name,
            data: _salesSeries
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlets, defaultSelectedOutlet, props.startedAt, props.endedAt, modal, router, auth.access_token])



  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Product Analytics
          </h4>
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
            series={[seriesSales]}
            type="bar"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};