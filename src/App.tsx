import React, { useState, useCallback, useEffect } from 'react';
import { Trophy, Heart, Lightbulb, AlertCircle } from 'lucide-react';
import { words } from './data/words';
import { Timer } from './components/Timer';

type Word = {
  readonly word: string;
  readonly hint: string;
};

const initialWord = words.easy[Math.floor(Math.random() * words.easy.length)];

// Hàm kiểm tra ký tự có dấu
const hasDiacritic = (char: string) => {
  return char.normalize('NFD').length > 1;
};

function App() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [input, setInput] = useState('');
  const [currentWord, setCurrentWord] = useState<Word>(initialWord);
  const [maskedWord, setMaskedWord] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [gameActive, setGameActive] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [resetTimer, setResetTimer] = useState(false);
  const [advanceLevelTrigger, setAdvanceLevelTrigger] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const getMaxHints = () => {
    if (level <= 7) return 2; // Easy: 2 hints
    if (level <= 14) return 3; // Medium: 3 hints
    return 4; // Hard: 4 hints
  };

  const getTotalHints = () => {
    return 20;
  };

  const maskWord = useCallback((word: string) => {
    const chars = word.split('');
    // Lọc các ký tự không có dấu và không phải khoảng trắng
    const indices = chars
      .map((char, index) => ({ char, index }))
      .filter(({ char }) => !hasDiacritic(char) && char !== ' ')
      .map(({ index }) => index);

    // Tính số lượng cần ẩn (~70%, tối thiểu 1)
    const hideCount = Math.max(1, Math.ceil(indices.length * 0.7));
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    const toHide = shuffled.slice(0, hideCount);

    // Tạo masked word
    const masked = chars.map((char, index) => 
      toHide.includes(index) ? '_' : char
    ).join('');

    // Cập nhật chỉ số đã hiển thị
    const initialRevealed = chars
      .map((_, index) => index)
      .filter(index => !toHide.includes(index));
    setRevealedIndices(initialRevealed);

    return masked;
  }, []);

  const revealHint = () => {
    const maxHints = getMaxHints();
    if (hintCount >= maxHints) return;

    // Lấy các chỉ số có thể tiết lộ
    const chars = currentWord.word.split('');
    const indicesToHide = chars
      .map((char, index) => ({ char, index }))
      .filter(({ char }) => !hasDiacritic(char) && char !== ' ')
      .map(({ index }) => index);

    const availableIndices = indicesToHide.filter(i => !revealedIndices.includes(i));
    if (availableIndices.length === 0) return;

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newRevealed = [...revealedIndices, randomIndex];
    setRevealedIndices(newRevealed);

    // Cập nhật masked word
    const newMasked = chars.map((char, i) => 
      newRevealed.includes(i) ? char : maskedWord[i]
    ).join('');

    setMaskedWord(newMasked);
    setHintCount(hintCount + 1);
    setTotalHintsUsed(totalHintsUsed + 1);
  };

  const startNewGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setHintCount(0);
    setTotalHintsUsed(0);
    setGameActive(true);
    setMessage(null);
    const newWord = words.easy[Math.floor(Math.random() * words.easy.length)];
    setCurrentWord(newWord);
    setMaskedWord(maskWord(newWord.word));
    setInput('');
    setResetTimer(prev => !prev);
  }, [maskWord]);

  const nextLevel = useCallback(() => {
    if (level >= 20) {
      setMessage({ text: 'Chúc mừng! Bạn đã hoàn thành trò chơi! 🎉', type: 'success' });
      setGameActive(false);
      return;
    }
    const newLevel = level + 1;
    setLevel(newLevel);
    const wordList = newLevel <= 7 ? words.easy : newLevel <= 14 ? words.medium : words.hard;
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(newWord);
    setMaskedWord(maskWord(newWord.word));
    setInput('');
    setHintCount(0);
    setMessage(null);
    setResetTimer((prev) => !prev);
    setRevealedIndices([]);
  }, [level, maskWord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toLowerCase() === currentWord.word.toLowerCase()) {
      setScore(score + 10);
      setMessage({ text: 'Chính xác! +10 điểm', type: 'success' });
      setAdvanceLevelTrigger((prev) => prev + 1);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        setMessage({
          text: `Game Over! Đáp án là: ${currentWord.word}`,
          type: 'error',
        });
        setGameActive(false);
      } else {
        setMessage({ text: `Sai! Còn ${newLives} lần thử.`, type: 'error' });
      }
      setInput('');
    }
  };

  useEffect(() => {
    if (message?.type === 'success' && message?.text === 'Chính xác! +10 điểm') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (advanceLevelTrigger > 0) {
      const timer = setTimeout(() => {
        nextLevel();
        setAdvanceLevelTrigger(0);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [advanceLevelTrigger, nextLevel]);
  
  useEffect(() => {
    if (gameStarted) {
      setMaskedWord(maskWord(currentWord.word));
    }
  }, [currentWord.word, gameStarted, maskWord]);

  const handleTimeout = () => {
    setMessage({
      text: `Hết giờ! Đáp án là: ${currentWord.word}`,
      type: 'error',
    });
    setGameActive(false);
  };

  const handleStartGame = () => {
    setGameStarted(true);
    startNewGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 opacity-50 animate-gradient-shift"></div>
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full opacity-20 animate-particle"
          style={{
            width: `${Math.random() * 8 + 5}px`,
            height: `${Math.random() * 8 + 5}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 5 + 5}s`,
          }}
        ></div>
      ))}
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative z-10 animate-container-bounce">
        {!gameStarted ? (
          <div className="text-center relative">
            <h2 className="text-3xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {Array.from("Đoán Chữ !?").map((char, index) => (
                <span
                  key={index}
                  className="inline-block animate-bounce-char"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {char}
                </span>
              ))}
            </h2>
            <div className="relative">
              <p className="text-gray-600 mb-6 animate-fade-in-delayed">
                Sẵn sàng thử thách trí tuệ của bạn chưa? Nhấn để bắt đầu!
              </p>
              <div className="absolute top-0 left-0 w-4 h-4 bg-yellow-300 rounded-full opacity-50 animate-sparkle"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-300 rounded-full opacity-50 animate-sparkle-delayed"></div>
            </div>
            <button
              onClick={handleStartGame}
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 animate-pulse-shadow animate-slight-rotate group"
            >
              Bắt đầu
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-50 transition-opacity duration-300 animate-glow"></div>
            </button>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-30 animate-float animate-color-shift"
                style={{
                  width: `${Math.random() * 40 + 20}px`,
                  height: `${Math.random() * 40 + 20}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 5 + 5}s`,
                }}
              ></div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-bold">{score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                <span className="text-lg font-bold">{getTotalHints() - totalHintsUsed}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                <span className="text-lg font-bold">{lives}</span>
              </div>
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Màn {level}/20</h2>
              <Timer
                duration={45}
                onTimeout={handleTimeout}
                isActive={gameActive}
                reset={resetTimer}
              />
              <p className="text-lg mb-4 mt-4">{currentWord.hint}</p>
              <div className="flex justify-center gap-1 flex-wrap mb-4">
                {Array.from(maskedWord).map((char, index) => (
                  <div
                    key={index}
                    className={`bg-blue-100 text-blue-800 font-bold text-lg rounded-md px-2 py-1 shadow-sm ${
                      char === ' ' ? 'bg-transparent shadow-none' : ''
                    }`}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập đáp án..."
                className="flex-1 px-4 py-2 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:outline-none"
                disabled={!gameActive}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={!gameActive || !input.trim()}
              >
                Gửi
              </button>
            </form>
            {message && (
              <div
                className={`mb-6 p-3 rounded-lg text-center ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {message.text}
              </div>
            )}
            <div className="flex gap-4">
              {!gameActive && (
                <button
                  onClick={startNewGame}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Chơi lại
                </button>
              )}
              {gameActive && hintCount < getMaxHints() && (
                <button
                  onClick={revealHint}
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 py-2 px-4 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <Lightbulb className="w-5 h-5" />
                  Gợi ý ({getMaxHints() - hintCount} lần)
                </button>
              )}
            </div>
            <div className="mt-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Gõ tiếng Việt có dấu
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;