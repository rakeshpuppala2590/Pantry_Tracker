"use client";
import React, { useState, useEffect } from "react";
import { db } from "./firebase";
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
  where,
  updateDoc,
} from "firebase/firestore";

export default function Home() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    quantity: "",
    date: null,
  });
  const [upItem, setUpItem] = useState({ name: "", price: "", quantity: "" });

  // add Item to DB
  const addItem = async (e) => {
    e.preventDefault();
    if (
      newItem.name !== "" &&
      newItem.price !== "" &&
      newItem.quantity !== ""
    ) {
      await addDoc(collection(db, "items"), {
        name: newItem.name.trim(),
        price: newItem.price,
        quantity: newItem.quantity,
        date: newItem.date,
      });
      setNewItem({ name: "", price: "", quantity: "", date: null });
    }
  };

  // Get items
  useEffect(() => {
    const q = query(collection(db, "items"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
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
      return () => unsubscribe();
    });
  }, []);

  // Delete items
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "items", id));
  };

  // Update Items
  const updateItem = async (e) => {
    e.preventDefault();
    if (upItem.name && upItem.price && upItem.quantity) {
      const q = query(
        collection(db, "items"),
        where("name", "==", upItem.name)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const itemDoc = querySnapshot.docs[0];
        const itemId = itemDoc.id;

        await updateDoc(doc(db, "items", itemId), {
          name: upItem.name.trim(),
          price: parseFloat(upItem.price), // Ensure price is a number
          quantity: parseFloat(upItem.quantity),
        });

        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  name: upItem.name,
                  price: parseFloat(upItem.price),
                  quantity: parseFloat(upItem.quantity),
                }
              : item
          )
        );
        setUpItem({ name: "", price: "", quantity: "" });
      } else {
        alert("Item not found");
      }
    } else {
      alert("Please fill out all fields");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
          <h1 className="text-4xl p-4 text-center">
            <strong>Pantry Tracker</strong>
          </h1>
          <div className="bg-slate-800 p-4 rounded-lg">
            <form className="grid grid-cols-6 items-center text-black">
              <input
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="col-span-3 p-3 border"
                placeholder="Enter Item"
                type="text"
              />
              <input
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: e.target.value })
                }
                className="col-span-1 p-3 border mx-3"
                placeholder="Enter Quan"
                type="number"
              />
              <input
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                className="col-span-1 p-3 border mx-3"
                placeholder="Enter $"
                type="number"
              />
              <DatePicker
                value={newItem.date}
                onChange={(date) => setNewItem({ ...newItem, date })}
                renderInput={(params) => <TextField {...params} />}
              />
              <button
                onClick={addItem}
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
                  className="text-white my-4 w-full flex justify-between bg-slate-950"
                >
                  <div className="p-4 w-full flex justify-between">
                    <span className="capitalize">{item.name}</span>
                    <span>{item.quantity}</span>
                    <span>${item.price}</span>
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
          </div>
          {/* Update */}
          <h1 className="text-3xl p-4 text-center font-bold">Update</h1>
          <div className="bg-slate-800 p-4 rounded-lg w-10/12 mx-auto">
            <form className="grid grid-cols-5 items-center text-black">
              <input
                className="col-span-2 p-3 border "
                placeholder="Item Name"
                value={upItem.name}
                onChange={(e) => setUpItem({ ...upItem, name: e.target.value })}
                type="text"
              />
              <input
                className="col-span-1 p-3 border mx-3"
                placeholder="Enter $"
                value={upItem.quantity}
                onChange={(e) =>
                  setUpItem({ ...upItem, quantity: e.target.value })
                }
                type="number"
              />
              <input
                className="col-span-1 p-3 border mx-3"
                placeholder="Enter $"
                value={upItem.price}
                onChange={(e) =>
                  setUpItem({ ...upItem, price: e.target.value })
                }
                type="number"
              />
              <button
                onClick={(e) => {
                  updateItem(e);
                }}
                className="text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl"
                type="submit"
              >
                U
              </button>
            </form>
          </div>
        </div>
      </main>
    </LocalizationProvider>
  );
}