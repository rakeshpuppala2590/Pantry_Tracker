"use client"; // Mark as a Client Component
import * as dotenv from "dotenv";
dotenv.config();

import React, { useState, useRef, useEffect } from "react";
import { db, imageDb } from "./firebase";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TextField from "@mui/material/TextField";
import { Camera } from "react-camera-pro";
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cameraRef = useRef(null);

  // Update camera state on mount
  useEffect(() => {
    if (cameraRef.current) {
      // Ensure cameraRef.current is correctly set
    }
  }, []);

  const handleCapture = () => {
    if (cameraRef.current) {
      const dataUri = cameraRef.current.takePhoto();
      fetch(dataUri)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "captured_image.jpg", {
            type: blob.type,
          });
          setNewItem((prev) => ({ ...prev, imageFile: file }));
          setImageFileName(file.name);
          setIsCameraOpen(false); // Close the camera
        });
    }
  };

  // Add Item to DB
  const addItem = async (e) => {
    e.preventDefault();

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
        setImageFileName("");
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
                    {isCameraOpen ? "Close Camera" : "Open Camera"}
                  </span>
                )}

                <Button
                  onClick={() => setIsCameraOpen(!isCameraOpen)}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {imageFileName ? "Change" : "Upload"}
                </Button>

                {isCameraOpen && (
                  <div className="fixed top-0 left-0 w-full h-full bg-black flex flex-col items-center justify-center z-50">
                    <div className="relative">
                      <Camera
                        ref={cameraRef}
                        onTakePhoto={() => handleCapture()}
                        facingMode="environment"
                      />
                      <button
                        onClick={handleCapture}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2 bg-white text-black rounded"
                      >
                        Take Photo
                      </button>
                      <button
                        onClick={() => setIsCameraOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white text-black rounded"
                      >
                        Close Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-span-2 mx-3">
                <DatePicker
                  value={newItem.date}
                  onChange={(date) => setNewItem({ ...newItem, date })}
                  renderInput={(params) => <TextField {...params} />}
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  onClick={addItem}
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg mt-6">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border"
              placeholder="Search Item"
              type="text"
            />

            {filteredItems.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="border p-4 rounded-lg shadow-lg bg-white"
                  >
                    <h2 className="text-xl font-bold">{item.name}</h2>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: ${item.price}</p>
                    <p>Date: {dayjs(item.date).format("YYYY-MM-DD")}</p>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-auto mt-2"
                      />
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="mt-2 bg-red-500 text-white p-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </LocalizationProvider>
  );
}
