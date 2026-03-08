import React from 'react';
import { Trophy, Zap, Magnet, ShieldCheck, Heart } from 'lucide-react';
import { PowerUpType, GameStatus } from '../types';
import { TEDDY_WORD } from '../constants';

interface HUDProps {
  score: number;
  coins: number;
  speed: number;
  oracleMessage: string;
  activePowerUp: PowerUpType | null;
  powerUpTime: number;
  collectedLetters: string[];
}

const HUD: React.FC<HUDProps> = ({ score, coins, speed, oracleMessage, activePowerUp, powerUpTime, collectedLetters }) => {
  return (
    <div className="fixed inset-0 pointer-events-none select-none p-8 flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-start">
        {/* Score & Coins: Polished Glassmorphism */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-8 py-4 flex items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <Trophy className="text-yellow-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            <div className="flex flex-col">
              <span className="text-white/50 text-[0.6rem] uppercase font-black tracking-widest leading-none mb-1">Total Distance</span>
              <span className="text-white font-black text-4xl font-medieval drop-shadow-md">
                {Math.floor(score).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-3xl px-8 py-3 flex items-center gap-4 shadow-lg">
            <Heart className="text-yellow-400 fill-yellow-400 w-6 h-6" />
            <span className="text-yellow-100 font-black text-3xl">
              {coins}
            </span>
          </div>
        </div>

        {/* TEDDY Tracker */}
        <div className="absolute left-1/2 -translate-x-1/2 flex gap-4 mt-2">
           {TEDDY_WORD.split('').map((char, i) => {
             const isCollected = collectedLetters.length > i;
             return (
               <div 
                 key={i}
                 className={`w-14 h-14 flex items-center justify-center rounded-xl border-2 font-medieval text-3xl transition-all duration-500 ${
                   isCollected 
                     ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-[0_0_20px_rgba(217,70,239,0.8)] scale-110' 
                     : 'bg-black/40 border-white/20 text-white/30'
                 }`}
               >
                 {char}
               </div>
             );
           })}
        </div>

        {/* Speed & Power-ups */}
        <div className="flex flex-col items-end gap-4">
          {activePowerUp && (
            <div className="bg-white/10 backdrop-blur-xl border border-blue-400/30 rounded-3xl px-6 py-4 flex flex-col items-center gap-3 shadow-2xl animate-pulse">
              <div className="flex items-center gap-3">
                {activePowerUp === PowerUpType.MAGNET ? 
                  <Magnet className="text-blue-400 w-7 h-7" /> : 
                  <ShieldCheck className="text-green-400 w-7 h-7" />
                }
                <span className="text-white font-black text-sm uppercase tracking-[0.3em]">{activePowerUp}</span>
              </div>
              <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
                <div 
                  className={`h-full transition-all duration-300 ${activePowerUp === PowerUpType.MAGNET ? 'bg-blue-400' : 'bg-green-400'} shadow-[0_0_15px_rgba(255,255,255,0.5)]`} 
                  style={{ width: `${(powerUpTime / 500) * 100}%` }}
                />
              </div>
            </div>
          )}
          <div className="bg-orange-500/20 backdrop-blur-xl border border-orange-500/40 rounded-full px-6 py-2 flex items-center gap-3 shadow-lg">
            <Zap className="text-orange-400 w-5 h-5 fill-orange-400 animate-bounce" />
            <span className="text-orange-100 font-black text-xl tracking-tighter">{(speed * 10).toFixed(2)}<span className="text-xs ml-1 opacity-50">SPEED</span></span>
          </div>
        </div>
      </div>

      {/* Cinematic Oracle Message */}
      <div className="flex justify-center mb-12">
        {oracleMessage && (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] px-14 py-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative max-w-xl group">
            <p className="text-white font-medieval text-3xl text-center font-bold tracking-tight italic">
              "{oracleMessage}"
            </p>
            <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full -z-10 group-hover:bg-green-500/10 transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
};

export default HUD;