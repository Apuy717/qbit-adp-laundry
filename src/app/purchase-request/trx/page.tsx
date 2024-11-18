'use client'
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CardDataStats from "@/components/CardDataStats";
import { DatePickerOne } from "@/components/FormElements/DatePicker/DatePickerOne";
import { iDropdown } from "@/components/Inputs/InputComponent";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { FilterByOutletTableModal } from "@/components/Outlets/FilterByOutletTableModal";
import Table from "@/components/Tables/Table";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { PRTrx } from "@/types/PRTrx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function GotTransaction() {
      const res = await PostWithToken<iResponse<PRTrx[]>>({
        url: "/api/pr/transaction", router: router, token: `${auth.access_token}`,
        data: {
          outlet_ids: filterByOutlet,
          started_at: startDate,
          ended_at: endDate
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

    GotTransaction()
  }, [startDate, filterByOutlet])

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
    <DefaultLayout>
      <Breadcrumb pageName="Pengeluaran" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1 md:gap-6 xl:grid-cols-3 2xl:gap-7.5 bg-white dark:bg-boxdark mb-4 p-4">
        <CardDataStats title="Total Transaksi" total={`${transaction.length}`} rate="belanja" levelUp>
          <TbShoppingBagPlus size={23} />
        </CardDataStats>
        <CardDataStats title="Total Pengeluaran" total={`${totalPengeluaran}`} rate="uang keluar" levelDown >
          <RiMoneyCnyCircleLine size={23} />
        </CardDataStats>
      </div>

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
        </div>
      </div>



      <Table colls={["Outlet", "Tanggal Nota", "Dibuat Pada", "Total", "Total Item", "Aksi"]} currentPage={0} totalItem={0} onPaginate={function (page: number): void {
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

      <div className={`w-min h-full fixed right-0 top-0 z-[999]
        transition-all duration-500 shadow bg-white dark:bg-boxdark
        ${isViewDetail ? "" : "translate-x-full"}`}>
        <div className="p-4 bg-white dark:bg-boxdark shadow">
          <button onClick={() => setIsViewDetail(false)}>
            <FaArrowLeft size={20} />
          </button>
        </div>
        <div className="mt-4 p-4">
          <h3 className="mb-4 text-2xl font-semibold text-black dark:text-white">
            Transaction Detail
          </h3>
          <div className="flex flex-row space-x-2">
            <a className="w-35 h-35 bg-gray-500 relative" href={`/file/${viewDetailData?.note}`} target="blank">
              <Image
                priority
                className="h-auto max-w-full absolute object-contain"
                fill
                alt="nota"
                src={`/file/${viewDetailData?.note}`}
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
                second: "2-digit",
              })}</p>
            </div>
          </div>
        </div>

        <div className="px-4">
          <p className="text-lg font-semibold text-black dark:text-white">
            Item
          </p>
          <Table colls={["#", "Nama", "Harga", "Kuantitas", "Sub Total"]} currentPage={0} totalItem={0} onPaginate={function (page: number): void {
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

    </DefaultLayout>
  )
}