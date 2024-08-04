// components/CameraComponent.js
import React, { useState, useRef } from "react";
import { Camera } from "react-camera-pro";

const CameraComponent = () => {
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);

  return (
    <div>
      {cameraActive ? (
        <>
          <Camera ref={camera} numberOfCamerasCallback={setNumberOfCameras} />
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
          <button onClick={() => setCameraActive(false)}>Stop Camera</button>
        </>
      ) : (
        <button onClick={() => setCameraActive(true)}>Start Camera</button>
      )}
      {image && <img src={image} alt="Taken photo" />}
    </div>
  );
};

export default CameraComponent;
