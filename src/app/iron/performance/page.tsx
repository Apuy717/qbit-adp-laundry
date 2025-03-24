"use client"

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb"
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne"
import { Input } from "@/components/Inputs/InputComponent"
import Table from "@/components/Tables/Table"
import { FilterByOutletContext } from "@/contexts/selectOutletContex"
import { iResponse, PostWithToken } from "@/libs/FetchData"
import { RootState } from "@/stores/store"
import { IronTypes } from "@/types/ironType"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { useSelector } from "react-redux"


export default function IronPerformancePage() {
  let startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  let endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);

  endOfMonth.setHours(6, 59, 59, 0)
  const offsetInMinutes = 7 * 60
  startOfMonth = new Date(startOfMonth.getTime() + offsetInMinutes * 60 * 1000);

  const [startDate, setStartDate] = useState<Date | string>(startOfMonth.toISOString().split(".")[0]);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth.toISOString().split(".")[0]);

  const [data, setData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState<string>("");


  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)

  useEffect(() => {
    async function GotData() {
      let urlwithQuery = `/api/iron/performance-of-employee`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/iron/performance-of-employee?search=${fixValueSearch}`;
      }
      const res = await PostWithToken<iResponse<any[]>>({
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
        setData(res.data);
      }
      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    if (!modal)
      GotData()
  }, [fixValueSearch, refresh, auth.access_token, selectedOutlets, defaultSelectedOutlet, modal, startDate, endDate, router])

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
  function formatWorkDuration(totalMinutes: number) {
    if (!totalMinutes || totalMinutes <= 0) return "0 m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m` : ""}`.trim();
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb pageName={"Iron Performance"} />

      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <DatePickerOne label={"Start"} defaultDate={new Date(startDate)}
            onChange={(val) => setStartDate(val)} />
          <DatePickerOne label={"End"} defaultDate={new Date(endDate)}
            onChange={(val) => setEndDate(val)} />
          <div className="w-full">
            <Input
              label={"Search User"}
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
        colls={["#", "Name", "Department", "Outlet", "Total Work", "Total Item", "Total Job"]}
        onPaginate={(page) => null}
        currentPage={0}
        totalItem={0}>
        {data.map((i, k) => (
          <tr key={k} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600">
            <td className="px-6 py-4">
              {k + 1}
            </td>
            <td className="px-6 py-4 capitalize">
              {i.user.fullname}
              <p className="text-xs font-thin">{` ` + i.user.dial_code + '' + i.user.phone_number}</p>
            </td>
            <td className="px-6 py-4 uppercase">
              {i.user.department}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {i.outlet.name}
              <p className="text-xs font-thin">{` ` + i.outlet.city.split("--")[1]}</p>
            </td>
            <td className="px-6 py-4">
              {formatWorkDuration(i.total_work_duration_minutes)}
            </td>
            <td className="px-6 py-4">
              {i.total_item} pcs
            </td>
            <td className="px-6 py-4">
              {i.total_job} sku
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}