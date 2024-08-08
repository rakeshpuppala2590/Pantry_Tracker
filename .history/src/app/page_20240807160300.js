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
import { Camera } from "react-camera-pro";

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
    category: "",
  });
  const [upItem, setUpItem] = useState({
    name: "",
    price: "",
    quantity: "",
    date: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Add Item to DB
  const addItem = async (e) => {
    e.preventDefault();

    if (
      newItem.name !== "" &&
      newItem.price !== "" &&
      newItem.quantity !== "" &&
      newItem.date != null &&
      newItem.imageFile != null
    ) {
      const imgRef = ref(imageDb, `files/${v4()}`);
      try {
        const snapshot = await uploadBytes(imgRef, newItem.imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);

        await addDoc(collection(db, "items"), {
          name: newItem.name.trim(),
          price: parseFloat(newItem.price),
          quantity: parseFloat(newItem.quantity),
          date: newItem.date.toISOString(),
          imageUrl: imageUrl,
        });

        setNewItem({
          name: "",
          price: "",
          quantity: "",
          date: null,
          imageFile: null,
        });
        setImageFileName(""); // Clear the file name after adding
      } catch (error) {
        console.error("Error adding item: ", error);
      }
    } else {
      alert("Please fill out all fields including the image.");
    }
  };

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

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "items", id));
  };

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
          price: parseFloat(upItem.price),
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

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCapture = (imageFile) => {
    setNewItem({ ...newItem, imageFile });
    setImageFileName(imageFile.name); // Set the image file name
    setIsCameraOpen(false); // Close the camera
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
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
                {imageFileName ? (
                  <span className="text-gray-300 mb-1 text-xs font-bold">
                    {imageFileName}
                  </span>
                ) : (
                  <span className="text-gray-300 mb-1 text-xs font-bold">
                    Upload
                  </span>
                )}
                <Button
                  onClick={() => setIsCameraOpen(true)}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                >
                  Open Camera
                </Button>
              </div>

              <DatePicker
                value={newItem.date}
                onChange={(date) => setNewItem({ ...newItem, date })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={{
                      "& .MuiInputBase-input": {
                        color: "white", // Set text color to white
                      },
                      "& .MuiInputBase-root": {
                        backgroundColor: "gray", // Set background color as needed
                      },
                    }}
                  />
                )}
              />
              <button
                onClick={addItem}
                className="text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl"
                type="submit"
              >
                +
              </button>
            </form>

            {/* Update Form */}
            <form className="mt-8">
              <input
                value={upItem.name}
                onChange={(e) => setUpItem({ ...upItem, name: e.target.value })}
                className="p-3 border"
                placeholder="Enter Item to Update"
                type="text"
              />
              <input
                value={upItem.quantity}
                onChange={(e) =>
                  setUpItem({ ...upItem, quantity: e.target.value })
                }
                className="p-3 border mx-3"
                placeholder="Enter Quan"
                type="number"
              />
              <input
                value={upItem.price}
                onChange={(e) =>
                  setUpItem({ ...upItem, price: e.target.value })
                }
                className="p-3 border mx-2"
                placeholder="Enter $"
                type="number"
              />
              <DatePicker
                value={upItem.date}
                onChange={(date) => setUpItem({ ...upItem, date })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={{
                      "& .MuiInputBase-input": {
                        color: "white", // Set text color to white
                      },
                      "& .MuiInputBase-root": {
                        backgroundColor: "gray", // Set background color as needed
                      },
                    }}
                  />
                )}
              />
              <button
                onClick={updateItem}
                className="text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl mt-4"
                type="submit"
              >
                Update
              </button>
            </form>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg mt-4">
          <input
            className="p-3 border rounded-lg mb-4"
            type="text"
            placeholder="Search items"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ul className="divide-y divide-gray-700">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className={`flex justify-between p-2 border rounded-lg ${
                  isDateExpired(item.date) ? "bg-red-500" : "bg-gray-800"
                }`}
              >
                <div>
                  <img
                    className="w-24 h-24 object-cover"
                    src={item.imageUrl}
                    alt={item.name}
                  />
                  <p className="font-bold">{item.name}</p>
                  <p>Price: ${item.price}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Date: {dayjs(item.date).format("YYYY-MM-DD")}</p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <h2 className="text-xl text-white mt-4">Total: ${total}</h2>
        </div>

        {isCameraOpen && (
          <div className="fixed top-0 left-0 w-full h-full bg-black flex items-center justify-center z-50">
            <Camera
              onTakePhoto={(dataUri) => {
                fetch(dataUri)
                  .then((res) => res.blob())
                  .then((blob) => {
                    const file = new File([blob], "captured_image.jpg", {
                      type: blob.type,
                    });
                    handleCapture(file);
                  });
              }}
              onClose={() => setIsCameraOpen(false)}
            />
          </div>
        )}
      </main>
    </LocalizationProvider>
  );
}
