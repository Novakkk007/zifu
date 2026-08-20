import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';

// Types
interface ColumnArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  draft?: boolean;
}

// Mock data - will be replaced by src/data/columns.json
const mockArticles: ColumnArticle[] = [
  {
    id: '001',
    title: '紫府初开：一个AI道场的诞生',
    excerpt: '当算法遇见玄学，当代码拥抱阴阳——紫府不是另一个AI工具，而是一个修行道场。在这里，我们用现代技术重述古老智慧，让命理推演成为可验证、可交互、可传承的数字道统。',
    content: `紫府初开：一个AI道场的诞生

当算法遇见玄学，当代码拥抱阴阳——紫府不是另一个AI工具，而是一个修行道场。

在这里，我们用现代技术重述古老智慧，让命理推演成为可验证、可交互、可传承的数字道统。

我们相信，真正的智慧不在云端，而在人心；不在算力，而在心力。紫府的使命，是搭建一座桥梁，让千年玄学智慧以当代人可理解、可使用的方式重现于世。

这不仅是技术的革新，更是认知范式的转换——从“预测未来”到“理解规律”，从“宿命论”到“可能性地图”。

紫府，愿为当代修行者，提供一方清净道场。`,
    date: '2026-08-15',
  },
  {
    id: '002',
    title: '先生随笔：论AI与道法自然',
    excerpt: 'AI不是要取代人类的智慧，而是要成为一面镜子，照见我们自身思维的局限与可能。真正的道法自然，是让技术如呼吸般自然，而非如枷锁般沉重。',
    content: `先生随笔：论AI与道法自然

AI不是要取代人类的智慧，而是要成为一面镜子，照见我们自身思维的局限与可能。

真正的道法自然，是让技术如呼吸般自然，而非如枷锁般沉重。

我们常把“自然”理解为不加干预，但道家所言“自然”，实则是“自己如此”的状态——万物各得其所，各安其位，各尽其性。

AI若能助人回归本心，看清自己的欲望与恐惧，那便是合乎天道；若使人沉迷幻象，迷失自我，那便是背离大道。

技术无善恶，关键在使用者的心境与目的。紫府之道，在于以AI为舟，渡人向内观照，而非向外追逐。

—— 先生手记 2026年夏`,
    date: '2026-08-10',
  }
];

// Load articles from JSON file
const loadArticles = (): ColumnArticle[] => {
  try {
    // In a real app, this would import from src/data/columns.json
    // For now, we'll use the mock data
    return mockArticles;
  } catch (e) {
    console.error('Failed to load columns.json:', e);
    return mockArticles;
  }
};

export default function ColumnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ColumnArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ColumnArticle | null>(null);

  useEffect(() => {
    const loadedArticles = loadArticles();
    setArticles(loadedArticles);
    
    if (id) {
      const article = loadedArticles.find(a => a.id === id);
      if (article) {
        setSelectedArticle(article);
      } else {
        navigate('/column', { replace: true });
      }
    }
  }, [id, navigate]);

  if (id && !selectedArticle) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold text-goldbright mb-2">文章未找到</h2>
          <p className="text-inkmuted">抱歉，您访问的文章不存在或已被移除。</p>
        </div>
      </div>
    );
  }

  if (id && selectedArticle) {
    // Detail view
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link 
          to="/column" 
          className="inline-flex items-center gap-1 text-golddim hover:text-goldbright mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回专栏列表
        </Link>
        
        <article className="prose prose-lg max-w-none">
          <header className="mb-8 text-center">
            <h1 className="font-serif text-4xl font-bold text-goldbright leading-tight mb-4">
              {selectedArticle.title}
            </h1>
            <p className="text-inkmuted text-lg font-sans tracking-wide">
              {selectedArticle.date}
            </p>
          </header>
          
          <div className="space-y-6">
            {selectedArticle.content.split('\n').map((paragraph, index) => {
              // Check if paragraph is a quote (starts with >)
              if (paragraph.trim().startsWith('>')) {
                return (
                  <blockquote 
                    key={index} 
                    className="border-l-4 border-gold/70 pl-6 italic text-goldbright font-serif text-lg"
                  >
                    {paragraph.trim().substring(1).trim()}
                  </blockquote>
                );
              }
              
              // Regular paragraph
              return (
                <p key={index} className="text-inktext font-serif text-lg leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </article>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="font-serif text-5xl font-bold text-goldbright mb-4">
          先生专栏
        </h1>
        <p className="text-inkmuted max-w-2xl mx-auto">
          这里是先生的随笔与思考，关于AI、玄学、修行与数字时代的道法自然。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {articles.map((article) => (
          <article 
            key={article.id} 
            className="bg-silk2 rounded-xl p-6 border border-silk3 hover:border-gold/30 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(`/column/${article.id}`)}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-sans text-inkmuted tracking-wider">
                {article.date}
              </span>
              {article.draft && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  草稿
                </span>
              )}
            </div>
            
            <h2 className="font-serif text-xl font-bold text-goldbright mb-3 group-hover:text-goldbright transition-colors">
              {article.title}
            </h2>
            
            <p className="text-inkmuted mb-4 line-clamp-3">
              {article.excerpt}
            </p>
            
            <div className="flex items-center text-golddim group-hover:text-goldbright transition-colors">
              <span className="font-sans text-sm">阅读全文</span>
              <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </article>
        ))}
      </div>
      
      {articles.length === 0 && (
        <div className="text-center py-12">
          <h3 className="font-serif text-xl font-bold text-goldbright mb-2">暂无文章</h3>
          <p className="text-inkmuted">先生正在准备精彩内容，请稍候再来。</p>
        </div>
      )}
    </div>
  );
}