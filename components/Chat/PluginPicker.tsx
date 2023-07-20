import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { IoArrowBack } from 'react-icons/io5';
import Select, { MultiValue, StylesConfig } from 'react-select';
import Datepicker from 'tailwind-datepicker-react';

import Image from 'next/image';

import { KeyValuePair } from '@/types/data';
import { Symbol } from '@/types/edgar';
import { Plugin, PluginID, Plugins } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

interface EdgarParamsProps {
  onBack: () => void;
  onSave: (plugin: Plugin) => void;
}

interface PluginPickerProps {
  onPluginChange: (plugin: Plugin) => void;
  onClose: () => void;
}

interface Option {
  value: string;
  label: string;
}

async function readCSVFile(filePath: string): Promise<Symbol[]> {
  const response = await fetch(filePath);
  const csvData = await response.text();

  // split the csvData by newline to get an array of lines
  const lines = csvData.split(/\r?\n/);

  // for each line, split by comma to get the value and label,
  // and create a Symbol object
  const symbols: Symbol[] = lines.map((line) => {
    const [value, label] = line.split(',');
    return { value, label };
  });

  return symbols;
}

const formTypes = [
  { value: '8-K', label: 'Current Report' },
  { value: '10-K', label: 'Annual Report' },
  { value: '10-Q', label: 'Quarterly Report' },
];

const EdgarParams: React.FC<EdgarParamsProps> = memo(({ onBack, onSave }) => {
  const {
    state: { lightMode, edgarPluginKeys },
  } = useContext(HomeContext);

  const numberToDate = (number: number) => {
    const year = Math.floor(number / 10000);
    const month = Math.floor((number % 10000) / 100);
    const day = number % 100;
    return new Date(year, month - 1, day);
  };

  const dateToNumber = (date: Date | null) => {
    if (!date) {
      return 0;
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // add 1 to get the month number in the range 1-12
    const day = date.getDate();
    // pad the month and day components with leading zeros if necessary
    const monthStr = (month < 10 ? '0' + month : month) as string;
    const dayStr = (day < 10 ? '0' + day : day) as string;
    return parseInt(`${year}${monthStr}${dayStr}`);
  };

  const [symbols, setSymbols] = useState<Symbol[]>([]); // changed the default value to null

  const [selectedSymbols, setSelectedSymbols] = useState<MultiValue<Option>>(
    [],
  );
  const [selectedFormTypes, setSelectedFormTypes] = useState<
    MultiValue<Option>
  >([]);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = edgarPluginKeys?.find((key) => key.key === 'startDate')?.value;
    return d ? numberToDate(d) : oneYearAgo;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = edgarPluginKeys?.find((key) => key.key === 'endDate')?.value;
    return d ? numberToDate(d) : new Date();
  });
  const [startDateShow, setStartDateShow] = useState<Boolean | null>(false);
  const [endDateShow, setEndDateShow] = useState<Boolean | null>(false);

  const updatePlugin = (plugin: Plugin) => {
    const requiredKeys: KeyValuePair[] = [
      {
        key: 'symbols',
        value:
          selectedSymbols.length !== 0
            ? selectedSymbols.map((symbol) => symbol.value)
            : symbols.map((symbol) => symbol.value),
      },
      {
        key: 'formTypes',
        value:
          selectedFormTypes.length !== 0
            ? selectedFormTypes.map((formType) => formType.value)
            : formTypes.map((formType) => formType.value),
      },
      { key: 'startDate', value: dateToNumber(startDate) },
      { key: 'endDate', value: dateToNumber(endDate) },
    ];
    const updatedPlugin = { ...plugin, requiredKeys };
    // console.log(requiredKeys);
    return updatedPlugin;
  };

  const selectCustomStyles: StylesConfig = {
    // clearIndicator: () => ({ display: 'none' }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? lightMode === 'dark'
          ? '#1F2937'
          : '#E3EBFD'
        : lightMode === 'dark'
        ? '#3B4150'
        : 'white',
      color: lightMode === 'dark' ? 'white' : 'gray',
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: lightMode === 'dark' ? '#3B4150' : 'white',
      color: lightMode === 'dark' ? 'white' : 'gray',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: lightMode === 'dark' ? '#3B4150' : 'white',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9FA3AE',
    }),
  };

  // on load
  useEffect(() => {
    const symbolKeys = edgarPluginKeys?.find(
      (key) => key.key === 'symbols',
    )?.value;
    if (symbolKeys && symbols.length && symbolKeys.length !== symbols.length) {
      setSelectedSymbols(
        symbolKeys.map((symbol: string) => ({
          value: symbol,
          label: symbols.find((s) => s.value === symbol)?.label,
        })),
      );
    }
    const formTypeKeys = edgarPluginKeys?.find(
      (key) => key.key === 'formTypes',
    )?.value;
    if (formTypeKeys && formTypeKeys.length !== formTypes.length) {
      setSelectedFormTypes(
        formTypeKeys.map((formType: string) => ({
          value: formType,
          label: formTypes.find((f) => f.value === formType)?.label,
        })),
      );
    }
  }, [edgarPluginKeys, symbols]);

  useEffect(() => {
    (async () => {
      try {
        const result = await readCSVFile('/symbols.csv');
        result.sort((a, b) => a.label.localeCompare(b.label));
        setSymbols(result);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="p-6 rounded-lg shadow-lg">
      <button
        className="mb-4  text-blue-500 hover:text-blue-700 font-bold py-2"
        onClick={onBack}
      >
        <IoArrowBack size={25} />
      </button>
      <h2 className="font-bold text-lg dark:text-neutral-200 text-gray-700 mb-4">
        EDGAR Parameters
      </h2>
      <Select
        isMulti
        className="mb-4"
        value={selectedSymbols}
        options={symbols}
        onChange={(selectedOptions) =>
          setSelectedSymbols(selectedOptions as Option[])
        }
        placeholder="Symbol"
        styles={selectCustomStyles}
      />
      <Select
        isMulti
        className="mb-4"
        value={selectedFormTypes}
        options={formTypes}
        onChange={(selectedOptions) =>
          setSelectedFormTypes(selectedOptions as Option[])
        }
        placeholder="Form Type"
        styles={selectCustomStyles}
      />
      <div className="flex items-center mb-4">
        <div className="w-1/2 mr-2">
          <Datepicker
            onChange={setStartDate}
            show={startDateShow}
            setShow={setStartDateShow}
            options={{ defaultDate: startDate }}
          />
        </div>
        <div className="dark:text-neutral-200 text-gray-700 mr-2">To</div>
        <div className="w-1/2 mr-2">
          <Datepicker
            onChange={setEndDate}
            show={endDateShow}
            setShow={setEndDateShow}
            options={{ defaultDate: endDate }}
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            const updatedPlugin = updatePlugin(Plugins[PluginID.EDGAR]);
            onSave(updatedPlugin);
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
});

export const PluginPicker: React.FC<PluginPickerProps> = memo(
  ({ onPluginChange, onClose }) => {
    const modalRef = useRef<HTMLInputElement>(null);
    const [showEdgarSettings, setShowEdgarSettings] = useState(false);

    useEffect(() => {
      const handleOutsideClick = (e: any) => {
        if (
          e.target instanceof SVGElement ||
          e.target instanceof SVGPathElement ||
          (e.target instanceof HTMLDivElement && e.target.querySelector('svg'))
        ) {
          return;
        }
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          onClose();
        }
      };
      window.addEventListener('mousedown', handleOutsideClick);
      return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handlePluginSelection = (pluginId: PluginID) => {
      if (pluginId === PluginID.EDGAR) {
        setShowEdgarSettings(true);
      } else {
        const plugin = Plugins[pluginId] ?? null;
        onPluginChange(plugin);
      }
    };

    return (
      <div className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75" />
          </div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div
            ref={modalRef}
            className="inline-block align-bottom border border-gray-300 bg-white dark:bg-[#202123] rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          >
            {showEdgarSettings ? (
              <EdgarParams
                onBack={() => setShowEdgarSettings(false)}
                onSave={(plugin: Plugin) => {
                  setShowEdgarSettings(false);
                  onPluginChange(plugin);
                }}
              />
            ) : (
              <div className="p-6 mb-6">
                <h2 className="text-lg dark:text-neutral-200 text-gray-700 font-bold mb-4">
                  Choose a Plugin
                </h2>
                <div className="flex space-x-10">
                  <div
                    className="relative group inline-block"
                    onClick={() => handlePluginSelection('chatgpt' as PluginID)}
                  >
                    <Image
                      className="grayscale hover:grayscale-0 cursor-pointer bg-cover bg-center rounded-full hover:shadow-2xl hover:scale-110 transition duration-300 ease-in-out"
                      src="/chatgpticon.svg"
                      alt="ChatGPT"
                      width={42}
                      height={42}
                    />
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-70 transition ease-in-out duration-200 pointer-events-none p-2 rounded-md bg-black text-white text-xs z-10">
                      ChatGPT
                    </div>
                  </div>
                  <div
                    className="relative group inline-block"
                    onClick={() =>
                      handlePluginSelection(PluginID.GOOGLE_SEARCH)
                    }
                  >
                    <Image
                      className="grayscale hover:grayscale-0 cursor-pointer bg-cover bg-center rounded-full hover:shadow-2xl hover:scale-110 transition duration-300 ease-in-out"
                      src="/googleicon.svg"
                      alt="Google"
                      width={42}
                      height={42}
                    />
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-70 transition ease-in-out duration-200 pointer-events-none p-2 rounded-md bg-black text-white text-xs z-10">
                      Google
                    </div>
                  </div>
                  <div
                    className="relative group inline-block"
                    onClick={() => handlePluginSelection(PluginID.EDGAR)}
                  >
                    <Image
                      className="grayscale hover:grayscale-0 cursor-pointer bg-cover bg-center rounded-full hover:shadow-2xl hover:scale-110 transition duration-300 ease-in-out"
                      src="/edgaricon.svg"
                      alt="EDGAR"
                      width={42}
                      height={42}
                    />
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-70 transition ease-in-out duration-200 pointer-events-none p-2 rounded-md bg-black text-white text-xs z-10">
                      EDGAR
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
EdgarParams.displayName = 'EdgarParams';
PluginPicker.displayName = 'PluginPicker';
