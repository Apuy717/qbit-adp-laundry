import { useEffect, useState } from "react";
import { Input } from "../Inputs/InputComponent"
import { Area, iOutletSelected } from "@/contexts/selectOutletContex";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/stores/store";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { Outlet } from "@/types/outlet";
import Modal from "../Modals/Modal";

interface iProps {
  defaultSelected?: iOutletSelected[]
  modal: boolean
  closeModal: (result: iOutletSelected[]) => void
  onSubmit: (result: iOutletSelected[]) => void
}

export default function ModalSelectOutlet(props: iProps) {
  const [data, setData] = useState<Area[]>([])
  const [selectedOutlets, setSelectedOutlets] = useState<iOutletSelected[]>([])
  const [search, setSearch] = useState<string>("");

  function findOutletByNameSubstring(nameSubstring: string): Area[] {
    const results: Area[] = [];

    for (const area of data) {
      for (const outlet of area.outlets) {
        if (outlet.name.toLowerCase().includes(nameSubstring.toLowerCase())) {
          const checkArea = results.findIndex(f => f.area_id === area.area_id)
          if (checkArea <= -1) {
            results.push({
              area_id: area.area_id,
              area: area.area,
              outlets: [outlet],
            });
          } else {
            Object.assign(results[checkArea], {
              ...results[checkArea],
              outlets: results[checkArea].outlets.concat([outlet])
            })
          }
        }
      }
    }

    return results;
  }

  function filterOutlet() {
    if (search.length >= 3)
      return findOutletByNameSubstring(search);
    return data
  }

  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    async function GotAllOutlet() {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet/got/forme",
        token: `${auth.access_token}`
      })

      if (res?.statusCode === 200) {
        const maping: Area[] = []
        for (const i of res.data) {
          let areaId = null;
          let areaName = "Without Area";
          if (i.outlet_area_grouping) {
            areaId = i.outlet_area_grouping.outlet_area.id
            areaName = i.outlet_area_grouping.outlet_area.name
          }

          const city = i.city.split("--")
          const checkArea = maping.findIndex(f => f.area_id === areaId)
          const outlet = { outlet_id: i.id, name: `${i.name} ${city.length >= 2 ? city[1] : city}` }

          const outletGrouping: Area = {
            area_id: areaId,
            area: areaName,
            outlets: [outlet]
          }
          if (checkArea <= -1) {
            maping.push(outletGrouping);
          } else {
            Object.assign(maping[checkArea], {
              ...maping[checkArea],
              outlets: maping[checkArea].outlets.concat([outlet])
            })
          }
        }
        setData(maping)
        if (props.defaultSelected)
          setSelectedOutlets(props.defaultSelected)
      }
    }

    GotAllOutlet()
  }, [])

  const [modal, setModal] = useState<boolean>(false)
  return (
    <div onClick={() => setModal(true)}>
      <Modal isOpen={props.modal}>
        <div className="relative bg-white dark:bg-boxdark shadow rounded-md h-[90vh] 
        w-[90%] md:w-[50%] p-4">
          <div className="w-full h-full flex flex-col">
            <div className="w-full h-min">
              <div className="p-2 text-lg">
                <p className="font-semibold">Filter by Outlets or Areas</p>
              </div>
              <div className="p-2 mb-2">
                <Input label={"Search Outlet"} name={"search"} id={"search"}
                  value={search}
                  onChange={(v) => setSearch(v)} error={null} />
              </div>
            </div>
            <div className="h-full overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">#</th>
                    <th scope="col" className="px-6 py-3">name</th>
                  </tr>
                </thead>
                {filterOutlet().map((i, k) => (
                  <tbody key={k}>
                    <tr
                      className="border-b-2 bg-gray-100 hover:bg-gray-50 dark:border-gray-700
             dark:bg-gray-800 dark:hover:bg-gray-600"
                    >
                      <td className="px-6 py-4">
                        <input type="checkbox"
                          checked={selectedOutlets.filter(f => f.area_id === i.area_id).length === i.outlets.length ? true : false}
                          onChange={(e) => {
                            setSelectedOutlets((old) => {
                              let checkAll: iOutletSelected[] = []
                              i.outlets.map(f => {
                                const checkAlready = selectedOutlets.find(fS => fS.area_id === i.area_id && fS.outlet_id === f.outlet_id)
                                if (checkAlready === undefined) checkAll.push({
                                  area_id: i.area_id,
                                  outlet_id: f.outlet_id,
                                  outlet: f.name
                                })
                              })

                              if (e.target.checked) {
                                return old.concat(checkAll.filter(f => old.map(m => f.outlet_id !== m.outlet_id)))
                              } else {
                                return old.filter(f => f.area_id !== i.area_id)
                              }
                            })
                          }} />
                      </td>
                      <td className="w-full whitespace-nowrap px-6 py-4 text-center font-bold">
                        {i.area !== null ? i.area : "Belum dimasukan ke area tertentu"}
                      </td>
                    </tr>
                    {i.outlets.map((outlet, index) => (
                      <tr
                        key={index}
                        className="border-b bg-white hover:bg-gray-50 dark:border-gray-700
             dark:bg-gray-800 dark:hover:bg-gray-600"
                      >
                        <td className="px-6 py-4">
                          <input type="checkbox"
                            checked={selectedOutlets.find(f => f.outlet_id === outlet.outlet_id) ? true : false}
                            onChange={(e) => {
                              setSelectedOutlets((old) => {
                                if (e.target.checked) {
                                  return old.concat([{ area_id: i.area_id, outlet_id: outlet.outlet_id, outlet: outlet.name }])
                                } else {
                                  return old.filter(f => f.outlet_id !== outlet.outlet_id)
                                }
                              })
                            }} />
                        </td>
                        <td className="w-full whitespace-nowrap px-6 py-4">{outlet.name}</td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
            <div className="w-full h-min flex flex-row space-x-4 justify-end pt-2">
              <button
                className="inline-flex items-center justify-center bg-red px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                onClick={() =>
                  setSelectedOutlets(() => {
                    props.closeModal(selectedOutlets)
                    return []
                  })

                }
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center bg-primary px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                onClick={() => {
                  props.onSubmit(selectedOutlets)
                }}
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      </Modal >
    </div >
  )
}