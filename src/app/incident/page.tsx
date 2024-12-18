"use client"

import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne"
import { Input } from "@/components/Inputs/InputComponent"
import Table from "@/components/Tables/Table"
import { FilterByOutletContext } from "@/contexts/selectOutletContex"
import { iResponse, PostWithToken } from "@/libs/FetchData"
import { RootState } from "@/stores/store"
import { ETypeIncident, IncidentType } from "@/types/incidentType"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { FaArrowLeft } from "react-icons/fa"
import { FiEye } from "react-icons/fi"
import { IoCheckmark } from "react-icons/io5"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"


export default function IncidentPage() {
  let startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  let endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);

  endOfMonth.setHours(6, 59, 59, 0)
  const offsetInMinutes = 7 * 60
  startOfMonth = new Date(startOfMonth.getTime() + offsetInMinutes * 60 * 1000);

  const [startDate, setStartDate] = useState<Date | string>(startOfMonth.toISOString().split(".")[0]);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth.toISOString().split(".")[0]);

  const [data, setData] = useState<IncidentType[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [viewDetail, setViewDetail] = useState<boolean>(false)
  const [detail, setDetail] = useState<IncidentType | null>(null)
  const [search, setSearch] = useState<string>("");


  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const [totalData, setTotalData] = useState<number>(0)
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)

  useEffect(() => {
    async function GotData() {
      let urlwithQuery = `/api/incident/got-incident?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/incident/got-incident?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }
      const res = await PostWithToken<iResponse<IncidentType[]>>({
        url: urlwithQuery,
        router: router,
        token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map(o => o.outlet_id) : defaultSelectedOutlet.map(o => o.outlet_id),
          started_at: startDate,
          ended_at: endDate
        }
      })
      if (res?.statusCode === 200) {
        if (res.data.length >= 1 && res.total)
          setTotalData(res.total)
        else
          setTotalData(0)

        setData(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    if (!modal)
      GotData()
  }, [currentPage, fixValueSearch, refresh, auth.access_token, selectedOutlets, defaultSelectedOutlet, modal])

  const handleSearch = async () => {
    if (search.length === 0) {
      setCurrentPage(1);
      setData([]);
      setLoadingSearch(true);
      setFixValueSearch("");
      setRefresh((prev) => !prev);
    } else {
      if (search.length >= 1) {
        setData([]);
        setLoadingSearch(true);
        setFixValueSearch(search);
        setCurrentPage(1);
      }
    }
  };

  const approveToken = async (tokenId: string) => {
    const res = await PostWithToken<iResponse<any>>({
      url: `/api/incident/approve/${tokenId}`,
      router: router,
      token: `${auth.access_token}`,
      data: []
    })

    if (res.statusCode === 200) {
      toast.success("Sucess update data!");
    }

  }

  return (
    <div>
      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <DatePickerOne label={"Start"} defaultDate={new Date(startDate)}
            onChange={(val) => setStartDate(val)} />
          <DatePickerOne label={"End"} defaultDate={new Date(endDate)}
            onChange={(val) => setEndDate(val)} />
          <div className="w-full">
            <Input
              label={"Serach Token"}
              name={"search"}
              id={"search"}
              value={search}
              onChange={(v) => setSearch(v)}
              error={null}
            />
          </div>
          <button
            onClick={handleSearch}
            className={`w-full md:w-min inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            {loadingSearch ? "Loading" : "Search"}
          </button>
        </div>
      </div>


      <Table
        colls={["Outlet", "Invoice", "Token", "Incident", "Requested", "Approved", "Created At", "Note", "Action"]}
        onPaginate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        totalItem={totalData}>
        {data.map((i, k) => (
          <tr key={k} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600">

            <td className="px-6 py-4 whitespace-nowrap flex flex-col">
              {i.outlet.name}
              <span className="text-xs font-thin">{i.outlet.city}</span>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.incident_reports[0].order_item_stage.order_item.order.invoice_id}
            </td>
            <td className="px-6 py-4">
              <div className={`${i.approved ? "bg-green-500" : "bg-red"} flex items-center justify-center
                 p-2 rounded text-white`}>
                {i.token}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {i.incident_type.name}
            </td>

            <td className="px-6 py-4 whitespace-nowrap flex flex-col">
              {i.reported_by?.fullname}
              <span className="text-xs font-thin">{i.reported_by?.dial_code} {i.reported_by?.phone_number}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {i.accepted_by?.fullname}
            </td>
            <td className="px-6 py-4">
              {new Date(i.created_at).toLocaleDateString("id", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </td>
            <td className="px-6 py-4">
              {i.note === null ? "-" : i.note}
            </td>
            <td className="px-6 py-4 whitespace-nowrap flex flex-row gap-1 items-center justify-center">
              {!i.approved && (
                <button className="bg-green-500 flex items-center justify-center p-1 rounded"
                  onClick={() => approveToken(i.id)}>
                  <IoCheckmark size={20} color="white" />
                </button>
              )}
              <button className="bg-gray-500 flex items-center justify-center p-1 rounded"
                onClick={() => {
                  setDetail(i)
                  setViewDetail(true)

                }}>
                <FiEye size={20} color="white" />
              </button>
            </td>
          </tr>
        ))}
      </Table>

      {detail && (
        <div className={`h-screen w-full md:w-[32rem] bg-white fixed right-0 top-0 z-[999] transition-all duration-300
        ${!viewDetail && "translate-x-full"} dark:bg-boxdark shadow overflow-y-auto`}>
          <div className="p-4 bg-white dark:bg-boxdark shadow">
            <button onClick={() => setViewDetail(false)}>
              <FaArrowLeft className="rotate-180" size={20} />
            </button>
          </div>
          <div className="w-full h-full">
            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Reported
              </h4>
              <div className="py-3 flex flex-col space-y-1">
                <div className="flex flex-row justify-between">
                  <p>Nama Lengkap</p>
                  <p>{detail?.reported_by?.fullname}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>No.Hp</p>
                  <p>{detail?.reported_by?.dial_code} {detail?.reported_by?.phone_number}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Accepted
              </h4>
              <div className="py-3 flex flex-col space-y-1">
                <div className="flex flex-row justify-between">
                  <p>Nama Lengkap</p>
                  <p>{detail?.accepted_by?.fullname}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>No.Hp</p>
                  <p>{detail?.accepted_by?.dial_code} {detail?.accepted_by?.phone_number}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Detail
              </h4>
              <div className="py-3 flex flex-col space-y-1">
                <div className="flex flex-row justify-between">
                  <p>Token</p>
                  <p>{detail?.token}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Approved</p>
                  {detail && detail.approved ? (
                    <div className="bg-green-500 flex items-center justify-center px-2 text-white rounded text-sm">true</div>
                  ) : (
                    <div className="bg-red-500 flex items-center justify-center px-2 text-white rounded text-sm">false</div>
                  )}
                </div>
                <div className="flex flex-row justify-between">
                  <p>Has been used</p>
                  {detail && detail.is_used ? (
                    <div className="bg-green-500 flex items-center justify-center px-2 text-white rounded text-sm">true</div>
                  ) : (
                    <div className="bg-red-500 flex items-center justify-center px-2 text-white rounded text-sm">false</div>
                  )}
                </div>
                <div className="flex flex-row justify-between">
                  <p>Created At</p>
                  <p>
                    {new Date(detail.created_at).toLocaleDateString("id", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Updated At</p>
                  <p>
                    {new Date(detail.updated_at).toLocaleDateString("id", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Ref Order
              </h4>
              <div className="py-3 flex flex-col space-y-1">
                <Table
                  colls={["#", "Item", "Machine"]}
                  onPaginate={(page) => setCurrentPage(page)}
                  currentPage={0}
                  totalItem={0}>
                  {detail.incident_reports.map((i, k) => (
                    <tr key={k} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600">
                      <td className="px-6 py-4">{k + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          {i.order_item_stage.order_item.product_name}
                          <span className="text-xs font-thin">{i.order_item_stage.order_item.product_sku_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          {i.order_item_stage.machine.name}
                          <span className="text-xs font-thin">{i.order_item_stage.machine.type}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}