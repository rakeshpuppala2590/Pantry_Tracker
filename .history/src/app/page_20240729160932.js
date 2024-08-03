import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
        <h1 className="text-4xl p-4 text-center"><strong>Pantry Tracker</strong></h1>
        <div>
        <form>
          <input className="" type="text"></input>
          <input className="" type="number"></input> 
          <button>
            +
          </button> 
        </form>   
        </div> 
      </div>
    </main>
  );
}
