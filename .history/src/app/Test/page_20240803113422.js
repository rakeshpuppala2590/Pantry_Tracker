import { Camera } from "react-camera-pro";
export default function Cart() {
  const Component = () => {
    const camera = useRef(null);
    const [image, setImage] = useState(null);

    return (
      <div>
        <Camera ref={camera} />
        <button onClick={() => setImage(camera.current.takePhoto())}>
          Take photo
        </button>
        <img src={image} alt="Taken photo" />
      </div>
    );
  };
}
