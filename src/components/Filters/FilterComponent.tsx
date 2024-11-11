import { Input } from "../Inputs/InputComponent"

interface iFilterComponent {
  onClickFilterOutlet: () => void
  handleSearch: () => void
  search: string
  setSearch: (value: string) => void
  children?: any
}


export const FilterComponent = (props: iFilterComponent) => {
  return (
    <div className="w-full bg-white dark:bg-boxdark p-4 mb-4 rounded-t">
      <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row w-full md:space-x-4">
        <div className="w-full md:w-96">
          <Input
            label={"Pencarian"}
            name={"search"}
            id={"search"}
            value={props.search}
            onChange={(v) => props.setSearch(v)}
            error={null}
          />
        </div>

        <div className="cursor-pointer w-full md:w-96" onClick={props.onClickFilterOutlet}>
          <div className="flex flex-row">
            <div className="w-full p-3 border-2 rounded-md relative">
              <label
                className={`text-md  transition-all duration-500`}
              >
                Filter By Outlet
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={props.handleSearch}
          className={`inline-flex items-center justify-center rounded-md bg-black px-10 py-3 
              text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10`}
        >
          Cari
        </button>
        {props.children && props.children}
      </div>
    </div>
  )
}