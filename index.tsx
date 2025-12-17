import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type Choice = 'rock' | 'paper' | 'scissors' | null;
type Result = 'win' | 'lose' | 'draw' | null;

const CHOICES = {
  rock: { icon: '✊', label: '石頭', beats: 'scissors' },
  paper: { icon: '🖐️', label: '布', beats: 'rock' },
  scissors: { icon: '✌️', label: '剪刀', beats: 'paper' },
};

const App = () => {
  const [userChoice, setUserChoice] = useState<Choice>(null);
  const [cpuChoice, setCpuChoice] = useState<Choice>(null);
  const [result, setResult] = useState<Result>(null);
  const [scores, setScores] = useState({ user: 0, cpu: 0, draw: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [commentary, setCommentary] = useState<string>('準備好開始猜拳了嗎？');

  const getResult = (user: string, cpu: string): Result => {
    if (user === cpu) return 'draw';
    // @ts-ignore
    if (CHOICES[user].beats === cpu) return 'win';
    return 'lose';
  };

  const getGeminiCommentary = async (user: string, cpu: string, res: Result) => {
    try {
      const prompt = `
        這是一個猜拳遊戲。
        玩家出了：${CHOICES[user as keyof typeof CHOICES].label}
        電腦出了：${CHOICES[cpu as keyof typeof CHOICES].label}
        結果：${res === 'win' ? '玩家贏了' : res === 'lose' ? '玩家輸了' : '平手'}
        
        請用繁體中文，給出一句簡短、幽默或帶有輕微嘲諷的評論（20字以內）。
        如果是玩家贏，可以稱讚運氣或技巧；如果是玩家輸，可以調侃一下；平手則說真有默契。
        語氣要活潑有趣。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text;
      if (text) {
        setCommentary(text);
      }
    } catch (error) {
      console.error('Failed to get commentary', error);
      // Fallback commentary if API fails
      if (res === 'win') setCommentary('運氣不錯喔！');
      else if (res === 'lose') setCommentary('再接再厲！');
      else setCommentary('不分軒輊！');
    }
  };

  const play = (choice: 'rock' | 'paper' | 'scissors') => {
    if (isAnimating) return;

    setIsAnimating(true);
    setUserChoice(null);
    setCpuChoice(null);
    setResult(null);
    setCommentary('...');

    // Animation delay
    setTimeout(() => {
      const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
      const randomCpu = choices[Math.floor(Math.random() * choices.length)];
      
      const gameResult = getResult(choice, randomCpu);
      
      setUserChoice(choice);
      setCpuChoice(randomCpu);
      setResult(gameResult);
      
      setScores(prev => ({
        ...prev,
        [gameResult === 'win' ? 'user' : gameResult === 'lose' ? 'cpu' : 'draw']: 
          prev[gameResult === 'win' ? 'user' : gameResult === 'lose' ? 'cpu' : 'draw'] + 1
      }));

      setIsAnimating(false);

      // Fetch AI commentary
      getGeminiCommentary(choice, randomCpu, gameResult);

    }, 1500); // 1.5s shake animation
  };

  const resetGame = () => {
    setScores({ user: 0, cpu: 0, draw: 0 });
    setUserChoice(null);
    setCpuChoice(null);
    setResult(null);
    setCommentary('準備好開始猜拳了嗎？');
  };

  return (
    <div className="game-container">
      <h1>⚡ 猜拳大對決</h1>

      <div className="scoreboard">
        <div className="score-item">
          <span className="score-label">玩家</span>
          <span className="score-value">{scores.user}</span>
        </div>
        <div className="score-item">
          <span className="score-label">平手</span>
          <span className="score-value">{scores.draw}</span>
        </div>
        <div className="score-item">
          <span className="score-label">電腦</span>
          <span className="score-value">{scores.cpu}</span>
        </div>
      </div>

      <div className="battle-area">
        <div className={`hand user ${isAnimating ? 'shake' : ''}`}>
          {isAnimating ? '✊' : (userChoice ? CHOICES[userChoice].icon : '✊')}
        </div>
        
        <div className="vs-text">VS</div>
        
        <div className={`hand cpu ${isAnimating ? 'shake cpu' : ''}`}>
          {isAnimating ? '✊' : (cpuChoice ? CHOICES[cpuChoice].icon : '✊')}
        </div>
      </div>

      <div className="result-area">
        {result && (
          <div className={`result-text ${result === 'win' ? 'win-text' : result === 'lose' ? 'lose-text' : 'draw-text'}`}>
            {result === 'win' ? '你贏了！🎉' : result === 'lose' ? '電腦贏了 🤖' : '平手！🤝'}
          </div>
        )}
        <div className="commentary">
          {commentary}
        </div>
      </div>

      <div className="controls">
        <button 
          className="btn-choice" 
          onClick={() => play('rock')}
          disabled={isAnimating}
        >
          {CHOICES.rock.icon}
          <span>石頭</span>
        </button>
        <button 
          className="btn-choice" 
          onClick={() => play('paper')}
          disabled={isAnimating}
        >
          {CHOICES.paper.icon}
          <span>布</span>
        </button>
        <button 
          className="btn-choice" 
          onClick={() => play('scissors')}
          disabled={isAnimating}
        >
          {CHOICES.scissors.icon}
          <span>剪刀</span>
        </button>
      </div>

      <button className="reset-btn" onClick={resetGame}>
        重新開始計分
      </button>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
