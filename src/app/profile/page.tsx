"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { iAuthRedux } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function Detailcredential() {
  const router = useRouter()
  const credential = useSelector((s: RootState) => s).auth

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
            <div className="relative z-30 mx-auto -mt-22 h-30 w-full max-w-30 rounded-full bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-44 sm:p-3">
              <div className="relative drop-shadow-2 justify-center flex items-center h-full">
                <FaRegUser size={50} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="mb-1.5 text-2xl font-semibold text-black dark:text-white">
                {credential?.fullname}
              </h3>
              <p className="font-medium">{credential?.role.name}</p>
              <div className="flex flex-col items-start mx-auto max-w-180 mt-5.5">
                <h4 className="font-semibold text-black dark:text-white">
                  About Me
                </h4>
                <div className="mt-4 w-full space-y-2">
                  <div className="flex flex-row items-center justify-between">
                    <p>Phone Number</p>
                    <p>{credential?.phone_number}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>Email</p>
                    <p>{credential?.email}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p>Role</p>
                    <p>{credential?.role.name}</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}