"use client"; // Mark as a Client Component
import React, { useState, useEffect } from "react";
import { db, imageDb } from "./firebase"; // Adjust the import path as necessary
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
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
import { v4 } from "uuid";

// Utility function to convert file to Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Function to send image to the server
const getCategoryFromImage = async (file) => {
  try {
    const base64Image = await fileToBase64(file);

    const response = await fetch("/api/category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        prompt:
          "Give me the category of this pantry item. Give response in only one word.",
      }),
    });

    const result = await response.json();
    return result.category || "Unknown";
  } catch (error) {
    console.error("Error fetching category:", error);
    return "Sorry, couldn't fetch category.";
  }
};

// Check if a date is expired
const isDateExpired = (date) => {
  return date && dayjs(date).isBefore(dayjs(), "day");
};

export default function ItemForm() {
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

    if (
      newItem.name !== "" &&
      newItem.price !== "" &&
      newItem.quantity !== "" &&
      newItem.date != null &&
      newItem.imageFile != null
    ) {
      try {
        const category = await getCategoryFromImage(newItem.imageFile);
        const imgRef = ref(imageDb, `files/${v4()}`);
        const snapshot = await uploadBytes(imgRef, newItem.imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);

        await addDoc(collection(db, "items"), {
          name: newItem.name.trim(),
          price: parseFloat(newItem.price),
          quantity: parseFloat(newItem.quantity),
          date: newItem.date.toISOString(),
          imageUrl: imageUrl,
          category: category,
        });

        setNewItem({
          name: "",
          price: "",
          quantity: "",
          date: null,
          imageFile: null,
        });
        setImageFileName(""); // Clear the image file name after submission
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
                    Upload
                  </span>
                )}
                <input
                  type="file"
                  placeholder="Upload"
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
              <Button
                onClick={addItem}
                className="text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl"
                type="submit"
              >
                Add Item
              </Button>
            </form>

            <form className="grid grid-cols-6 items-center text-black mt-5">
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
                        color: "white", // Set text color to white
                      },
                      "& .MuiInputBase-root": {
                        backgroundColor: "gray", // Set background color as needed
                      },
                    }}
                  />
                )}
              />
              <Button
                onClick={updateItem}
                className="text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl"
                type="submit"
              >
                Update Item
              </Button>
            </form>

            <input
              placeholder="Search Item"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded mt-4"
            />
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`border border-gray-300 rounded-lg p-4 mb-2 ${
                    isDateExpired(item.date) ? "bg-red-100" : "bg-green-100"
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover mb-2"
                  />
                  <p>Name: {item.name}</p>
                  <p>Price: ${item.price.toFixed(2)}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Expiration Date: {item.date?.format("YYYY-MM-DD")}</p>
                  <p>Category: {item.category}</p>
                  <Button
                    onClick={() => deleteItem(item.id)}
                    variant="contained"
                    color="error"
                  >
                    Delete
                  </Button>
                </div>
              ))
            ) : (
              <p>No items found.</p>
            )}
            <p>Total Value: ${total.toFixed(2)}</p>
          </div>
        </div>
      </main>
    </LocalizationProvider>
  );
}