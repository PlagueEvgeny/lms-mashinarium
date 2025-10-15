const SelectField = ({ label, value, onChange, name, options = [] }) => (
  <label className="relative w-full block">
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="peer w-full bg-white border border-gray-300 rounded-lg p-3 pt-5 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <span
      className="absolute left-3 top-1 text-xs text-gray-500 bg-white px-1 peer-focus:text-green-600"
    >
      {label}
    </span>
  </label>
);

export default SelectField;
