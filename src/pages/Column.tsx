import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import type { ColumnArticle } from '@/data/columns';
import { COLUMN_ARTICLES } from '@/data/columns';

export default function ColumnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [articles] = useState<ColumnArticle[]>(() => COLUMN_ARTICLES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 渲染期派生（React 官方模式：避免 effect 内同步 setState 级联渲染）
  if (selectedId !== (id ?? null)) {
    setSelectedId(id ?? null)
  }
  const selectedArticle = selectedId
    ? (articles.find((a) => a.id === selectedId) ?? null)
    : null

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