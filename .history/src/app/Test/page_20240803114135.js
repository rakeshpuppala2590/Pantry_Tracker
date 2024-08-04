// pages/index.js
import Head from "next/head";
import CameraComponent from "../components/CameraComponent";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Next.js Camera App</title>
        <meta name="description" content="Using react-camera-pro in Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Camera App</h1>
        <CameraComponent />
      </main>
    </div>
  );
}