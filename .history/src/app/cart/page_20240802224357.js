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

  // Get items
  useEffect(() => {
    const q = query(collection(db, "items"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.date = data.date ? dayjs(data.date) : null;
        itemsArr.push({ ...data, id: doc.id });
      });
      setItems(itemsArr);
    });

    return () => unsubscribe();
  }, []);

  const isDateExpired = (date) => {
    return date && dayjs(date).isBefore(dayjs(), "day");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full font-mono text-sm">
          <h1 className="text-2xl p-4 text-center">Available Items</h1>
          <div className="bg-slate-800 p-4 rounded-lg h-80 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <ul>
              {items.slice(0, 4).map((item) => (
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
