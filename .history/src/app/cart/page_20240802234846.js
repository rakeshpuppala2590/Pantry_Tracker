"use client"; // Mark as a Client Component

import React, { useState, useEffect } from "react";
import { db } from "/Users/rakeshpuppala/pantry/src/app/firebase.js";
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
  updateDoc,
  where,
} from "firebase/firestore";
import dayjs from "dayjs";
import { Button } from "@mui/material";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    date: null,
  });
  const [isFetchingAvailableItems, setIsFetchingAvailableItems] =
    useState(true);

  // Fetch available items
  const fetchAvailableItems = async () => {
    setIsFetchingAvailableItems(true);
    const q = query(collection(db, "items"));
    const querySnapshot = await getDocs(q);
    let itemsArr = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.date = data.date ? dayjs(data.date) : null;
      itemsArr.push({ ...data, id: doc.id });
    });
    setAvailableItems(itemsArr);
    setIsFetchingAvailableItems(false);

    // Add available items to cart if not already in the cart
    itemsArr.forEach(async (item) => {
      const cartRef = collection(db, "cart");
      const cartQuery = query(cartRef, where("name", "==", item.name));
      const cartSnapshot = await getDocs(cartQuery);

      if (cartSnapshot.empty) {
        // Add item to cart if it's not already there
        await addDoc(cartRef, {
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          date: item.date ? item.date.toISOString() : null,
        });
      } else {
        // Update existing item in cart if needed
        cartSnapshot.forEach(async (cartDoc) => {
          const cartData = cartDoc.data();
          const cartRef = doc(db, "cart", cartDoc.id);

          // Assuming we want to update quantity if it's different
          if (parseInt(item.quantity) !== parseInt(cartData.quantity)) {
            await updateDoc(cartRef, {
              quantity: item.quantity,
              date: item.date ? item.date.toISOString() : null,
            });
          }
        });
      }
    });
  };

  useEffect(() => {
    fetchAvailableItems(); // Fetch items on component mount
  }, []);

  // Get cart items
  useEffect(() => {
    const q = query(collection(db, "cart"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.date = data.date ? dayjs(data.date) : null;
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
      const itemNameLower = newItem.name.trim().toLowerCase();
      const item = availableItems.find(
        (item) => item.name.toLowerCase() === itemNameLower
      );

      if (!item) {
        alert("Item not available.");
        return;
      }
      if (parseInt(newItem.quantity) > item.quantity) {
        alert("Quantity not available.");
        return;
      }

      await Promise.all([
        addDoc(collection(db, "cart"), {
          name: item.name,
          price: item.price,
          quantity: newItem.quantity,
          date: newItem.date ? newItem.date.toISOString() : null,
        }),
      ]);

      setNewItem({ name: "", quantity: "", date: null });
      fetchAvailableItems(); // Refresh available items after adding
    }
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "cart", id));
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
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="col-span-2 p-3 border"
              placeholder="Enter Item"
              type="text"
            />
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

          <Button
            onClick={fetchAvailableItems} // Trigger refresh on button click
            className="mt-4 p-2 bg-blue-500 text-white hover:bg-blue-700"
          >
            Refresh Available Items
          </Button>

          <ul>
            {items.map((item, id) => (
              <li
                key={id}
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
          {items.length < 1 ? (
            ""
          ) : (
            <div className="flex justify-between p-3">
              <span>Total</span>
              <span className="">${total}</span>
            </div>
          )}

          <h1 className="text-2xl p-4 text-center">Available Items</h1>
          <div className="bg-slate-800 p-4 rounded-lg h-80 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <ul>
              {availableItems.map((item) => (
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
