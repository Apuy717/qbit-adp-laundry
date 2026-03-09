import React, { useState, useRef, useEffect } from "react";
import { BiErrorCircle } from "react-icons/bi";
import { FiSearch, FiChevronDown, FiCheck } from "react-icons/fi";

export interface iDropdown {
    label: string;
    value: string;
}

export interface iInputDropdownSearch {
    label: string;
    name: string;
    id: string;
    value: string | any;
    onChange: (e: string) => void;
    className?: string;
    error: string | null;
    options: iDropdown[];
    placeholder?: string;
    onSearchChange?: (e: string) => void;
    searchPlaceholder?: string;
}

export const InputDropdownSearch: React.FC<iInputDropdownSearch> = (props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options if there's no custom onSearchChange provided.
    // If custom onSearchChange is provided, assume options are passed already filtered from the parent.
    const filteredOptions = props.onSearchChange
        ? props.options
        : props.options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const selectedOption = props.options.find((opt) => opt.value === props.value);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (value: string) => {
        props.onChange(value);
        setIsOpen(false);
        setSearchTerm("");
        if (props.onSearchChange) {
            props.onSearchChange("");
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (props.onSearchChange) {
            props.onSearchChange(val);
        }
    };

    return (
        <div className={`${props.className} relative flex-1`} ref={dropdownRef}>
            <label
                htmlFor={props.id}
                onClick={() => setIsOpen(!isOpen)}
                className={`text-md absolute bg-white transition-all duration-500 dark:bg-boxdark ${isOpen || props.value ? `-top-3` : `-top-3`
                    } left-4 text-gray-500 z-10 px-1 cursor-pointer`}
            >
                {props.label}
            </label>

            {/* Trigger Button */}
            <div
                id={props.id}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-md border-[1.5px] bg-white p-3 focus:outline-none dark:bg-boxdark ${isOpen ? "border-primary" : "border-stroke dark:border-form-strokedark"
                    }`}
            >
                <span className={selectedOption ? "text-black dark:text-white" : "text-gray-500"}>
                    {selectedOption ? selectedOption.label : (props.placeholder || props.label)}
                </span>
                <FiChevronDown className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Error Message */}
            <div
                className={`text-md mt-1 mr-2 flex flex-row items-center normal-case text-red-500 ${props.error === null ? `hidden` : `block`
                    }`}
            >
                <BiErrorCircle className="mr-1" />
                <p>{props.error}</p>
            </div>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute left-0 mt-1 w-full z-50 rounded-md border border-stroke bg-white py-2 shadow-lg dark:border-strokedark dark:bg-boxdark">
                    {/* Search Input */}
                    <div className="px-3 md:px-4 pb-2">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <FiSearch size={16} />
                            </span>
                            <input
                                type="text"
                                placeholder={props.searchPlaceholder || "Search..."}
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 pl-9 pr-4 text-sm outline-none focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <ul className="max-h-60 overflow-y-auto px-2">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`flex cursor-pointer items-center justify-between rounded py-2 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${props.value === option.value ? "bg-gray-50 dark:bg-gray-800 font-medium" : ""
                                        }`}
                                >
                                    <span className="text-black dark:text-white">{option.label}</span>
                                    {props.value === option.value && (
                                        <FiCheck className="text-primary" />
                                    )}
                                </li>
                            ))
                        ) : (
                            <li className="py-2 px-3 text-sm text-gray-500 text-center">
                                No results found
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InputDropdownSearch;
