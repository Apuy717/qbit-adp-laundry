'use client'
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DatePickerOne } from "@/components/FormElements/DatePicker/DatePickerOne";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { FilterByOutletTableModal } from "@/components/Outlets/FilterByOutletTableModal";
import Table from "@/components/Tables/Table";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { EPaymentStatus, EStatusOrder, OrderType } from "@/types/orderType";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { HiDownload } from "react-icons/hi";
import { useSelector } from "react-redux";

export default function Orders() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(
    `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate()} 23:59`,
  )

  const [startDate, setStartDate] = useState<Date | string>(startOfMonth.toISOString().split(".")[0]);
  const [endDate, setEndDate] = useState<Date | string>(endOfMonth.toISOString().split(".")[0]);
  const [modalOutlet, setModalOutlet] = useState<boolean>(false);
  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([])

  const { auth, role } = useSelector((s: RootState) => s.auth)
  const [items, setItems] = useState<OrderType[]>([])
  const [totalItem, setTotalItem] = useState<number>(0)
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter()

  useEffect(() => {
    async function GotPRItems() {
      setLoadingSearch(true)
      let urlwithQuery = `/api/order/filter?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/order/filter?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      const res = await PostWithToken<iResponse<OrderType[]>>({
        router: router,
        url: urlwithQuery,
        token: `${auth.access_token}`,
        data: {
          outlet_ids: filterByOutlet,
          started_at: startDate,
          ended_at: endDate
        }
      })

      if (res?.statusCode === 200) {
        if (res.total)
          setTotalItem(res.total);
        setItems(res.data);
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    GotPRItems()

  }, [currentPage, fixValueSearch, refresh, auth.access_token, filterByOutlet, startDate])

  const [isViewDetail, setIsViewDetail] = useState<boolean>(false)
  const [detail, setDetail] = useState<OrderType | undefined>()

  function rupiah(number: number) {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR"
    }).format(number);

    return `Rp. ${result}`
  }

  return (
    <DefaultLayout>
      <Breadcrumb pageName={"Order"} />
      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row w-full md:space-x-4">
          <DatePickerOne label={"Dari"} defaultDate={startDate} onChange={(val) => {
            setStartDate(val)
          }} />
          <DatePickerOne label={"Sampai"} defaultDate={endDate} onChange={(val) => {
            console.log(val);
          }} />

          <div className="cursor-pointer w-full" onClick={() => setModalOutlet(true)}>
            <div className="flex flex-row">
              <div className="w-full p-3 border-2 rounded-md relative">
                <label
                  className={`text-md  transition-all duration-500`}
                >
                  Filter By Outlet
                </label>
              </div>
            </div>
          </div>
          <button
            className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
            text-center font-edium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
          >
            <HiDownload size={23} />
          </button>
        </div>
      </div>
      {!loadingSearch && (
        <Table colls={["#", "INVOICE", "Outlet", "Total Item", "Total", "Metode Pembayaran", "Status Pembayaran", "Status Order", "Tanggal", "Aksi"]}
          currentPage={currentPage} totalItem={totalItem} onPaginate={(page) => setCurrentPage(page)}>
          {items.map((i, k) => (
            <tr
              className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:hover:bg-gray-600"
              key={k}
            >
              <td className="whitespace-nowrap px-6 py-4">{k + 1}</td>
              <td className="whitespace-nowrap px-6 py-4 uppercase">{i.invoice_id}</td>
              <td className="px-6 py-4">{i.outlet.name}</td>
              <td className="px-6 py-4">{i.items.length}</td>
              <td className="whitespace-nowrap px-6 py-4">{rupiah(parseInt(i.total))}</td>
              <td className="px-6 py-4">{i.payment_method.name}</td>
              <td className="px-6 py-4">
                <p className={`px-2 py-1 text-center w-min rounded text-white
                ${i.payment_status === EPaymentStatus.PENDING && "bg-yellow-500"}
                ${i.payment_status === EPaymentStatus.RECEIVABLES && "bg-blue-500"}
                ${i.payment_status === EPaymentStatus.PAID && "bg-green-500"}
              `}>{i.payment_status}</p>
              </td>
              <td className="px-6 py-4">
                <p className={`px-2 py-1 text-center w-min rounded text-white
                ${i.status === EStatusOrder.CANCELED && "bg-red"}
                ${i.status === EStatusOrder.REGISTERED && "bg-yellow-500"}
                ${i.status === EStatusOrder.CANCELED && "bg-green-500"}
              `}>{i.status}</p>
              </td>
              <td className="whitespace-nowrap px-6 py-4">{
                new Date(i.created_at).toLocaleDateString("id", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }</td>
              <td className="px-6 py-4">
                <button onClick={() => {
                  setDetail(() => {
                    setIsViewDetail(true)
                    return i
                  })
                }}>
                  <FiEye size={23} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}


      <FilterByOutletTableModal modalOutlet={modalOutlet}
        closeModal={(isOpen) => setModalOutlet(isOpen)}
        setFilterByOutlet={(isChecked, value) => {
          if (isChecked) {
            setFilterByOutlet(old => [...old, value])
          } else {
            setFilterByOutlet(old => old.filter(f => f !== value))
          }
        }} />

      <div className={`w-min h-full fixed right-0 top-0 z-[999]
        transition-all duration-500 shadow bg-white dark:bg-boxdark
        ${isViewDetail ? "" : "translate-x-full"}`}>
        <div className="p-4 bg-white dark:bg-boxdark shadow">
          <button onClick={() => {
            setIsViewDetail(false)
          }}>
            <FaArrowLeft className="rotate-180" size={20} />
          </button>
        </div>
        <div className="w-full h-full overflow-y-auto">
          <div className="mt-4 px-6">
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
          </div>

          <div className="mt-4 px-6">
            <h4 className="font-semibold text-black dark:text-white">
              Detail Transaksi
            </h4>
            <div className="py-3 flex flex-col space-y-1">
              <div className="flex flex-row justify-between">
                <p>Invoice</p>
                <p>{detail?.invoice_id}</p>
              </div>
              <div className="flex flex-row justify-between">
                <p>Staus Order</p>
                <p>{detail?.status}</p>
              </div>
              <div className="flex flex-row justify-between">
                <p>Methode Pembayaran</p>
                <p>{detail?.payment_method.name}</p>
              </div>
              <div className="flex flex-row justify-between">
                <p>Staus Pembayaran</p>
                <p>{detail?.payment_status}</p>
              </div>
              <div className="flex flex-row justify-between">
                <p>Tanggal</p>
                <p>22 Nov 2024, 11.00.00</p>
              </div>
              <div className="flex flex-row justify-between">
                <p>Total Item</p>
                <p>{detail?.items.length}</p>
              </div>
              <div className="flex flex-row justify-between">
                <p>Total Pembayaran</p>
                <p>{detail && rupiah(parseInt(detail.total))}</p>
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
              {detail && detail.items.map((i, k) => (
                <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
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
      </div >
    </DefaultLayout >
  )
}