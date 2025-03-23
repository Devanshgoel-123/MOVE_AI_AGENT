import React, { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface SingleLevelDropdownMenuProps {
  buttonLabel: string;
  items: {
    title: string;
    url?: string;
    icon?: React.ReactNode;
    action?: () => void;
  }[];
}

export const SingleLevelDropdownMenu = ({
  buttonLabel,
  items,
}: SingleLevelDropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) setFocusedIndex(null);
      return !prev;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setFocusedIndex(0);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    } else if (event.key === "Escape") {
      setOpen(false);
      setFocusedIndex(null);
    }
  };

  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        id="dropdown-button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="dropdown-menu"
        type="button"
        className="inline-flex items-center justify-center rounded-md text-sm border border-[#e4e4e7] h-10 px-4 py-2"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {buttonLabel}
        <span className="ml-2">
          {open ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-12">
          <ul
            role="menu"
            id="dropdown-menu"
            aria-labelledby="dropdown-button"
            className="w-56 h-auto shadow-md rounded-md p-1 border bg-white"
          >
            {items.map((item, index) => (
              <li
                role="menuitem"
                key={index}
                className="relative flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 rounded-md"
              >
                {item.icon && <span>{item.icon}</span>}

                <button
                  className="w-full text-left"
                  onClick={() => {
                    item.action?.();
                    setOpen(false);
                  }}
                  type="button"
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SingleLevelDropdownMenu;
