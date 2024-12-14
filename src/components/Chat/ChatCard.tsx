import Link from "next/link";
import Image from "next/image";
import { Chat } from "@/types/chat";
import { FaRegUser, FaRegUserCircle, FaUser } from "react-icons/fa";
import { CiUser } from "react-icons/ci";
import { IoIosArrowDown } from "react-icons/io";
import { useEffect, useState } from "react";
import { iResponse, PostWithToken } from "@/libs/FetchData";
import { TopPerformanceCustomer } from "@/types/graph";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/stores/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const chatData: Chat[] = [
  {
    avatar: "/images/user/user-01.png",
    name: "Devid Heilo",
    text: "+62 8980-3546-41",
    time: 0,
    textCount: 10,
    dot: 3,
  },
];

const ChatCard = () => {
  const [topCustomers, setTopCustomers] = useState<TopPerformanceCustomer[]>([])
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const [loading, setLoading] = useState<boolean>(false)
  const [filterByDate, setFilterByDate] = useState<string>("month")

  useEffect(() => {
    let now = new Date()
    let startedAt: Date = new Date()
    let endedAt: Date = new Date()
    if (filterByDate === "day") {
      startedAt = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
      endedAt = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
    }

    if (filterByDate === "week") {
      const currentDay = now.getDay();
      // Tanggal awal minggu (Senin)
      startedAt = new Date(now);
      startedAt.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
      startedAt.setHours(0, 0, 0, 0);

      // Tanggal akhir minggu (Minggu)
      endedAt = new Date(now);
      endedAt.setDate(now.getDate() + (currentDay === 0 ? 0 : 7 - currentDay));
      endedAt.setHours(23, 59, 59, 999);
    }

    if (filterByDate === "month") {
      startedAt = new Date(now.getFullYear(), now.getMonth(), 1);
      endedAt = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    if (filterByDate === "year") {
      startedAt = new Date(now.getFullYear(), 0, 1);
      endedAt = new Date(now.getFullYear(), 11, 31);
    }

    startedAt.setHours(0, 0, 0, 0)
    endedAt.setHours(23, 59, 59, 0)
    const offsetInMinutes = 7 * 60;
    startedAt = new Date(startedAt.getTime() + offsetInMinutes * 60 * 1000);
    endedAt = new Date(endedAt.getTime() + offsetInMinutes * 60 * 1000);

    async function TopUsers() {
      setLoading(true)
      const res = await PostWithToken<iResponse<TopPerformanceCustomer[]>>({
        url: "/api/order/top-customers?limit=10",
        router: router,
        token: `${auth.access_token}`,
        data: {
          started_at: startedAt.toISOString().split(".")[0],
          ended_at: endedAt.toISOString().split(".")[0]
        }
      })

      if (res.statusCode === 200) {
        setTopCustomers(res.data)
      }

      setTimeout(() => {
        setLoading(false)
      }, 100)
    }

    TopUsers()
  }, [filterByDate])

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="flex flex-row justify-between px-6.5 mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Top Customers
        </h4>
        <div className="relative z-20 inline-block">
          <select
            name="#"
            id="#"
            className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 text-sm font-medium outline-none"
            value={filterByDate}
            onChange={(v) => setFilterByDate(v.target.value)}
          >
            <option value="day" className="dark:bg-boxdark">
              Daily
            </option>
            <option value="week" className="dark:bg-boxdark">
              Weekly
            </option>
            <option value="month" className="dark:bg-boxdark">
              Monthly
            </option>
            <option value="year" className="dark:bg-boxdark">
              Yearly
            </option>
          </select>
          <span className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
            <IoIosArrowDown />
          </span>
        </div>
      </div>


      <div className="relative">
        {
          loading && <div className="w-full h-full absolute top-0 flex items-center justify-center z-50">
            <AiOutlineLoading3Quarters className="animate-spin text-purple-600" size={50} />
          </div>
        }
        {topCustomers.map((cus, key) => (
          <div
            className="flex items-center gap-2 px-5.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
            key={key}
          >
            <div className="relative h-14 w-14 flex items-center justify-center border rounded-full">
              <CiUser size={30} />
            </div>

            <div className="flex flex-1 items-center justify-between">
              <div>
                <h5 className="font-medium text-black dark:text-white">
                  {cus.customer_name}
                </h5>
                <p>
                  <span className="text-sm text-black dark:text-white">
                    {cus.customer.dial_code}  {cus.customer.phone_number.replace(/(\d{4})(?=\d)/g, '$1-')}
                  </span>
                  {/* <span className="text-xs"> . 100.000</span> */}
                </p>
                {/* <p>
                  <span className="text-xs p-0 text-black dark:text-white">
                    {cus.customer}
                  </span>
                </p> */}
              </div>
              <div className="flex flex-col w-auto py-1  px-2 items-center justify-center rounded bg-primary">
                <span className="text-sm font-medium text-white">
                  {" "}
                  {cus.count_order} x
                </span>
                <span className="text-xs text-white">
                  Rp. {new Intl.NumberFormat("id-ID", {
                    style: "decimal",
                    currency: "IDR"
                  }).format(parseInt(cus.total_sum))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatCard;
