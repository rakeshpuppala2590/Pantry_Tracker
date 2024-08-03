import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
        <h1 className="text-4xl p-4 text-center"><strong>Pantry Tracker</strong></h1>
        <div className="bg-slate-800 p-4 rounded-lg">
          <form className="grid grid-cols-7 items-center text-black">
            <input className="col-span-3 p-3 border" placeholder="Enter Item" type="text"/>
            <input className="col-span-3 p-3 border mx-3" placeholder="Enter $" type="number"/>
            <button className="text-white bg-slate-950" type="submit">+</button> 
          </form>   
        </div> 
      </div>
    </main>
  );
}
