import React, { useEffect, useRef, useState } from "react";

interface iDropdown {
    label: string;
    value: string;
}

interface SelectOutletProps {
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    outlets: iDropdown[];
}

const SearchDropdown: React.FC<SelectOutletProps> = ({
    value,
    onChange,
    className = "",
    outlets,
}) => {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [filteredOutlets, setFilteredOutlets] = useState<iDropdown[]>(outlets);
    const containerRef = useRef<HTMLDivElement>(null);

    // isi label sesuai value awal
    useEffect(() => {
        if (value) {
            const selected = outlets.find((o) => o.value === value);
            if (selected) setSearch(selected.label);
        } else {
            setSearch("");
        }
    }, [value, outlets]);

    // filter berdasarkan search
    useEffect(() => {
        const lower = search.toLowerCase();
        setFilteredOutlets(
            outlets.filter((o) => o.label.toLowerCase().includes(lower))
        );
    }, [search, outlets]);

    // close dropdown kalau klik di luar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        onChange?.(id);
        const selected = outlets.find((o) => o.value === id);
        setSearch(selected ? selected.label : "");
        setOpen(false);
    };

    const handleClear = () => {
        setSearch("");
        onChange?.("");
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full ${className} text-gray-500 dark:text-gray-400`}
        >
            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                        if (e.target.value === "") {
                            handleClear(); // clear kalau kosong
                        }
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Filter by Outlet"
                    className="
            w-full rounded-lg border border-stroke
            bg-white p-3 text-sm outline-none
            focus:border-primary focus:ring-1 focus:ring-primary
            dark:border-gray-800 dark:bg-boxdark
            text-gray-500 dark:text-gray-400
          "
                />
                {search && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>

            {open && (
                <ul
                    className="
            absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stroke
            bg-white dark:bg-gray-dark dark:border-strokedark dark:bg-boxdark
          "
                >
                    {filteredOutlets.length > 0 ? (
                        filteredOutlets.map((outlet) => (
                            <li
                                key={outlet.value}
                                onClick={() => handleSelect(outlet.value)}
                                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {outlet.label}
                            </li>
                        ))
                    ) : (
                        <li className="px-3 py-2 text-sm text-gray-500">Tidak ditemukan</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchDropdown;
