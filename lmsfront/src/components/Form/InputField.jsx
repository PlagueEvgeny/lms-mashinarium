const InputField = ({ label, value, onChange, type='text', name }) => (
  <label className="relative w-full block">
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder=" "
      className="peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none focus:border-green-500"
    />
    <span
      className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
      ${value ? 'top-[-10px] text-[14px] text-green-600' : 'top-[16px] text-[16px]'} peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}
    >
      {label}
    </span>
  </label>
);

export default InputField;
