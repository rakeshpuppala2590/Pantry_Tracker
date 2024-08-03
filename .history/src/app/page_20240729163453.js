"use client";
import React, { useState, useEffect } from "react";

export default function Home() {
  const [items, setItems] = useState([
    { name: "candy", price: 10.5 },
    { name: "Bread", price: 3.99 },
    { name: "Milk", price: 2.5 },
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
        <h1 className="text-4xl p-4 text-center">
          <strong>Pantry Tracker</strong>
        </h1>
        <div className="bg-slate-800 p-4 rounded-lg">
          <form className="grid grid-cols-6 items-center text-black">
            <input
              className="col-span-3 p-3 border"
              placeholder="Enter Item"
              type="text"
            />
            <input
              className="col-span-2 p-3 border mx-3"
              placeholder="Enter $"
              type="number"
            />
            <button
              className="text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl"
              type="submit"
            >
              +
            </button>
          </form>
          <ui>
            {items.map((item, id) => {
              <li>
                <div>
                  <span>{item.name}</span>
                  <span>{item.price}</span>
                </div>
              </li>;
            })}
          </ui>
        </div>
      </div>
    </main>
  );
}