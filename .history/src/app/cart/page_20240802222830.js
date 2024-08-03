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
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
        <h1 className="text-4xl p-4 text-center">
          <strong>Pantry Tracker</strong>
        </h1>
      </div>
    </main>
  </LocalizationProvider>;
}
