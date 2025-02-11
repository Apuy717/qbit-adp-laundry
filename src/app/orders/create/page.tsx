'use client';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { InputToggle } from "@/components/Inputs/InputComponent";
import { useEffect, useState } from "react";
import { FaStore, FaUser } from "react-icons/fa";
import { HiMinusSmall, HiOutlineShoppingBag } from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import { ModalCashierComponent } from "./CashierComponent";
import { ModalCustomerComponent } from "./CustomerComponent";
import { ModalOutletComponent } from "./OutletComponent";
import { ModalProductComponent } from "./ProductComponent";
import { GetWithToken, iResponse, PostWithToken } from "@/libs/FetchData";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/stores/store";
import { PaymentMethodType } from "@/types/paymentMethod";

interface iCardOne {
  title: string
  icon: JSX.Element
  textTop: string | null
  textBottom: string | null
  onClick: () => void
  onDelete: () => void,
}

interface iSelfServiceOption {
  setIsSelfService: () => void;
  is_self_service: boolean;
  trxDate: Date | string;
  setTrxDate: (val: Date | string) => void;
  setIsB2B: () => void;
  isB2B: boolean;
  isCompleted: boolean;
  setIsCompleted: () => void;
}

function CardOne(payload: Array<iCardOne>, options: iSelfServiceOption) {
  return (
    <div className="bg-white dark:bg-boxdark w-full p-5">
      {payload.map((i, k) => (
        <div className="space-y-4 mb-7" key={k}>
          <p className="font-semibold">{i.title}</p>
          {i.textTop === null && (
            <button
              onClick={i.onClick}
              className="bg-blue-500 p-2 text-white rounded capitalize">select {i.title}</button>
          )}

          {i.textTop && i.textBottom !== null && (
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center space-x-2">
                <div className="p-2 border rounded">
                  {i.icon}
                </div>
                <div className="flex h-full space-y-1 justify-between flex-col">
                  <p>{i.textTop}</p>
                  <p className="text-xs">{i.textBottom}</p>
                </div>
              </div>
              <button className="bg-red-500 hover:bg-red-700 p-1 rounded"
                onClick={i.onDelete}>
                <IoMdClose size={25} color="white" />
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex h-full justify-between flex-col font-semibold mt-10">
        {/* <p>Transaction Date</p> */}
        <DatePickerOne label={"Transaction Date"} defaultDate={options.trxDate} onChange={(val) => {
          options.setTrxDate(val)
        }} />
      </div>

      <div className="flex h-full mt-5  space-y-4 justify-between flex-col font-semibold">
        <p>Order Options</p>
        <InputToggle label="Self Service" value={options.is_self_service} onClick={options.setIsSelfService} />
      </div>

      <div className="flex h-full mt-5  space-y-4 justify-between flex-col font-semibold">
        <p>For Bussiness B2B</p>
        <InputToggle label="For Bussiness" value={options.isB2B} onClick={options.setIsB2B} />
      </div>

      <div className="flex h-full mt-5  space-y-4 justify-between flex-col font-semibold">
        <p>Order Completed</p>
        <InputToggle label="Order Completed" value={options.isCompleted} onClick={options.setIsCompleted} />
      </div>
    </div>
  )
}



interface iSelectedCustomer {
  customer_id: string,
  fullname: string,
  phone_number: string,
}

interface iSelectedCashier {
  user_id: string,
  fullname: string,
  phone_number: string,
}

interface iSelectedOutlet {
  outlet_id: string,
  name: string,
  address: string,
}

interface iSelectedSku {
  product_sku_id: string,
  name: string,
  quantity: number,
  price: number
}

export default function CreateOrder() {
  const [selectedOutlet, setSelectedOutlet] = useState<iSelectedOutlet | null>(null)
  const [selectedCashier, setSelectedCashier] = useState<iSelectedCashier | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<iSelectedCustomer | null>(null)
  const [selectedSkus, setSelectedSkus] = useState<iSelectedSku[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [isB2B, setIsB2B] = useState<boolean>(false)
  const [isCompleted, setIsCompleted] = useState<boolean>(true)


  const [modalOutlet, setModalOutlet] = useState<boolean>(false)
  const [modalCustomer, setModalCustomer] = useState<boolean>(false)
  const [modalCashier, setModalCashier] = useState<boolean>(false)
  const [isSelfService, setIsSelfService] = useState<boolean>(false)
  const [modalProduct, setModalProduct] = useState<boolean>(false)
  let nowDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const [trxDate, setTrxDate] = useState<Date | string>(nowDate);
  const { access_token } = useSelector((s: RootState) => s.auth.auth)
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()


  function FormatDecimal(number: number) {
    const result = new Intl.NumberFormat("id-ID", {
      style: "decimal",
      currency: "IDR"
    }).format(number);

    return result
  }

  function CalculateTotal() {
    let total = 0;
    for (const item of selectedSkus) {
      total += item.price * item.quantity;
    }
    return FormatDecimal(total)
  }

  useEffect(() => {
    setSelectedSkus([])
  }, [isSelfService])

  useEffect(() => {
    if (isB2B) setSelectedPaymentMethod(null)
  }, [isB2B])

  useEffect(() => {
    async function GotPaymentMethod() {
      if (selectedOutlet === null) {
        setPaymentMethods([])
        setSelectedPaymentMethod(null)
        return
      }
      const res = await GetWithToken<iResponse<PaymentMethodType[]>>({
        router: router,
        url: `/api/payment-method?outlet_id=${selectedOutlet.outlet_id}`,
        token: `${access_token}`
      })

      if (res.statusCode === 200) {
        if (res.data.length >= 1) {
          setSelectedPaymentMethod(res.data[0])
        }
        setPaymentMethods(res.data)
      } else {
        toast.error("Failed get payment method!")
      }
    }

    GotPaymentMethod()
  }, [selectedOutlet, router, access_token])

  async function SubmitOrder() {
    if (loading) return
    if (selectedOutlet === null) {
      toast.warning("Please select outlet")
      return
    }
    if (selectedCashier === null) {
      toast.warning("Please select cashier")
      return
    }
    if (selectedCustomer === null) {
      toast.warning("Please select customer")
      return
    }
    if (selectedSkus.length === 0) {
      toast.warning("Please add product")
      return
    }
    if (selectedPaymentMethod === null && !isB2B) {
      toast.warning("Please select payment method")
      return
    }

    setLoading(true)
    const pad = (n: any) => n.toString().padStart(2, '0');
    const stdDate = new Date(trxDate)
    const _trxDate = `${stdDate.getFullYear()}-${pad(stdDate.getMonth() + 1)}-${pad(stdDate.getDate())} ${pad(stdDate.getHours())}:${pad(stdDate.getMinutes())}:${pad(stdDate.getSeconds())}`;
    const payload = {
      outlet_id: selectedOutlet.outlet_id,
      customer_id: selectedCustomer.customer_id,
      payment_method_id: isB2B ? null : selectedPaymentMethod?.id,
      voucher_code: null,
      order_type: "b2b",
      user_id: selectedCashier.user_id,
      is_self_service: isSelfService,
      transaction_date: _trxDate,
      skus: selectedSkus.map((i) => ({
        product_sku_id: i.product_sku_id,
        quantity: i.quantity
      }))
    }

    const res = await PostWithToken<iResponse<{ id: string }>>({
      router: router,
      url: "/api/order/create",
      data: payload,
      token: `${access_token}`
    })

    if (res.statusCode === 422) {
      if (res.err.length >= 1)
        toast.error(res.err[0])
    }
    if (res.statusCode === 200) {
      if (isCompleted) {
        const resSetCompleted = await PostWithToken<iResponse<{ id: string }>>({
          router: router,
          url: `/api/order/set-completed/${res.data.id}?overide_process=true`,
          token: `${access_token}`,
          data: {}
        })

        if (resSetCompleted.statusCode === 200) {
          toast.success("Order creation has been successful!")
          setTimeout(() => router.push("/orders"), 500)
        }
      } else {
        toast.success("Order creation has been successful!")
        setTimeout(() => router.push("/orders"), 500)
      }
    }
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="min-h-screen space-y-4">
      <Breadcrumb pageName={"Create Order"} />
      {
        CardOne(
          [
            {
              title: "Outlet",
              icon: <FaStore size={27} />,
              textTop: selectedOutlet ? selectedOutlet.name : null,
              textBottom: selectedOutlet ? selectedOutlet.address : null,
              onClick: () => setModalOutlet(true),
              onDelete: () => {
                setSelectedOutlet(null);
                setSelectedCashier(null);
              }
            },
            {
              title: "Cashier",
              icon: <FaStore size={27} />,
              textTop: selectedCashier ? selectedCashier.fullname : null,
              textBottom: selectedCashier ? selectedCashier.phone_number : null,
              onClick: () => selectedOutlet ? setModalCashier(true) : setModalOutlet(true),
              onDelete: () => setSelectedCashier(null)
            },
            {
              title: "Customer",
              icon: <FaUser size={27} />,
              textTop: selectedCustomer ? selectedCustomer.fullname : null,
              textBottom: selectedCustomer ? selectedCustomer.phone_number : null,
              onClick: () => setModalCustomer(true),
              onDelete: () => setSelectedCustomer(null)
            }
          ],
          {
            setIsSelfService: () => {
              setIsSelfService(!isSelfService)
            },
            is_self_service: isSelfService,
            trxDate: trxDate,
            setTrxDate: (val) => {
              setTrxDate(val)
            },
            isB2B: isB2B,
            setIsB2B: () => setIsB2B(!isB2B),
            isCompleted: isCompleted,
            setIsCompleted: () => setIsCompleted(!isCompleted)
          }
        )
      }

      {
        <ModalOutletComponent
          showModal={modalOutlet}
          coleModal={() => setModalOutlet(false)}
          onSelected={(data) => {
            setModalOutlet(false);
            setSelectedOutlet({
              outlet_id: data.id,
              name: data.name,
              address: `${data.address}`,
            })
          }}
        />
      }

      {
        <ModalCashierComponent
          showModal={modalCashier}
          coleModal={() => setModalCashier(false)}
          outletId={selectedOutlet ? selectedOutlet.outlet_id : null}
          onSelected={(data) => {
            setModalCashier(false);
            setSelectedCashier({
              user_id: data.id,
              fullname: data.fullname,
              phone_number: `${data.dial_code} ${data.phone_number}`,
            })
          }}
        />
      }

      {
        <ModalCustomerComponent
          showModal={modalCustomer}
          coleModal={() => setModalCustomer(false)}
          onSelected={(customer) => {
            setModalCustomer(false);
            setSelectedCustomer({
              customer_id: customer.id,
              fullname: customer.fullname,
              phone_number: `${customer.dial_code} ${customer.phone_number}`,
            })
          }}
        />
      }

      {
        selectedOutlet && (
          <ModalProductComponent
            outlet_id={selectedOutlet?.outlet_id}
            isSelfService={isSelfService}
            showModal={modalProduct}
            coleModal={() => setModalProduct(false)}
            onSelected={(sku) => {
              setModalProduct(false);
              setSelectedSkus([
                ...selectedSkus,
                {
                  product_sku_id: sku.id,
                  name: sku.name,
                  quantity: 1,
                  price: sku.outlet_price_skus.length >= 1 ? parseInt(sku.outlet_price_skus[0].price) : sku.price
                }
              ])
            }}
          />
        )

      }

      <div className="bg-white dark:bg-boxdark w-full p-5 space-y-4">
        <div className="grid grid-cols-5 capitalize font-semibold">
          <div className="col-span-2">
            <p>Product Ordered</p>
          </div>
          <div className="hidden md:block">
            <p>Price</p>
          </div>
          <div className="hidden md:block">
            <p>Quantity</p>
          </div>
          <div className="hidden md:block">
            <p>Subtotal Product</p>
          </div>
        </div>
        {selectedSkus.map((i, k) => (
          <div className="hidden md:grid grid-cols-5 py-2" key={k}>
            <div className="col-span-2 flex flex-row items-center space-x-2">
              <div className="cursor-pointer" onClick={() =>
                setSelectedSkus((prevSkus) => prevSkus.filter((_, idx) => idx !== k)
                )}>
                <HiMinusSmall size={25} color="red" />
              </div>
              <HiOutlineShoppingBag size={35} />
              <p>{i.name}</p>
            </div>
            <div>
              <p>Rp. {FormatDecimal(i.price)}</p>
            </div>
            <div className="flex flex-row space-x-2">
              <input name="quantity" type="number"
                step={0.1}
                min={0.1}
                className="border w-20 pl-2 text-center dark:bg-boxdark dark:border-gray-700"
                value={i.quantity}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    const fixedValue = parseFloat(value.toFixed(2)); // Membatasi ke 2 desimal
                    setSelectedSkus((prevSkus) =>
                      prevSkus.map((item, idx) =>
                        idx === k ? { ...item, quantity: fixedValue } : item
                      )
                    );
                  }
                }}
              />
              {/* <p className="text-xs">/ meter</p> */}
            </div>
            <div>
              <p>Rp. {i.quantity >= 0 && FormatDecimal(i.price * i.quantity)}</p>
            </div>
          </div>
        ))}

        {selectedSkus.map((i, k) => (
          <div className="flex md:hidden flex-row justify-between" key={k}>
            <div className="flex flex-row space-x-1 items-center">
              <div className="cursor-pointer" onClick={() =>
                setSelectedSkus((prevSkus) => prevSkus.filter((_, idx) => idx !== k)
                )}>
                <HiMinusSmall size={25} color="red" />
              </div>
              <div className="p-2 border"><HiOutlineShoppingBag size={35} /></div>
              <div className="space-y-1">
                <p>{i.name.substring(0, 10)}</p>
                <p className="text-xs">Rp. {FormatDecimal(i.price)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <input name="quantity" type="number"
                step={0.1}
                min={0.1}
                className="border w-20 pl-2 text-center dark:bg-boxdark dark:border-gray-700"
                value={i.quantity}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    const fixedValue = parseFloat(value.toFixed(2)); // Membatasi ke 2 desimal
                    setSelectedSkus((prevSkus) =>
                      prevSkus.map((item, idx) =>
                        idx === k ? { ...item, quantity: fixedValue } : item
                      )
                    );
                  }
                }}
              />
              <p className="text-xs">Rp. {i.quantity >= 0 && FormatDecimal(i.price * i.quantity)}</p>
            </div>
          </div>
        ))}

        <button className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
          onClick={() => setModalProduct(true)}>
          add product
        </button>
      </div>

      <div className="bg-white dark:bg-boxdark w-full space-y-4 py-5">
        <div className="flex flex-row items-center justify-between px-5 w-full">
          <div className="w-max">
            <p className="font-semibold w-max">Payment Method</p>
          </div>
          <div className="flex items-center flex-wrap flex-row w-full space-x-4 justify-end">
            {paymentMethods.map((i, k) => (
              <div
                onClick={() => setSelectedPaymentMethod(i)}
                key={k} className={`p-2 border cursor-pointer ${selectedPaymentMethod !== null && selectedPaymentMethod.id === i.id && "border-blue-500 text-blue-500"}`}>
                <p className="font-semibold" key={k}>{i.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-b dark:border-gray-700 p-5 space-y-4">
          <div className="flex flex-row justify-between">
            <p>Subtotal Product</p>
            <p>Rp. {CalculateTotal()}</p>
          </div>
          <div className="flex flex-row justify-between">
            <p>Subtotal Voucher</p>
            <p>Rp. 0</p>
          </div>
          <div className="flex flex-row justify-between">
            <p>Total</p>
            <p>Rp. {CalculateTotal()}</p>
          </div>
        </div>
        <div className="flex flex-row items-center justify-end px-5">
          <button className="uppercase text-sm font-semibold bg-blue-500 text-white p-4 rounded hover:bg-blue-600"
            onClick={SubmitOrder}>
            {loading ? "Loading.." : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  )
}