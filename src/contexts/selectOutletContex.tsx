"use client";

import { Input } from "@/components/Inputs/InputComponent";
import Modal from "@/components/Modals/Modal";
import { GetWithToken, iResponse } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { Outlet } from "@/types/outlet";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { useSelector } from "react-redux";

export interface iOutletSelected {
  area_id: string | null;
  outlet_id: string;
  outlet: string;
}
export type OutletType = {
  outlet_id: string;
  name: string;
};

export type Area = {
  area_id: string | null;
  area: string | null;
  outlets: OutletType[];
};
export type CV = {
  cv_id: string | null;
  cv: string | null;
  outlets: OutletType[];
};

export interface iFilterByOutlet {
  modal: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
  selectedOutlets: iOutletSelected[];
  defaultSelectedOutlet: iOutletSelected[];
}
export const FilterByOutletContext = createContext({} as iFilterByOutlet);

export interface iFilterProvider {
  children: any;
}

enum TabActive {
  AREA = "AREA",
  CV = "CV",
}
export const FilterPageProvider: FC<iFilterProvider> = ({ children }) => {
  const [data, setData] = useState<any[]>([]);
  const [selectedOutlets, setSelectedOutlets] = useState<any[]>([]);
  const [defaultSelectedOutlet, setDefaultSelectedOutlet] = useState<
    iOutletSelected[]
  >([]);
  const [search, setSearch] = useState<string>("");
  const [tabActive, setTabActive] = useState<TabActive>(TabActive.AREA);

  function findOutletByNameSubstring(nameSubstring: string): Area[] {
    const results: Area[] = [];

    for (const area of data) {
      for (const outlet of area.outlets) {
        if (outlet.name.toLowerCase().includes(nameSubstring.toLowerCase())) {
          const checkArea = results.findIndex(
            (f) => f.area_id === area.area_id,
          );
          if (checkArea <= -1) {
            results.push({
              area_id: area.area_id,
              area: area.area,
              outlets: [outlet],
            });
          } else {
            Object.assign(results[checkArea], {
              ...results[checkArea],
              outlets: results[checkArea].outlets.concat([outlet]),
            });
          }
        }
      }
    }

    return results;
  }

  function filterOutlet() {
    if (search.length >= 3) return findOutletByNameSubstring(search);
    return data;
  }

  const router = useRouter();
  const { auth } = useSelector((s: RootState) => s.auth);
  const pathname = usePathname();

  useEffect(() => {
    async function GotAllOutlet() {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet/got/forme?is_deleted=false",
        token: `${auth.access_token}`,
      });

      if (res?.statusCode === 200) {
        if (tabActive === TabActive.AREA) {
          let maping: Area[] = [];
          let defaultOutlet: iOutletSelected[] = [];
          for (const i of res.data) {
            let areaId = null;
            let areaName = "Without Area";
            if (i.outlet_area_grouping) {
              areaId = i.outlet_area_grouping.outlet_area.id;
              areaName = i.outlet_area_grouping.outlet_area.name;
            }

            const city = i.city.split("--");
            const checkArea = maping.findIndex((f) => f.area_id === areaId);
            const outlet = {
              outlet_id: i.id,
              name: `${i.name} ${city.length >= 2 ? city[1] : city}`,
            };

            const outletGrouping: Area = {
              area_id: areaId,
              area: areaName,
              outlets: [outlet],
            };

            if (checkArea <= -1) {
              maping.push(outletGrouping);
            } else {
              Object.assign(maping[checkArea], {
                ...maping[checkArea],
                outlets: maping[checkArea].outlets.concat([outlet]),
              });
            }
            defaultOutlet.push({
              area_id: areaId,
              outlet: outlet.name,
              outlet_id: outlet.outlet_id,
            });
          }
          console.log(maping);

          setDefaultSelectedOutlet(defaultOutlet);
          setData(maping);
        } else {
          let maping: CV[] = [];
          let defaultOutlet: iOutletSelected[] = [];
          for (const i of res.data) {
            let cvId = null;
            let cvName = "Without CV Group";
            if (i.outlet_grouping) {
              cvId = i.outlet_grouping.outlet_grouping_master.id;
              cvName = i.outlet_grouping.outlet_grouping_master.name;
            }

            const city = i.city.split("--");
            const checkArea = maping.findIndex((f) => f.cv_id === cvId);
            const outlet = {
              outlet_id: i.id,
              name: i.name,
              phone: i.dial_code + i.phone_number,
              is_deleted: i.is_deleted,
            };

            const outletGrouping: any = {
              cv_id: cvId,
              cv: cvName,
              outlets: [outlet],
            };
            if (checkArea <= -1) {
              maping.push(outletGrouping);
            } else {
              Object.assign(maping[checkArea], {
                ...maping[checkArea],
                outlets: maping[checkArea].outlets.concat([outlet]),
              });
            }
          }
          console.log(maping);

          setDefaultSelectedOutlet(defaultOutlet);
          setData(maping);
        }
      }
    }

    if (auth.access_token !== null && auth.access_token.length >= 1)
      GotAllOutlet();
  }, [auth.access_token, router, tabActive]);

  const [modal, setModal] = useState<boolean>(false);

  return (
    <FilterByOutletContext.Provider
      value={{ modal, setModal, selectedOutlets, defaultSelectedOutlet }}
    >
      {children}
      <div>
        <Modal isOpen={modal}>
          <div
            className="relative h-[90vh] w-[90%] rounded-md bg-white p-4 
        shadow dark:bg-boxdark md:w-[50%]"
          >
            <div className="flex h-full w-full flex-col">
              <div className="h-min w-full">
                <div className="p-2 text-lg">
                  <p className="font-semibold">Filter by Outlets or Areas</p>
                </div>
                <div className="mb-2 p-2">
                  <Input
                    label={"Search Outlet"}
                    name={"search"}
                    id={"search"}
                    value={search}
                    onChange={(v) => setSearch(v)}
                    error={null}
                  />
                </div>
                <div className="mb-4 w-full rounded-md bg-gray-50 px-4 pt-4 dark:bg-gray-800">
                  <ul
                    className="-mb-px flex flex-wrap text-center text-sm font-medium"
                    id="default-tab"
                    data-tabs-toggle="#default-tab-content"
                    role="tablist"
                  >
                    <li className="me-2" role="presentation">
                      <button
                        className={`inline-block rounded-t-lg border-b-2 p-4 
                              ${
                                tabActive === TabActive.AREA
                                  ? "border-blue-500 text-blue-500"
                                  : "dark:border-form-strokedark"
                              }
                              `}
                        onClick={() => setTabActive(TabActive.AREA)}
                      >
                        {TabActive.AREA}
                      </button>
                    </li>
                    <li className="me-2" role="presentation">
                      <button
                        className={`inline-block rounded-t-lg border-b-2 p-4 
                              ${
                                tabActive === TabActive.CV
                                  ? "border-blue-500 text-blue-500"
                                  : "dark:border-form-strokedark"
                              }
                              `}
                        onClick={() => setTabActive(TabActive.CV)}
                      >
                        {TabActive.CV}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="h-full overflow-y-auto">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        #
                      </th>
                      <th scope="col" className="px-6 py-3">
                        name
                      </th>
                    </tr>
                  </thead>
                  {filterOutlet().map((i, k) => (
                    <tbody key={k}>
                      <tr
                        className="border-b-2 bg-gray-100 hover:bg-gray-50 dark:border-gray-700
             dark:bg-gray-800 dark:hover:bg-gray-600"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={
                              tabActive === TabActive.AREA
                                ? selectedOutlets.filter(
                                    (f) => f.area_id === i.area_id,
                                  ).length === i.outlets.length
                                  ? true
                                  : false
                                : selectedOutlets.filter(
                                      (f) => f.cv_id === i.cv_id,
                                    ).length === i.outlets.length
                                  ? true
                                  : false
                            }
                            onChange={(e) => {
                              let checkAll: any[] = [];

                              if (tabActive === TabActive.AREA) {
                                setSelectedOutlets((old) => {
                                  i.outlets.forEach((f: any) => {
                                    const checkAlready = old.find(
                                      (fS) =>
                                        fS.area_id === i.area_id &&
                                        fS.outlet_id === f.outlet_id,
                                    );
                                    if (!checkAlready) {
                                      console.log(i.area_id);

                                      checkAll.push({
                                        area_id: i.area_id,
                                        outlet_id: f.outlet_id,
                                        outlet: f.name,
                                      });
                                    }
                                  });

                                  if (e.target.checked) {
                                    return [
                                      ...old,
                                      ...checkAll.filter(
                                        (f) =>
                                          !old.some(
                                            (m) => f.outlet_id === m.outlet_id,
                                          ),
                                      ),
                                    ];
                                  } else {
                                    return old.filter(
                                      (f) => f.area_id !== i.area_id,
                                    );
                                  }
                                });
                              } else {
                                setSelectedOutlets((old) => {
                                  i.outlets.forEach((f: any) => {
                                    const checkAlready = old.find(
                                      (fS) =>
                                        fS.cv_id === i.cv_id &&
                                        fS.outlet_id === f.outlet_id,
                                    );
                                    if (!checkAlready) {
                                      console.log(i.cv_id);

                                      checkAll.push({
                                        cv_id: i.cv_id,
                                        outlet_id: f.outlet_id,
                                        outlet: f.name,
                                      });
                                    }
                                  });

                                  if (e.target.checked) {
                                    return [
                                      ...old,
                                      ...checkAll.filter(
                                        (f) =>
                                          !old.some(
                                            (m) => f.outlet_id === m.outlet_id,
                                          ),
                                      ),
                                    ];
                                  } else {
                                    return old.filter(
                                      (f) => f.cv_id !== i.cv_id,
                                    );
                                  }
                                });
                              }
                              console.log(data);
                            }}
                          />
                        </td>
                        <td className="w-full whitespace-nowrap px-6 py-4 text-center font-bold">
                          {tabActive === TabActive.AREA
                            ? i.area !== null
                              ? i.area
                              : "Belum dimasukan ke area tertentu"
                            : i.cv !== null
                              ? i.cv
                              : "Belum dimasukan ke cv tertentu"}
                        </td>
                      </tr>
                      {i.outlets.map((outlet: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b bg-white hover:bg-gray-50 dark:border-gray-700
             dark:bg-gray-800 dark:hover:bg-gray-600"
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={
                                selectedOutlets.find(
                                  (f) => f.outlet_id === outlet.outlet_id,
                                )
                                  ? true
                                  : false
                              }
                              onChange={(e) => {
                                setSelectedOutlets((old) => {
                                  if (e.target.checked) {
                                    return old.concat([
                                      {
                                        area_id: i.area_id,
                                        outlet_id: outlet.outlet_id,
                                        outlet: outlet.name,
                                      },
                                    ]);
                                  } else {
                                    return old.filter(
                                      (f) => f.outlet_id !== outlet.outlet_id,
                                    );
                                  }
                                });
                              }}
                            />
                          </td>
                          <td className="w-full whitespace-nowrap px-6 py-4">
                            {outlet.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
              <div className="flex h-min w-full flex-row justify-end space-x-4 pt-2">
                <button
                  className="inline-flex items-center justify-center bg-red px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                  onClick={() =>
                    setSelectedOutlets(() => {
                      setModal(false);
                      return [];
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center justify-center bg-primary px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                  onClick={() => setModal(false)}
                >
                  Filter
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </FilterByOutletContext.Provider>
  );
};
