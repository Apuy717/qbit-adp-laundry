import { useEffect, useState } from "react"
import { iDropdown, Input } from "../Inputs/InputComponent"
import Modal from "../Modals/Modal"
import { IoCloseOutline } from "react-icons/io5"
import Table from "../Tables/Table"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { RootState } from "@/stores/store"
import { GetWithToken, iResponse } from "@/libs/FetchData"
import { Outlet } from "@/types/outlet"

interface iFilterByOutletTableModal {
  setFilterByOutlet: (isChecked: boolean, val: string) => void
  modalOutlet: boolean
  closeModal: (isOpen: boolean) => void
}

export const FilterByOutletTableModal = (props: iFilterByOutletTableModal) => {
  const [searchOutlet, setSearchOutlet] = useState<string>("")
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)
  const [outlets, setOutlets] = useState<iDropdown[]>([])

  useEffect(() => {
    async function GotAllOutlet() {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet",
        token: `${auth.access_token}`
      })

      if (res?.statusCode === 200) {
        const outletMaping = res.data.map(i => {
          const city = i.city.split("--")
          return {
            value: i.id,
            label: `${i.name} ${city.length >= 2 ? city[1] : city}`
          }
        })

        setOutlets(outletMaping)
      }
    }

    GotAllOutlet()
  }, [])

  function filterOutlet() {
    if (searchOutlet.length >= 3)
      return outlets.filter(f => f.label.toLowerCase().includes(searchOutlet.toLowerCase()))
    return outlets
  }

  return (
    <Modal isOpen={props.modalOutlet}>
      <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-[90vh] overflow-scroll overflow-x-hidden
        md:h-[40rem] w-[90%] md:w-[50%] p-4">
        <div
          className="z-9999 absolute top-3 right-3 bg-red-500 p-1 rounded-full border-white shadow border-2 cursor-pointer"
          onClick={() => props.closeModal(false)}
        >
          <IoCloseOutline color="white" size={20} />
        </div>

        <div className="p-2 mb-5 text-lg">
          <p className="font-semibold">Filter Berdasarkan Outlet</p>
        </div>

        <div className="p-2">
          <Input label={"Cari Outlet"} name={"search"} id={"search"}
            value={searchOutlet}
            onChange={(v) => {
              setSearchOutlet(v)
            }} error={null} />
        </div>
        <Table colls={["#", "Nama Outlet"]} currentPage={0} totalItem={1} onPaginate={() => null}>
          {filterOutlet().map((i, k) => (
            <tr
              className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
              key={k}
            >
              <td className="whitespace-nowrap px-6 py-4">
                <input type="checkbox" value={`${i.value}`}
                  onChange={(e) => props.setFilterByOutlet(e.target.checked, e.target.value)} />
              </td>
              <td className="whitespace-nowrap px-6 py-4">{i.label}</td>
            </tr>
          ))}
        </Table>
      </div>
    </Modal>
  )
}