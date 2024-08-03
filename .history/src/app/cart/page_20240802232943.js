"use client"; // Mark as a Client Component

import React, { useState, useEffect } from "react";
import { db } from "/Users/rakeshpuppala/pantry/src/app/firebase.js";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TextField from "@mui/material/TextField";
import {
  collection,
  addDoc,
  query,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  where,
  updateDoc,
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
  });

  // Get available items
  useEffect(() => {
    const fetchItems = async () => {
      const q = query(collection(db, "items"));
      const querySnapshot = await getDocs(q);
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.date = data.date ? dayjs(data.date) : null;
        itemsArr.push({ ...data, id: doc.id });
      });
      setAvailableItems(itemsArr);
    };
    fetchItems();
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
      const itemNameLower = newItem.name.trim().toLowerCase(); // Convert to lowercase
      const item = availableItems.find(
        (item) => item.name.toLowerCase() === itemNameLower // Compare in lowercase
      );

      if (!item) {
        alert("Item not available.");
        return;
      }
      if (parseInt(newItem.quantity) > item.quantity) {
        alert("Quantity not available.");
        return;
      }

      // Use Promise.all to handle both operations in parallel
      await Promise.all([
        // Add item to cart
        addDoc(collection(db, "cart"), {
          name: item.name, // Keep the original case if desired
          price: item.price,
          quantity: newItem.quantity,
          date: newItem.date ? newItem.date.toISOString() : null, // Convert to ISO string
        }),
        // Update item quantity in the items collection
        updateDoc(doc(db, "items", item.id), {
          quantity: item.quantity - parseInt(newItem.quantity),
        }),
      ]);

      setNewItem({ name: "", quantity: "", date: null });
    }
  };

  const deleteItem = async (id) => {
    try {
      // Fetch the item details from the cart
      const cartDocRef = doc(db, "cart", id);
      const cartDoc = await getDoc(cartDocRef);
      const cartData = cartDoc.data();

      if (!cartData) {
        console.error("Cart item not found");
        return;
      }

      // Find the item in the availableItems collection
      const itemDocRef = doc(db, "items", cartData.itemId); // Assuming you have itemId in cartData
      const itemDoc = await getDoc(itemDocRef);
      const itemData = itemDoc.data();

      if (!itemData) {
        console.error("Item not found");
        return;
      }

      // Update the quantity in the items collection
      await updateDoc(itemDocRef, {
        quantity: itemData.quantity + parseInt(cartData.quantity), // Restore quantity
      });

      // Delete the item from the cart collection
      await deleteDoc(cartDocRef);

      console.log("Item removed and quantity updated successfully");
    } catch (error) {
      console.error("Error removing item:", error);
    }
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
              className="text-white bg-slate-950 hover:bg-slate-900  p-3 text-xl"
              type="submit"
            >
              +
            </button>
          </form>

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
