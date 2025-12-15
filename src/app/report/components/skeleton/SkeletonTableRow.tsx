// TODOOOOO
type SkeletonType = {
    howMuch: number;
}

export function SkeletonTableRow(props: SkeletonType) {
    return (
        <tr className="animate-pulse border-b dark:bg-gray-800 bg-white/5">
                            {Array.from({length: props.howMuch ? props.howMuch : 5}).map((_, i) => (
                            <td key={i} className="px-6 py-4">
                                <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </td>
                            ))}
        </tr>
    )
}