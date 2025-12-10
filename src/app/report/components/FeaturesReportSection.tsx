import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import { IoIosRefresh, IoMdDownload } from "react-icons/io";

type FeaturesReportType = {
  startDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  endDate: string;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  optionsOutlet: {id: number, name: string}[];
  handleRefreshData: () => void;
  handleDownloadExcel: () => void;
  setChoiceOutlet: React.Dispatch<React.SetStateAction<string | number>>
  setGetDataById: React.Dispatch<React.SetStateAction<number[] | string[] | []>>
}

export function FeaturesReportSection(props: FeaturesReportType) {
  return (<>
  <section className="mb-4 mt-8 flex flex-col items-end justify-between gap-y-3 lg:flex-row lg:items-center lg:gap-y-0">
        <div className="mx-auto flex w-full items-center gap-x-4 lg:mx-0 lg:w-fit">
          <DatePickerOne label="start" defaultDate={props.startDate} onChange={props.setStartDate} />
          <DatePickerOne
            label="end"
            defaultDate={props.endDate}
            onChange={props.setEndDate}
          />
        </div>
        <div className="flex items-center gap-x-6">
          <button
            onClick={() => window.location.reload()}
            className="p-3 rounded-full bg-slate-400/50 dark:bg-slate-800 dark:border dark:border-slate-100"
          >
            <IoIosRefresh className="dark:text-slate-100" />
          </button>
          <button
            onClick={props.handleDownloadExcel}
            className="flex items-center gap-x-3 rounded-md dark:bg-slate-800 border-slate-500 hover:bg-slate-200 dark:border-slate-200 px-3 py-1.5 text-slate-800 dark:text-slate-100 shadow transition-all hover:dark:bg-slate-700"
          >
            <IoMdDownload />
            <span className="font-medium capitalize">download excel</span>
          </button>
        </div>
      </section>
  </>)
}