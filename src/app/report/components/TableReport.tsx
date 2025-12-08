import { toRupiah } from "../utils/toRupiah";

type MerchantDataType = {
  transaction: string;
  total: string;
  outlet: {
    id: number;
    name: string;
  }
}[];

type TableReportType = {
  merchantData: MerchantDataType;
}

export function TableReport(props: TableReportType) {
  return (<>
  <section>
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="hidden sm:table-header-group">
                <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800 dark:text-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-6 py-4 text-left lg:text-center text-xs font-medium uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {props.merchantData != null && props.merchantData.map((item, index) => (
                  <tr
                    key={index}
                    className="grid grid-cols-2 items-start gap-2 rounded-xl border border-white/10 
                       bg-white/5 p-4 shadow-lg backdrop-blur-xl
                       transition hover:bg-slate-50 sm:table-row
                       sm:rounded-none sm:bg-transparent sm:p-0 sm:hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <td className="text-xs sm:px-6 sm:py-4 sm:text-sm sm:text-slate-500 dark:text-slate-100">
                      #{index + 1}
                    </td>

                    <td className="sm:px-6 sm:py-4 sm:text-slate-800 dark:text-slate-100">
                      {item.outlet.name}
                    </td>

                    <td className="font-mono col-span-2 text-xs sm:col-span-1 sm:px-6 sm:py-4 sm:text-sm lg:text-center dark:text-slate-100">
                      {item.transaction}
                    </td>

                    <td className="text-right font-medium text-green-400 sm:px-6 sm:py-4 sm:text-slate-800 dark:text-slate-100">
                      {toRupiah(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
  </>)
}