"use client";
import { Input } from "@/components/Inputs/InputComponent";
import reqApi from "@/libs/reqApi";
import { ERoles, iAuthRedux, setLogin } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { useFormik } from "formik";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

// export const metadata: Metadata = {
//   title: "Sign in",
//   description: "This is Next.js Signin Page",
// };

const SignIn: React.FC = () => {
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Email atau nomor telepon diperlukan"),
    }),
    onSubmit: async (value) => {
      const res = await reqApi.POST("/api/auth/req-forgot-password", value);

      if (res?.statusCode === 200) {
        toast.success("Unique code for change new password was sent to your email");
        router.push("/auth/confirm-password")
      } else {
        toast.error("Something went wrong, please try again")
      }
    },
  });
  return (
    <div className="flex h-svh w-full flex-wrap items-center justify-center rounded-sm border">
      <div className="w-[90%] rounded-md bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:w-1/2">
        <div className="w-full p-4 sm:p-12.5 xl:p-4">
          <h2 className="mb-9 w-full text-center text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
            Forgot Password
          </h2>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-4">
              <div className="relative">
                <Input
                  label={"Email"}
                  name={"email"}
                  id={"email"}
                  value={formik.values.email}
                  onChange={(val) => formik.setFieldValue("email", val)}
                  error={
                    formik.touched.email && formik.errors.email
                      ? formik.errors.email
                      : null
                  }
                />

                <span className="absolute right-4 top-4">
                  <svg
                    className="fill-current"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g opacity="0.5">
                      <path
                        d="M19.2516 3.30005H2.75156C1.58281 3.30005 0.585938 4.26255 0.585938 5.46567V16.6032C0.585938 17.7719 1.54844 18.7688 2.75156 18.7688H19.2516C20.4203 18.7688 21.4172 17.8063 21.4172 16.6032V5.4313C21.4172 4.26255 20.4203 3.30005 19.2516 3.30005ZM19.2516 4.84692C19.2859 4.84692 19.3203 4.84692 19.3547 4.84692L11.0016 10.2094L2.64844 4.84692C2.68281 4.84692 2.71719 4.84692 2.75156 4.84692H19.2516ZM19.2516 17.1532H2.75156C2.40781 17.1532 2.13281 16.8782 2.13281 16.5344V6.35942L10.1766 11.5157C10.4172 11.6875 10.6922 11.7563 10.9672 11.7563C11.2422 11.7563 11.5172 11.6875 11.7578 11.5157L19.8016 6.35942V16.5688C19.8703 16.9125 19.5953 17.1532 19.2516 17.1532Z"
                        fill=""
                      />
                    </g>
                  </svg>
                </span>
              </div>
            </div>

            <div className="mb-5">
              <input
                type="submit"
                value="Submit"
                className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
