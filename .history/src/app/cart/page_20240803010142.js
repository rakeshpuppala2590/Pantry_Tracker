"use client"; // Mark as a Client Component

import React, { useState, useEffect } from "react";
import { db } from "/Users/rakeshpuppala/pantry/src/app/firebase.js";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  collection,
  addDoc,
  query,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import dayjs from "dayjs";
import { Button } from "@mui/material";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [filteredAvailableItems, setFilteredAvailableItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    date: null,
  });
  const [removedItems, setRemovedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");

  // Get available items
  useEffect(() => {
    const fetchItems = async () => {
      const q = query(collection(db, "items"));
      const querySnapshot = await getDocs(q);
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.date = data.date ? dayjs(data.date.toDate()) : null; // Ensure date is properly converted
        itemsArr.push({ ...data, id: doc.id });
      });
      setAvailableItems(itemsArr);
      setFilteredAvailableItems(itemsArr);
    };
    fetchItems();
  }, []);

  // Filter available items based on search term for the available items table
  useEffect(() => {
    const filteredItems = availableItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAvailableItems(filteredItems);
  }, [searchTerm, availableItems]);

  // Filter available items based on search term for the dropdown
  const filteredDropdownItems = availableItems.filter((item) =>
    item.name.toLowerCase().includes(dropdownSearchTerm.toLowerCase())
  );

  // Get cart items
  useEffect(() => {
    const q = query(collection(db, "cart"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.date = data.date ? dayjs(data.date.toDate()) : null; // Ensure date is properly converted
        itemsArr.push({ ...data, id: doc.id });
      });
      setItems(itemsArr);
      const calTotal = () => {
        const totalPrice = itemsArr.reduce(
          (sum, item) => sum + parseFloat(item.price),
          0
        );
        setTotal(totalPrice);
      };
      calTotal();
    });

    return () => unsubscribe();
  }, []);

  // Add Item to cart DB
  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.name !== "" && newItem.quantity !== "") {
      const item = availableItems.find(
        (item) => item.name.toLowerCase() === newItem.name.toLowerCase()
      );
      if (!item) {
        alert("Item not available.");
        return;
      }
      if (parseInt(newItem.quantity) > item.quantity) {
        alert("Quantity not available.");
        return;
      }

      await addDoc(collection(db, "cart"), {
        name: newItem.name.trim(),
        price: item.price,
        quantity: newItem.quantity,
        date: newItem.date ? newItem.date.toISOString() : null,
      });

      setNewItem({ name: "", quantity: "", date: null });
    }
  };

  const deleteItem = async (id) => {
    // Remove item from the cart collection
    await deleteDoc(doc(db, "cart", id));
  };

  const confirmChanges = async () => {
    const batch = writeBatch(db);

    // Update available items based on cart items
    for (const item of items) {
      const availableItem = availableItems.find(
        (availableItem) =>
          availableItem.name.toLowerCase() === item.name.toLowerCase()
      );
      if (availableItem) {
        batch.update(doc(db, "items", availableItem.id), {
          quantity: availableItem.quantity - parseInt(item.quantity),
        });
      }
    }

    // Commit batch operations
    await batch.commit();

    // Clear the cart collection
    const q = query(collection(db, "cart"));
    const querySnapshot = await getDocs(q);
    const batchDelete = writeBatch(db);

    querySnapshot.forEach((doc) => {
      batchDelete.delete(doc.ref);
    });

    await batchDelete.commit();

    setRemovedItems(new Set());
  };

  const clearCart = async () => {
    const batch = writeBatch(db);
    items.forEach((item) => {
      batch.delete(doc(db, "cart", item.id));
    });
    await batch.commit();
    setRemovedItems(new Set());
  };

  const isDateExpired = (date) => {
    return date && dayjs(date).isBefore(dayjs(), "day");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full font-mono text-sm">
          <h1 className="text-2xl p-4 text-center">
            Add Available items to cart
          </h1>
          <form
            className="grid grid-cols-4 items-center text-black"
            onSubmit={addItem}
          >
            <div className="col-span-2 p-3 border relative">
              <select
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="w-full p-3 border mt-1"
              >
                <option value="">Select Item</option>
                {filteredDropdownItems.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={newItem.quantity}
              onChange={(e) =>
                setNewItem({ ...newItem, quantity: e.target.value })
              }
              className="col-span-1 p-3 border mx-3"
              placeholder="Enter Quant"
              type="number"
            />
            <button
              className="text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl"
              type="submit"
            >
              +
            </button>
          </form>

          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className={`text-white my-4 w-full flex justify-between bg-slate-950 ${
                  isDateExpired(item.date) ? "text-red-500" : ""
                }`}
              >
                <div className="p-4 w-full flex justify-between">
                  <span className="capitalize">{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>
                    {item.date ? (
                      isDateExpired(item.date) ? (
                        <span className="text-red-700">
                          {dayjs(item.date).format("MM/DD/YYYY")}
                        </span>
                      ) : (
                        dayjs(item.date).format("MM/DD/YYYY")
                      )
                    ) : (
                      "Invalid Date"
                    )}
                  </span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="ml-8 p-4 border-l-2 border-slate-900 hover:bg-slate-900"
                >
                  X
                </button>
              </li>
            ))}
          </ul>
          {items.length > 0 && (
            <div className="flex justify-between p-3">
              <span>Total</span>
              <span className="">${total}</span>
            </div>
          )}
          <button
            onClick={confirmChanges}
            className="mt-4 p-3 bg-green-500 text-white hover:bg-green-600"
          >
            Confirm Changes
          </button>
          <button
            onClick={clearCart}
            className="mt-4 p-3 bg-red-500 text-white hover:bg-red-600"
          >
            Clear Cart
          </button>

          <h1 className="text-2xl p-4 text-center">Available Items</h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search items"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border"
            />
          </div>
          <div className="bg-slate-800 p-4 rounded-lg h-80 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <ul>
              {filteredAvailableItems.map((item) => (
                <li
                  key={item.id}
                  className={`text-white my-4 w-full flex justify-between bg-slate-950 ${
                    isDateExpired(item.date) ? "text-red-500" : ""
                  }`}
                >
                  <div className="p-4 w-full flex justify-between">
                    <span className="capitalize">{item.name}</span>
                    <span>{item.quantity}</span>
                    <span>${item.price}</span>
                    <span>
                      {item.date ? (
                        isDateExpired(item.date) ? (
                          <span className="text-red-700">
                            {dayjs(item.date).format("MM/DD/YYYY")}
                          </span>
                        ) : (
                          dayjs(item.date).format("MM/DD/YYYY")
                        )
                      ) : (
                        "Invalid Date"
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </LocalizationProvider>
  );
}
