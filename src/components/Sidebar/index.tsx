"use client";

import ClickOutside from "@/components/ClickOutside";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ERoles } from "@/stores/authReducer";
import { RootState } from "@/stores/store";
import { EDepartmentEmployee } from "@/types/employee";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { BiSolidDiscount, BiSolidWasher } from "react-icons/bi";
import {
  FaUsers
} from "react-icons/fa";
import { GrDocumentText } from "react-icons/gr";
import { HiOutlineBuildingStorefront } from "react-icons/hi2";
import { IoIosApps, IoIosArrowDown } from "react-icons/io";
import { MdOutlineDashboard, MdOutlineReportGmailerrorred, MdPayment } from "react-icons/md";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
import { TbIroningSteam } from "react-icons/tb";
import { useSelector } from "react-redux";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const { role, department } = useSelector((s: RootState) => s.auth)
  const { setModal, modal, selectedOutlets } = useContext(FilterByOutletContext)

  const menuGroups = [
    {
      name: "MENU",
      role: [
        ERoles.SUPER_ADMIN,
        ERoles.PROVIDER,
        EDepartmentEmployee.HQ,
        EDepartmentEmployee.AUDITOR,
        EDepartmentEmployee.FINANCE,
        EDepartmentEmployee.AM,
        EDepartmentEmployee.SPV,
        EDepartmentEmployee.HO,
        EDepartmentEmployee.OWNER,
        ERoles.OUTLET_ADMIN,
        ERoles.FINANCE
      ],
      menuItems: [
        {
          icon: <MdOutlineDashboard size={23} />,
          label: "Dashboard",
          route: "/",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.AUDITOR,
            EDepartmentEmployee.FINANCE,
            EDepartmentEmployee.AM,
            EDepartmentEmployee.SPV,
            EDepartmentEmployee.HO,
            EDepartmentEmployee.OWNER,
            ERoles.OUTLET_ADMIN,
            ERoles.FINANCE
          ],
        },
        {
          icon: <HiOutlineBuildingStorefront size={22} />,
          label: "Outlet",
          route: "#",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.AUDITOR,
            EDepartmentEmployee.FINANCE,
            EDepartmentEmployee.AM,
            EDepartmentEmployee.SPV,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
            ERoles.FINANCE
          ],
          children: [
            { label: "Outlet", route: "/outlet" },
            { label: "Product Group", route: "/product" },
            { label: "Product Sku", route: "/v2/product" },
            { label: "Group by CV", route: "/group-by-cv" },
          ],
        },
        {
          icon: <FaUsers size={22} />,
          label: "Employee",
          route: "/employee",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
          ],
        },
        {
          icon: <RiMoneyCnyCircleLine size={23} />,
          label: "Transaction",
          route: "#",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.AUDITOR,
            EDepartmentEmployee.FINANCE,
            EDepartmentEmployee.AM,
            EDepartmentEmployee.SPV,
            EDepartmentEmployee.HO,
            EDepartmentEmployee.OWNER,
            ERoles.OUTLET_ADMIN,
            ERoles.FINANCE
          ],
          children: ERoles.FINANCE === role.name ?
            [
              { label: "Sales", route: "/orders" },
            ] :
            [
              { label: "Sales", route: "/orders" },
              { label: "Audit", route: "/audit" },
              { label: "Master Expense", route: "/purchase-request/item" },
              { label: "Expense", route: "/purchase-request/trx" },
            ],
        },
        {
          icon: <TbIroningSteam size={24} />,
          label: "Iron",
          route: "#",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
          ],
          children: [
            { label: "Log", route: "/iron" },
            { label: "Performance", route: "/iron/performance" },
          ],
        },
        {
          icon: <MdOutlineReportGmailerrorred size={24} />,
          label: "Incident",
          route: "/incident",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
          ],
        },
      ],
    },
    {
      name: "OTHERS",
      role: [
        ERoles.SUPER_ADMIN,
        ERoles.PROVIDER,
        EDepartmentEmployee.HQ,
        EDepartmentEmployee.HO,
        ERoles.OUTLET_ADMIN,
      ],
      menuItems: [
        {
          icon: <BiSolidDiscount size={22} />,
          label: "Voucher",
          route: "/voucher",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
          ],
        },
        {
          icon: <BiSolidWasher size={24} />,
          label: "Machines",
          route: "#",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
          ],
          children: [
            { label: "Machine", route: "/machine" },
            { label: "Empty Wash", route: "/empty-wash" },
            { label: "Maintenance", route: "/machine-service" },
            { label: "Log Machine", route: "/log-machine" }
          ],
        },
        {
          icon: <MdPayment size={22} />,
          label: "Payment Method",
          route: "/payment-method",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
          ],
        },
        {
          icon: <GrDocumentText size={22} />,
          label: "Terms And Conditions",
          route: "/terms-and-conditions",
          role: [
            ERoles.SUPER_ADMIN,
            ERoles.PROVIDER,
            EDepartmentEmployee.HQ,
            EDepartmentEmployee.HO,
            ERoles.OUTLET_ADMIN,
          ],
        },
        {
          icon: <IoIosApps size={22} />,
          label: "Release Versions",
          route: "/release-versions",
          role: [ERoles.PROVIDER],
        },

      ],
    },
  ];

  return (
    <ClickOutside onClick={() => null}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-150 dark:bg-boxdark  ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:pt-10 lg:px-10">
          <Link href="/">
            <Image
              width={100}
              height={50}
              src={"/images/logo_bossq.png"}
              alt="Logo"
              priority
              style={{ height: "auto", width: "auto" }}
            />
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="absolute right-2 ml-4 rounded-full bg-blue-600 p-2 lg:hidden"
          >
            <svg
              className="fill-current text-white"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <div className="md:hidden block border-[1.5px] dark:border-form-strokedark rounded-md mx-4 px-4 py-2 relative cursor-pointer flex-1" onClick={() => setModal(!modal)}>
            {selectedOutlets.length >= 1 ? <p>Selected {" "} {selectedOutlets.length} Outlet</p> : <p>All Area</p>}
            <div className="absolute top-0 right-2 h-full flex w-min items-center justify-center">
              <IoIosArrowDown size={23} />
            </div>
          </div>
          <nav className=" px-4 py-4 lg:mt-0 lg:px-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className={`mb-4 ml-4 text-sm font-semibold text-bodydark2 
                  ${group.role.filter(f => f === role.name && f === department).length === 0
                    ? "hidden" : "block"}`}>
                  {group.name}
                </h3>

                <ul className="mb-6 flex flex-col gap-1.5">
                  {group.menuItems.map((menuItem, menuIndex) => {
                    if (role.name === ERoles.OUTLET_ADMIN) {
                      // const check = menuItem.role.filter(f => f === role.name && f === department)
                      const check = menuItem.role.filter(f => f.toLowerCase() === department?.toLowerCase())
                      console.log(check.length);

                      return (
                        <div key={menuIndex} className={`${check.length === 0 ? "hidden" : "block"}`}>
                          <SidebarItem
                            key={menuIndex}
                            item={menuItem}
                            pageName={pageName}
                            setPageName={setPageName}
                          />
                        </div>
                      )
                    } else {
                      const check = menuItem.role.filter(f => f === role.name)
                      return (
                        <div key={menuIndex} className={`${check.length === 0 ? "hidden" : "block"}`}>
                          <SidebarItem
                            key={menuIndex}
                            item={menuItem}
                            pageName={pageName}
                            setPageName={setPageName}
                          />
                        </div>
                      )
                    }

                  })}
                  {/* {group.menuItems.map((menuItem, menuIndex) => (
                    <div key={menuIndex} className={`${menuItem.role.filter(f => f === role.name && f === department).length === 0 ? "hidden" : "block"}`}>
                      <SidebarItem
                        key={menuIndex}
                        item={menuItem}
                        pageName={pageName}
                        setPageName={setPageName}
                      />
                    </div>
                  ))} */}
                </ul>
              </div>
            ))}
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
