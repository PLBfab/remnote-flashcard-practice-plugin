// src/widgets/flashcard_practice_widget.tsx
import { usePlugin, renderWidget, useTracker } from '@remnote/plugin-sdk';
import React, { useState, useEffect } from 'react';

interface Flashcard {
  question: string;
  answer: string;
  remId: string; // 保留原始Rem ID用于后续交互
}

export const FlashcardPracticeWidget = () => {
  const plugin = usePlugin();

  const documentIds = useTracker(() => 
    plugin.settings.getSetting<string>('documentIds')
      .split(',')
      .map(id => id.trim())
      .filter(id => id) // 过滤空ID
  );
  const cardCountPerDoc = useTracker(() => 
    plugin.settings.getSetting<number>('cardCountPerDoc')
  );
  const timeLimitPerCard = useTracker(() => 
    plugin.settings.getSetting<number>('timeLimitPerCard')
  );

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimitPerCard);

  // ------------------------ 获取闪卡核心逻辑 ------------------------
  const fetchFlashcardsFromDocuments = async (docIds: string[]) => {
    const allCards: Flashcard[] = [];
    
    for (const docId of docIds) {
      try {
        // 获取文档根Rem
        const docRootRem = await plugin.app.remApi.getRem(docId);
        
        // 筛选符合条件的闪卡Rem（假设闪卡Rem有两个子Rem：问题和答案）
        const potentialFlashcards = docRootRem.children.filter(rem => 
          rem.children.length >= 2 && 
          rem.children[0].content.trim() && 
          rem.children[1].content.trim()
        );

        // 随机选取指定数量的闪卡
        const shuffledCards = potentialFlashcards
          .slice() // 创建副本避免修改原数组
          .sort(() => Math.random() - 0.5); // 随机排序
        
        const selectedCards = shuffledCards.slice(0, cardCountPerDoc);
        
        // 转换为标准闪卡格式
        selectedCards.forEach(rem => {
          allCards.push({
            remId: rem.id,
            question: rem.children[0].content.trim(),
            answer: rem.children[1].content.trim()
          });
        });

      } catch (error: any) {
        if (error.code === 'REM_NOT_FOUND') {
          console.warn(`文档ID无效: ${docId}`);
        } else {
          console.error('获取闪卡时发生错误', error);
        }
      }
    }

    setFlashcards(allCards);
    setCurrentCardIndex(0); // 重置当前卡片索引
  };

  // ------------------------ 监听文档ID变化时重新获取闪卡 ------------------------
  useEffect(() => {
    if (documentIds.length === 0) {
      setFlashcards([]);
      return;
    }

    fetchFlashcardsFromDocuments(documentIds);
  }, [documentIds, cardCountPerDoc]);

  // ------------------------ 计时器逻辑（优化后）------------------------
  useEffect(() => {
    if (flashcards.length === 0) return; // 没有闪卡时不启动计时器

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 0) return prev - 1;
        
        // 时间耗尽时切换卡片
        if (currentCardIndex < flashcards.length - 1) {
          return timeLimitPerCard; // 重置时间
        }
        return 0; // 最后一张卡片保持时间为0
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentCardIndex, timeLimitPerCard, flashcards.length]);

  // ------------------------ 界面渲染优化 ------------------------
  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="p-4 rn-clr-background-light-positive rn-clr-content-positive rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">闪卡练习</h2>
      
      {flashcards.length === 0 ? (
        <div className="text-center p-6">
          <p className="text-gray-600">未找到有效闪卡</p>
          <p className="text-sm text-gray-400">
            请检查文档ID是否正确，且文档内存在至少两个子Rem的闪卡结构
          </p>
        </div>
      ) : (
        <div>
          <div className="card-content mb-6">
            <p className="question-text text-lg mb-2">{currentCard.question}</p>
            
            <div className="timer-section flex justify-between items-center mt-4">
              <p>剩余时间: <span className="text-red-500">{timeLeft}</span> 秒</p>
              <p>进度: {currentCardIndex + 1}/{flashcards.length}</p>
            </div>
          </div>

          <div className="button-group text-right">
            <button
              onClick={() => {
                if (currentCardIndex < flashcards.length - 1) {
                  setCurrentCardIndex(prev => prev + 1);
                  setTimeLeft(timeLimitPerCard); // 切换卡片时重置时间
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              下一张卡片
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

renderWidget(FlashcardPracticeWidget);