import { useIsMobile } from "../../hooks/useIsMobile";

type SkeletonType = {
    howMuch: number;
    currentPath?: string;
}

export function SkeletonTableRow(props: SkeletonType) {
    const isMobile = useIsMobile();
    const blacklistPath = ["/report/omzet-daily"];

    const isBlacklist = blacklistPath.includes(props.currentPath ?? "");

    return (
        isMobile && !isBlacklist ? (<>
            <tr className="animate-pulse grid grid-cols-2 items-start gap-2 rounded-xl border border-white/10 
                       bg-white/5 p-4 shadow-lg backdrop-blur-xl
                       transition hover:bg-slate-50 sm:table-row
                       sm:rounded-none sm:bg-transparent sm:p-0 sm:hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer h-20 mb-3">
                        {Array.from({length: props.howMuch ? props.howMuch : 5}).map((_, i) => (
                            <td key={i} className={`${i == 0 ? "w-24" : i == 1 ? "w-24" : i == 2 ? "w-20" : "w-20"} h-2 dark:bg-slate-400 bg-slate-300 sm:text-slate-500 dark:text-slate-100`}></td>
                        ))}
                       </tr>
        </>) : (<>
            <tr className={`animate-pulse border-b dark:bg-gray-800 bg-white/5`}>
                                {Array.from({length: props.howMuch ? props.howMuch : 5}).map((_, i) => (
                                <td key={i} className="px-6 py-4">
                                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                </td>
                                ))}
            </tr>
        </>)
    )
}