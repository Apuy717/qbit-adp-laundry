'use client'
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { InputDropdown } from "@/components/Inputs/InputComponent";
import Table from "@/components/Tables/Table";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { EPaymentStatus, EStatusOrder, OrderType } from "@/types/orderType";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaArrowLeft } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { HiDownload } from "react-icons/hi";
import { useSelector } from "react-redux";

export default function Orders() {
  let startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let endOfMonth = new Date(
    `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate()}`,
  )

  endOfMonth.setHours(6, 59, 59, 0)
  const offsetInMinutes = 7 * 60
  startOfMonth = new Date(startOfMonth.getTime() + offsetInMinutes * 60 * 1000);
  endOfMonth = new Date(endOfMonth.getTime() + offsetInMinutes * 60 * 1000);

  const [startDate, setStartDate] = useState<Date | string>(startOfMonth.toISOString().split(".")[0]);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth.toISOString().split(".")[0]);

  const { auth } = useSelector((s: RootState) => s.auth)
  const [items, setItems] = useState<OrderType[]>([])
  const [totalItem, setTotalItem] = useState<number>(0)
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<string>("all")
  const [orderStatus, setOrderStatus] = useState<string>("all")
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)

  useEffect(() => {
    async function GotPRItems() {
      setLoadingSearch(true)
      let urlwithQuery = `/api/order/filter?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/order/filter?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      let paymentStts = {}
      if (paymentStatus !== "all") paymentStts = { payment_status: paymentStatus }

      let orderStts = {}
      if (orderStatus !== "all") orderStts = { status_order: orderStatus }


      const res = await PostWithToken<iResponse<OrderType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map(o => o.outlet_id) : defaultSelectedOutlet.map(o => o.outlet_id),
          started_at: startDate,
          ended_at: endDate,
          ...paymentStts,
          ...orderStts
        }
      })

      // alert(res.total)
      if (res?.statusCode === 200) {
        if (res.total)
          setTotalItem(res.total);
        setItems(res.data);
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    if (!modal)
      GotPRItems()

  }, [currentPage, fixValueSearch, refresh, auth.access_token, router,
    startDate, paymentStatus, orderStatus, selectedOutlets, defaultSelectedOutlet, modal, endDate])

  const [isViewDetail, setIsViewDetail] = useState<boolean>(false)
  const [detail, setDetail] = useState<OrderType | undefined>()

  function rupiah(number: number) {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR"
    }).format(number);

    return `Rp. ${result}`
  }

  const [loadingDownload, setLodaingDownload] = useState<boolean>(false)

  async function DownloadXLXS() {
    setLodaingDownload(true);
    if (loadingDownload) return;
    let paymentStts = {}
    if (paymentStatus !== "all") paymentStts = { payment_status: paymentStatus }

    let orderStts = {}
    if (orderStatus !== "all") orderStts = { status_order: orderStatus }

    const res = await PostWithToken<iResponse<{ filename: string }>>({
      router: router,
      url: "/api/order/download",
      token: `${auth.access_token}`,
      data: {
        outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map(o => o.outlet_id) : defaultSelectedOutlet.map(o => o.outlet_id),
        started_at: startDate,
        ended_at: endDate,
        ...paymentStts,
        ...orderStts
      }
    })

    if (res.statusCode === 200) {
      const url = `${window.location.origin}/download/${res.data.filename}`;
      window.open(url, '_blank');
    }

    setTimeout(() => setLodaingDownload(false), 1000)
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb pageName={"Order"} />
      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="grid grid-cols-1 md:gird-cols-2 lg:grid-cols-4 gap-4">
          <DatePickerOne label={"Start"} defaultDate={startDate} onChange={(val) => {
            setStartDate(val)
          }} />
          <DatePickerOne label={"End"} defaultDate={new Date(endDate)} onChange={(val) => {
            setEndDate(val)
          }} />

          <div className="w-full">
            <InputDropdown className="flex-1" label={"Payment status"} name={"payment_status"} id={"payment_status"}
              options={[{ label: "ALL", value: "all" }, ...Object.values(EPaymentStatus).map(i => ({ label: i.toUpperCase(), value: i }))]}
              value={paymentStatus} onChange={(e) => setPaymentStatus(e)} error={null} />
          </div>

          <div className="w-full">
            <InputDropdown className="flex-1" label={"Order Status"} name={"order_status"} id={"order_status"}
              options={[{ label: "ALL", value: "all" }, ...Object.values(EStatusOrder).map(i => ({ label: i.toUpperCase(), value: i }))]}
              value={orderStatus} onChange={(e) => setOrderStatus(e)} error={null} />
          </div>
          <button
            className={`w-min inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
            text-center font-edium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={DownloadXLXS}
          >
            {loadingDownload && <AiOutlineLoading3Quarters size={23} className="animate-spin" />}
            {!loadingDownload && <HiDownload size={23} />}
          </button>
        </div>
      </div>

      {!loadingSearch && (
        <Table colls={["Date", "Invoice", "Outlet", "Customer Name", "Total Sku", "Total Clothes", "Total Billing", "Payment Method", "Payment Status", "Order Status"]}
          currentPage={currentPage} totalItem={totalItem} onPaginate={(page) => setCurrentPage(page)}>
          {items.map((i, k) => (
            <tr
              className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600"
              key={k}
            >
              <td className="whitespace-nowrap px-6 py-4">{
                new Date(i.created_at).toLocaleDateString("id", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
              </td>
              <td className="whitespace-nowrap px-6 py-4 uppercase">
                <p className="cursor-pointer hover:text-blue-400 text-blue-500" onClick={() => {
                  setDetail(() => {
                    setIsViewDetail(true)
                    return i
                  })
                }}>
                  {i.invoice_id}
                </p>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex flex-col">
                  {i.outlet?.name}
                  <span className="font-light">
                    {" "} ({i.outlet && i.outlet.city.split("--").length >= 2 ? i.outlet.city.split("--")[1] : i.outlet?.city})
                  </span>
                </div>
              </td>

              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex flex-col">
                  {i.customer.fullname}
                  <span className="font-light">
                    {" "} {i.customer.dial_code} {i.customer.phone_number}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">{i.items.length}</td>
              <td className="px-6 py-4">{i.total_item !== null ? i.total_item : "-"}</td>
              <td className="whitespace-nowrap px-6 py-4">{rupiah(parseInt(i.total))}</td>
              <td className="px-6 py-4">{i.payment_method?.name}</td>
              <td className="px-6 py-4 uppercase">
                <p className={`px-2 py-1 text-center w-min rounded 
                ${i.payment_status === EPaymentStatus.PAID && "text-green-500"}
              `}>{i.payment_status}</p>
              </td>
              <td className="px-6 py-4">
                <p className={`px-2 py-1 text-center w-min rounded`}>{i.status}</p>
              </td>
            </tr>
          ))}
        </Table>
      )}


      <div className={`w-min h-full fixed right-0 top-0 z-[999]
        transition-all duration-500 shadow bg-white dark:bg-boxdark
        ${isViewDetail ? "" : "translate-x-full"} overflow-y-auto`}>
        <div className="p-4 bg-white dark:bg-boxdark shadow">
          <button onClick={() => {
            setIsViewDetail(false)
          }}>
            <FaArrowLeft className="rotate-180" size={20} />
          </button>
        </div>
        {detail && (
          <div className="w-full h-full">
            {/* <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Detail Pelanggan
              </h4>
              <div className="py-3 flex flex-col space-y-1">
                <div className="flex flex-row justify-between">
                  <p>Nama Lengkap</p>
                  <p>{detail?.customer.fullname}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>No.Hp</p>
                  <p>{detail?.customer.dial_code} {detail?.customer.phone_number}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Detail Admin
              </h4>
              <div className="py-3 flex flex-col space-y-1">
                <div className="flex flex-row justify-between">
                  <p>Nama Lengkap</p>
                  <p>{detail?.admin.fullname}</p>
                </div>
              </div>
            </div> */}

            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Detail Transaksi
              </h4>
              <div className="py-3 flex flex-col space-y-3 text-sm">
                <div className="flex flex-row justify-between">
                  <p>ID</p>
                  <p>{detail?.id}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Date</p>
                  <p>{
                    new Date(detail?.created_at).toLocaleDateString("id", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  }</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Invoice</p>
                  <p>{detail?.invoice_id}</p>
                </div>
                <div className="flex flex-row justify-between items-center">
                  <p>Outlet</p>
                  <div>
                    <p>{detail?.outlet.name}</p>
                  </div>
                </div>
                <div className="flex flex-row justify-between items-center">
                  <p>Customer</p>
                  <div>
                    <p>{detail?.customer.fullname}</p>
                    <span className="text-xs">({detail?.customer.dial_code} {detail?.customer.phone_number})</span>
                  </div>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Total Items</p>
                  <p>{detail?.items.length} <span className="text-xs">items</span></p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Total Clothes</p>
                  <p>{detail?.total_item} <span className="text-xs">Clothes</span></p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Voucher</p>
                  <p>{detail?.voucher !== null ? (detail?.voucher as { name: string }).name : '-'}</p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Total Billing</p>
                  <p>{detail && rupiah(parseInt(detail.total))}</p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Methode Pembayaran</p>
                  <p>{detail?.payment_method?.name}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Staus Pembayaran</p>
                  <p className={`uppercase ${detail?.payment_status === EPaymentStatus.PAID && "text-green-500"}`}>{detail?.payment_status}</p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Staus Order</p>
                  <p className="uppercase" >{detail?.status}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Detail Item
              </h4>
              <Table colls={["#", "Nama", "Harga", "Kuantitas", "Total"]}
                currentPage={0} totalItem={0}
                onPaginate={() => null}>
                {detail && detail.items.map((i: any, k: any) => (
                  <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                    key={k}
                  >
                    <td className="whitespace-nowrap px-6 py-4">{k + 1}</td>
                    <td className="whitespace-nowrap px-6 py-4">{i.product_sku_name}</td>
                    <td className="whitespace-nowrap px-6 py-4">{rupiah(parseInt(i.price))}</td>
                    <td className="px-6 py-4">{i.quantity}</td>
                    <td className="whitespace-nowrap px-6 py-4">{rupiah(parseInt(i.sub_total))}</td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
        )}
      </div >
    </div>
  )
}