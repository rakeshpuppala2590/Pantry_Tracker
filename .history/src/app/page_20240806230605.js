"use client"; // Mark as a Client Component
import * as dotenv from "dotenv";
dotenv.config();

import React, { useState, useEffect } from "react";
import { db, imageDb } from "./firebase";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dayjs from "dayjs";
import { Button } from "@mui/material";
import { v4 } from "uuid";

// Check if a date is expired
const isDateExpired = (date) => {
  return date && dayjs(date).isBefore(dayjs(), "day");
};

export default function Home() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    quantity: "",
    date: null,
    imageFile: null,
  });
  const [upItem, setUpItem] = useState({
    name: "",
    price: "",
    quantity: "",
    date: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  // Add Item to DB
  const addItem = async (e) => {
    e.preventDefault();
    console.log("New Item:", newItem);
    // Check if all required fields are filled
    if (
      newItem.name !== "" &&
      newItem.price !== "" &&
      newItem.quantity !== "" &&
      newItem.date != null &&
      newItem.imageFile != null
    ) {
      const imgRef = ref(imageDb, `files/${v4()}`);
      try {
        // Upload the image file
        const snapshot = await uploadBytes(imgRef, newItem.imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);

        // Add the item with the image URL to the database
        await addDoc(collection(db, "items"), {
          name: newItem.name.trim(),
          price: parseFloat(newItem.price),
          quantity: parseFloat(newItem.quantity),
          date: newItem.date.toISOString(),
          imageUrl: imageUrl,
        });

        // Reset the newItem state
        setNewItem({
          name: "",
          price: "",
          quantity: "",
          date: null,
          imageFile: null,
        });
      } catch (error) {
        console.error("Error adding item: ", error);
      }
    } else {
      alert("Please fill out all fields including the image.");
    }
  };

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

  // Delete items
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "items", id));
  };

  // Update Items
  const updateItem = async (e) => {
    e.preventDefault();
    if (upItem.name && upItem.price && upItem.quantity && upItem.date) {
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
          date: upItem.date.toISOString(),
        });

        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  name: upItem.name,
                  price: parseFloat(upItem.price),
                  quantity: parseFloat(upItem.quantity),
                  date: upItem.date,
                }
              : item
          )
        );
        setUpItem({ name: "", price: "", quantity: "", date: null });
      } else {
        alert("Item not found");
      }
    } else {
      alert("Please fill out all fields");
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main
        className="flex min-h-screen flex-col items-center justify-between p-24
      "
      >
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
                className="col-span-1 p-3 border"
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
                className="col-span-1 p-3 border mx-2"
                placeholder="Enter $"
                type="number"
              />
              <div className="col-span-1 p-3 border mx-3 flex flex-col items-center justify-center w-26 h-11 relative">
                {imageFileName && (
                  <span className="text-gray-300 mb-2 text-xs">
                    {imageFileName}
                  </span> // Adjust text size as needed
                )}
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setNewItem({ ...newItem, imageFile: e.target.files[0] });
                      setImageFileName(e.target.files[0].name); // Set the image file name
                    }
                  }}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

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
            <input
              type="text"
              placeholder="Search Items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border mb-4 text-black"
            />
            <ul className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-gray-100">
              {filteredItems.map((item, id) => (
                <li
                  key={id}
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
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="ml-8 p-4 border-l-2 border-slate-900 hover:bg-slate-900"
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* Update */}
          <h1 className="text-3xl p-4 text-center font-bold">Update</h1>
          <div className="bg-slate-800 p-4 rounded-lg w-10/12 mx-auto">
            <form className="grid grid-cols-5 items-center text-black">
              <input
                className="col-span-1 p-3 border "
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
              <DatePicker
                value={upItem.date}
                onChange={(date) => setUpItem({ ...upItem, date })}
                renderInput={(params) => <TextField {...params} />}
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
        <Button href="cart" variant="contained" color="success">
          Check Out
        </Button>
      </main>
    </LocalizationProvider>
  );
}
