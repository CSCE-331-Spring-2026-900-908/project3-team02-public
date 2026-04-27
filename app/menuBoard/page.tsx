"use client";

import React, { useEffect, useState } from 'react';

interface MenuItem {
  itemid: number;
  itemname: string;
  price: number | string;
  category: string;
}

interface QueueEntry {
  id: string;
  saleId: number;
  summary: string;
  minutesTotal: number;
  minutesRemaining: number;
}

const WindowBoundMenuBoard = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items');
        const data = await response.json();
        if (Array.isArray(data)) setItems(data);
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/queue');
        const data = await res.json();
        if (Array.isArray(data)) setQueue(data);
      } catch {
        // silently ignore queue fetch errors on the board
      }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const getByCategory = (catName: string) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => item.category?.toLowerCase() === catName.toLowerCase());
  };

  const PriceDisplay = ({ price }: { price: any }) => (
    <span>${Number(price).toFixed(2)}</span>
  );

  if (loading) return (
    <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-2xl">
      LOADING...
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden font-sans select-none border-gray-200 relative">
      
      {/* 1. TOP IMAGE BANNER (25% height) */}
      <div className="grid grid-cols-3 h-[25vh] shrink-0">
        <div className="bg-[url('/specialty-header.jpg')] bg-cover bg-center" />
        <div className="bg-[url('/fruit-tea-header.jpg')] bg-cover bg-center" />
        <div className="bg-[url('/snack-header.jpg')] bg-cover bg-center" />
      </div>

      {/* 2. MIDDLE ROW (37.5% height) */}
      <div className="grid grid-cols-3 h-[37.5vh] shrink-0">
        {/* Specialty */}
        <section className="p-[3vh] bg-gray-50 flex flex-col min-h-0">
          <h2 className="text-[4vh] font-bold mb-[1vh] text-slate-900 leading-none">SPECIALTY</h2>
          <div className="space-y-[0.8vh] text-[1.8vh] font-semibold text-slate-700 uppercase flex-1 overflow-hidden pr-[5%]">
            {getByCategory('Specialty').map(item => (
              <div key={item.itemid} className="flex justify-between">
                <span className="truncate mr-2">{item.itemname}</span>
                <PriceDisplay price={item.price} />
              </div>
            ))}
          </div>
        </section>

        {/* Fruit Tea */}
        <section className="p-[3vh] bg-green-50 flex flex-col min-h-0 border-l border-white">
          <h2 className="text-[4vh] font-bold mb-[1vh] text-green-600 leading-none">FRUIT TEA</h2>
          <div className="space-y-[0.8vh] text-[1.8vh] font-semibold text-slate-700 uppercase flex-1 overflow-hidden pr-[5%]">
            {getByCategory('Fruit Tea').map(item => (
              <div key={item.itemid} className="flex justify-between">
                <span className="truncate mr-2">{item.itemname}</span>
                <PriceDisplay price={item.price} />
              </div>
            ))}
          </div>
        </section>

        {/* Snack */}
        <section className="p-[3vh] bg-orange-50 flex flex-col min-h-0 border-l border-white">
          <h2 className="text-[4vh] font-bold mb-[1vh] text-red-900 leading-none">SNACK</h2>
          <div className="space-y-[0.8vh] text-[1.8vh] font-semibold text-slate-700 uppercase flex-1 overflow-hidden pr-[5%]">
            {getByCategory('Snack').map(item => (
              <div key={item.itemid} className="flex justify-between">
                <span className="truncate mr-2">{item.itemname}</span>
                <PriceDisplay price={item.price} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 3. BOTTOM ROW (37.5% height) */}
      <div className="grid grid-cols-3 h-[37.5vh] shrink-0">
        
        {/* Milk Tea: Image on left, text pushed to right using flex layout */}
        <section className="p-[3vh] bg-orange-100 flex gap-[2vh] min-h-0 border-t border-white relative overflow-hidden">
          <img src="/milk-tea-boba.png" className="h-[90%] w-auto object-contain self-end z-0" alt="" />
          <div className="flex-1 flex flex-col min-h-0 z-10">
            <h2 className="text-[4vh] font-bold mb-[1vh] text-amber-900 leading-none">MILK TEA</h2>
            <div className="space-y-[0.8vh] text-[1.8vh] font-semibold text-slate-700 uppercase flex-1 overflow-hidden pr-[5%]">
              {getByCategory('Milk Tea').map(item => (
                <div key={item.itemid} className="flex justify-between">
                  <span className="truncate mr-2">{item.itemname}</span>
                  <PriceDisplay price={item.price} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Refresher: Center header, text padded on the right to avoid bottom-right image */}
        <section className="p-[3vh] bg-cyan-50 relative flex flex-col min-h-0 border-t border-l border-white overflow-hidden">
          <h2 className="text-[4vh] font-bold mb-[1vh] text-cyan-900 leading-none text-center relative z-10">REFRESHER</h2>
          {/* pr-[30%] creates a safe zone so the prices stop before hitting the image */}
          <div className="w-full space-y-[0.8vh] text-[1.8vh] font-semibold text-slate-700 uppercase relative z-10 flex-1 overflow-hidden pr-[30%]">
            {getByCategory('Refresher').map(item => (
              <div key={item.itemid} className="flex justify-between">
                <span className="truncate mr-2">{item.itemname}</span>
                <PriceDisplay price={item.price} />
              </div>
            ))}
          </div>
          <img src="/refresher.png" className="absolute bottom-0 right-0 h-[90%] opacity-40 object-contain z-0" alt="" />
        </section>

        {/* Slush: Left-aligned text padded on the right to avoid right-side image */}
        <section className="p-[3vh] bg-purple-50 relative flex flex-col min-h-0 border-t border-l border-white overflow-hidden">
          {/* pr-[35%] keeps the text block entirely away from the slush cup */}
          <div className="w-full relative z-10 flex flex-col h-full pr-[35%]">
            <h2 className="text-[4vh] font-bold mb-[1vh] text-purple-900 leading-none">SLUSH</h2>
            <div className="space-y-[0.8vh] text-[1.8vh] font-semibold text-slate-700 uppercase flex-1 overflow-hidden">
              {getByCategory('Slush').map(item => (
                <div key={item.itemid} className="flex justify-between">
                  <span className="truncate mr-2">{item.itemname}</span>
                  <PriceDisplay price={item.price} />
                </div>
              ))}
            </div>
          </div>
          {/* Image locked firmly to the bottom right */}
          <img src="/slush.png" className="absolute bottom-0 right-2 h-[100%] object-contain z-0" alt="" />
        </section>

      </div>

      {/* Live Queue Strip */}
      {queue.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/85 text-white flex items-center overflow-hidden" style={{ height: '7vh' }}>
          <div className="shrink-0 bg-amber-500 h-full flex items-center px-[2vw]">
            <span className="font-black uppercase tracking-widest text-black text-[2vh] whitespace-nowrap">
              ORDER QUEUE
            </span>
          </div>
          <div className="flex items-center gap-[4vw] px-[2vw] overflow-x-auto flex-1 h-full">
            {queue.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-[1vw] shrink-0">
                <span className="text-amber-400 font-bold text-[2.2vh]">#{i + 1}</span>
                <span className="text-[1.8vh] text-gray-200">{entry.summary}</span>
                <span className="text-[1.8vh] font-bold text-white bg-white/20 rounded px-2 py-0.5 whitespace-nowrap">
                  ~{entry.minutesRemaining} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WindowBoundMenuBoard;