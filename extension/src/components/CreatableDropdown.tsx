import { useState } from "react";
import {type Label } from "@/lib/gmailApi";

type CreatableDropdownProps = {
  items: Label[];
  onChangeId: (id: string) => void;
  onCreate: (value: string) => Promise<boolean>;
  placeholder?: string;
};

export function CreatableDropdown({
  items,
  onChangeId,
  onCreate,
  placeholder = "Select/create new label",
}: CreatableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(""); // the text that shows for the currently selected label
  const [search, setSearch] = useState(""); // the input text

  const exactMatch = items.some(
    (item) => item.name.toLowerCase() === search.trim().toLowerCase()
  );

  async function handleCreate() {
    const newItem = search.trim();

    if (!newItem) return;

    const createResult = await onCreate(newItem)
    if (createResult) {
        setValue(newItem);
    };
    setSearch("");
    setIsOpen(false);
  };

  const handleSelect = (label: Label) => {
    setValue(label.name);
    onChangeId(label.id)
    setSearch("");
    setIsOpen(false);
  };

  return (

    <div className="dropdown bg-black">
      <input
        value={isOpen? search : value}
        placeholder={placeholder}
        onFocus={() => {
          setSearch("");
          setIsOpen(true);
        }}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isOpen && (
        <ul className="dropdown-list">
          {items.map((item) => (
            <li key={item.id} onClick={() => handleSelect(item)}>
              {item.name}
            </li>
          ))}

          {search.trim() && !exactMatch && (
            <li onClick={handleCreate}>
              + Create "{search.trim()}"
            </li>
          )}

          {items.length === 0 && (
            <li>No labels found... please create one</li>
          )}
        </ul>
      )}
    </div>
  );
}
