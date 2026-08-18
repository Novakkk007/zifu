import { useState } from 'react';
import { useNavigate } from 'react-router';
import Layout from '@/components/Layout';
import { usePageMeta } from '@/lib/page-meta';
import { computeChartV2, type BaziChartV2 } from '@contracts/bazi-core';
import MasterHintsSection from '@/components/bazi-v2/MasterHintsSection';
import { TenGodsTable } from '@/components/bazi-v2/ChartDetails';

// 顶部：场景说明（财官结构参详的文化定位 + 免责）
// 中部：八字快速排盘表单（复用现有组件）→ 排盘后展示
// 「财官概览」：财星/官杀十神统计（chart.tenGods 过滤正财/偏财/正官/七杀）
// + 「名家视角」复用 MasterHintsSection
// 底部：AI 参详入口（引导到八字页完整功能）

export default function WealthScenario() {
  const navigate = useNavigate();
  const [chart, setChart] = useState<BaziChartV2 | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 初始化表单数据
  const [formData, setFormData] = useState({
    calendar: 'solar' as 'solar' | 'lunar',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hour: 12,
    minute: 0,
    gender: 'male' as 'male' | 'female',
    useTrueSolarTime: false,
    dayRollover: 'zichu' as 'zichu' | 'midnight',
  });
  
  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'month' || name === 'day' || name === 'hour' || name === 'minute' 
        ? parseInt(value) 
        : value
    }));
  };
  
  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 构建出生输入对象
    const birthInput = {
      calendar: formData.calendar,
      year: formData.year,
      month: formData.month,
      day: formData.day,
      hour: formData.hour,
      minute: formData.minute,
      gender: formData.gender,
      isLeapMonth: false,
      city: undefined,
      longitude: 120,
      timezone: 8,
      ianaTimezone: 'Asia/Shanghai',
      useTrueSolarTime: formData.useTrueSolarTime,
      dayRollover: formData.dayRollover,
    };
    
    try {
      const result = computeChartV2(birthInput);
      setChart(result);
      setLoading(false);
    } catch (error) {
      console.error('排盘失败:', error);
      setLoading(false);
    }
  };
  
  // 财官概览计算
  const getCaiguanOverview = () => {
    if (!chart) return null;
    
    // 过滤财星和官杀
    const caiguanTenGods = chart.tenGods.filter(t => 
      t.tenGod === '正财' || 
      t.tenGod === '偏财' || 
      t.tenGod === '正官' || 
      t.tenGod === '七杀'
    );
    
    // 统计数量
    const counts = {
      '正财': 0,
      '偏财': 0,
      '正官': 0,
      '七杀': 0
    };
    
    caiguanTenGods.forEach(t => {
      if (counts[t.tenGod as keyof typeof counts] !== undefined) {
        counts[t.tenGod as keyof typeof counts]++;
      }
    });
    
    return {
      total: caiguanTenGods.length,
      counts
    };
  };
  
  const caiguanOverview = getCaiguanOverview();
  
  usePageMeta(
    '财富运程 · 紫府',
    '紫府事业财富运程——以八字财官结构与阶段节律为基础，参看事业方向与财富趋势。',
  );
  
  return (
    <Layout>
      <main className="min-h-[78dvh] bg-deep px-4 py-12 sm:px-6 sm:py-20">
        {/* 顶部说明 */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="mb-4 font-serif text-[clamp(30px,8vw,52px)] font-bold tracking-[0.06em] text-silktext sm:tracking-[0.08em]">
              事业财富运程
            </h1>
            <p className="text-[15px] leading-[2] text-silkmuted max-w-3xl mx-auto">
              以八字财官结构与阶段节律为基础，梳理事业方向、资源关系与财富趋势。
              本页面提供文化视角的结构参详，不构成任何投资建议或预测。
            </p>
            <div className="mt-6 text-[12px] text-silkmuted/75 italic">
              * 传统文化研究参考 · 不构成决策建议 · 禁止使用"必赚""发财"等断言性词汇
            </div>
          </div>
          
          {/* 中部：排盘表单 */}
          <div className="mb-12 rounded-2xl border border-gold/25 bg-deep2/80 p-4 sm:p-8">
            <h2 className="font-serif text-[22px] font-bold tracking-[0.08em] text-silktext mb-6">
              八字快速排盘
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-silkmuted mb-2">历法</label>
                  <select 
                    name="calendar" 
                    value={formData.calendar}
                    onChange={handleInputChange}
                    className="min-h-11 w-full rounded-lg border border-gold/25 bg-deep2 px-3 py-2 text-silktext focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="solar">公历</option>
                    <option value="lunar">农历</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[13px] font-medium text-silkmuted mb-2">性别</label>
                  <select 
                    name="gender" 
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="min-h-11 w-full rounded-lg border border-gold/25 bg-deep2 px-3 py-2 text-silktext focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[13px] font-medium text-silkmuted mb-2">年份</label>
                  <input 
                    type="number" 
                    name="year" 
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1900" 
                    max="2100"
                    className="min-h-11 w-full rounded-lg border border-gold/25 bg-deep2 px-3 py-2 text-silktext focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-medium text-silkmuted mb-2">月份</label>
                  <input 
                    type="number" 
                    name="month" 
                    value={formData.month}
                    onChange={handleInputChange}
                    min="1" 
                    max="12"
                    className="min-h-11 w-full rounded-lg border border-gold/25 bg-deep2 px-3 py-2 text-silktext focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-medium text-silkmuted mb-2">日期</label>
                  <input 
                    type="number" 
                    name="day" 
                    value={formData.day}
                    onChange={handleInputChange}
                    min="1" 
                    max="31"
                    className="min-h-11 w-full rounded-lg border border-gold/25 bg-deep2 px-3 py-2 text-silktext focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-medium text-silkmuted mb-2">时辰</label>
                  <select 
                    name="hour" 
                    value={formData.hour}
                    onChange={handleInputChange}
                    className="min-h-11 w-full rounded-lg border border-gold/25 bg-deep2 px-3 py-2 text-silktext focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(h => (
                      <option key={h} value={h}>{h}时</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`min-h-11 rounded-lg px-6 py-3 font-semibold tracking-[0.1em] transition-colors ${loading ? 'cursor-not-allowed bg-gold/50' : 'bg-gold hover:bg-goldbright'} text-deep`}
                >
                  {loading ? '正在排盘...' : '开始排盘'}
                </button>
                
                <label className="flex min-h-11 items-center text-[13px] text-silkmuted">
                  <input 
                    type="checkbox" 
                    name="useTrueSolarTime" 
                    checked={formData.useTrueSolarTime}
                    onChange={handleInputChange}
                    className="mr-2 h-4 w-4 text-gold focus:ring-gold/50 border-gold/30 rounded"
                  />
                  真太阳时修正
                </label>
              </div>
            </form>
          </div>
          
          {/* 排盘结果区域 */}
          {chart && (
            <div className="mb-12 rounded-2xl border border-gold/25 bg-deep2/80 p-4 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-[22px] font-bold tracking-[0.08em] text-silktext">
                  排盘结果
                </h2>
                <span className="text-[12px] text-silkmuted/75">
                  日主：{chart.dayMaster}（{chart.dayMasterWuxing}）
                </span>
              </div>
              
              {/* 财官概览 */}
              <div className="mb-8">
                <h3 className="font-serif text-[18px] font-bold tracking-[0.08em] text-silktext mb-4">
                  财官概览
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-gold/25 bg-silk2 p-4">
                    <div className="text-[12px] text-silkmuted uppercase tracking-[0.1em] mb-1">正财</div>
                    <div className="font-serif text-[24px] font-bold text-golddim">{caiguanOverview?.counts['正财'] || 0}</div>
                    <div className="text-[12px] text-silkmuted/75 mt-1">稳定之财</div>
                  </div>
                  
                  <div className="rounded-lg border border-gold/25 bg-silk2 p-4">
                    <div className="text-[12px] text-silkmuted uppercase tracking-[0.1em] mb-1">偏财</div>
                    <div className="font-serif text-[24px] font-bold text-golddim">{caiguanOverview?.counts['偏财'] || 0}</div>
                    <div className="text-[12px] text-silkmuted/75 mt-1">流动之财</div>
                  </div>
                  
                  <div className="rounded-lg border border-gold/25 bg-silk2 p-4">
                    <div className="text-[12px] text-silkmuted uppercase tracking-[0.1em] mb-1">正官</div>
                    <div className="font-serif text-[24px] font-bold text-golddim">{caiguanOverview?.counts['正官'] || 0}</div>
                    <div className="text-[12px] text-silkmuted/75 mt-1">规矩名位</div>
                  </div>
                  
                  <div className="rounded-lg border border-gold/25 bg-silk2 p-4">
                    <div className="text-[12px] text-silkmuted uppercase tracking-[0.1em] mb-1">七杀</div>
                    <div className="font-serif text-[24px] font-bold text-golddim">{caiguanOverview?.counts['七杀'] || 0}</div>
                    <div className="text-[12px] text-silkmuted/75 mt-1">压力权威</div>
                  </div>
                </div>
                
                <div className="mt-4 text-[13px] text-silkmuted/75">
                  财官总数：{caiguanOverview?.total || 0} 个（含天干透干与地支藏干）
                </div>
              </div>
              
              {/* 名家视角 */}
              <div className="mb-8">
                <MasterHintsSection chart={chart} />
              </div>
              
              {/* 十神明细（可选） */}
              <div className="mb-8">
                <h3 className="font-serif text-[18px] font-bold tracking-[0.08em] text-silktext mb-4">
                  十神明细
                </h3>
                <TenGodsTable chart={chart} />
              </div>
            </div>
          )}
          
          {/* 底部：AI参详入口 */}
          <div className="rounded-2xl border border-gold/25 bg-deep2/80 p-4 text-center sm:p-8">
            <h2 className="font-serif text-[22px] font-bold tracking-[0.08em] text-silktext mb-4">
              深度参详
            </h2>
            <p className="text-[15px] leading-[2] text-silkmuted max-w-2xl mx-auto mb-6">
              如需更深入的事业财富分析，包括大运流年趋势、用神喜忌、行业适配等完整功能，
              请前往专业八字分析页面进行详细参详。
            </p>
            <button 
              onClick={() => navigate('/bazi')}
              className="min-h-11 rounded-lg bg-gold px-8 py-3 font-semibold tracking-[0.1em] text-deep transition-colors hover:bg-goldbright"
            >
              前往八字专业分析
            </button>
            <div className="mt-4 text-[12px] text-silkmuted/75 italic">
              * 本页面为事业财富场景快速参详，完整功能请访问专业八字分析页面
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
