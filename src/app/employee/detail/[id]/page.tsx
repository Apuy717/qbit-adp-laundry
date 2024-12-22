"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { Employee } from "@/types/employee";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function DetailEmployee({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const [employee, setEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    async function GotDetailEmployee() {
      const res = await GetWithToken<iResponse<Employee>>({
        router: router,
        url: `/api/auth/employee/${params.id}`,
        token: `${auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        setEmployee(res.data)
      }
    }

    GotDetailEmployee();
  }, [auth.access_token, router, params.id])


  return (
    <>
      <div className="mx-auto max-w-242.5">
        <Breadcrumb pageName="Profile" />

        <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="relative z-20 h-35 md:h-65">
            <Image
              src={"/images/cover/cover-01.png"}
              alt="profile cover"
              className="h-full w-full rounded-tl-sm rounded-tr-sm object-cover object-center"
              width={970}
              height={260}
              style={{
                width: "auto",
                height: "auto",
              }}
            />
          </div>
          <div className="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
            <div className="relative z-30 mx-auto -mt-22 h-30 w-full max-w-30 rounded-full bg-gray-500/20 dark:bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-44 sm:p-3">
              <div className="relative drop-shadow-2 justify-center flex items-center h-full">
                <FaRegUser size={50} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="mb-1.5 text-2xl font-semibold text-black dark:text-white">
                {employee?.fullname}
              </h3>
              <p className="font-medium">{employee?.role.name}</p>
              <div className="flex flex-col items-start mx-auto max-w-180 mt-5.5">
                <h4 className="font-semibold text-black dark:text-white">
                  About Me
                </h4>
                <div className="mt-4 w-full space-y-2">
                  <div className="flex flex-row items-center justify-between">
                    <p>Status</p>
                    <p>{employee && employee.is_deleted ? <span className="text-red-500">non-active</span> : <span className="text-green-500">active</span>} </p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>Phone</p>
                    <p>Jabatan</p>
                    <p>{employee?.department !== null && employee?.department} / {employee?.role !== null && employee?.role.name}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>No. Hp</p>
                    <p>{employee?.dial_code} {employee?.phone_number}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>Email</p>
                    <p>{employee?.email}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>District</p>
                    <p>{employee?.district.split("--")[1]}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>City</p>
                    <p>{employee?.city.split("--")[1]}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>Province</p>
                    <p>{employee?.province.split("--")[1]}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>Nationality</p>
                    <p>{employee?.country}</p>
                  </div>

                  {/* <div className="flex flex-row items-center justify-between">
                    <p>Full Name</p>
                    <p>{employee && employee.address.length >= 1 ? employee?.address.length : "-"}</p>
                  </div> */}

                  <div className="flex flex-row items-center justify-between">
                    <p>Registered</p>
                    <p> {new Date(`${employee?.created_at}`).toLocaleString("id", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric"
                    })}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start mx-auto max-w-180 mt-5.5">
                <h4 className="font-semibold text-black dark:text-white">
                  Outlets
                </h4>

                <div className="mt-4 w-full space-y-2">
                  {employee && employee.employee_outlets.map((i, k) => (
                    <div className="flex flex-row items-center justify-between" key={k}>
                      <p>{i.outlet.name}</p>
                      <p>{i.outlet.city.split("//").length >= 2 ? i.outlet.city.split("//")[1] : i.outlet.name}</p>
                    </div>
                  ))}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}