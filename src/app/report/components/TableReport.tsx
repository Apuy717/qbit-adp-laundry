import { toRupiah } from "../utils/toRupiah";

type MerchantDataType = {
  transaction: string;
  total: string;
  outlet: {
    id: string;
    name: string;
  }
}[];

type TableReportType = {
  merchantData: MerchantDataType;
  currentPage: number;
  itemsPerPage: number;
  children: React.ReactNode;
}

export function TableReport(props: TableReportType) {
  return (<>
    <section>
      <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr className="">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Outlet
                </th>
                <th className="px-6 py-4 text-left lg:text-center text-xs font-medium uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:bg-slate-700">
              {props.merchantData.length > 0 ? props.merchantData.map((item, index) => (

                <tr
                  key={index}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    {(props.currentPage - 1) * props.itemsPerPage + index + 1}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    {item.outlet.name}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {Intl.NumberFormat("id-ID").format(Number(item.transaction))}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    {toRupiah(item.total)}
                  </td>
                </tr>
              )) : (
                <>
                  {props.children}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </>)
}