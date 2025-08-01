'use client';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { Input } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { useMqtt } from "@/contexts/MqttContext";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { EEmptyWash, EmptyWashType } from "@/types/emptyWashType";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheck } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import { MdBlock } from "react-icons/md";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function EmptyWash() {
  const { client, status } = useMqtt();
  function handlePower(deviceId: string, power: "ON" | "OFF") {
    if (client) {
      client.publish(`cmnd/${deviceId}/POWER`, power, { qos: 1 }, (err) => {
        if (err) toast.error("Gagal kirim perintah ke device");
        else toast.success(`Device ${deviceId} -> ${power}`);
      });
    } else {
      toast.error("MQTT client belum terhubung");
    }
  }
  const isDeviceOnline = (deviceId: string) => {
    return status[deviceId]?.lwt === "Online";
  };

  const isPowerOff = (deviceId: string) => {
    return status[deviceId]?.power === "OFF";
  };

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

  const [items, setItems] = useState<EmptyWashType[]>([])
  const [totalItem, setTotalItem] = useState<number>(0)
  const { auth, role } = useSelector((s: RootState) => s.auth)
  const [currentPage, setCurrentPage] = useState(1);
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [modalApproved, setModalApproved] = useState<boolean>(false)
  const [duration, setDuration] = useState<string>("")
  const [payloadApproved, setPayloadApproved] = useState<{ id: string, stts: EEmptyWash, duration: number } | null>(null)

  useEffect(() => {
    if (client) {
      // Ketika halaman mount dan client sudah connect,
      // minta semua device mengirim status POWER
      const deviceIds = Object.keys(status);
      deviceIds.forEach(deviceId => {
        client.publish(`cmnd/${deviceId}/POWER`, "");
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    async function GotItems() {
      setLoading(true)
      let urlwithQuery = `/api/empty-wash/filter?page=${currentPage}&limit=${10}`;
      const pad = (n: any) => n.toString().padStart(2, "0");
      const stdDate = new Date(startDate);
      const eDate = new Date(endDate);
      const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
      const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

      const res = await PostWithToken<iResponse<EmptyWashType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map((o: any) => o.outlet_id) : defaultSelectedOutlet.map((o: any) => o.outlet_id),
          started_at: _startedAt,
          ended_at: _endedAt,
        }
      })

      if (res?.statusCode === 200) {
        if (res.total)
          setTotalItem(res.total);
        setItems(res.data);
      }
      setTimeout(() => setLoading(false), 100)
    }
    if (!modal)
      GotItems()

  }, [currentPage, auth.access_token, selectedOutlets, defaultSelectedOutlet, modal, router, startDate, endDate])

  async function SetReviewStatus(id: string, stts: EEmptyWash, duration: number) {
    const res = await PostWithToken<iResponse<EmptyWashType>>({
      router: router,
      url: "/api/empty-wash/set-status",
      token: `${auth.access_token}`,
      data: {
        empty_wash_id: id,
        review_status: stts,
        duration: duration
      }
    })

    if (res.statusCode === 200) {
      toast.success(`Success update status to ${stts}`)
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? {
            ...item, approved: res.data.approved,
            review_status: res.data.review_status
          } : item
        )
      );
      setPayloadApproved(null)
      setModalApproved(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb pageName={"Empty Wash"} />
      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="grid grid-cols-1 md:gird-cols-2 lg:grid-cols-2 gap-4">
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
        </div>
      </div>

      {
        loading && (
          <div className="fixed top-0 left-0  w-full h-full flex items-center justify-center z-50">
            <AiOutlineLoading3Quarters className="animate-spin text-purple-600" size={50} />
          </div>
        )
      }

      <Table
        colls={["created", "outlet", "machine", "Duration", "requested", "approved", "status", "action"]}
        currentPage={currentPage}
        totalItem={totalItem}
        onPaginate={(page) => setCurrentPage(page)}
      >
        {items.map((i, k) => (
          <tr
            className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
                    dark:bg-gray-800 dark:hover:bg-gray-600"
            key={k}
          >
            <td className="hitespace-nowrap px-6 py-4">
              {new Date(i.created_at).toLocaleDateString("id", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex flex-col">
                {i.outlet?.name}
                <span className="font-light">
                  (
                  {i.outlet && i.outlet.city.split("--").length >= 2
                    ? i.outlet.city.split("--")[1]
                    : i.outlet?.city}
                  )
                </span>
              </div>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex flex-col uppercase">
                {i.machine.name}
                <span className="font-light lowercase">
                  {i.machine.type}
                </span>
              </div>
            </td>

            <td className="whitespace-nowrap px-6 py-4">{i.duration !== null && i.duration >= 1 && i.duration} {i.duration ? "min" : "-"}</td>

            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex flex-col">
                {i.requested?.fullname}
                <span className="font-light">
                  {i.requested?.dial_code} {i.requested?.phone_number}
                </span>
              </div>
            </td>

            <td className="whitespace-nowrap px-6 py-4">
              {
                i.approved === null && "-"
              }
              <div className="flex flex-col">
                {i.approved?.fullname}
                <span className="font-light">
                  {i.approved?.dial_code} {i.approved?.phone_number}
                </span>
              </div>
            </td>


            <td className="whitespace-nowrap px-6 py-4 uppercase">{i.review_status}</td>
            <td className="px-6 py-4 whitespace-nowrap space-x-4 text-white">
              {
                i.review_status !== EEmptyWash.PENDING && (
                  <button
                    className="bg-orange-500 px-2 p-[2px] rounded"
                  >
                    <span className="text-xs">no action</span>
                  </button>
                )
              }

              {
                i.review_status === EEmptyWash.PENDING && (
                  <button
                    className="bg-green-500 hover:bg-green-700 p-2 rounded uppercase"
                    onClick={() => {
                      // handlePower(i.machine.machine_id, "ON")
                      console.log(status);
                      if (i.is_mqtt) {
                        if (isPowerOff(i.machine.machine_id) && isDeviceOnline(i.machine.machine_id)) {
                          setModalApproved(true);
                          setPayloadApproved({
                            id: i.id,
                            stts: EEmptyWash.APPROVED,
                            duration: 0
                          })
                        } else {
                          toast.warning(`${i.machine.name} at Outlet ${i.outlet.name} already running`)
                        }
                      } else {
                        setModalApproved(true);
                        setPayloadApproved({
                          id: i.id,
                          stts: EEmptyWash.APPROVED,
                          duration: 0
                        })
                      }
                    }}
                  >
                    <FaCheck />
                  </button>
                )
              }
              {
                i.review_status === EEmptyWash.PENDING && (
                  <button
                    className="bg-red-500 hover:bg-red-600 p-2 rounded uppercase"
                    onClick={() => SetReviewStatus(i.id, EEmptyWash.REJECTED, 0)}
                  >
                    <MdBlock />
                  </button>
                )
              }
            </td>
          </tr>
        ))}
      </Table>

      <Modal isOpen={modalApproved}>
        <div className="relative w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-[50%]">
          <div
            className="absolute -right-3 -top-3 z-50 cursor-pointer rounded-full border-2 border-white bg-red-500 p-1 shadow"
            onClick={() => {
              setPayloadApproved(null);
              setModalApproved(false)
            }}
          >
            <IoCloseOutline color="white" size={20} />
          </div>

          <div className="flex flex-col space-y-8">
            <Breadcrumb
              pageName={"Approved Empty Wash"}
            />
          </div>

          <div className="gap-y-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6">
              <Input
                type="number"
                label={"Duration*"}
                name={"CV_name"}
                id={"CV_name"}
                value={duration}
                onChange={(v) => setDuration(v)}
                error={duration.length === 0 ? "Duration required" : null}
              />
            </div>

            <button
              className={`mt-6 inline-flex items-center justify-center rounded-md bg-black px-10 py-2 text-center 
                font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10 ${duration.length === 0 && "cursor-not-allowed"}`}
              disabled={duration.length >= 1 ? false : true}
              onClick={() => {
                if (duration.length >= 1 && payloadApproved) {
                  SetReviewStatus(payloadApproved.id, EEmptyWash.APPROVED, parseInt(duration))
                }
              }}
            >
              Approved
            </button>
          </div>
        </div>
      </Modal >
    </div >
  )
}