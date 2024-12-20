'use client'
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CardDataStats from "@/components/CardDataStats";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { iDropdown, InputDropdown } from "@/components/Inputs/InputComponent";
import { FilterByOutletTableModal } from "@/components/Outlets/FilterByOutletTableModal";
import Table from "@/components/Tables/Table";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { PRTrx } from "@/types/PRTrx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
import { TbShoppingBagPlus } from "react-icons/tb";
import { useSelector } from "react-redux";

export default function PRTrxPage() {
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

  const router = useRouter();
  const { auth } = useSelector((s: RootState) => s.auth);
  const [outlets, setOutlets] = useState<iDropdown[]>([]);

  const [filterByOutlet, setFilterByOutlet] = useState<string[]>([]);
  const [modalOutlet, setModalOutlet] = useState<boolean>(false);
  const [transaction, setTransaction] = useState<PRTrx[]>([])
  const [totalPengeluaran, setTotalPengeluaran] = useState<string>("Rp. 0")
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(FilterByOutletContext)


  useEffect(() => {
    async function GotTransaction() {
      const res = await PostWithToken<iResponse<PRTrx[]>>({
        url: "/api/pr/transaction", router: router, token: `${auth.access_token}`,
        data: {
          outlet_ids: selectedOutlets.length >= 1 ? selectedOutlets.map((o: any) => o.outlet_id) : defaultSelectedOutlet.map((o: any) => o.outlet_id),
          started_at: startDate,
          ended_at: endDate,

        }
      })

      if (res.statusCode === 200) {
        if (res.total) {
          setTotalPengeluaran(rupiah(res.total))
        } else {
          setTotalPengeluaran("Rp. 0")
        }
        setTransaction(res.data)
      }
    }
    if (!modal)
      GotTransaction()
  }, [startDate, endDate, selectedOutlets, defaultSelectedOutlet, modal])

  const [isViewDetail, setIsViewDetail] = useState<boolean>(false)
  const [viewDetailData, setIsViewDetailData] = useState<PRTrx | null>(null)

  const rupiah = (number: number) => {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR"
    }).format(number);

    return `Rp. ${result}`
  }

  return (
    <>
      <Breadcrumb pageName="Pengeluaran" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1 md:gap-6 xl:grid-cols-3 2xl:gap-7.5 bg-white dark:bg-boxdark mb-4 p-4">
        <CardDataStats title="Total Transaction" total={`${transaction.length}`} rate="purchase" levelUp>
          <TbShoppingBagPlus size={23} />
        </CardDataStats>
        <CardDataStats title="Total Expense" total={`${totalPengeluaran}`} rate="expense" levelDown >
          <RiMoneyCnyCircleLine size={23} />
        </CardDataStats>
      </div>

      <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
        <div className="grid grid-cols-1 md:gird-cols-2 lg:grid-cols-4 gap-4">
          <DatePickerOne label={"Start"} defaultDate={startDate} onChange={(val) => {
            setStartDate(val)
          }} />
          <DatePickerOne label={"End"} defaultDate={new Date(endDate)} onChange={(val) => {
            setEndDate(val)
          }} />

          {/* <div className="w-full">
            <InputDropdown className="flex-1" label={"Payment status"} name={"payment_status"} id={"payment_status"}
              options={[{ label: "all", value: "all" }, ...Object.values(EPaymentStatus).map(i => ({ label: i, value: i }))]}
              value={paymentStatus} onChange={(e) => setPaymentStatus(e)} error={null} />
          </div>

          <div className="w-full">
            <InputDropdown className="flex-1" label={"Order Status"} name={"order_status"} id={"order_status"}
              options={[{ label: "all", value: "all" }, ...Object.values(EStatusOrder).map(i => ({ label: i, value: i }))]}
              value={orderStatus} onChange={(e) => setOrderStatus(e)} error={null} />
          </div>
          <button
            className={`w-min inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
            text-center font-edium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={DownloadXLXS}
          >
            {loadingDownload && <AiOutlineLoading3Quarters size={23} className="animate-spin" />}
            {!loadingDownload && <HiDownload size={23} />}
          </button> */}
          <button
            className={`w-auto justify-center rounded-md bg-black px-10 py-3 
            text-center font-medium text-sm text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
            onClick={() => {
              router.push("/purchase-request/trx/create-trx-pr")
            }}
          >
            Add Expense
          </button>
        </div>
      </div>

      <Table colls={["Outlet", "Date Note", "Created At", "Total", "Total Item", "Action"]} currentPage={0} totalItem={0} onPaginate={function (page: number): void {
        throw new Error("Function not implemented.");
      }} >
        {transaction.map((i, k) => (
          <tr className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 
        dark:bg-gray-800 dark:hover:bg-gray-600"
            key={k}>
            <td className="whitespace-nowrap px-6 py-4">
              {i.outlet?.name}
              <span className="font-light">
                {" "} ({i.outlet && i.outlet.city.split("--").length >= 2 ? i.outlet.city.split("--")[1] : i.outlet?.city})
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              {new Date(i.trx_date).toLocaleDateString("id", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
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
              {rupiah(parseInt(i.total))}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              {i.trx_pr_items.length}
            </td>

            <td className="px-6 py-4 whitespace-nowrap space-x-4">
              <button
                className="cursor-pointer"
                onClick={() => {
                  setIsViewDetail(true)
                  setIsViewDetailData(i)
                }}
              >
                <FiEye size={23} />
              </button>
            </td>
          </tr>
        ))}
      </Table>

      <div className={`w-[80%] lg:w-min h-full fixed right-0 top-0 z-[999]
        transition-all duration-500 shadow bg-white dark:bg-boxdark
        ${isViewDetail ? "" : "translate-x-full"}`}>
        <div className="p-4 bg-white dark:bg-boxdark shadow">
          <button onClick={() => setIsViewDetail(false)}>
            <FaArrowLeft size={20} className="rotate-180" />
          </button>
        </div>
        <div className="mt-4 p-4">
          <h3 className="mb-4 text-2xl font-semibold text-black dark:text-white">
            Transaction Detail
          </h3>
          <div className="flex flex-row space-x-2">
            <a className="w-35 h-35 bg-gray-500 relative" href={`/api/file/${viewDetailData?.note}`} target="blank">
              <Image
                priority
                className="h-auto max-w-full absolute object-contain"
                fill
                alt="nota"
                src={`/api/file/${viewDetailData?.note}`}
                sizes=""
              />
            </a>
            <div className="flex flex-col space-y-2">
              <p className="font-bold text-lg">{viewDetailData?.outlet?.name}</p>
              <p>{viewDetailData?.trx_pr_items.length} Item</p>
              <p>{viewDetailData && rupiah(parseInt(viewDetailData.total))}</p>
              <p>{viewDetailData && new Date(viewDetailData.trx_date).toLocaleDateString("id", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                // second: "2-digit",
              })}</p>
            </div>
          </div>
        </div>

        <div className="px-4">
          <p className="text-lg font-semibold text-black dark:text-white">
            Item
          </p>
          <Table colls={["#", "Name", "Price", "Quantity", "Subtotal"]} currentPage={0} totalItem={0} onPaginate={function (page: number): void {
            throw new Error("Function not implemented.");
          }}>
            {viewDetailData && viewDetailData.trx_pr_items.map((i, k) => (
              <tr key={k}>
                <td className="px-6 py-4">
                  {k + 1}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {rupiah(parseInt(i.price))}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {i.quantity} - ({i.unit})
                </td>

                <td className="whitespace-nowrap px-6 py-4">
                  {rupiah(parseInt(i.sub_total))}
                </td>
              </tr>
            ))}

          </Table>
        </div>
      </div>


      <FilterByOutletTableModal modalOutlet={modalOutlet}
        closeModal={(isOpen) => setModalOutlet(isOpen)}
        setFilterByOutlet={(isChecked, value) => {
          if (isChecked) {
            setFilterByOutlet(old => [...old, value])
          } else {
            setFilterByOutlet(old => old.filter(f => f !== value))
          }
        }} />
    </>
  )
}