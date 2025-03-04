"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { InputDropdown } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import Table from "@/components/Tables/Table";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { EPaymentStatus, EStatusOrder, OrderType } from "@/types/orderType";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AiOutlineLoading3Quarters, AiOutlinePlus } from "react-icons/ai";
import { CiCircleAlert } from "react-icons/ci";
import { FaArrowLeft } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { HiDownload } from "react-icons/hi";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function Orders() {
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

  const { auth, role } = useSelector((s: RootState) => s.auth);
  const [items, setItems] = useState<OrderType[]>([]);
  const [totalItem, setTotalItem] = useState<number>(0);
  const [fixValueSearch, setFixValueSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [orderStatus, setOrderStatus] = useState<string>("all");
  const { selectedOutlets, defaultSelectedOutlet, modal } = useContext(
    FilterByOutletContext,
  );
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteFunction, setDeleteFunction] = useState<() => void>(
    () => () => {},
  );

  enum TabActive {
    ALL = "ALL",
    B2C = "B2C",
    B2B = "B2B",
  }

  const [tabActive, setTabActive] = useState<TabActive>(TabActive.ALL);

  useEffect(() => {
    async function GotPRItems() {
      setLoadingSearch(true);
      let urlwithQuery = `/api/order/filter?page=${currentPage}&limit=${10}`;
      if (fixValueSearch.length >= 1) {
        urlwithQuery = `/api/order/filter?page=${currentPage}&limit=${10}&search=${fixValueSearch}`;
      }

      let paymentStts = {};
      if (paymentStatus !== "all")
        paymentStts = { payment_status: paymentStatus };

      let orderStts = {};
      if (orderStatus !== "all") orderStts = { status_order: orderStatus };

      let tabActiveQuery = {};
      if (tabActive !== TabActive.ALL)
        tabActiveQuery = { tab_active: tabActive };

      const pad = (n: any) => n.toString().padStart(2, "0");
      const stdDate = new Date(startDate);
      const eDate = new Date(endDate);
      const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
      const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

      const res = await PostWithToken<iResponse<OrderType[]>>({
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
          // ...paymentStts,
          ...tabActiveQuery,
          ...orderStts,
        },
      });

      // alert(res.total)
      if (res?.statusCode === 200) {
        if (res.total) setTotalItem(res.total);
        setItems(res.data);
      }

      setTimeout(() => {
        setLoadingSearch(false);
      }, 100);
    }

    if (!modal) GotPRItems();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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

  const [isViewDetail, setIsViewDetail] = useState<boolean>(false);
  const [detail, setDetail] = useState<OrderType | undefined>();

  function rupiah(number: number) {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR",
    }).format(number);

    return `Rp. ${result}`;
  }

  const [loadingDownload, setLodaingDownload] = useState<boolean>(false);

  async function DownloadXLXS() {
    setLodaingDownload(true);
    if (loadingDownload) return;
    let paymentStts = {};
    if (paymentStatus !== "all")
      paymentStts = { payment_status: paymentStatus };

    let orderStts = {};
    if (orderStatus !== "all") orderStts = { status_order: orderStatus };

    let tabActiveQuery = {};
    if (tabActive !== TabActive.ALL) tabActiveQuery = { tab_active: tabActive };

    const pad = (n: any) => n.toString().padStart(2, "0");
    const stdDate = new Date(startDate);
    const eDate = new Date(endDate);
    const _startedAt = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
    const _endedAt = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())} ${pad(eDate.getHours())}:${pad(eDate.getMinutes())}:${pad(eDate.getSeconds())}`;

    const res = await PostWithToken<iResponse<{ filename: string }>>({
      router: router,
      url: "/api/order/download",
      token: `${auth.access_token}`,
      data: {
        outlet_ids:
          selectedOutlets.length >= 1
            ? selectedOutlets.map((o) => o.outlet_id)
            : defaultSelectedOutlet.map((o) => o.outlet_id),
        started_at: _startedAt,
        ended_at: _endedAt,
        // ...paymentStts,
        tabActiveQuery,
        ...orderStts,
      },
    });

    if (res.statusCode === 200) {
      const url = `${window.location.origin}/download/${res.data.filename}`;
      window.open(url, "_blank");
    }

    setTimeout(() => setLodaingDownload(false), 1000);
  }

  async function setPaidHandle(id: string) {
   
    try {
      const result = await fetch(`/api/order/set-paid/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.access_token}`,
        },
      });
      const res = await result.json();
      if (res.statusCode === 200) {
        setRefresh(true);
        setDeleteModal(false)
        toast.success("Set Paid Success");
        setRefresh(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong: " + error);
    }
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb pageName={"Sales"} />
      <div className="mb-4 w-full rounded-t bg-white p-4 dark:bg-boxdark">
        <div className="md:gird-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-5">
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

          <div className="w-full">
            <InputDropdown
              className="flex-1"
              label={"Order Status"}
              name={"order_status"}
              id={"order_status"}
              options={[
                { label: "ALL", value: "all" },
                ...Object.values(EStatusOrder).map((i) => ({
                  label: i.toUpperCase(),
                  value: i,
                })),
              ]}
              value={orderStatus}
              onChange={(e) => setOrderStatus(e)}
              error={null}
            />
          </div>

          <button
            className={`${role.name === ERoles.OUTLET_ADMIN && "hidden"} font-edium inline-flex w-full items-center justify-center rounded-md bg-black px-10 
            py-3 text-center text-white hover:bg-opacity-90`}
            onClick={() => router.push("/orders/create")}
          >
            Create Order
          </button>
          <button
            className={`font-edium inline-flex w-min items-center justify-center rounded-md bg-black px-10 
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
      <div className="mb-4 w-full rounded-md bg-gray-50 px-4 pt-4 dark:bg-gray-800">
        <ul
          className="-mb-px flex flex-wrap text-center text-sm font-medium"
          id="default-tab"
          data-tabs-toggle="#default-tab-content"
          role="tablist"
        >
          <li className="me-2" role="presentation">
            <button
              className={`inline-block rounded-t-lg border-b-2 p-4 
              ${
                tabActive === TabActive.ALL
                  ? "border-blue-500 text-blue-500"
                  : "dark:border-form-strokedark"
              }
              `}
              onClick={() => setTabActive(TabActive.ALL)}
            >
              {TabActive.ALL}
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              className={`inline-block rounded-t-lg border-b-2 p-4 
              ${
                tabActive === TabActive.B2C
                  ? "border-blue-500 text-blue-500"
                  : "dark:border-form-strokedark"
              }
              `}
              onClick={() => setTabActive(TabActive.B2C)}
            >
              {TabActive.B2C}
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              className={`inline-block rounded-t-lg border-b-2 p-4 
              ${
                tabActive === TabActive.B2B
                  ? "border-blue-500 text-blue-500"
                  : "dark:border-form-strokedark"
              }
              `}
              onClick={() => setTabActive(TabActive.B2B)}
            >
              {TabActive.B2B}
            </button>
          </li>
        </ul>
      </div>
      {!loadingSearch && (
        <Table
          colls={[
            "Date",
            "Invoice",
            "Outlet",
            "Customer Name",
            "Total Sku",
            "Total Clothes",
            "Total Billing",
            "Payment Method",
            "Payment Status",
            "Order Status",
            "Action",
          ]}
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
              <td className="whitespace-nowrap px-6 py-4 uppercase">
                <p
                  className="cursor-pointer text-blue-500 hover:text-blue-400"
                  onClick={() => {
                    setDetail(() => {
                      setIsViewDetail(true);
                      return i;
                    });
                  }}
                >
                  {i.invoice_id}
                </p>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex flex-col">
                  {i.outlet?.name}
                  <span className="font-light">
                    {" "}
                    (
                    {i.outlet && i.outlet.city.split("--").length >= 2
                      ? i.outlet.city.split("--")[1]
                      : i.outlet?.city}
                    )
                  </span>
                </div>
              </td>

              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex flex-col">
                  {i.customer.fullname}
                  <span className="font-light">
                    {" "}
                    {i.customer.dial_code} {i.customer.phone_number}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">{i.items.length}</td>
              <td className="px-6 py-4">
                {i.total_item !== null ? i.total_item : "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {rupiah(parseInt(i.total))}
              </td>
              <td className="px-6 py-4 text-center">
                {i.payment_method ? i.payment_method.name : "-"}
              </td>
              <td className="px-6 py-4 uppercase">
                <p
                  className={`w-min rounded px-2 py-1 text-center 
                ${i.payment_status === EPaymentStatus.PAID && "text-green-500"}
              `}
                >
                  {i.payment_status}
                </p>
              </td>
              <td className="px-6 py-4">
                <p className={`w-min rounded px-2 py-1 text-center`}>
                  {i.status.toUpperCase()}
                </p>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => {
                    setDeleteFunction(() => () => setPaidHandle(i.id));
                    setDeleteModal(true);
                    setRefresh(!refresh);
                  }}
                  className={
                    i.payment_status === EPaymentStatus.PAID
                      ? `hidden`
                      : `w-min rounded bg-green-700 px-2 py-1 text-center text-white`
                  }
                >
                  SET PAID
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <div
        className={`fixed right-0 top-0 z-[999] h-full w-min
        bg-white shadow transition-all duration-500 dark:bg-boxdark
        ${isViewDetail ? "" : "translate-x-full"} overflow-y-auto`}
      >
        <div className="bg-white p-4 shadow dark:bg-boxdark">
          <button
            onClick={() => {
              setIsViewDetail(false);
            }}
          >
            <FaArrowLeft className="rotate-180" size={20} />
          </button>
        </div>
        {detail && (
          <div className="h-full w-full">
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
                Transaction Detail
              </h4>
              <div className="flex flex-col space-y-3 py-3 text-sm">
                {/* <div className="flex flex-row justify-between">
                  <p>ID</p>
                  <p>{detail?.id}</p>
                </div> */}
                <div className="flex flex-row justify-between">
                  <p>Date</p>
                  <p>
                    {new Date(detail?.created_at).toLocaleDateString("id", {
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
                  <p>Invoice</p>
                  <p>{detail?.invoice_id}</p>
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Outlet</p>
                  <div>
                    <p>{detail?.outlet.name}</p>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Cashier</p>
                  <div className="text-right">
                    <p>{detail?.admin.fullname}</p>
                    <span className="text-xs">
                      ({detail?.customer.dial_code}{" "}
                      {detail?.customer.phone_number})
                    </span>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Customer</p>
                  <div className="text-right">
                    <p>{detail?.customer.fullname}</p>
                    <span className="text-xs">
                      ({detail?.customer.dial_code}{" "}
                      {detail?.customer.phone_number})
                    </span>
                  </div>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Total Sku</p>
                  <p>{detail?.items.length}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Total Clothes</p>
                  <p>{detail?.total_item}</p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Voucher</p>
                  <p>
                    {detail?.voucher !== null
                      ? (detail?.voucher as { name: string }).name
                      : "-"}
                  </p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Total Billing</p>
                  <p>{detail && rupiah(parseInt(detail.total))}</p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Payment Method</p>
                  <p>{detail?.payment_method?.name}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Payment Status</p>
                  <p
                    className={`uppercase ${detail?.payment_status === EPaymentStatus.PAID && "text-green-500"}`}
                  >
                    {detail?.payment_status}
                  </p>
                </div>

                <div className="flex flex-row justify-between">
                  <p>Status Order</p>
                  <p className="uppercase">{detail?.status}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 px-6">
              <h4 className="font-semibold text-black dark:text-white">
                Detail SKU
              </h4>
              <Table
                colls={["#", "Name", "Price", "Qty", "Total"]}
                currentPage={0}
                totalItem={0}
                onPaginate={() => null}
              >
                {detail &&
                  detail.items.map((i: any, k: any) => (
                    <tr
                      className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                      key={k}
                    >
                      <td className="whitespace-nowrap px-6 py-4">{k + 1}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {i.product_sku_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {rupiah(parseInt(i.price))}
                      </td>
                      <td className="px-6 py-4">{i.quantity}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {rupiah(parseInt(i.sub_total))}
                      </td>
                    </tr>
                  ))}
              </Table>
            </div>
          </div>
        )}
      </div>
      <Modal isOpen={deleteModal}>
        <div className="relative h-min w-[90%] rounded-md bg-white p-4 shadow dark:bg-boxdark md:w-fit">
          <div className="flex w-full justify-center">
            <CiCircleAlert size={100} />
          </div>
          <div className="flex-wrap justify-center">
            <p className="w-full text-center text-2xl font-semibold">
              Are you sure?
            </p>
            <p className="w-full text-center">you wanna set payment to paid?</p>
          </div>
          <div className="flex w-full justify-center space-x-4">
            <button
              onClick={() => {
                deleteFunction();
              }}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setDeleteModal(false);
              }}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-red px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
