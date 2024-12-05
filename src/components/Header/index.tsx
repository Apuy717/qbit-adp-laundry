import Link from "next/link";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownMessage from "./DropdownMessage";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { CiMenuFries } from "react-icons/ci";
import { IoIosArrowDown } from "react-icons/io";
import { useContext, useEffect } from "react";
import { FilterByOutletContext } from "@/contexts/selectOutletContex";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const { setModal, modal, selectedOutlets } = useContext(FilterByOutletContext)
  useEffect(() => {
    console.log(modal)
  }, [modal])
  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11 space-x-4">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* <!-- Hamburger Toggle BTN --> */}
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark "
          >
            <CiMenuFries size={20} />
          </button>
          {/* <!-- Hamburger Toggle BTN --> */}

          <Link className="flex-shrink-0 block md:hidden xl:hidden" href="/" >
            <Image
              width={32}
              height={32}
              src={"/images/share-logo.png"}
              alt="Logo"
            />
          </Link>
        </div>

        <div className="hidden md:block border-2 rounded-md px-4 py-2 relative cursor-pointer flex-1" onClick={() => setModal(!modal)}>
          {selectedOutlets.length >= 1 ? <p>Selected {" "} {selectedOutlets.length} Outlet</p> : <p>All Area</p>}
          <div className="absolute top-0 right-0 h-full flex w-min items-center justify-center">
            <IoIosArrowDown size={23} />
          </div>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/* <!-- Dark Mode Toggler --> */}
            <DarkModeSwitcher />
            {/* <!-- Dark Mode Toggler --> */}

            {/* <!-- Notification Menu Area --> */}
            <DropdownNotification />
            {/* <!-- Notification Menu Area --> */}

            {/* <!-- Chat Notification Area --> */}
            <DropdownMessage />
            {/* <!-- Chat Notification Area --> */}
          </ul>

          {/* <!-- User Area --> */}
          <DropdownUser />
          {/* <!-- User Area --> */}
        </div>
      </div>
    </header >
  );
};

export default Header;
