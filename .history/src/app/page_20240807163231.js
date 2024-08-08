"use client"; // Mark as a Client Component
import * as dotenv from "dotenv";
dotenv.config();

import React, { useState, useEffect, useRef } from "react";
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

  const cameraRef = useRef(null); // Create a ref for the Camera component

  const handleCapture = (imageFile) => {
    setNewItem({ ...newItem, imageFile });
    setImageFileName(imageFile.name); // Set the image file name
    setIsCameraOpen(false); // Close the camera
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
                  onClick={() => setIsCameraOpen(true)}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {imageFileName ? "Change" : "Upload"}
                </Button>

                {isCameraOpen && (
                  <div className="fixed top-0 left-0 w-full h-full bg-black flex flex-col items-center justify-center z-50">
                    <div className="relative">
                      <Camera
                        ref={cameraRef} // Set the ref to the Camera component
                        onTakePhoto={(dataUri) => {
                          fetch(dataUri)
                            .then((res) => res.blob())
                            .then((blob) => {
                              const file = new File(
                                [blob],
                                "captured_image.jpg",
                                {
                                  type: blob.type,
                                }
                              );
                              handleCapture(file);
                            });
                        }}
                        onClose={() => setIsCameraOpen(false)}
                      />
                      <button
                        onClick={() => {
                          if (cameraRef.current) {
                            cameraRef.current.takePhoto(); // Use ref to access takePhoto method
                          }
                        }}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Capture
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <DatePicker
                value={newItem.date}
                onChange={(newDate) =>
                  setNewItem({ ...newItem, date: newDate })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    className="col-span-2 p-3 border mx-2"
                  />
                )}
              />
              <button
                className="col-span-2 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={addItem}
              >
                Add Item
              </button>
            </form>

            <h2 className="text-2xl text-center my-4">Update Item</h2>
            <form className="grid grid-cols-6 items-center text-black">
              <input
                value={upItem.name}
                onChange={(e) => setUpItem({ ...upItem, name: e.target.value })}
                className="col-span-1 p-3 border"
                placeholder="Item Name"
                type="text"
              />
              <input
                value={upItem.price}
                onChange={(e) =>
                  setUpItem({ ...upItem, price: e.target.value })
                }
                className="col-span-1 p-3 border mx-3"
                placeholder="New Price"
                type="number"
              />
              <input
                value={upItem.quantity}
                onChange={(e) =>
                  setUpItem({ ...upItem, quantity: e.target.value })
                }
                className="col-span-1 p-3 border mx-2"
                placeholder="New Quantity"
                type="number"
              />
              <DatePicker
                value={upItem.date}
                onChange={(newDate) => setUpItem({ ...upItem, date: newDate })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    className="col-span-2 p-3 border mx-2"
                  />
                )}
              />
              <button
                className="col-span-2 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={updateItem}
              >
                Update Item
              </button>
            </form>

            <input
              type="text"
              placeholder="Search items"
              onChange={(e) => setSearchQuery(e.target.value)}
              className="my-4 p-2 border border-gray-300 rounded"
            />

            <h2 className="text-xl my-4">Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded ${
                    isDateExpired(item.date) ? "bg-red-100" : "bg-green-100"
                  }`}
                >
                  <h3 className="text-lg font-bold">{item.name}</h3>
                  <p>Price: ${item.price}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>
                    Expiration Date:{" "}
                    {item.date ? item.date.format("MM/DD/YYYY") : "N/A"}
                  </p>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-48 object-cover my-2"
                  />
                  <Button
                    onClick={() => deleteItem(item.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold">Total Cost</h2>
              <p className="text-lg">${total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </main>
    </LocalizationProvider>
  );
}
