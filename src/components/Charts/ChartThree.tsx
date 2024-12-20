import { GetWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { GraphProductAnalytic } from "@/types/graph";
import { ApexOptions } from "apexcharts";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useSelector } from "react-redux";

const ChartThree: React.FC = () => {

  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const [options, setOptions] = useState<ApexOptions>({
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "donut",
    },
    colors: [],
    labels: [],
    legend: {
      show: false,
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          background: "transparent",
        },
      },
    },
    dataLabels: {
      enabled: true, // This must be true for data labels to show
      style: {
        fontSize: '10px',
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderRadius: 2,
        padding: 4,
        opacity: 0.9,
        borderWidth: 1,
        borderColor: '#fff'
      },
      dropShadow: {
        enabled: false
      }
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  })

  const [series, setSeries] = useState<number[]>([])

  function generateRandomColor() {
    const blueShades = [
      "#3C50E0", // Biru tua
      "#0FADCF",  // Biru turquoise
      "#db2777", //Pink
      "#a21caf", //Fuchsia
      "#0891b2", //Cyan
      "#16a34a", //Green
      "#ea580c", //Orange
      "dc2626", //Red
    ];


    const baseColor = blueShades[Math.floor(Math.random() * blueShades.length)];

    function adjustColor(color: string, adjustment: number) {
      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);

      r = Math.min(255, Math.max(0, r + adjustment));
      g = Math.min(255, Math.max(0, g + adjustment));
      b = Math.min(255, Math.max(0, b + adjustment));

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    return adjustColor(baseColor, Math.floor(Math.random() * 20 - 10));
  }

  const [filterBy, setFilterBy] = useState<string>("month")
  const [loading, setLoading] = useState<boolean>(false)
  useEffect(() => {
    async function GotData() {
      setLoading(true)
      const res = await GetWithToken<iResponse<GraphProductAnalytic[]>>({
        url: `/api/order/order-product-analytics?filter=${filterBy}`,
        router: router,
        token: `${auth.access_token}`
      })

      if (res.statusCode === 200) {
        let _series: number[] = []
        let _labels: string[] = []
        let _color: string[] = []
        let _data = []
        const total = res.total ? res.total : 0
        for (const itm of res.data) {
          _series.push(parseInt(itm.count));
          _labels.push(itm.product_sku_name);
          const color = generateRandomColor()

          _color.push(color)
          const percentage = (parseInt(itm.count) / total) * 100;
          _data.push({
            name: itm.product_sku_name,
            percentage: percentage.toFixed(2) + "%",
            color: color
          })
        }

        setSeries(_series)
        setOptions((old) => {
          return {
            ...old,
            labels: _labels,
            colors: _color,
          }
        })
      }

      setTimeout(() => {
        setLoading(false);
      }, 100);
    }

    GotData()

  }, [filterBy,router, auth.access_token])


  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-5">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <div>
          <h5 className="text-xl font-semibold text-black dark:text-white">
            Product Analytics
          </h5>
        </div>
        <div>
          <div className="relative z-20 inline-block">
            <select
              name=""
              id=""
              className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 text-sm font-medium outline-none"
              onChange={(v) => setFilterBy(v.target.value)}
            >
              <option value="month" className="dark:bg-boxdark">
                Monthly
              </option>
              <option value="year" className="dark:bg-boxdark">
                Yearly
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
        <div id="chartThree" className="mx-auto flex justify-center relative">
          {
            loading && <div className="w-full h-full absolute top-0 flex items-center justify-center z-50">
              <AiOutlineLoading3Quarters className="animate-spin text-purple-600" size={50} />
            </div>
          }
          <ReactApexChart options={options} series={series} type="donut" />
        </div>
      </div>
    </div>
  );
};

export default ChartThree;
