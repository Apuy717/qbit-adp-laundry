import React, { useState } from "react";
import { FaSortUp, FaSortDown } from "react-icons/fa";

interface iTableSortable {
    colls: string[];
    currentPage: number;
    totalItem: number;
    onPaginate: (page: number) => void;
    children: any;
    showing?: number;
    onSort?: (index: number, direction: "asc" | "desc") => void;
}

const TableSortable: React.FC<iTableSortable> = (props) => {
    const ITEMS_PER_PAGE_GROUP = props.showing ?? 10;
    const totalPages = Math.ceil(props.totalItem / ITEMS_PER_PAGE_GROUP);

    const [sortIndex, setSortIndex] = useState<number | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Hitung rentang halaman
    const currentGroup = Math.floor(
        (props.currentPage - 1) / ITEMS_PER_PAGE_GROUP
    );
    const startPage = currentGroup * ITEMS_PER_PAGE_GROUP + 1;
    const endPage = Math.min(startPage + ITEMS_PER_PAGE_GROUP - 1, totalPages);

    const handleSort = (idx: number) => {
        let direction: "asc" | "desc" = "asc";
        if (sortIndex === idx && sortDirection === "asc") direction = "desc";
        setSortIndex(idx);
        setSortDirection(direction);
        props.onSort?.(idx, direction);
    };

    return (
        <div className="overflow-x-auto border-t border-white bg-white shadow-md dark:border-gray-800 dark:bg-gray-800 sm:rounded-lg">
            <div className="min-w-fit">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            {props.colls.map((col, idx) => {
                                const isActive = sortIndex === idx;
                                return (
                                    <th
                                        key={idx}
                                        scope="col"
                                        className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        onClick={() => handleSort(idx)}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>{col}</span>
                                            {isActive && (
                                                sortDirection === "asc" ? (
                                                    <FaSortUp className="inline-block text-gray-500" />
                                                ) : (
                                                    <FaSortDown className="inline-block text-gray-500" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>{props.children}</tbody>
                </table>

                {/* Pagination */}
                {props.currentPage >= 1 && (
                    <nav
                        className="w-full items-center justify-between p-4 flex"
                        aria-label="Table navigation"
                    >
                        <span className="mb-4 block w-full text-sm font-normal text-gray-500 dark:text-gray-400 md:mb-0 md:inline md:w-auto">
                            Showing{" "}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {Math.min((props.currentPage - 1) * ITEMS_PER_PAGE_GROUP + 1, props.totalItem)}-
                                {Math.min(props.currentPage * ITEMS_PER_PAGE_GROUP, props.totalItem)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {props.totalItem}
                            </span>
                        </span>

                        <ul className="inline-flex h-8 -space-x-px text-sm rtl:space-x-reverse">
                            <li>
                                <button
                                    className="ms-0 flex h-8 items-center justify-center rounded-s-lg border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                    onClick={() => {
                                        if (props.currentPage > 1)
                                            props.onPaginate(props.currentPage - 1);
                                    }}
                                >
                                    Previous
                                </button>
                            </li>

                            {[...Array(endPage - startPage + 1)].map((_, i) => {
                                const pageNumber = startPage + i;
                                return (
                                    <li key={i}>
                                        <button
                                            className={`flex h-8 items-center justify-center px-3 leading-tight 
                        dark:border-gray-700 dark:bg-gray-800 
                        dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${props.currentPage === pageNumber
                                                    ? "border border-gray-300 bg-gray-400 text-white"
                                                    : "border border-gray-300 bg-white text-gray-500"
                                                }`}
                                            onClick={() => props.onPaginate(pageNumber)}
                                        >
                                            {pageNumber}
                                        </button>
                                    </li>
                                );
                            })}

                            <li>
                                <button
                                    className="flex h-8 items-center justify-center rounded-e-lg border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                    onClick={() => {
                                        if (props.currentPage < totalPages)
                                            props.onPaginate(props.currentPage + 1);
                                    }}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default TableSortable;
