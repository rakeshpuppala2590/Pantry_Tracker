// components/CameraComponent.js
"use client";
import React, { useState, useRef } from "react";
import { Camera } from "react-camera-pro";

const CameraComponent = () => {
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [numberOfCameras, setNumberOfCameras] = useState(0);

  return (
    <div>
      <Camera ref={camera} numberOfCamerasCallback={setNumberOfCameras} />
      <img src={image} alt="Taken photo" />
      <button onClick={() => setImage(camera.current.takePhoto())}>
        Take photo
      </button>
      <button
        hidden={numberOfCameras <= 1}
        onClick={() => {
          camera.current.switchCamera();
        }}
      >
        Switch Camera
      </button>
    </div>
  );
};

export default CameraComponent;
