'use client';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { InputDropdown } from "@/components/Inputs/InputComponent";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { BiSolidDryer, BiSolidWasher } from "react-icons/bi";
import { useSelector } from "react-redux";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const PrintButton = dynamic(() => import("../../components/Button/ButtonPrint"), {
  ssr: false,
});

export interface Stage {
  id: string;
  name: string;
  status: string;
  log_machine: {
    id: string;
    status: string;
    accessed_by: string
    created_at: string;
    updated_at: string;
    machine: {
      name: string;
    };
  } | null;
  incident_reports: { id: string }[]
}

export interface Item {
  id: string;
  product_name: string;
  product_sku_name: string;
  stages: Stage[];
}

export interface Order {
  id: string;
  invoice_id: string;
  customer_name: string;
  admin_name: string;
  total: string;
  created_at: string
  items: Item[];
}

type MachineSummary = {
  iotLog: number;
  task: number;
  unprocessInSomeDay: number;
  unprocessReal: number;
  process: number;
  reqExtra: number;
};

type Summary = {
  washer: MachineSummary;
  dryer: MachineSummary;
};

interface iReactApexChart {
  outlet: {
    id: string
    name: string
    washerCategories: string[]
    dryerCategories: string[]
    maxWasher: number
    washers: {
      id: string
      name: string
      data: number[]
    }[]
    maxDryer: number
    dryers: {
      id: string
      name: string
      data: number[]
    }[]
  }
}
const formatDateTime = (date: string) =>
  new Date(date).toLocaleDateString("id", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("id", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

export default function Page() {
  const router = useRouter()
  let startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  let endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  );
  endOfMonth.setHours(23, 59, 59, 0);
  startOfMonth.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = useState<Date | string>(startOfMonth);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth);

  const { auth, role, department } = useSelector((s: RootState) => s.auth);
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [orderStatus, setOrderStatus] = useState<string>("all");
  enum TabActive {
    ALL = "ALL",
    GRAP = "GRAPH MACHINE",
  }
  const [tabActive, setTabActive] = useState<TabActive>(TabActive.ALL);

  const [items, setItems] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary>({
    washer: {
      iotLog: 0,
      task: 0,
      unprocessInSomeDay: 0,
      unprocessReal: 0,
      process: 0,
      reqExtra: 0
    },
    dryer: {
      iotLog: 0,
      task: 0,
      unprocessInSomeDay: 0,
      unprocessReal: 0,
      process: 0,
      reqExtra: 0
    }
  })
  const [totalItem, setTotalItem] = useState<number>(0);
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );

  const [limit, setLimit] = useState<string>("10")

  useEffect(() => {
    async function GotPRItems() {
      setLoadingSearch(true);
      let urlwithQuery = `/api/machine/audit-order?page=${currentPage}${limit !== "all" && `&limit=${limit}`}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/machine/audit-order?page=${currentPage}&search=${fixValueSearch}${limit !== "all" && `&limit=${limit}`}`;
      }

      let paymentStts = {};
      if (paymentStatus !== "all")
        paymentStts = { payment_status: paymentStatus };

      let tabActiveQuery = {};
      if (tabActive !== TabActive.ALL)
        tabActiveQuery = { tab_active: tabActive };

      const pad = (n: any) => n.toString().padStart(2, "0");
      const stdDate = new Date(startDate);
      const eDate = new Date(endDate);
      const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
      const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

      const res = await PostWithToken<iResponse<{ summary: Summary, data: Order[] }>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : defaultSelectedOutlet.map((o) => o.outlet_id),
          started_at: _startedAt,
          ended_at: _endedAt,
          ...tabActiveQuery
        },
      });

      if (res?.statusCode === 200) {
        setItems(res.data.data);
        setSummary(res.data.summary)
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    async function GotGraph() {
      setLoadingSearch(true);

      let urlwithQuery = `/api/machine/graph-machine?page=${currentPage}${limit !== "all" && `&limit=${limit}`}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/machine/graph-machine?page=${currentPage}&search=${fixValueSearch}${limit !== "all" && `&limit=${limit}`}`;
      }

      const pad = (n: any) => n.toString().padStart(2, "0");
      const stdDate = new Date(startDate);
      const eDate = new Date(endDate);
      const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
      const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

      const res = await PostWithToken<iResponse<iReactApexChart[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : defaultSelectedOutlet.map((o) => o.outlet_id),
          started_at: _startedAt,
          ended_at: _endedAt,
        },
      });

      if (res?.statusCode === 200) {
        setSeries(res.data)
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);

    }

    if (!modal && tabActive === TabActive.ALL) GotPRItems();
    if (!modal && tabActive === TabActive.GRAP) GotGraph();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    limit,
    currentPage,
    fixValueSearch,
    refresh,
    auth.access_token,
    router,
    startDate,
    paymentStatus,
    orderStatus,
    selectedOutlets,
    defaultSelectedOutlet,
    modal,
    endDate,
    tabActive,
  ]);

  const [series, setSeries] = useState<iReactApexChart[]>([]);

  const [options, setOptions] = useState<ApexOptions>({
    chart: {
      height: '100%',
      type: 'bar',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      },
    },
    colors: ['#3a7bd5', '#ea4c89', '#f39c12', '#1abc9c', '#9b59b6', '#e74c3c', '#34495e', '#2ecc71', '#d35400', '#2980b9', '#7f8c8d', '#c0392b'],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '7px'
      }
    },
    stroke: {
      curve: 'smooth'
    },
    markers: {
      size: 1
    },
    xaxis: {
      categories: [],
    },
    yaxis: {
      min: 0,
      max: 20
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      offsetY: 0,
      offsetX: 0
    }
  })

  return (
    <div className="p-4 min-h-screen">
      {loadingSearch && (
        <div className="w-full fixed top-0 left-0 z-99999 h-screen flex items-center justify-center">
          <div className="h-screen w-screen bg-black opacity-45 absolute top-0 left-0"></div>
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid
           border-primary border-t-transparent"></div>
        </div>
      )}

      <Breadcrumb pageName={"Audit Sales and Machines"} />
      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="md:gird-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <DatePickerOne
            label={"Start"}
            defaultDate={startDate}
            onChange={(val) => {
              setStartDate(val);
            }}
          />
          <DatePickerOne
            label={"End"}
            defaultDate={new Date(endDate)}
            onChange={(val) => {
              setEndDate(val);
            }}
          />

          <div className="w-auto">
            <InputDropdown
              className="flex-1"
              label={"Display Data"}
              name={"display_data"}
              id={"display_data"}
              options={[
                { label: "10", value: "10" },
                { label: "50", value: "50" },
                { label: "100", value: "100" },
                { label: "ALL", value: "all" },
              ]}
              value={limit}
              onChange={(e) => setLimit(e)}
              error={null}
            />
          </div>

          <PrintButton />
        </div>
      </div>

      <div className="mb-4 w-full rounded-md bg-gray-50 px-4 pt-4 dark:bg-gray-800">
        <ul
          className="-mb-px flex flex-wrap text-center text-sm font-medium"
          id="default-tab"
          data-tabs-toggle="#default-tab-content"
          role="tablist"
        >
          {Object.values(TabActive).map((i, k) => (
            <li className="me-2" role="presentation" key={k}>
              <button
                className={`inline-block rounded-t-lg border-b-2 p-4 
              ${tabActive === i
                    ? "border-blue-500 text-blue-500"
                    : "dark:border-form-strokedark"
                  }
              `}
                onClick={() => setTabActive(i)}
              >
                {i}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {
        tabActive === TabActive.ALL && (
          <div id="printable">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-5">
              <div className="bg-white dark:bg-boxdark w-full p-4">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div>
                      <BiSolidWasher size={50} className="text-blue-400 rounded-full" />
                    </div>
                    <p className="ml-2 mb-2 font-bold">Washer</p>
                  </div>
                  <div className="flex flex-row space-x-4">
                    <div className="flex flex-col text-sm border-r pr-2">
                      <p className="font-bold">{summary.washer.iotLog}</p>
                      <p>Log IOT</p>
                    </div>
                    <div className="flex flex-col text-sm border-r pr-2">
                      <p className="font-bold">{summary.washer.reqExtra}</p>
                      <p>Req Extra</p>
                    </div>
                    <div className="flex flex-col text-sm text-red-500">
                      <p className="font-bold">{summary.washer.unprocessReal}</p>
                      <p>Unprocess</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-center space-x-2 p-2 mt-2 border-t">
                  <div className="flex-1 flex flex-col text-sm border-r">
                    <p className="font-bold">{summary.washer.task}</p>
                    <p>Task form order</p>
                  </div>
                  <div className="flex-1 flex flex-col text-sm border-r text-green-500">
                    <p className="flex-1 font-bold">{summary.washer.process}</p>
                    <p>Process</p>
                  </div>
                  <div className="flex flex-col text-sm text-yellow-500">
                    <p className="font-bold">{summary.washer.unprocessInSomeDay}</p>
                    <p>Unprocess in some day</p>
                  </div>
                </div>
              </div>
              {/* summary */}
              <div className="bg-white dark:bg-boxdark w-full p-4">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div>
                      <BiSolidDryer size={50} className="text-orange-400 rounded-full" />
                    </div>
                    <p className="ml-2 mb-2 font-bold">Dryer</p>
                  </div>
                  <div className="flex flex-row items-center space-x-4">
                    <div className="flex flex-col text-sm border-r pr-2">
                      <p className="font-bold">{summary.dryer.iotLog}</p>
                      <p>Log IOT</p>
                    </div>
                    <div className="flex flex-col text-sm border-r pr-2">
                      <p className="font-bold">{summary.dryer.reqExtra}</p>
                      <p>Req Extra</p>
                    </div>
                    <div className="flex flex-col text-sm text-red-500">
                      <p className="font-bold">{summary.dryer.unprocessReal}</p>
                      <p>Unprocess</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-center space-x-2 p-2 mt-2 border-t">
                  <div className="flex-1 flex flex-col text-sm border-r">
                    <p className="font-bold">{summary.dryer.task}</p>
                    <p>Task form order</p>
                  </div>
                  <div className="flex-1 flex flex-col text-sm border-r text-green-500">
                    <p className="flex-1 font-bold">{summary.dryer.process}</p>
                    <p>Process</p>
                  </div>
                  <div className="flex flex-col text-sm text-yellow-500">
                    <p className="font-bold">{summary.dryer.unprocessInSomeDay}</p>
                    <p>Unprocess in some day</p>
                  </div>
                </div>
              </div>
            </div>
            {/* summary */}

            {/* detail data */}
            <div className="bg-white dark:bg-boxdark shadow rounded-lg">
              <div className="flex items-center border-b dark:border-gray-700 justify-between px-4 py-2">
                <p className="text-sm text-gray-600">1 - {items.length} of {items.length} items</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Items per page:</span>
                  <select className="border dark:text-gray-500 bg-white dark:bg-boxdark border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}>
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={"all"}>All</option>
                  </select>
                </div>
              </div>
              {items.map((order) => {
                return (
                  <div key={order.id} className="border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="mb-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {/* <input type="checkbox" /> */}
                        <div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <p className="text-sm text-gray-500">{order.invoice_id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-500 font-bold text-center">Order created</p>
                        <p className="text-sm text-gray-500 font-bold">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <div className="text-blue-600 font-semibold">{order.admin_name}</div>
                    </div>
                    <div className="border-l-2 border-blue-500 relative">
                      {/* <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-500" /> */}
                      {order.items.map((item) => {
                        return (
                          <div key={item.id} className="relative pl-2">
                            <p className="font-semibold text-sm ml-4" style={{ marginBottom: '0.5rem' }}>{item.product_name} {item.product_sku_name}</p>
                            {/* <div className="absolute bottom-[0%] left-0 w-4 h-0.5 bg-blue-500" /> */}
                            <div className="absolute bottom-2 -left-0.5 -rotate-2 w-4 h-4 border-l-2 border-b-2 border-blue-500 rounded-bl-md" />

                            <div className="overflow-x-auto border-l-2 border-blue-500 ml-4">
                              <table className="w-full text-sm text-left text-gray-500">
                                <thead className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                                  <tr>
                                    {/* <th className="p-2">Product</th> */}
                                    <th className="p-2">Machine Type</th>
                                    <th className="p-2">Machine</th>
                                    <th className="p-2">Machine Process</th>
                                    <th className="p-2">Processed By</th>
                                    <th className="p-2">Request Extra</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {
                                    item.stages.map((stage) => {
                                      const log = stage.log_machine;
                                      if (log === null) return
                                      return (
                                        <tr key={stage.id} className={`border-b border-gray-200 dark:border-gray-700 
                                  ${(stage.name === "washer" || stage.name === "dryer") && stage.status === "pending" && "bg-red text-white"}
                                  ${formatDate(log.created_at) !== formatDate(order.created_at) && "bg-orange-500 text-white"}
                                  `}>
                                          <td className="p-2">{stage.name}</td>
                                          <td className="p-2">{log?.machine?.name || '-'}</td>
                                          {/* <td className={`p-2 bg-orange-500 text-white`}>{log?.created_at ? formatDateTime(log.created_at) : '-'}</td> */}
                                          <td className={`p-2`}>{formatDateTime(log.created_at)}</td>
                                          <td className="p-2">{log.accessed_by}</td>
                                          <td className="p-2">{stage.incident_reports.length >= 1 && stage.incident_reports.length || "-"}</td>
                                        </tr>
                                      )
                                    })
                                  }
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-sm text-gray-600">1 - {items.length} of {items.length} items</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Items per page:</span>
                  <select className="border bg-white dark:bg-boxdark border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}>
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={"all"}>All</option>
                  </select>
                </div>
              </div>
            </div>
            {/* detail data */}
          </div>
        )
      }

      {
        tabActive === TabActive.GRAP && (
          <div className="bg-white dark:bg-black" id="printable">
            {series.map((i, k) => (
              <div key={k} className="font-semibold m-2 p-4 space-y-4">
                <p className="text-lg text-center">{i.outlet.name}</p>
                <div className="grid grid-cols-1 gap-5">
                  <div id="chart" className="bg-white dark:bg-black h-full">
                    <div className="font-semibold m-4">
                      <p>Washer</p>
                    </div>
                    <ReactApexChart options={{
                      ...options,
                      xaxis: {
                        ...options.xaxis,
                        categories: i.outlet.washerCategories
                      },
                      yaxis: {
                        ...options.yaxis,
                        max: i.outlet.maxWasher
                      }
                    }}
                      series={i.outlet.washers.sort((a, b) => a.name.localeCompare(b.name))}
                      type="line" height={350} />
                  </div>
                  <div id="chart" className="bg-white dark:bg-black">
                    <div className="font-semibold m-2">
                      <p>Dryer</p>
                    </div>
                    <ReactApexChart options={{
                      ...options,
                      xaxis: {
                        ...options.xaxis,
                        categories: i.outlet.dryerCategories
                      },
                      yaxis: {
                        ...options.yaxis,
                        max: i.outlet.maxDryer
                      }
                    }}
                      series={i.outlet.dryers.sort((a, b) => a.name.localeCompare(b.name))}
                      type="line" height={350} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div >
  );
}
