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
import Modal from "react-modal";
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

// Set the app element for the modal
Modal.setAppElement("#root"); // Make sure this matches your root element

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

  // Handling Camera
  const handleTakePhoto = (dataUri) => {
    setNewItem({
      ...newItem,
      imageFile: dataUri,
    });
    setIsCameraOpen(false);
    setImageFileName("Image Taken"); // You can modify this to use a dynamic file name if needed
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
                    {"Open Camera"}
                  </span>
                )}

                <button onClick={() => setIsCameraOpen(true)}>
                  Open Camera
                </button>

                <Modal
                  isOpen={isCameraOpen}
                  onRequestClose={() => setIsCameraOpen(false)}
                  contentLabel="Camera Modal"
                  className="modal"
                  overlayClassName="modal-overlay"
                >
                  <Camera
                    onTakePhoto={(dataUri) => handleTakePhoto(dataUri)}
                    ref={camera}
                  />
                  <button onClick={() => setIsCameraOpen(false)}>
                    Close Camera
                  </button>
                </Modal>
              </div>
              <DatePicker
                value={newItem.date}
                onChange={(date) => setNewItem({ ...newItem, date })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={{
                      "& .MuiInputBase-input": {
                        height: "10px", // Adjust the height value as needed
                      },
                      width: 150,
                    }}
                  />
                )}
              />
              <Button
                onClick={addItem}
                variant="contained"
                type="submit"
                className="col-span-1 text-white border p-3 mx-2 rounded-lg"
              >
                Add
              </Button>
            </form>
            <form className="grid grid-cols-6 items-center text-black mt-4">
              <input
                value={upItem.name}
                onChange={(e) => setUpItem({ ...upItem, name: e.target.value })}
                className="col-span-1 p-3 border"
                placeholder="Enter Item"
                type="text"
              />
              <input
                value={upItem.quantity}
                onChange={(e) =>
                  setUpItem({ ...upItem, quantity: e.target.value })
                }
                className="col-span-1 p-3 border mx-3"
                placeholder="Enter Quan"
                type="number"
              />
              <input
                value={upItem.price}
                onChange={(e) =>
                  setUpItem({ ...upItem, price: e.target.value })
                }
                className="col-span-1 p-3 border mx-2"
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
                        height: "10px", // Adjust the height value as needed
                      },
                      width: 150,
                    }}
                  />
                )}
              />
              <Button
                onClick={updateItem}
                variant="contained"
                type="submit"
                className="col-span-1 text-white border p-3 mx-2 rounded-lg"
              >
                Update
              </Button>
            </form>
          </div>
          <h2 className="text-lg p-4 text-center">
            <strong>Pantry Items</strong>
          </h2>
          <div className="flex items-center justify-center">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border border-gray-400 rounded"
            />
          </div>
          <ul>
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className={`flex justify-between p-4 my-2 ${
                  isDateExpired(item.date) ? "bg-red-400" : "bg-slate-200"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold">{item.name}</span>
                  <span>{item.quantity} pcs</span>
                  <span>${item.price}</span>
                  <span>
                    Expiry: {item.date ? item.date.format("YYYY-MM-DD") : "N/A"}
                  </span>
                  <div className="flex flex-wrap">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          marginRight: "10px",
                          marginTop: "10px",
                        }}
                      />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="bg-red-500 text-white p-2 rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <div className="text-center mt-4">
            <h2 className="text-lg p-4">
              <strong>Total Value:</strong> ${total.toFixed(2)}
            </h2>
          </div>
        </div>
      </main>
    </LocalizationProvider>
  );
}
