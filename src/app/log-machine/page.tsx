"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import Table from "@/components/Tables/Table";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { MachineLogType } from "@/types/machineLogType";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { HiDownload } from "react-icons/hi";
import { useSelector } from "react-redux";


export default function LogMachine() {
  let startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  let endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() + 1,
  );

  endOfMonth.setHours(6, 59, 59, 0);
  const offsetInMinutes = 7 * 60;
  startOfMonth = new Date(startOfMonth.getTime() + offsetInMinutes * 60 * 1000);

  const [startDate, setStartDate] = useState<Date | string>(
    startOfMonth.toISOString().split(".")[0],
  );
  const [endDate, setEndDate] = useState<Date | string>(
    endOfMonth.toISOString().split(".")[0],
  );
  const [items, setItems] = useState<MachineLogType[]>([]);
  const { auth, role } = useSelector((s: RootState) => s.auth);
  const [refresh, setRefresh] = useState<boolean>(false);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );
  const [loadingDownload, setLodaingDownload] = useState<boolean>(false);


  const router = useRouter();

  useEffect(() => {
    async function GotLogMachine() {
      let urlwithQuery = `/api/machine/got-logs`

      const res = await PostWithToken<iResponse<MachineLogType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids:
            selectedOutlets.length >= 1
              ? selectedOutlets.map((o) => o.outlet_id)
              : defaultSelectedOutlet.map((o) => o.outlet_id),
          started_at: startDate,
          ended_at: endDate,
        },
      });

      if (res?.statusCode === 200) {
        setItems(res.data);
      }
    }
    if (!modal) GotLogMachine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    refresh,
    auth.access_token,
    selectedOutlets,
    defaultSelectedOutlet,
    modal,
    startDate,
    endDate
  ]);

  async function DownloadXLXS() {
    setLodaingDownload(true);
    if (loadingDownload) return;

    const pad = (n: any) => n.toString().padStart(2, "0");
    const stdDate = new Date(startDate);
    const eDate = new Date(endDate);
    const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
    const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

    const res = await PostWithToken<iResponse<{ filename: string }>>({
      router: router,
      url: "/api/machine/logs/download",
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

    if (res.statusCode === 200) {
      const url = `${window.location.origin}/download/${res.data.filename}`;
      window.open(url, "_blank");
    }

    setTimeout(() => setLodaingDownload(false), 1000);
  }


  return (
    <div className="min-h-screen">
      <Breadcrumb pageName={"Log Machine"} />
      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <DatePickerOne
            label={"Start"}
            defaultDate={new Date(startDate)}
            onChange={(val) => setStartDate(val)}
          />
          <DatePickerOne
            label={"End"}
            defaultDate={new Date(endDate)}
            onChange={(val) => setEndDate(val)}
          />
          <button
            className={`font-edium inline-flex w-full md:w-min items-center justify-center rounded-md bg-black px-10 
                      py-3 text-center text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={DownloadXLXS}
          >
            {loadingDownload && (
              <AiOutlineLoading3Quarters size={23} className="animate-spin" />
            )}
            {!loadingDownload && <HiDownload size={23} />}
          </button>
        </div>
      </div>

      <Table
        colls={[
          "#",
          "invoice",
          "customer",
          "sku",
          "outlet",
          "status",
          "access by",
          "start at",
          "end at",
          "target",
          "real",
        ]
        }
        currentPage={0}
        totalItem={0}
        onPaginate={() => { }}
        showing={100}
      >
        {items.map((i, k) => (
          <tr
            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600"
            key={k}
          >
            <td className="whitespace-nowrap px-6 py-4">{k + 1}</td>
            <td className="whitespace-nowrap px-6 py-4 font-bold text-green-500">{i.order_item_stage?.order_item?.order.invoice_id}</td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.order_item_stage?.order_item?.order.customer.fullname}
            </td>
            <td className="whitespace-nowrap px-6 py-4">{i.order_item_stage?.order_item?.product_sku_name}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.machine.outlet?.name}</td>
            <td className="whitespace-nowrap px-6 py-4 uppercase">{i.status}</td>
            <td className="whitespace-nowrap px-6 py-4 uppercase">{i.accessed_by}</td>
            <td className="whitespace-nowrap px-6 py-4">{new Date(i.created_at).toLocaleDateString("id", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}</td>
            <td className="whitespace-nowrap px-6 py-4">{new Date(i.updated_at).toLocaleDateString("id", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}</td>
            <td className="whitespace-nowrap px-6 py-4">{i.duration} (minutes)</td>
            <td className="whitespace-nowrap px-6 py-4">{i.time_used} (minutes)</td>
          </tr>
        ))}
      </Table>
    </div >
  );
}
