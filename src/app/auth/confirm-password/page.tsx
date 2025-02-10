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
      code: "",
      new_password: "",
      c_password: "",
    },
    validationSchema: Yup.object({
      code: Yup.string().required("code atau nomor telepon diperlukan"),
    }),
    onSubmit: async (value) => {
      console.log(value);
      
      const res = await reqApi.POST("/api/auth/forgot-password", value);

      if (res?.statusCode === 200) {
        toast.success(
          "Change new password success!",
        );
        router.push("/auth/signin");
      } else {
        toast.error("Something went wrong, please try again");
      }
    },
  });
  return (
    <div className="flex h-svh w-full flex-wrap items-center justify-center rounded-sm border">
      <div className="w-[90%] rounded-md bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:w-1/2">
        <div className="w-full p-4 sm:p-12.5 xl:p-4">
          <h2 className="mb-9 w-full text-center text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
            New Password
          </h2>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-4 space-y-4">
              <div className="relative">
                <Input
                  className="mb-4"
                  label={"Code"}
                  name={"code"}
                  id={"code"}
                  value={formik.values.code}
                  onChange={(val) => formik.setFieldValue("code", val)}
                  error={
                    formik.touched.code && formik.errors.code
                      ? formik.errors.code
                      : null
                  }
                />
                <Input
                  className="mb-4"
                  type="password"
                  label={"New password"}
                  name={"new_password"}
                  id={"new_password"}
                  value={formik.values.new_password}
                  onChange={(val) => formik.setFieldValue("new_password", val)}
                  error={
                    formik.touched.new_password && formik.errors.new_password
                      ? formik.errors.new_password
                      : null
                  }
                />
                <Input
                  className="mb-4"
                  type="password"
                  label={"Confirm password"}
                  name={"c_password"}
                  id={"c_password"}
                  value={formik.values.c_password}
                  onChange={(val) => formik.setFieldValue("c_password", val)}
                  error={
                    formik.touched.c_password && formik.errors.c_password
                      ? formik.errors.c_password
                      : null
                  }
                />
              </div>
            </div>

            <div className="mb-5">
              <input
                onClick={() => formik.handleSubmit}
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
