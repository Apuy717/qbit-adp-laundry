import { ChangeEvent, FC, useState } from "react";
import { BiErrorCircle, BiInfoCircle } from "react-icons/bi";

export interface iDropdown {
  label: string;
  value: string;
}

export interface iInput {
  label: string;
  name: string;
  id: string;
  value: string | any;
  type?: string;
  onChange: (e: string) => void;
  className?: string;
  error: string | null;
  required?: boolean;
  info?: string;
  placeholder?: string;
  options?: iDropdown[] | any[];
  rows?: number;
}

export interface iInputFile {
  label: string;
  name: string;
  id: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  className?: string;
  error: string | null;
  value?: any;
  info?: string;
  required?: boolean;
}

export const InputDropdown: FC<iInput> = (props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  return (
    <div className={`${props.className} relative flex-1`}>
      <label
        onClick={() => setIsFocus(true)}
        htmlFor={props.id}
        className={`text-md absolute bg-white transition-all duration-500 dark:dark:bg-boxdark  ${
          isFocus || props.value.length >= 1 ? `-top-3` : `top-3`
        }  left-4 text-gray-500`}
      >
        {props.label}
      </label>
      <select
        name={props.name}
        id={props.id}
        onChange={(e) => props.onChange(e.target.value)}
        value={props.value}
        className="focus:border-apps-primary w-full rounded-md border-2 bg-white p-3 text-gray-500 focus:outline-none dark:border-form-strokedark dark:dark:bg-boxdark"
      >
        {props.options &&
          props.options.map((i, k) => (
            <option value={i.value} key={k}>
              {i.label}
            </option>
          ))}
      </select>
      <div
        className={`text-md mr-2 flex flex-row items-center normal-case text-red-500 ${
          props.error === null ? `hidden` : `block`
        }`}
      >
        <BiErrorCircle className="mr-1" />
        <p>{props.error}</p>
      </div>
    </div>
  );
};

export const Input: FC<iInput> = (props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  return (
    <div className={`${props.className} relative flex-1`}>
      <input
        id={props.id}
        type={props.type ? props.type : "text"}
        name={props.name}
        autoComplete="off"
        className="focus:border-apps-primary w-full rounded-md border-[1.5px] bg-white p-3 text-gray-500 focus:outline-none dark:border-form-strokedark dark:dark:bg-boxdark"
        onChange={(e) => props.onChange(e.target.value)}
        value={props.value}
        required={props.required ? true : false}
        placeholder={props.placeholder}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
      />

      <label
        htmlFor={props.id}
        className={`text-md absolute bg-white transition-all duration-500 dark:bg-gray-800  ${
          isFocus ||
          typeof props.value === "number" ||
          (typeof props.value === "string" && props.value.length >= 1)
            ? `-top-3`
            : `top-3`
        }  left-4 text-gray-500 dark:text-gray-300`}
      >
        {props.label}
      </label>
      <div
        className={`mr-2 flex flex-row text-xs normal-case text-gray-500 ${props.info ? `block` : `hidden`}`}
      >
        <BiInfoCircle className="mr-1 mt-0.5" />
        <p>{props.info}</p>
      </div>
      <div
        className={`text-md mr-2 flex flex-row items-center normal-case text-red-500 ${
          props.error === null ? `hidden` : `block`
        }`}
      >
        <BiErrorCircle className="mr-1" />
        <p>{props.error}</p>
      </div>
    </div>
  );
};

export interface iInputRange {
  onChange: (e: number) => void;
  value: number;
  min?: number;
  max?: number;
  label: string;
  step?: number | string;
}

export const InputSlider: FC<iInputRange> = (props) => {
  return (
    <div className="flex h-auto flex-col justify-between space-y-3 px-4">
      <div className="flex flex-row justify-between">
        <p>{props.label}</p>
        <input
          type="number"
          value={props.value}
          min={props.max ? props.min : 0}
          max={props.max ? props.max : 150}
          step={props.step ? props.step : 1}
          onChange={(e) => props.onChange(parseFloat(e.target.value))}
          className="focus:border-apps-primary w-20 rounded border text-center focus:outline-none dark:dark:bg-boxdark dark:text-gray-500"
        />
      </div>
      <input
        id="default-range"
        type="range"
        min={props.max ? props.min : 0}
        max={props.max ? props.max : 150}
        value={props.value}
        step={props.step ? props.step : 1}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 focus:outline-none dark:bg-gray-700"
      />
    </div>
  );
};

export const InputTextArea: FC<iInput> = (props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  return (
    <div className={`${props.className} relative flex-1`}>
      <label
        onClick={() => setIsFocus(true)}
        htmlFor={props.id}
        className={`text-md absolute bg-white transition-all duration-500 dark:dark:bg-boxdark  ${
          isFocus || props.value.length >= 1 ? `-top-3` : `top-3`
        }  left-4 text-gray-500`}
      >
        {props.label}
      </label>
      <textarea
        value={props.value}
        rows={props.rows ? props.rows : 2}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        id={props.id}
        name={props.name}
        autoComplete="off"
        className="focus:border-apps-primary w-full rounded-md border-2 p-2 text-gray-500 focus:outline-none dark:dark:bg-boxdark"
        onChange={(e) => props.onChange(e.target.value)}
      ></textarea>
      <div
        className={`text-md mr-2 flex flex-row items-center normal-case text-red-500 ${
          props.error === null ? `hidden` : `block`
        }`}
      >
        <BiErrorCircle className="mr-1" />
        <p>{props.error}</p>
      </div>
    </div>
  );
};
export const InputTextAreaWithKeydown: FC<
  iInput & { onKeydown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void }
> = (props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  return (
    <div className={`${props.className} relative flex-1`}>
      <label
        onClick={() => setIsFocus(true)}
        htmlFor={props.id}
        className={`text-md absolute bg-white transition-all duration-500 dark:dark:bg-boxdark  ${
          isFocus || props.value.length >= 1 ? `-top-3` : `top-3`
        }  left-4 text-gray-500`}
      >
        {props.label}
      </label>
      <textarea
        value={props.value}
        rows={props.rows ? props.rows : 2}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        id={props.id}
        name={props.name}
        autoComplete="off"
        className="focus:border-apps-primary w-full rounded-md border-2 p-2 text-gray-500 focus:outline-none dark:dark:bg-boxdark"
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={(e) => props.onKeydown(e)}
      ></textarea>
      <div
        className={`text-md mr-2 flex flex-row items-center normal-case text-red-500 ${
          props.error === null ? `hidden` : `block`
        }`}
      >
        <BiErrorCircle className="mr-1" />
        <p>{props.error}</p>
      </div>
    </div>
  );
};

export const InputFile: FC<iInputFile> = (props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  return (
    <div className={`${props.className} relative flex-1`}>
      <input
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        id={props.id}
        type={"file"}
        accept={props.accept ? props.accept : "image/*"}
        name={props.name}
        autoComplete="off"
        className="focus:border-apps-primary w-full rounded-md border-2 p-2 text-gray-500 focus:outline-none"
        onChange={(e) => props.onChange(e)}
        value={props.value}
        required={props.required}
      />
      <div
        className={`mr-2 flex flex-row items-center text-sm normal-case text-red-500 ${
          props.error === null ? `hidden` : `block`
        }`}
      >
        <BiErrorCircle className="mr-1" />
        <p>{props.error}</p>
      </div>
      <div
        className={`mr-2 flex flex-row items-center text-xs normal-case text-gray-500 ${
          props.info ? `block` : `hidden`
        }`}
      >
        <BiInfoCircle className="mr-1" />
        <p>{props.info}</p>
      </div>
    </div>
  );
};

interface iInputToggle {
  value: boolean;
  onClick: (value: boolean) => void;
  label: string;
  className?: string;
}

export const InputToggle: FC<iInputToggle> = (props) => {
  return (
    <div className={`mb-2 ${props.className}`}>
      <label className="inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={props.value}
          onChange={(e) => props.onClick(e.target.checked)}
          className="peer sr-only"
        />
        <div className="peer relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800 rtl:peer-checked:after:-translate-x-full"></div>
        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {props.label}
        </span>
      </label>
    </div>
  );
};
